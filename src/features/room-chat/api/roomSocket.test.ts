import { describe, expect, it } from 'vitest';
import { RoomSocket } from './roomSocket';

class FakeSocket {
  static latest: FakeSocket | null = null;
  readyState = 0;
  sent: string[] = [];
  private listeners = new Map<string, Array<(event: { data?: unknown }) => void>>();

  constructor(url: string) {
    void url;
    FakeSocket.latest = this;
  }

  addEventListener(type: string, listener: (event: { data?: unknown }) => void): void {
    const list = this.listeners.get(type) ?? [];
    list.push(listener);
    this.listeners.set(type, list);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.readyState = 3;
    this.emit('close');
  }

  open(): void {
    this.readyState = 1;
    this.emit('open');
  }

  receive(data: unknown): void {
    this.emit('message', { data: JSON.stringify(data) });
  }

  private emit(type: string, event: { data?: unknown } = {}): void {
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }
}

describe('RoomSocket', () => {
  it('joins after auth and merges the latest page only after a reconnect', async () => {
    const joins: string[] = [];
    const merged: string[][] = [];
    const socket = new RoomSocket({
      url: 'ws://example.test/ws',
      token: () => 'token',
      maxRetries: 2,
      createSocket: () => new FakeSocket('ws://example.test/ws'),
      schedule: (callback) => {
        callback();
        return 1;
      },
      clearSchedule: () => undefined,
      join: async () => {
        joins.push('join');
      },
      loadLatest: async () => [{ messageId: 'm-new' }],
      onEvent: () => undefined,
      onStatus: () => undefined,
      onGapMerge: (messages) => merged.push(messages.map((message) => message.messageId ?? '')),
      onDisconnect: () => undefined,
    });

    socket.start();
    const first = FakeSocket.latest;
    if (!first) throw new Error('socket was not created');
    first.open();
    expect(JSON.parse(first.sent[0] ?? '{}')).toMatchObject({ type: 'auth', accessToken: 'token' });
    first.receive({ type: 'auth.result', auth: { success: true } });
    await Promise.resolve();
    expect(joins).toEqual(['join']);
    expect(merged).toEqual([]);

    first.close();
    const second = FakeSocket.latest;
    if (!second || second === first) throw new Error('socket did not reconnect');
    second.open();
    second.receive({ type: 'auth.result', auth: { success: true } });
    await Promise.resolve();
    await Promise.resolve();
    expect(joins).toEqual(['join', 'join']);
    expect(merged).toEqual([['m-new']]);
    socket.stop();
  });
});
