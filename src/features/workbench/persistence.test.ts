import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readChatState } from './chat-state';
import {
  createSequentialIdFactory,
  createWorkbenchStore,
  selectFocusedWindow,
  validateWorkspace,
} from './core';
import {
  createWorkbenchStoreForSpace,
  defaultRoomId,
  openKind,
  primeWorkbenchRoom,
  readWorkbenchRoomId,
  resolveRoomId,
  writeWorkbenchSnapshot,
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

  it('selects the requested room in a saved chat without changing other chat windows', () => {
    const store = createWorkbenchStoreForSpace('space-a');
    const chat = selectFocusedWindow(store.getState())!;
    store.actions.setWindowState(chat.instanceId, {
      roomId: 'room-a',
      scene: 'old-scene',
      query: 'old search',
    });
    const otherId = openKind(store, 'chat', { state: { roomId: 'room-c', query: 'keep' } })!;
    store.actions.focus(chat.instanceId);
    writeWorkbenchSnapshot('space-a', store);

    primeWorkbenchRoom('space-a', 'room-b');
    const restored = createWorkbenchStoreForSpace('space-a');

    expect(readChatState(selectFocusedWindow(restored.getState()))).toEqual({
      roomId: 'room-b',
      query: '',
    });
    expect(readChatState(restored.getState().windows[otherId])).toEqual({
      roomId: 'room-c',
      query: 'keep',
    });
    expect(restored.getState().containers).toEqual(store.getState().containers);
  });

  it('opens a chat for a room shortcut when every chat was closed', () => {
    const store = createWorkbenchStoreForSpace('space-a');
    for (const window of Object.values(store.getState().windows)) {
      if (window.windowTypeId === 'chat') store.actions.close(window.instanceId);
    }
    writeWorkbenchSnapshot('space-a', store);

    primeWorkbenchRoom('space-a', 'room-b');
    const restored = createWorkbenchStoreForSpace('space-a');
    const focused = selectFocusedWindow(restored.getState());

    expect(focused?.windowTypeId).toBe('chat');
    expect(readChatState(focused).roomId).toBe('room-b');
  });

  it('opens new windows after restoring a layout without reusing window or container IDs', () => {
    const store = createWorkbenchStore({ createId: createSequentialIdFactory() });
    openKind(store, 'chat');
    openKind(store, 'characters');
    for (let index = 0; index < 5; index += 1) {
      store.actions.open({
        appId: 'narratable',
        windowTypeId: 'chat',
        title: '聊天',
        intoContainerId: store.getState().containers[0]!.id,
      });
    }
    writeWorkbenchSnapshot('space-a', store);
    const restored = createWorkbenchStoreForSpace('space-a');
    const before = Object.keys(restored.getState().windows);
    const opened = Array.from({ length: 4 }, () => openKind(restored, 'chat'));

    expect(new Set([...before, ...opened]).size).toBe(before.length + opened.length);
    expect(Object.keys(restored.getState().windows)).toHaveLength(before.length + opened.length);
    expect(validateWorkspace(restored.getState())).toEqual({ ok: true, errors: [] });
  });
});
