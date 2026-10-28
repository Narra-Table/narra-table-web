import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  defaultRoomId,
  primeWorkbenchRoom,
  readWorkbenchRoomId,
  resolveRoomId,
} from './persistence';

const rooms = [
  { roomId: 'room-b', type: 'reference' },
  { roomId: 'room-a', type: 'session' },
];

let values: Map<string, string>;

beforeEach(() => {
  values = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, String(value)),
  });
});

afterEach(() => vi.unstubAllGlobals());

describe('room preference', () => {
  it('prefers the session room and otherwise uses the first room', () => {
    expect(defaultRoomId(rooms)).toBe('room-a');
    expect(defaultRoomId([{ roomId: 'room-b' }])).toBe('room-b');
    expect(defaultRoomId([])).toBe('');
  });

  it('keeps a saved room while it exists and falls back when it does not', () => {
    expect(resolveRoomId('room-b', rooms)).toBe('room-b');
    expect(resolveRoomId('removed', rooms)).toBe('room-a');
    expect(resolveRoomId('room-b', undefined)).toBe('room-b');
    expect(resolveRoomId('', [])).toBe('');
  });

  it('primes the room preference from a space card or room link', () => {
    primeWorkbenchRoom('space-a', 'room-b');
    expect(readWorkbenchRoomId('space-a')).toBe('room-b');
    expect(readWorkbenchRoomId('space-b')).toBe('');
  });

  it('migrates only the selected room from the previous workspace record', () => {
    values.set('narratable.workspace.space-a', JSON.stringify({ roomId: 'room-a', win: 'chat' }));

    expect(readWorkbenchRoomId('space-a')).toBe('room-a');
    expect(values.get('narratable.workbench-next.room.space-a')).toBe('room-a');
  });

  it('ignores malformed previous workspace data', () => {
    values.set('narratable.workspace.space-a', '{');

    expect(readWorkbenchRoomId('space-a')).toBe('');
  });
});
