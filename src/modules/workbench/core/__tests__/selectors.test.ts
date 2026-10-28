import { describe, expect, it } from 'vitest';
import { focusWindow, mergeContainers, openWindow, setColumnDisplay } from '../actions';
import {
  selectActiveWindowId,
  selectAdjacentColumn,
  selectColumns,
  selectContainerState,
  selectFocusedContainer,
  selectFloating,
  selectTaskbarGroups,
  selectWindowOrder,
} from '../selectors';
import { createEmptyWorkspace } from '../state';
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

describe('container state derivation', () => {
  it('derives standard, stacked, paged and floating', () => {
    const state = fresh();
    const a = open(state, { title: 'A' });
    const column = selectColumns(a.state)[0];
    if (!column) throw new Error('missing column');
    expect(selectContainerState(column)).toBe('standard');

    const stacked = open(a.state, { title: 'B', intoContainerId: column.id });
    const stackedColumn = selectColumns(stacked.state)[0];
    if (!stackedColumn) throw new Error('missing stacked column');
    expect(selectContainerState(stackedColumn)).toBe('stacked');

    const tabbedState = setColumnDisplay(stacked.state, column.id, 'tabbed');
    const tabbedColumn = selectColumns(tabbedState)[0];
    if (!tabbedColumn) throw new Error('missing tabbed column');
    expect(selectContainerState(tabbedColumn)).toBe('paged');

    const floated = open(tabbedState, { title: 'F', floating: true });
    const floats = floated.state.containers.filter((container) => container.kind === 'floating');
    if (!floats[0]) throw new Error('missing float');
    expect(selectContainerState(floats[0])).toBe('floating');
  });
});

describe('focus and active window selectors', () => {
  it('uses the last focused window for tabbed containers', () => {
    const state = fresh();
    const a = open(state, { title: 'A', display: 'tabbed' });
    const column = selectColumns(a.state)[0];
    if (!column) throw new Error('missing column');
    const b = open(a.state, { title: 'B', intoContainerId: column.id });
    const updated = selectColumns(b.state)[0];
    if (!updated) throw new Error('missing column');
    expect(selectActiveWindowId(b.state, updated)).toBe(b.instanceId);
    const focusedA = focusWindow(b.state, a.instanceId);
    const columnA = selectColumns(focusedA)[0];
    if (!columnA) throw new Error('missing column');
    expect(selectActiveWindowId(focusedA, columnA)).toBe(a.instanceId);
  });

  it('reports the focused container', () => {
    const state = fresh();
    const a = open(state, { title: 'A' });
    const floated = open(a.state, { title: 'F', floating: true });
    const focused = selectFocusedContainer(floated.state);
    expect(focused?.kind).toBe('floating');
    expect(focused?.id).toBe(selectFloating(floated.state)[0]?.id);
  });

  it('finds adjacent columns without wrapping', () => {
    const state = fresh();
    const a = open(state, { title: 'A' });
    const b = open(a.state, { title: 'B' });
    const columns = selectColumns(b.state);
    expect(selectAdjacentColumn(b.state, columns[0]?.id ?? '', 'right')?.id).toBe(columns[1]?.id);
    expect(selectAdjacentColumn(b.state, columns[0]?.id ?? '', 'left')).toBeUndefined();
    expect(selectAdjacentColumn(b.state, columns[1]?.id ?? '', 'right')).toBeUndefined();
  });
});

describe('taskbar and ordering', () => {
  it('keeps columns in strip order and floats most recent first', () => {
    const state = fresh();
    const a = open(state, { title: 'A' });
    const b = open(a.state, { title: 'B' });
    const f1 = open(b.state, { title: 'F1', floating: true });
    const f2 = open(f1.state, { title: 'F2', floating: true });
    const groups = selectTaskbarGroups(f2.state);
    expect(groups.map((group) => group.kind)).toEqual(['column', 'column', 'floating', 'floating']);
    expect(groups[2]?.items[0]?.title).toBe('F2');
    expect(groups[3]?.items[0]?.title).toBe('F1');
  });

  it('orders windows by columns then floats from bottom to top', () => {
    const state = fresh();
    const a = open(state, { title: 'A' });
    const f1 = open(a.state, { title: 'F1', floating: true });
    const f2 = open(f1.state, { title: 'F2', floating: true });
    expect(selectWindowOrder(f2.state)).toEqual([a.instanceId, f1.instanceId, f2.instanceId]);
  });

  it('merging keeps taskbar grouping intact', () => {
    const state = fresh();
    const a = open(state, { title: 'A' });
    const b = open(a.state, { title: 'B' });
    const [source, target] = selectColumns(b.state);
    const merged = mergeContainers(b.state, source?.id ?? '', target?.id ?? '', 'tab');
    const groups = selectTaskbarGroups(merged);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.items).toHaveLength(2);
    expect(groups[0]?.state).toBe('paged');
  });
});
