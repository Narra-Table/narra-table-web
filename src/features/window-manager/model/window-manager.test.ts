import { describe, expect, it } from 'vitest';
import {
  parseWindowManagerState,
  selectFocusedWindow,
  snapWindowWidth,
  validateWindowManagerState,
} from './window-manager';

describe('window manager model', () => {
  const snapshot = {
    version: 2,
    windows: [
      {
        instanceId: 'win-1',
        appId: 'app',
        windowTypeId: 'chat',
        title: 'Chat',
        width: 2 / 3,
        state: { roomId: 'room-1' },
      },
    ],
    focusedWindowId: 'win-1',
  };

  it('parses a minimal snapshot', () => {
    const state = parseWindowManagerState(snapshot)!;
    expect(selectFocusedWindow(state)?.state).toEqual({ roomId: 'room-1' });
    expect(validateWindowManagerState(state)).toEqual([]);
  });

  it('rejects old and malformed snapshots', () => {
    expect(parseWindowManagerState({ version: 1 })).toBeNull();
    expect(parseWindowManagerState({ ...snapshot, windows: [{ instanceId: 'win-1' }] })).toBeNull();
  });

  it('drops unavailable window types', () => {
    const state = parseWindowManagerState(snapshot, {
      isWindowTypeAvailable: () => false,
    });
    expect(state).toEqual({ version: 2, windows: [], focusedWindowId: null });
  });

  it('snaps widths to one third, one half, two thirds or full width', () => {
    expect(snapWindowWidth(0.3)).toBe(1 / 3);
    expect(snapWindowWidth(0.45)).toBe(1 / 2);
    expect(snapWindowWidth(0.7)).toBe(2 / 3);
    expect(snapWindowWidth(0.9)).toBe(1);
    expect(parseWindowManagerState(snapshot)?.windows[0]?.width).toBe(2 / 3);
  });
});
