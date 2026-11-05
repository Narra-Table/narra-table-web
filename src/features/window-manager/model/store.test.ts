import { describe, expect, it } from 'vitest';
import { createSequentialIdFactory, createWindowManagerStore } from './store';

describe('window manager store', () => {
  it('opens, focuses, updates and closes windows', () => {
    const store = createWindowManagerStore({ createId: createSequentialIdFactory() });
    const chat = store.actions.open({ appId: 'app', windowTypeId: 'chat', title: 'Chat' });
    const map = store.actions.open({ appId: 'app', windowTypeId: 'map', title: 'Map' });

    expect(store.getState().focusedWindowId).toBe(map);
    store.actions.focus(chat);
    store.actions.setWindowState(chat, { roomId: 'room-1' });
    expect(store.getState().windows[0]?.state).toEqual({ roomId: 'room-1' });

    store.actions.close(chat);
    expect(store.getState().windows.map((window) => window.instanceId)).toEqual([map]);
    expect(store.getState().focusedWindowId).toBe(map);
  });

  it('restores snapshots without reusing an existing id', () => {
    const store = createWindowManagerStore({ createId: createSequentialIdFactory() });
    store.restore({
      version: 2,
      windows: [
        {
          instanceId: 'win-1',
          appId: 'app',
          windowTypeId: 'chat',
          title: 'Chat',
          width: 0.5,
        },
      ],
      focusedWindowId: 'win-1',
    });
    const next = store.actions.open({ appId: 'app', windowTypeId: 'map', title: 'Map' });
    expect(next).toBe('win-2');
  });
});
