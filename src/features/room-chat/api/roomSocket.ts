import type { RoomMessage } from '../model/types';

export type RoomConnection = 'connecting' | 'live' | 'reconnecting' | 'offline';

export interface RoomSocketEvent {
  type?: string;
  requestId?: string;
  roomId?: string;
  messageId?: string;
  messageIds?: string[];
  message?: RoomMessage;
  error?: { code?: string; message?: string };
  auth?: { success?: boolean };
}

interface SocketLike {
  readyState: number;
  send: (data: string) => void;
  close: () => void;
  addEventListener: (type: string, listener: (event: { data?: unknown }) => void) => void;
}

export interface RoomSocketOptions {
  url: string;
  token: () => string | null;
  join: () => Promise<void>;
  loadLatest: () => Promise<RoomMessage[]>;
  onEvent: (event: RoomSocketEvent) => void;
  onStatus: (status: RoomConnection) => void;
  onGapMerge: (messages: RoomMessage[]) => void;
  onDisconnect: () => void;
  createSocket?: (url: string) => SocketLike;
  maxRetries?: number;
  schedule?: (callback: () => void, delayMs: number) => number;
  clearSchedule?: (id: number) => void;
}

const SOCKET_OPEN = 1;
const DEFAULT_MAX_RETRIES = 5;

export function roomSocketUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL ?? '';
  if (base) {
    const url = new URL(base, 'http://localhost');
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${url.host}/ws`;
  }
  if (typeof location === 'undefined') return 'ws://localhost/ws';
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${location.host}/ws`;
}

export class RoomSocket {
  private readonly options: RoomSocketOptions;
  private socket: SocketLike | null = null;
  private stopped = false;
  private retries = 0;
  private authed = false;
  private sawLive = false;
  private timer: number | null = null;
  private generation = 0;

  constructor(options: RoomSocketOptions) {
    this.options = options;
  }

  start(): void {
    this.stopped = false;
    this.retries = 0;
    this.sawLive = false;
    this.open();
  }

  stop(): void {
    this.stopped = true;
    this.generation += 1;
    this.clearTimer();
    this.socket?.close();
    this.socket = null;
  }

  send(payload: unknown): boolean {
    if (!this.socket || this.socket.readyState !== SOCKET_OPEN || !this.authed) return false;
    this.socket.send(JSON.stringify(payload));
    return true;
  }

  private open(): void {
    if (this.stopped) return;
    this.generation += 1;
    const generation = this.generation;
    this.authed = false;
    this.options.onStatus(this.sawLive ? 'reconnecting' : 'connecting');
    const createSocket =
      this.options.createSocket ?? ((url: string) => new WebSocket(url) as unknown as SocketLike);
    const socket = createSocket(this.options.url);
    this.socket = socket;
    socket.addEventListener('open', () => {
      if (generation !== this.generation || this.stopped) return;
      const token = this.options.token();
      if (!token) {
        this.giveUp();
        return;
      }
      socket.send(JSON.stringify({ type: 'auth', accessToken: token }));
    });
    socket.addEventListener('message', (event) => {
      if (generation !== this.generation || this.stopped) return;
      void this.onMessage(generation, event.data);
    });
    socket.addEventListener('close', () => {
      if (generation !== this.generation || this.stopped) return;
      this.handleClose();
    });
  }

  private async onMessage(generation: number, data: unknown): Promise<void> {
    let event: RoomSocketEvent;
    try {
      event = JSON.parse(String(data)) as RoomSocketEvent;
    } catch {
      return;
    }
    if (generation !== this.generation || this.stopped) return;
    if (event.type === 'auth.result') {
      if (!event.auth?.success) {
        this.giveUp();
        return;
      }
      this.authed = true;
      this.retries = 0;
      try {
        await this.options.join();
        if (generation !== this.generation || this.stopped) return;
        if (this.sawLive) {
          const latest = await this.options.loadLatest();
          if (generation !== this.generation || this.stopped) return;
          this.options.onGapMerge(latest);
        }
        this.sawLive = true;
        this.options.onStatus('live');
      } catch {
        if (generation !== this.generation || this.stopped) return;
        this.socket?.close();
      }
      return;
    }
    this.options.onEvent(event);
  }

  private handleClose(): void {
    this.authed = false;
    this.socket = null;
    if (this.stopped) return;
    this.options.onDisconnect();
    const maxRetries = this.options.maxRetries ?? DEFAULT_MAX_RETRIES;
    if (this.retries >= maxRetries) {
      this.options.onStatus('offline');
      return;
    }
    const delay = 500 * 2 ** this.retries;
    this.retries += 1;
    this.options.onStatus('reconnecting');
    const schedule =
      this.options.schedule ??
      ((callback, delayMs) => setTimeout(callback, delayMs) as unknown as number);
    this.timer = schedule(() => {
      this.timer = null;
      this.open();
    }, delay);
  }

  private giveUp(): void {
    this.stopped = true;
    this.clearTimer();
    this.options.onDisconnect();
    this.options.onStatus('offline');
    this.socket?.close();
  }

  private clearTimer(): void {
    if (this.timer === null) return;
    const clear = this.options.clearSchedule ?? ((id: number) => clearTimeout(id));
    clear(this.timer);
    this.timer = null;
  }
}
