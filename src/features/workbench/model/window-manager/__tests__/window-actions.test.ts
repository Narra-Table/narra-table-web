import { describe, expect, it } from 'vitest';
import {
  closeWindow,
  focusDirection,
  focusLayer,
  focusWindow,
  openWindow,
  setAttention,
  setScrollOffset,
  setWindowState,
  updateWindow,
} from '../actions';
import {
  selectAttention,
  selectColumns,
  selectFloating,
  selectFocusedWindowId,
  selectTaskbarGroups,
  selectWindow,
} from '../selectors';
import { createEmptyWorkspace, validateWorkspace } from '../state';
import type { WorkspaceState } from '../types';
import { idFactory, windowInput } from './helpers';

function open(state: WorkspaceState, overrides: Parameters<typeof windowInput>[0] = {}) {
  return openWindow(state, windowInput(overrides), idsForTest);
}

let idsForTest = idFactory();

function fresh() {
  idsForTest = idFactory();
  return createEmptyWorkspace();
}

describe('opening windows', () => {
  it('creates the first standard column and focuses it', () => {
    const state = fresh();
    const result = open(state, { title: 'Chat', width: 2 / 3 });
    expect(result.created).toBe(true);
    expect(result.state.focus.focusedWindowId).toBe(result.instanceId);
    expect(result.state.focus.layer).toBe('tiling');
    const columns = selectColumns(result.state);
    expect(columns).toHaveLength(1);
    expect(columns[0]?.windows).toEqual([result.instanceId]);
    expect(columns[0]?.width).toBeCloseTo(2 / 3);
    expect(columns[0]?.display).toBe('normal');
    expect(validateWorkspace(result.state).ok).toBe(true);
  });

  it('inserts a new column to the right of the focused column', () => {
    const state = fresh();
    const first = open(state, { title: 'A' });
    const second = open(first.state, { title: 'B' });
    const columns = selectColumns(second.state);
    expect(columns).toHaveLength(2);
    expect(columns[0]?.windows).toEqual([first.instanceId]);
    expect(columns[1]?.windows).toEqual([second.instanceId]);
    expect(second.state.focus.focusedWindowId).toBe(second.instanceId);
  });

  it('honours tabbed display for a new column', () => {
    const state = fresh();
    const opened = open(state, { title: 'Tabs', display: 'tabbed' });
    const column = selectColumns(opened.state)[0];
    expect(column?.display).toBe('tabbed');
  });

  it('opens a floating window on the floating layer', () => {
    const state = fresh();
    const opened = open(state, {
      title: 'Map',
      floating: true,
      floatingBox: { x: 24, y: 32, width: 320, height: 240 },
    });
    const floats = selectFloating(opened.state);
    expect(floats).toHaveLength(1);
    expect(floats[0]?.window).toBe(opened.instanceId);
    expect(floats[0]?.x).toBe(24);
    expect(floats[0]?.zOrder).toBe(1);
    expect(opened.state.focus.layer).toBe('floating');
    expect(validateWorkspace(opened.state).ok).toBe(true);
  });

  it('focuses the existing instance for singleton windows', () => {
    const state = fresh();
    const first = open(state, {
      appId: 'chat',
      windowTypeId: 'room',
      title: 'Chat',
      singleton: true,
    });
    const second = open(first.state, {
      appId: 'chat',
      windowTypeId: 'room',
      title: 'Chat again',
      singleton: true,
    });
    expect(second.instanceId).toBe(first.instanceId);
    expect(second.created).toBe(false);
    expect(Object.keys(second.state.windows)).toHaveLength(1);
    expect(second.state.focus.focusedWindowId).toBe(first.instanceId);
  });

  it('opens into an existing column as a stacked row and splits height', () => {
    const state = fresh();
    const first = open(state, { title: 'A' });
    const column = selectColumns(first.state)[0];
    const second = open(first.state, {
      title: 'B',
      intoContainerId: column?.id,
    });
    const updated = selectColumns(second.state)[0];
    expect(updated?.windows).toEqual([first.instanceId, second.instanceId]);
    expect(updated?.display).toBe('normal');
    expect(updated?.heights).toHaveLength(2);
    expect(updated?.heights?.[0]).toBeCloseTo(0.5);
    expect(second.state.focus.focusedWindowId).toBe(second.instanceId);
  });

  it('opens into a tabbed column after the active tab', () => {
    const state = fresh();
    const first = open(state, { title: 'A' });
    const tabbed = openWindow(
      first.state,
      windowInput({ title: 'Tabs', display: 'tabbed' }),
      idsForTest,
    );
    const tabs = selectColumns(tabbed.state).find((column) => column.display === 'tabbed');
    expect(tabs?.display).toBe('tabbed');
    const second = open(tabbed.state, {
      title: 'B',
      intoContainerId: tabs?.id,
    });
    const updated = selectColumns(second.state).find((item) => item.id === tabs?.id);
    expect(updated?.windows).toHaveLength(2);
    expect(updated?.heights).toHaveLength(2);
  });
});

describe('closing windows', () => {
  it('removes the last window and clears focus', () => {
    const state = fresh();
    const opened = open(state);
    const closed = closeWindow(opened.state, opened.instanceId);
    expect(closed.containers).toHaveLength(0);
    expect(closed.windows).toEqual({});
    expect(selectFocusedWindowId(closed)).toBeNull();
    expect(validateWorkspace(closed).ok).toBe(true);
  });

  it('falls back to the neighbouring row in a stacked column', () => {
    const state = fresh();
    const first = open(state, { title: 'A' });
    const column = selectColumns(first.state)[0];
    const second = open(first.state, { title: 'B', intoContainerId: column?.id });
    const third = open(second.state, { title: 'C', intoContainerId: column?.id });
    const focusedSecond = focusWindow(third.state, second.instanceId);
    const closed = closeWindow(focusedSecond, second.instanceId);
    const updated = selectColumns(closed)[0];
    expect(updated?.windows).toEqual([first.instanceId, third.instanceId]);
    expect(updated?.heights).toHaveLength(2);
    expect(updated?.heights?.[0]).toBeCloseTo(2 / 3);
    expect(updated?.heights?.[1]).toBeCloseTo(1 / 3);
    expect(closed.focus.focusedWindowId).toBe(third.instanceId);
  });

  it('falls back to the adjacent column when a column disappears', () => {
    const state = fresh();
    const first = open(state, { title: 'A' });
    const second = open(first.state, { title: 'B' });
    const closed = closeWindow(second.state, second.instanceId);
    const columns = selectColumns(closed);
    expect(columns).toHaveLength(1);
    expect(columns[0]?.windows).toEqual([first.instanceId]);
    expect(closed.focus.focusedWindowId).toBe(first.instanceId);
  });

  it('keeps focus when closing a background window', () => {
    const state = fresh();
    const first = open(state, { title: 'A' });
    const second = open(first.state, { title: 'B' });
    const closed = closeWindow(second.state, first.instanceId);
    expect(closed.focus.focusedWindowId).toBe(second.instanceId);
  });

  it('returns to the tiling layer after closing the last float', () => {
    const state = fresh();
    const tiled = open(state, { title: 'A' });
    const floated = open(tiled.state, { title: 'F', floating: true });
    expect(floated.state.focus.layer).toBe('floating');
    const closed = closeWindow(floated.state, floated.instanceId);
    expect(closed.focus.layer).toBe('tiling');
    expect(closed.focus.focusedWindowId).toBe(tiled.instanceId);
  });
});

describe('focus', () => {
  it('moves left and right between columns without wrapping', () => {
    const state = fresh();
    const first = open(state, { title: 'A' });
    const second = open(first.state, { title: 'B' });
    const left = focusDirection(second.state, 'left');
    expect(left.focus.focusedWindowId).toBe(first.instanceId);
    expect(focusDirection(left, 'left').focus.focusedWindowId).toBe(first.instanceId);
    const right = focusDirection(left, 'right');
    expect(right.focus.focusedWindowId).toBe(second.instanceId);
  });

  it('moves up and down inside a stacked column', () => {
    const state = fresh();
    const first = open(state, { title: 'A' });
    const column = selectColumns(first.state)[0];
    const second = open(first.state, { title: 'B', intoContainerId: column?.id });
    const up = focusDirection(second.state, 'up');
    expect(up.focus.focusedWindowId).toBe(first.instanceId);
    const down = focusDirection(up, 'down');
    expect(down.focus.focusedWindowId).toBe(second.instanceId);
  });

  it('switches between the tiling and floating layers', () => {
    const state = fresh();
    const tiled = open(state, { title: 'A' });
    const floated = open(tiled.state, { title: 'F', floating: true });
    const backToTiling = focusLayer(floated.state, 'tiling');
    expect(backToTiling.focus.focusedWindowId).toBe(tiled.instanceId);
    expect(backToTiling.focus.layer).toBe('tiling');
    const backToFloating = focusLayer(backToTiling, 'floating');
    expect(backToFloating.focus.focusedWindowId).toBe(floated.instanceId);
    expect(backToFloating.focus.layer).toBe('floating');
  });

  it('raises a float when focused and clears attention', () => {
    const state = fresh();
    const first = open(state, { title: 'F1', floating: true });
    const second = open(first.state, { title: 'F2', floating: true });
    const focusedFirst = focusWindow(second.state, first.instanceId);
    const floats = selectFloating(focusedFirst);
    expect(floats[floats.length - 1]?.window).toBe(first.instanceId);

    const attention = setAttention(focusedFirst, first.instanceId, 'urgent', { count: 2 });
    expect(selectAttention(attention, first.instanceId)?.level).toBe('urgent');
    const cleared = focusWindow(attention, first.instanceId);
    expect(selectAttention(cleared, first.instanceId)).toBeUndefined();
  });
});

describe('window metadata', () => {
  it('updates title, icon and chrome', () => {
    const state = fresh();
    const opened = open(state);
    const updated = updateWindow(opened.state, opened.instanceId, {
      title: 'Renamed',
      icon: 'chat',
      chrome: 'titlebar-hidden',
    });
    const window = selectWindow(updated, opened.instanceId);
    expect(window?.title).toBe('Renamed');
    expect(window?.icon).toBe('chat');
    expect(window?.chrome).toBe('titlebar-hidden');
  });

  it('stores and clears opaque app state', () => {
    const state = fresh();
    const opened = open(state);
    const withState = setWindowState(opened.state, opened.instanceId, { roomId: 'r1' });
    expect(selectWindow(withState, opened.instanceId)?.state).toEqual({ roomId: 'r1' });
    const cleared = setWindowState(withState, opened.instanceId, undefined);
    expect(selectWindow(cleared, opened.instanceId)?.state).toBeUndefined();
  });

  it('sets attention levels and clears them explicitly', () => {
    const state = fresh();
    const opened = open(state);
    const info = setAttention(opened.state, opened.instanceId, 'info');
    expect(selectAttention(info, opened.instanceId)?.level).toBe('info');
    const urgent = setAttention(info, opened.instanceId, 'urgent', { count: 3 });
    expect(selectAttention(urgent, opened.instanceId)?.payload).toEqual({ count: 3 });
    const cleared = setAttention(urgent, opened.instanceId, 'none');
    expect(selectAttention(cleared, opened.instanceId)).toBeUndefined();
  });

  it('clamps the scroll offset', () => {
    const state = fresh();
    expect(setScrollOffset(state, -4).scrollOffset).toBe(0);
    expect(setScrollOffset(state, 123).scrollOffset).toBe(123);
  });
});

describe('taskbar projection', () => {
  it('groups tiled windows by column and floats separately', () => {
    const state = fresh();
    const first = open(state, { title: 'A' });
    const column = selectColumns(first.state)[0];
    const second = open(first.state, { title: 'B', intoContainerId: column?.id });
    const floated = open(second.state, { title: 'F', floating: true });
    const groups = selectTaskbarGroups(floated.state);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.kind).toBe('column');
    expect(groups[0]?.items.map((item) => item.title)).toEqual(['A', 'B']);
    expect(groups[1]?.kind).toBe('floating');
    expect(groups[1]?.items[0]?.focused).toBe(true);
  });
});
