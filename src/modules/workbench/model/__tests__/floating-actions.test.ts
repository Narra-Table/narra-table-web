import { describe, expect, it } from 'vitest';
import {
  dockFloating,
  floatWindow,
  focusWindow,
  moveFloating,
  openWindow,
  raiseFloating,
  resizeFloating,
} from '../actions';
import { selectColumns, selectFloating } from '../selectors';
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

function float(state: WorkspaceState, instanceId: string) {
  return floatWindow(state, instanceId);
}

describe('floating windows', () => {
  it('turns a standard column into a floating window', () => {
    const state = fresh();
    const opened = open(state, { title: 'A', width: 2 / 3 });
    const floating = float(opened.state, opened.instanceId);
    expect(selectColumns(floating)).toHaveLength(0);
    const floats = selectFloating(floating);
    expect(floats).toHaveLength(1);
    expect(floats[0]?.window).toBe(opened.instanceId);
    expect(floats[0]?.zOrder).toBe(1);
    expect(floating.focus.layer).toBe('floating');
    expect(floating.windows[opened.instanceId]?.lastTiledWidth).toBeCloseTo(2 / 3);
    expect(validateWorkspace(floating).ok).toBe(true);
  });

  it('floats one row out of a stacked column and reweights the rest', () => {
    const state = fresh();
    const a = open(state, { title: 'A' });
    const b = open(a.state, { title: 'B', intoContainerId: selectColumns(a.state)[0]?.id });
    const floating = float(b.state, b.instanceId);
    const columns = selectColumns(floating);
    expect(columns).toHaveLength(1);
    expect(columns[0]?.windows).toEqual([a.instanceId]);
    expect(columns[0]?.heights).toBeUndefined();
    expect(selectFloating(floating)[0]?.window).toBe(b.instanceId);
    expect(floating.focus.focusedWindowId).toBe(b.instanceId);
  });

  it('docks a float back into a new column with its remembered width', () => {
    const state = fresh();
    const a = open(state, { title: 'A', width: 2 / 3 });
    const floating = float(a.state, a.instanceId);
    const floatId = selectFloating(floating)[0]?.id ?? '';
    const docked = dockFloating(floating, floatId);
    const columns = selectColumns(docked);
    expect(columns).toHaveLength(1);
    expect(columns[0]?.windows).toEqual([a.instanceId]);
    expect(columns[0]?.width).toBeCloseTo(2 / 3);
    expect(docked.focus.layer).toBe('tiling');
    expect(docked.focus.focusedWindowId).toBe(a.instanceId);
  });

  it('docks next to the last tiled column', () => {
    const state = fresh();
    const a = open(state, { title: 'A' });
    const b = open(a.state, { title: 'B' });
    const floating = float(b.state, a.instanceId);
    const floatId = selectFloating(floating)[0]?.id ?? '';
    const docked = dockFloating(floating, floatId);
    const columns = selectColumns(docked);
    expect(columns.map((column) => column.windows[0])).toEqual([b.instanceId, a.instanceId]);
  });

  it('moves and resizes with a minimum box', () => {
    const state = fresh();
    const opened = open(state, { title: 'A', floating: true });
    const floatId = selectFloating(opened.state)[0]?.id ?? '';
    const moved = moveFloating(opened.state, floatId, 40, 60);
    expect(selectFloating(moved)[0]).toMatchObject({ x: 40, y: 60 });
    const clampedMove = moveFloating(moved, floatId, -10, -20);
    expect(selectFloating(clampedMove)[0]).toMatchObject({ x: 0, y: 0 });
    const resized = resizeFloating(clampedMove, floatId, 10, 10);
    expect(selectFloating(resized)[0]).toMatchObject({ width: 240, height: 160 });
  });

  it('raises a float to the top of the stack', () => {
    const state = fresh();
    const first = open(state, { title: 'F1', floating: true });
    const second = open(first.state, { title: 'F2', floating: true });
    const firstFloat = selectFloating(second.state)[0];
    const raised = raiseFloating(second.state, firstFloat?.id ?? '');
    const floats = selectFloating(raised);
    expect(floats[floats.length - 1]?.window).toBe(first.instanceId);
    expect(floats[floats.length - 1]?.zOrder).toBe(3);
  });

  it('does nothing when floating an already floating window', () => {
    const state = fresh();
    const opened = open(state, { title: 'A', floating: true });
    expect(float(opened.state, opened.instanceId)).toBe(opened.state);
  });

  it('focusing a float makes it the topmost', () => {
    const state = fresh();
    const first = open(state, { title: 'F1', floating: true });
    const second = open(first.state, { title: 'F2', floating: true });
    const focused = focusWindow(second.state, first.instanceId);
    const floats = selectFloating(focused);
    expect(floats[floats.length - 1]?.window).toBe(first.instanceId);
  });
});
