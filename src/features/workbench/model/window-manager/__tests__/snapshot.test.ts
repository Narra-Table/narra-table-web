import { describe, expect, it } from 'vitest';
import { openWindow, setAttention, setScrollOffset, setWindowState, focusWindow } from '../actions';
import { selectColumns, selectFloating } from '../selectors';
import {
  parseWorkspace,
  parseWorkspaceJson,
  serializeWorkspace,
  stringifyWorkspace,
} from '../snapshot';
import { createEmptyWorkspace, normalizeWorkspace, validateWorkspace } from '../state';
import type { WorkspaceSnapshot, WorkspaceState } from '../types';
import { idFactory, windowInput } from './helpers';

let ids = idFactory();

function fresh() {
  ids = idFactory();
  return createEmptyWorkspace();
}

function open(state: WorkspaceState, overrides: Parameters<typeof windowInput>[0] = {}) {
  return openWindow(state, windowInput(overrides), ids);
}

function sampleState(): { state: WorkspaceState; a: string; b: string } {
  const empty = fresh();
  const a = open(empty, { appId: 'chat', windowTypeId: 'room', title: 'Chat', width: 2 / 3 });
  const withState = setWindowState(a.state, a.instanceId, { roomId: 'room-1', scene: 's1' });
  const b = open(withState, {
    appId: 'sheet',
    windowTypeId: 'character',
    title: 'Sheet',
    floating: true,
    floatingBox: { x: 120, y: 80, width: 460, height: 320 },
  });
  return { state: b.state, a: a.instanceId, b: b.instanceId };
}

describe('snapshot serialization', () => {
  it('round-trips containers, floating geometry, focus and app state', () => {
    const { state, a, b } = sampleState();
    const scrolled = setScrollOffset(state, 180);
    const snapshot = serializeWorkspace(scrolled);
    expect(snapshot.version).toBe(1);
    expect(snapshot.windows).toHaveLength(2);
    expect(snapshot.appStates[a]).toEqual({ roomId: 'room-1', scene: 's1' });
    const snapshotWindow = snapshot.windows.find((window) => window.instanceId === a);
    expect(snapshotWindow).toBeDefined();
    expect(snapshotWindow).not.toHaveProperty('state');
    expect(snapshot.focus).toEqual(scrolled.focus);
    expect(snapshot.containers).toHaveLength(2);

    const parsed = parseWorkspace(snapshot);
    expect(parsed).not.toBeNull();
    if (!parsed) return;
    expect(validateWorkspace(parsed).ok).toBe(true);
    expect(parsed.scrollOffset).toBe(180);
    expect(parsed.windows[a]?.state).toEqual({ roomId: 'room-1', scene: 's1' });
    expect(parsed.windows[b]?.title).toBe('Sheet');
    expect(parsed.focus.focusedWindowId).toBe(b);
    expect(selectFloating(parsed)[0]?.x).toBe(120);
    expect(serializeWorkspace(parsed)).toEqual(snapshot);
  });

  it('drops transient attention from snapshots', () => {
    const { state, a } = sampleState();
    const attention = setAttention(state, a, 'urgent', { count: 4 });
    const snapshot = serializeWorkspace(attention);
    expect(snapshot.windows.find((window) => window.instanceId === a)).not.toHaveProperty(
      'attention',
    );
    const parsed = parseWorkspace(snapshot);
    expect(parsed?.windows[a]?.attention).toBeUndefined();
  });

  it('serializes an empty workspace and restores it as empty', () => {
    const empty = fresh();
    const snapshot = serializeWorkspace(empty);
    expect(snapshot.windows).toEqual([]);
    expect(snapshot.containers).toEqual([]);
    expect(snapshot.focus.focusedWindowId).toBeNull();
    const parsed = parseWorkspace(snapshot);
    expect(parsed).not.toBeNull();
    expect(parsed?.containers).toEqual([]);
    expect(parsed?.windows).toEqual({});
  });

  it('produces valid JSON', () => {
    const { state } = sampleState();
    const raw = stringifyWorkspace(state);
    const parsed = parseWorkspaceJson(raw);
    expect(parsed).not.toBeNull();
    expect(validateWorkspace(parsed as WorkspaceState).ok).toBe(true);
  });
});

describe('snapshot parsing', () => {
  it('rejects non-workspace, wrong-version and malformed JSON payloads', () => {
    expect(parseWorkspace(null)).toBeNull();
    expect(parseWorkspace({})).toBeNull();
    expect(parseWorkspace({ version: 2, windows: [], containers: [] })).toBeNull();
    expect(parseWorkspace({ version: 1, windows: {} })).toBeNull();
    expect(parseWorkspaceJson('{')).toBeNull();
    expect(parseWorkspaceJson('null')).toBeNull();
  });

  it('prunes dangling container references and unreferenced windows', () => {
    const { state } = sampleState();
    const raw = serializeWorkspace(state) as WorkspaceSnapshot & {
      windows: Array<Record<string, unknown>>;
      containers: Array<Record<string, unknown>>;
    };
    raw.windows.push({
      instanceId: 'ghost',
      appId: 'demo',
      windowTypeId: 'ghost',
      title: 'Ghost',
      chrome: 'full',
    });
    raw.containers.push({
      id: 'ghost-column',
      kind: 'column',
      display: 'normal',
      width: 0.5,
      lastNonFullWidth: 0.5,
      windows: ['missing-window'],
    });
    const parsed = parseWorkspace(raw);
    expect(parsed).not.toBeNull();
    expect(parsed?.windows.ghost).toBeUndefined();
    expect(parsed?.containers.some((container) => container.id === 'ghost-column')).toBe(false);
    expect(validateWorkspace(parsed as WorkspaceState).ok).toBe(true);
  });

  it('skips window types that no longer exist', () => {
    const { state, a } = sampleState();
    const snapshot = serializeWorkspace(state);
    const parsed = parseWorkspace(snapshot, {
      isWindowTypeAvailable: (window) => window.windowTypeId !== 'character',
    });
    expect(parsed).not.toBeNull();
    expect(parsed?.windows[a]).toBeDefined();
    expect(selectFloating(parsed as WorkspaceState)).toHaveLength(0);
    expect(selectColumns(parsed as WorkspaceState)).toHaveLength(1);
  });

  it('repairs invalid focus and heights instead of rejecting the snapshot', () => {
    const { state } = sampleState();
    const raw = serializeWorkspace(state) as WorkspaceSnapshot;
    const column = raw.containers.find((container) => container.kind === 'column');
    if (column && column.kind === 'column') {
      column.heights = [10, 0];
    }
    raw.focus = {
      layer: 'floating',
      focusedWindowId: 'missing',
      lastFocusedWindowByContainer: {},
      lastTiledContainerId: 'missing',
    };
    const parsed = parseWorkspace(raw);
    expect(parsed).not.toBeNull();
    expect(validateWorkspace(parsed as WorkspaceState).ok).toBe(true);
  });

  it('normalizes a parsed state even if the snapshot was already normalized', () => {
    const { state } = sampleState();
    const normalized = normalizeWorkspace(state);
    const parsed = parseWorkspace(serializeWorkspace(normalized));
    expect(parsed).not.toBeNull();
    expect(normalizeWorkspace(parsed as WorkspaceState)).toEqual(parsed);
  });

  it('keeps logical focus when restoring', () => {
    const { state, a } = sampleState();
    const focused = focusWindow(state, a);
    const parsed = parseWorkspace(serializeWorkspace(focused));
    expect(parsed?.focus.focusedWindowId).toBe(a);
    expect(parsed?.focus.layer).toBe('tiling');
  });
});
