import { describe, expect, it } from 'vitest';
import {
  createEmptyWorkspace,
  createWorkspace,
  normalizeWorkspace,
  validateWorkspace,
} from '../state';
import type { ColumnContainer, FloatingContainer, WindowInstance, WorkspaceState } from '../types';

function windowFixture(instanceId: string): WindowInstance {
  return {
    instanceId,
    appId: 'demo',
    windowTypeId: 'note',
    title: instanceId,
    chrome: 'full',
  };
}

function columnFixture(
  id: string,
  windows: string[],
  overrides: Partial<ColumnContainer> = {},
): ColumnContainer {
  return {
    id,
    kind: 'column',
    display: 'normal',
    width: 0.5,
    lastNonFullWidth: 0.5,
    windows,
    ...overrides,
  };
}

function floatingFixture(
  id: string,
  window: string,
  overrides: Partial<FloatingContainer> = {},
): FloatingContainer {
  return {
    id,
    kind: 'floating',
    window,
    x: 10,
    y: 20,
    width: 400,
    height: 300,
    zOrder: 1,
    ...overrides,
  };
}

function rawState(overrides: Partial<WorkspaceState> = {}): WorkspaceState {
  return {
    ...createEmptyWorkspace(),
    ...overrides,
  };
}

describe('workspace construction', () => {
  it('creates an empty workspace with no focus', () => {
    const state = createEmptyWorkspace();
    expect(state.version).toBe(1);
    expect(state.windows).toEqual({});
    expect(state.containers).toEqual([]);
    expect(state.focus.focusedWindowId).toBeNull();
    expect(state.scrollOffset).toBe(0);
    expect(validateWorkspace(state).ok).toBe(true);
  });

  it('normalizes arrays into a valid focused workspace', () => {
    const state = createWorkspace({
      windows: [windowFixture('w1'), windowFixture('w2')],
      containers: [columnFixture('c1', ['w1']), floatingFixture('f1', 'w2', { zOrder: 8 })],
      scrollOffset: -5,
    });
    expect(state.containers.map((container) => container.id)).toEqual(['c1', 'f1']);
    expect(state.focus.focusedWindowId).toBe('w1');
    expect(state.focus.layer).toBe('tiling');
    expect(state.scrollOffset).toBe(0);
    expect(validateWorkspace(state).ok).toBe(true);
  });

  it('drops dangling windows and repairs focus', () => {
    const state = rawState({
      windows: {
        w1: windowFixture('w1'),
        w2: windowFixture('w2'),
        ghost: windowFixture('ghost'),
      },
      containers: [columnFixture('c1', ['w1']), columnFixture('c2', ['w2'])],
      focus: {
        layer: 'floating',
        focusedWindowId: 'ghost',
        lastFocusedWindowByContainer: { c1: 'ghost', c2: 'w2' },
        lastTiledContainerId: 'c2',
      },
    });
    const normalized = normalizeWorkspace(state);
    expect(normalized.windows.ghost).toBeUndefined();
    expect(normalized.containers).toHaveLength(2);
    expect(normalized.focus.focusedWindowId).toBe('w2');
    expect(normalized.focus.layer).toBe('tiling');
    expect(normalized.focus.lastFocusedWindowByContainer.c1).toBe('w1');
    expect(validateWorkspace(normalized).ok).toBe(true);
  });

  it('keeps a window only in the first container that claims it', () => {
    const state = rawState({
      windows: { w1: windowFixture('w1') },
      containers: [columnFixture('c1', ['w1']), columnFixture('c2', ['w1'])],
    });
    const normalized = normalizeWorkspace(state);
    expect(normalized.containers).toHaveLength(1);
    expect(normalized.containers[0]?.id).toBe('c1');
  });

  it('canonicalizes floating order and normalizes z-order', () => {
    const state = rawState({
      windows: {
        w1: windowFixture('w1'),
        w2: windowFixture('w2'),
        w3: windowFixture('w3'),
      },
      containers: [
        floatingFixture('f2', 'w2', { zOrder: 30 }),
        columnFixture('c1', ['w1']),
        floatingFixture('f1', 'w3', { zOrder: 10 }),
      ],
    });
    const normalized = normalizeWorkspace(state);
    expect(normalized.containers.map((container) => container.id)).toEqual(['c1', 'f1', 'f2']);
    const floats = normalized.containers.filter((container) => container.kind === 'floating');
    expect(floats.map((container) => container.zOrder)).toEqual([1, 2]);
  });

  it('normalizes row weights and non-full width memory', () => {
    const state = rawState({
      windows: { w1: windowFixture('w1'), w2: windowFixture('w2') },
      containers: [
        columnFixture('c1', ['w1', 'w2'], {
          width: 1,
          lastNonFullWidth: 1,
          heights: [4, 6],
        }),
      ],
    });
    const normalized = normalizeWorkspace(state);
    const column = normalized.containers[0];
    expect(column?.kind).toBe('column');
    if (column?.kind === 'column') {
      expect(column.heights).toEqual([0.4, 0.6]);
      expect(column.lastNonFullWidth).toBe(0.5);
    }
  });
});

describe('workspace validation', () => {
  it('reports duplicate references', () => {
    const state = rawState({
      windows: { w1: windowFixture('w1') },
      containers: [columnFixture('c1', ['w1']), columnFixture('c2', ['w1'])],
      focus: {
        layer: 'tiling',
        focusedWindowId: 'w1',
        lastFocusedWindowByContainer: { c1: 'w1', c2: 'w1' },
        lastTiledContainerId: 'c1',
      },
    });
    const result = validateWorkspace(state);
    expect(result.ok).toBe(false);
    expect(result.errors.join('\n')).toContain('more than one container');
  });

  it('reports empty columns and windowless references', () => {
    const state = rawState({
      windows: { w1: windowFixture('w1') },
      containers: [columnFixture('c1', []), columnFixture('c2', ['ghost'])],
      focus: {
        layer: 'tiling',
        focusedWindowId: null,
        lastFocusedWindowByContainer: {},
        lastTiledContainerId: null,
      },
    });
    const result = validateWorkspace(state);
    expect(result.ok).toBe(false);
    expect(result.errors.join('\n')).toContain('is empty');
    expect(result.errors.join('\n')).toContain('references ghost');
  });

  it('reports invalid heights, widths and focus', () => {
    const state = rawState({
      windows: { w1: windowFixture('w1'), w2: windowFixture('w2') },
      containers: [
        columnFixture('c1', ['w1', 'w2'], {
          width: 4,
          heights: [1, 2, 3],
        }),
      ],
      focus: {
        layer: 'floating',
        focusedWindowId: 'w2',
        lastFocusedWindowByContainer: { c1: 'w2' },
        lastTiledContainerId: 'c1',
      },
    });
    const result = validateWorkspace(state);
    const errors = result.errors.join('\n');
    expect(result.ok).toBe(false);
    expect(errors).toContain('invalid width');
    expect(errors).toContain('heights length mismatch');
    expect(errors).toContain('layer does not match');
  });
});
