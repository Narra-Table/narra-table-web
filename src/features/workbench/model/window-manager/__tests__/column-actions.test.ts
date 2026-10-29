import { describe, expect, it } from 'vitest';
import {
  dissolveContainer,
  equalizeRows,
  mergeContainers,
  moveContainer,
  moveWindowToColumn,
  moveWindowToNewColumn,
  openWindow,
  setColumnDisplay,
  setColumnWidth,
  setRowHeights,
  toggleColumnFullWidth,
} from '../actions';
import { selectColumns } from '../selectors';
import { createEmptyWorkspace, validateWorkspace } from '../state';
import type { WorkspaceState } from '../types';
import { idFactory, windowInput } from './helpers';

let ids = idFactory();

function fresh() {
  ids = idFactory();
  return createEmptyWorkspace();
}

function open(state: WorkspaceState, overrides: Parameters<typeof windowInput>[0] = {}) {
  return openWindow(state, windowInput(overrides), ids);
}

function firstColumnId(state: WorkspaceState): string {
  return selectColumns(state)[0]?.id ?? '';
}

describe('merging columns', () => {
  it('merges two standard columns into a stacked container', () => {
    const state = fresh();
    const left = open(state, { title: 'Left', width: 2 / 3 });
    const right = open(left.state, { title: 'Right', width: 1 / 3 });
    const target = selectColumns(right.state)[1];
    const source = selectColumns(right.state)[0];
    const merged = mergeContainers(right.state, source?.id ?? '', target?.id ?? '', 'stack');
    const columns = selectColumns(merged);
    expect(columns).toHaveLength(1);
    expect(columns[0]?.windows).toEqual([right.instanceId, left.instanceId]);
    expect(columns[0]?.display).toBe('normal');
    expect(columns[0]?.width).toBeCloseTo(1 / 3);
    expect(columns[0]?.heights).toEqual([0.5, 0.5]);
    expect(merged.windows[left.instanceId]?.lastTiledWidth).toBeCloseTo(2 / 3);
    expect(merged.focus.focusedWindowId).toBe(left.instanceId);
    expect(validateWorkspace(merged).ok).toBe(true);
  });

  it('merges two standard columns into a tabbed container', () => {
    const state = fresh();
    const left = open(state, { title: 'Left' });
    const right = open(left.state, { title: 'Right' });
    const [source, target] = selectColumns(right.state);
    const merged = mergeContainers(right.state, source?.id ?? '', target?.id ?? '', 'tab');
    const column = selectColumns(merged)[0];
    expect(column?.display).toBe('tabbed');
    expect(column?.windows).toEqual([right.instanceId, left.instanceId]);
    expect(merged.focus.focusedWindowId).toBe(left.instanceId);
  });

  it('inserts into a divided container using its current display', () => {
    const state = fresh();
    const a = open(state, { title: 'A' });
    const b = open(a.state, { title: 'B' });
    const [aColumn, bColumn] = selectColumns(b.state);
    const stacked = mergeContainers(b.state, aColumn?.id ?? '', bColumn?.id ?? '', 'stack');
    const target = selectColumns(stacked)[0];
    const c = open(stacked, { title: 'C' });
    const cColumn = selectColumns(c.state).find((column) => column.id !== target?.id);
    const merged = mergeContainers(c.state, cColumn?.id ?? '', target?.id ?? '', 'stack');
    const column = selectColumns(merged)[0];
    expect(column?.windows).toEqual([b.instanceId, a.instanceId, c.instanceId]);
    expect(column?.heights).toHaveLength(3);
    expect(column?.heights?.reduce((sum, height) => sum + height, 0)).toBeCloseTo(1);
  });

  it('does not merge a multi-window source', () => {
    const state = fresh();
    const a = open(state, { title: 'A' });
    const b = open(a.state, { title: 'B' });
    const [aColumn, bColumn] = selectColumns(b.state);
    const stacked = mergeContainers(b.state, aColumn?.id ?? '', bColumn?.id ?? '', 'stack');
    const c = open(stacked, { title: 'C' });
    const columns = selectColumns(c.state);
    const source = columns[0];
    const target = columns[1];
    const result = mergeContainers(c.state, source?.id ?? '', target?.id ?? '', 'stack');
    expect(result).toBe(c.state);
  });

  it('ignores merging a column into itself', () => {
    const state = fresh();
    const a = open(state);
    expect(mergeContainers(a.state, firstColumnId(a.state), firstColumnId(a.state), 'stack')).toBe(
      a.state,
    );
  });
});

describe('moving windows and containers', () => {
  it('moves a window into another column and focuses it', () => {
    const state = fresh();
    const a = open(state, { title: 'A' });
    const b = open(a.state, { title: 'B' });
    const [aColumn, bColumn] = selectColumns(b.state);
    const moved = moveWindowToColumn(b.state, b.instanceId, aColumn?.id ?? '');
    const columns = selectColumns(moved);
    expect(columns).toHaveLength(1);
    expect(columns[0]?.windows).toEqual([a.instanceId, b.instanceId]);
    expect(moved.focus.focusedWindowId).toBe(b.instanceId);
    // b's source column was removed.
    expect(columns.some((column) => column.id === bColumn?.id)).toBe(false);
  });

  it('moves a row out into a new standard column with its width', () => {
    const state = fresh();
    const a = open(state, { title: 'A' });
    const b = open(a.state, { title: 'B', intoContainerId: firstColumnId(a.state) });
    const moved = moveWindowToNewColumn(b.state, b.instanceId, 1);
    const columns = selectColumns(moved);
    expect(columns).toHaveLength(2);
    expect(columns[0]?.windows).toEqual([a.instanceId]);
    expect(columns[1]?.windows).toEqual([b.instanceId]);
    expect(columns[1]?.width).toBeCloseTo(0.5);
    expect(moved.focus.focusedWindowId).toBe(b.instanceId);
  });

  it('reorders columns without changing focus', () => {
    const state = fresh();
    const a = open(state, { title: 'A' });
    const b = open(a.state, { title: 'B' });
    const c = open(b.state, { title: 'C' });
    const [aColumn, bColumn, cColumn] = selectColumns(c.state);
    const reordered = moveContainer(c.state, cColumn?.id ?? '', 0);
    expect(selectColumns(reordered).map((column) => column.windows[0])).toEqual([
      c.instanceId,
      a.instanceId,
      b.instanceId,
    ]);
    expect(reordered.focus.focusedWindowId).toBe(c.instanceId);
    expect(selectColumns(reordered).some((column) => column.id === aColumn?.id)).toBe(true);
    expect(selectColumns(reordered).some((column) => column.id === bColumn?.id)).toBe(true);
  });
});

describe('dissolving columns', () => {
  it('restores a standard column per window using lastTiledWidth', () => {
    const state = fresh();
    const a = open(state, { title: 'A', width: 2 / 3 });
    const b = open(a.state, { title: 'B', width: 1 / 3 });
    const [aColumn, bColumn] = selectColumns(b.state);
    const stacked = mergeContainers(b.state, aColumn?.id ?? '', bColumn?.id ?? '', 'stack');
    const target = selectColumns(stacked)[0];
    const dissolved = dissolveContainer(stacked, target?.id ?? '');
    const columns = selectColumns(dissolved);
    expect(columns).toHaveLength(2);
    expect(columns.map((column) => column.windows[0])).toEqual([b.instanceId, a.instanceId]);
    expect(columns[0]?.width).toBeCloseTo(0.5);
    expect(columns[1]?.width).toBeCloseTo(2 / 3);
    expect(dissolved.focus.focusedWindowId).toBe(a.instanceId);
    expect(validateWorkspace(dissolved).ok).toBe(true);
  });

  it('does nothing for a standard column', () => {
    const state = fresh();
    const a = open(state);
    expect(dissolveContainer(a.state, firstColumnId(a.state))).toBe(a.state);
  });
});

describe('width and display controls', () => {
  it('remembers the last non-full width across toggles', () => {
    const state = fresh();
    const a = open(state, { width: 1 / 3 });
    const columnId = firstColumnId(a.state);

    const full = toggleColumnFullWidth(a.state, columnId);
    let column = selectColumns(full)[0];
    expect(column?.width).toBe(1);
    expect(column?.lastNonFullWidth).toBeCloseTo(1 / 3);

    const restored = toggleColumnFullWidth(full, columnId);
    column = selectColumns(restored)[0];
    expect(column?.width).toBeCloseTo(1 / 3);
    expect(column?.lastNonFullWidth).toBeCloseTo(1 / 3);
  });

  it('remembers a new width when set explicitly', () => {
    const state = fresh();
    const a = open(state, { width: 0.5 });
    const columnId = firstColumnId(a.state);
    const wide = setColumnWidth(a.state, columnId, 0.75);
    const full = setColumnWidth(wide, columnId, 1);
    expect(selectColumns(full)[0]?.lastNonFullWidth).toBe(0.75);
    const restored = toggleColumnFullWidth(full, columnId);
    expect(selectColumns(restored)[0]?.width).toBe(0.75);
  });

  it('clamps widths', () => {
    const state = fresh();
    const a = open(state);
    const columnId = firstColumnId(a.state);
    expect(selectColumns(setColumnWidth(a.state, columnId, 0.01))[0]?.width).toBe(0.2);
    expect(selectColumns(setColumnWidth(a.state, columnId, 4))[0]?.width).toBe(1);
  });

  it('preserves row weights across tabbed mode', () => {
    const state = fresh();
    const a = open(state, { title: 'A' });
    const b = open(a.state, { title: 'B', intoContainerId: firstColumnId(a.state) });
    const columnId = firstColumnId(b.state);
    const weighted = setRowHeights(b.state, columnId, [0.2, 0.8]);
    const tabbed = setColumnDisplay(weighted, columnId, 'tabbed');
    const column = selectColumns(tabbed)[0];
    expect(column?.display).toBe('tabbed');
    expect(column?.heights?.[0]).toBeCloseTo(0.2);
    expect(column?.heights?.[1]).toBeCloseTo(0.8);
    const normal = setColumnDisplay(tabbed, columnId, 'normal');
    expect(selectColumns(normal)[0]?.heights?.[0]).toBeCloseTo(0.2);
  });

  it('normalizes custom heights and equalizes rows', () => {
    const state = fresh();
    const a = open(state, { title: 'A' });
    const b = open(a.state, { title: 'B', intoContainerId: firstColumnId(a.state) });
    const columnId = firstColumnId(b.state);
    const weighted = setRowHeights(b.state, columnId, [2, 6]);
    expect(selectColumns(weighted)[0]?.heights).toEqual([0.25, 0.75]);
    const equal = equalizeRows(weighted, columnId);
    expect(selectColumns(equal)[0]?.heights).toEqual([0.5, 0.5]);
  });
});
