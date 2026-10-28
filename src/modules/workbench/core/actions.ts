import {
  clampColumnWidth,
  clampFloatingBox,
  clampScrollOffset,
  DEFAULT_COLUMN_WIDTH,
  equalHeights,
  insertRowHeights,
  isFiniteNumber,
  normalizeHeights,
  normalizeNonFullWidth,
  removeRowHeights,
} from './geometry';
import { createId as defaultCreateId, type IdFactory } from './ids';
import {
  selectActiveWindowId,
  selectAdjacentColumn,
  selectColumns,
  selectFloating,
} from './selectors';
import { findContainerForWindow, isFloatingContainer, normalizeWorkspace } from './state';
import type {
  AttentionLevel,
  ColumnContainer,
  ColumnDisplay,
  Container,
  Direction,
  FloatingContainer,
  FocusLayer,
  OpenWindowInput,
  OpenWindowResult,
  WindowInstance,
  WindowInstanceId,
  WindowPatch,
  WorkspaceState,
} from './types';

export type WorkbenchAction =
  | { type: 'workspace/replace'; state: WorkspaceState }
  | { type: 'workspace/scroll'; offset: number }
  | { type: 'window/open'; input: OpenWindowInput; instanceId: WindowInstanceId }
  | { type: 'window/close'; instanceId: WindowInstanceId }
  | { type: 'window/focus'; instanceId: WindowInstanceId; clearAttention?: boolean }
  | { type: 'window/focus-direction'; direction: Direction }
  | { type: 'window/focus-layer'; layer: FocusLayer }
  | { type: 'window/update'; instanceId: WindowInstanceId; patch: WindowPatch }
  | { type: 'window/set-state'; instanceId: WindowInstanceId; state: unknown }
  | {
      type: 'window/set-attention';
      instanceId: WindowInstanceId;
      level: AttentionLevel;
      payload?: unknown;
    }
  | {
      type: 'window/move-to-column';
      instanceId: WindowInstanceId;
      containerId: string;
      index?: number;
    }
  | {
      type: 'window/move-to-new-column';
      instanceId: WindowInstanceId;
      index?: number;
      width?: number;
    }
  | {
      type: 'container/merge';
      sourceId: string;
      targetId: string;
      mode: 'stack' | 'tab';
      index?: number;
    }
  | { type: 'container/move'; containerId: string; index: number }
  | { type: 'container/dissolve'; containerId: string }
  | { type: 'container/set-width'; containerId: string; width: number }
  | { type: 'container/toggle-full-width'; containerId: string }
  | { type: 'container/set-display'; containerId: string; display: ColumnDisplay }
  | { type: 'container/set-heights'; containerId: string; heights: number[] }
  | { type: 'container/equalize-rows'; containerId: string }
  | { type: 'floating/float'; instanceId: WindowInstanceId }
  | { type: 'floating/dock'; containerId: string; index?: number }
  | { type: 'floating/move'; containerId: string; x: number; y: number }
  | { type: 'floating/resize'; containerId: string; width: number; height: number }
  | { type: 'floating/raise'; containerId: string };

export interface ReduceOptions {
  createId?: IdFactory;
}

function maxZOrder(state: WorkspaceState): number {
  let max = 0;
  for (const container of state.containers) {
    if (container.kind === 'floating' && container.zOrder > max) max = container.zOrder;
  }
  return max;
}

function clampIndex(index: number | undefined, max: number, fallback: number): number {
  if (index === undefined || !isFiniteNumber(index)) return fallback;
  return Math.min(max, Math.max(0, Math.trunc(index)));
}

function columnById(state: WorkspaceState, containerId: string): ColumnContainer | undefined {
  const container = state.containers.find((candidate) => candidate.id === containerId);
  return container && container.kind === 'column' ? container : undefined;
}

function floatingById(state: WorkspaceState, containerId: string): FloatingContainer | undefined {
  const container = state.containers.find((candidate) => candidate.id === containerId);
  return container && container.kind === 'floating' ? container : undefined;
}

function replaceContainer(state: WorkspaceState, container: Container): WorkspaceState {
  return {
    ...state,
    containers: state.containers.map((candidate) =>
      candidate.id === container.id ? container : candidate,
    ),
  };
}

function withColumns(state: WorkspaceState, columns: ColumnContainer[]): WorkspaceState {
  const floats = state.containers.filter(isFloatingContainer);
  return { ...state, containers: [...columns, ...floats] };
}

function commit(state: WorkspaceState): WorkspaceState {
  return normalizeWorkspace(state);
}

/**
 * Focus a window and raise its float. Clears transient attention by default.
 */
export function focusWindow(
  state: WorkspaceState,
  instanceId: WindowInstanceId,
  options: { clearAttention?: boolean } = {},
): WorkspaceState {
  const container = findContainerForWindow(state, instanceId);
  if (!container || !state.windows[instanceId]) return state;

  const clearAttention = options.clearAttention ?? true;
  const expectedLayer: FocusLayer = container.kind === 'floating' ? 'floating' : 'tiling';
  const isTopFloat = container.kind !== 'floating' || maxZOrder(state) === container.zOrder;
  const hasAttention = state.windows[instanceId]?.attention !== undefined;

  if (
    state.focus.focusedWindowId === instanceId &&
    state.focus.layer === expectedLayer &&
    isTopFloat &&
    (!clearAttention || !hasAttention)
  ) {
    return state;
  }

  let windows = state.windows;
  if (clearAttention && hasAttention) {
    const window = state.windows[instanceId];
    if (window) {
      const nextWindow: WindowInstance = { ...window };
      delete nextWindow.attention;
      windows = { ...windows, [instanceId]: nextWindow };
    }
  }

  let containers = state.containers;
  if (container.kind === 'floating' && !isTopFloat) {
    containers = state.containers.map((candidate) =>
      candidate.id === container.id && candidate.kind === 'floating'
        ? { ...candidate, zOrder: maxZOrder(state) + 1 }
        : candidate,
    );
  }

  return {
    ...state,
    windows,
    containers,
    focus: {
      layer: expectedLayer,
      focusedWindowId: instanceId,
      lastFocusedWindowByContainer: {
        ...state.focus.lastFocusedWindowByContainer,
        [container.id]: instanceId,
      },
      lastTiledContainerId:
        container.kind === 'column' ? container.id : state.focus.lastTiledContainerId,
    },
  };
}

interface InsertIntoColumnResult {
  state: WorkspaceState;
  container: ColumnContainer;
}

function insertIntoColumn(
  state: WorkspaceState,
  container: ColumnContainer,
  instanceId: WindowInstanceId,
  index?: number,
): InsertIntoColumnResult {
  const oldCount = container.windows.length;
  const activeId = selectActiveWindowId(state, container);
  const activeIndex = activeId ? container.windows.indexOf(activeId) : -1;
  const insertion = clampIndex(index, oldCount, activeIndex >= 0 ? activeIndex + 1 : oldCount);

  let heights: number[] | undefined;
  if (oldCount >= 2) {
    const base = container.heights ?? equalHeights(oldCount);
    const splitIndex = insertion === 0 ? 0 : insertion - 1;
    heights = insertRowHeights(base, oldCount, splitIndex);
  } else if (oldCount === 1) {
    heights = equalHeights(2);
  }

  const windows = [
    ...container.windows.slice(0, insertion),
    instanceId,
    ...container.windows.slice(insertion),
  ];
  const nextContainer: ColumnContainer = {
    ...container,
    windows,
    ...(heights ? { heights } : { heights: undefined }),
  };
  return {
    state: replaceContainer(state, nextContainer),
    container: nextContainer,
  };
}

interface RemoveFromColumnResult {
  state: WorkspaceState;
  container?: ColumnContainer;
  index: number;
}

function removeFromColumn(
  state: WorkspaceState,
  container: ColumnContainer,
  instanceId: WindowInstanceId,
): RemoveFromColumnResult {
  const index = container.windows.indexOf(instanceId);
  if (index < 0) return { state, container, index: -1 };

  if (container.windows.length === 1) {
    return {
      state: {
        ...state,
        containers: state.containers.filter((candidate) => candidate.id !== container.id),
      },
      index,
    };
  }

  const windows = container.windows.filter((id) => id !== instanceId);
  const heights = removeRowHeights(container.heights, container.windows.length, index);
  const nextContainer: ColumnContainer = {
    ...container,
    windows,
    ...(heights.length > 0 ? { heights } : { heights: undefined }),
  };
  return {
    state: replaceContainer(state, nextContainer),
    container: nextContainer,
    index,
  };
}

function uniqueContainerId(state: WorkspaceState, base: string): string {
  let candidate = base;
  let suffix = 1;
  while (state.containers.some((container) => container.id === candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

/**
 * Open a window. The host resolves app defaults into `input`; the core only
 * applies placement, singleton, focus and container rules.
 */
export function openWindow(
  state: WorkspaceState,
  input: OpenWindowInput,
  createId: IdFactory = defaultCreateId,
): OpenWindowResult {
  if (input.singleton) {
    const existing = Object.values(state.windows).find(
      (window) => window.appId === input.appId && window.windowTypeId === input.windowTypeId,
    );
    if (existing) {
      return {
        state: focusWindow(state, existing.instanceId),
        instanceId: existing.instanceId,
        created: false,
      };
    }
  }

  let instanceId = input.instanceId ?? createId('win');
  if (state.windows[instanceId]) {
    if (input.instanceId) {
      return { state, instanceId, created: false };
    }
    instanceId = createId('win');
    if (state.windows[instanceId]) {
      return { state, instanceId, created: false };
    }
  }

  const window: WindowInstance = {
    instanceId,
    appId: input.appId,
    windowTypeId: input.windowTypeId,
    title: input.title,
    ...(input.icon ? { icon: input.icon } : {}),
    chrome: input.chrome === 'titlebar-hidden' ? 'titlebar-hidden' : 'full',
    ...(input.state === undefined ? {} : { state: input.state }),
  };
  const baseState: WorkspaceState = {
    ...state,
    windows: { ...state.windows, [instanceId]: window },
  };

  if (input.floating) {
    const container: FloatingContainer = {
      id: createId('float'),
      kind: 'floating',
      window: instanceId,
      ...clampFloatingBox(input.floatingBox),
      zOrder: maxZOrder(state) + 1,
    };
    const nextState: WorkspaceState = {
      ...baseState,
      containers: [...baseState.containers, container],
    };
    return {
      state: focusWindow(nextState, instanceId),
      instanceId,
      created: true,
    };
  }

  if (input.intoContainerId) {
    const target = columnById(baseState, input.intoContainerId);
    if (target) {
      const inserted = insertIntoColumn(baseState, target, instanceId, input.index);
      return {
        state: focusWindow(inserted.state, instanceId),
        instanceId,
        created: true,
      };
    }
  }

  const width = clampColumnWidth(input.width);
  const display = input.display === 'tabbed' ? 'tabbed' : 'normal';
  const column: ColumnContainer = {
    id: createId('col'),
    kind: 'column',
    display,
    width,
    lastNonFullWidth: normalizeNonFullWidth(
      width < 1 ? width : DEFAULT_COLUMN_WIDTH,
      DEFAULT_COLUMN_WIDTH,
    ),
    windows: [instanceId],
  };

  const columns = selectColumns(baseState);
  const lastTiledId = state.focus.lastTiledContainerId;
  const lastTiledIndex = lastTiledId
    ? columns.findIndex((candidate) => candidate.id === lastTiledId)
    : -1;
  const insertion = lastTiledIndex >= 0 ? lastTiledIndex + 1 : 0;
  columns.splice(insertion, 0, column);

  const nextState = withColumns(baseState, columns);
  return {
    state: focusWindow(nextState, instanceId),
    instanceId,
    created: true,
  };
}

export function closeWindow(state: WorkspaceState, instanceId: WindowInstanceId): WorkspaceState {
  const container = findContainerForWindow(state, instanceId);
  if (!container || !state.windows[instanceId]) return state;

  const wasFocused = state.focus.focusedWindowId === instanceId;
  let next = state;
  let fallbackContainer: Container | undefined;
  let fallbackWindowId: WindowInstanceId | undefined;

  if (container.kind === 'column') {
    const columns = selectColumns(state);
    const columnIndex = columns.findIndex((candidate) => candidate.id === container.id);
    const windowIndex = container.windows.indexOf(instanceId);

    if (container.windows.length === 1) {
      const remainingColumns = columns.filter((candidate) => candidate.id !== container.id);
      const neighbor =
        remainingColumns[Math.min(columnIndex, remainingColumns.length - 1)] ??
        remainingColumns[columnIndex - 1];
      if (neighbor) {
        fallbackContainer = neighbor;
        fallbackWindowId = selectActiveWindowId(state, neighbor) ?? undefined;
      } else {
        const floats = selectFloating(state);
        const top = floats[floats.length - 1];
        if (top) {
          fallbackContainer = top;
          fallbackWindowId = top.window;
        }
      }
      next = {
        ...state,
        containers: state.containers.filter((candidate) => candidate.id !== container.id),
      };
    } else {
      const removed = removeFromColumn(state, container, instanceId);
      next = removed.state;
      if (removed.container) {
        fallbackContainer = removed.container;
        fallbackWindowId =
          removed.container.windows[Math.min(windowIndex, removed.container.windows.length - 1)] ??
          removed.container.windows[removed.container.windows.length - 1];
      }
    }
  } else {
    const floats = selectFloating(state).filter((candidate) => candidate.id !== container.id);
    const top = floats[floats.length - 1];
    if (top) {
      fallbackContainer = top;
      fallbackWindowId = top.window;
    } else {
      const columns = selectColumns(state);
      const column =
        (state.focus.lastTiledContainerId
          ? columns.find((candidate) => candidate.id === state.focus.lastTiledContainerId)
          : undefined) ?? columns[0];
      if (column) {
        fallbackContainer = column;
        fallbackWindowId = selectActiveWindowId(state, column) ?? undefined;
      }
    }
    next = {
      ...state,
      containers: state.containers.filter((candidate) => candidate.id !== container.id),
    };
  }

  const windows = { ...next.windows };
  delete windows[instanceId];
  next = { ...next, windows };

  if (!next.containers.some((candidate) => candidate.id === container.id)) {
    const lastFocused = { ...next.focus.lastFocusedWindowByContainer };
    delete lastFocused[container.id];
    next = {
      ...next,
      focus: { ...next.focus, lastFocusedWindowByContainer: lastFocused },
    };
  }

  if (wasFocused && fallbackWindowId && fallbackContainer) {
    next = focusWindow(next, fallbackWindowId, { clearAttention: false });
  }

  return commit(next);
}

export function focusDirection(state: WorkspaceState, direction: Direction): WorkspaceState {
  const focusedId = state.focus.focusedWindowId;
  if (!focusedId) return focusLayer(state, 'tiling');

  const container = findContainerForWindow(state, focusedId);
  if (!container) return state;
  if (container.kind === 'floating') return state;

  if (direction === 'left' || direction === 'right') {
    const target = selectAdjacentColumn(state, container.id, direction);
    if (!target) return state;
    const active = selectActiveWindowId(state, target);
    return active ? focusWindow(state, active) : state;
  }

  const index = container.windows.indexOf(focusedId);
  const targetIndex = index + (direction === 'up' ? -1 : 1);
  const targetId = container.windows[targetIndex];
  return targetId ? focusWindow(state, targetId) : state;
}

export function focusLayer(state: WorkspaceState, layer: FocusLayer): WorkspaceState {
  if (layer === 'tiling') {
    if (state.focus.layer === 'tiling' && state.focus.focusedWindowId) {
      const container = findContainerForWindow(state, state.focus.focusedWindowId);
      if (container?.kind === 'column') return state;
    }
    const columns = selectColumns(state);
    const lastTiled = state.focus.lastTiledContainerId
      ? columns.find((candidate) => candidate.id === state.focus.lastTiledContainerId)
      : undefined;
    const column = lastTiled ?? columns[0];
    const active = column ? selectActiveWindowId(state, column) : null;
    return active ? focusWindow(state, active) : state;
  }

  if (state.focus.layer === 'floating' && state.focus.focusedWindowId) return state;
  const floats = selectFloating(state);
  const top = floats[floats.length - 1];
  return top ? focusWindow(state, top.window) : state;
}

export function updateWindow(
  state: WorkspaceState,
  instanceId: WindowInstanceId,
  patch: WindowPatch,
): WorkspaceState {
  const window = state.windows[instanceId];
  if (!window) return state;

  const next: WindowInstance = { ...window };
  if (patch.title !== undefined) next.title = patch.title;
  if (patch.icon !== undefined) {
    if (patch.icon) next.icon = patch.icon;
    else delete next.icon;
  }
  if (patch.chrome !== undefined) next.chrome = patch.chrome;

  return { ...state, windows: { ...state.windows, [instanceId]: next } };
}

export function setWindowState(
  state: WorkspaceState,
  instanceId: WindowInstanceId,
  appState: unknown,
): WorkspaceState {
  const window = state.windows[instanceId];
  if (!window) return state;
  const next: WindowInstance = { ...window };
  if (appState === undefined) delete next.state;
  else next.state = appState;
  return { ...state, windows: { ...state.windows, [instanceId]: next } };
}

export function setAttention(
  state: WorkspaceState,
  instanceId: WindowInstanceId,
  level: AttentionLevel,
  payload?: unknown,
): WorkspaceState {
  const window = state.windows[instanceId];
  if (!window) return state;
  const next: WindowInstance = { ...window };
  if (level === 'none') {
    delete next.attention;
  } else {
    next.attention = { level, ...(payload === undefined ? {} : { payload }) };
  }
  return { ...state, windows: { ...state.windows, [instanceId]: next } };
}

export function mergeContainers(
  state: WorkspaceState,
  sourceId: string,
  targetId: string,
  mode: 'stack' | 'tab',
  index?: number,
): WorkspaceState {
  if (sourceId === targetId) return state;
  const source = columnById(state, sourceId);
  const target = columnById(state, targetId);
  if (!source || !target || source.windows.length !== 1) return state;

  const movedId = source.windows[0];
  if (!movedId || !state.windows[movedId]) return state;
  const moved = state.windows[movedId];
  const movedWidth = clampColumnWidth(source.width);

  const activeId = selectActiveWindowId(state, target);
  const activeIndex = activeId ? target.windows.indexOf(activeId) : -1;
  const insertion = clampIndex(
    index,
    target.windows.length,
    activeIndex >= 0 ? activeIndex + 1 : target.windows.length,
  );

  const display: ColumnDisplay =
    mode === 'tab' || target.display === 'tabbed' ? 'tabbed' : 'normal';
  const oldCount = target.windows.length;
  let heights: number[] | undefined;
  if (oldCount >= 2) {
    const base = target.heights ?? equalHeights(oldCount);
    const splitIndex = insertion === 0 ? 0 : insertion - 1;
    heights = insertRowHeights(base, oldCount, splitIndex);
  } else if (oldCount === 1) {
    heights = equalHeights(2);
  }

  const nextTarget: ColumnContainer = {
    ...target,
    display,
    windows: [...target.windows.slice(0, insertion), movedId, ...target.windows.slice(insertion)],
    ...(heights ? { heights } : { heights: undefined }),
  };

  const columns = selectColumns(state)
    .filter((candidate) => candidate.id !== source.id)
    .map((candidate) => (candidate.id === target.id ? nextTarget : candidate));

  const nextState: WorkspaceState = {
    ...withColumns(state, columns),
    windows: {
      ...state.windows,
      [movedId]: { ...moved, lastTiledWidth: movedWidth },
    },
  };

  const movedContainer = nextState.containers.find(
    (candidate): candidate is ColumnContainer =>
      candidate.kind === 'column' && candidate.id === target.id,
  );
  return commit(movedContainer ? focusWindow(nextState, movedId) : nextState);
}

export function moveWindowToColumn(
  state: WorkspaceState,
  instanceId: WindowInstanceId,
  targetId: string,
  index?: number,
): WorkspaceState {
  const source = findContainerForWindow(state, instanceId);
  if (!source || source.kind !== 'column') return state;
  if (source.id === targetId) return state;

  const target = columnById(state, targetId);
  if (!target) return state;

  const window = state.windows[instanceId];
  if (!window) return state;

  const removed = removeFromColumn(state, source, instanceId);
  const nextTarget = columnById(removed.state, targetId);
  if (!nextTarget) return removed.state;

  const inserted = insertIntoColumn(removed.state, nextTarget, instanceId, index);
  const nextState: WorkspaceState = {
    ...inserted.state,
    windows: {
      ...inserted.state.windows,
      [instanceId]: { ...window, lastTiledWidth: clampColumnWidth(source.width) },
    },
  };
  return commit(focusWindow(nextState, instanceId));
}

export function moveWindowToNewColumn(
  state: WorkspaceState,
  instanceId: WindowInstanceId,
  index?: number,
  width?: number,
): WorkspaceState {
  const source = findContainerForWindow(state, instanceId);
  if (!source || source.kind !== 'column') return state;
  const window = state.windows[instanceId];
  if (!window) return state;

  const sourceIndex = selectColumns(state).findIndex((candidate) => candidate.id === source.id);
  const removed = removeFromColumn(state, source, instanceId);
  const sourceRemoved = !removed.state.containers.some((candidate) => candidate.id === source.id);

  const nextWidth = clampColumnWidth(width ?? window.lastTiledWidth ?? source.width);
  const column: ColumnContainer = {
    id: uniqueContainerId(removed.state, `col-${instanceId}`),
    kind: 'column',
    display: 'normal',
    width: nextWidth,
    lastNonFullWidth: normalizeNonFullWidth(
      nextWidth < 1 ? nextWidth : DEFAULT_COLUMN_WIDTH,
      DEFAULT_COLUMN_WIDTH,
    ),
    windows: [instanceId],
  };

  const columns = selectColumns(removed.state);
  const insertion = clampIndex(
    index,
    columns.length,
    sourceRemoved ? sourceIndex : sourceIndex + 1,
  );
  columns.splice(insertion, 0, column);

  const nextState: WorkspaceState = {
    ...withColumns(removed.state, columns),
    windows: {
      ...removed.state.windows,
      [instanceId]: { ...window, lastTiledWidth: clampColumnWidth(source.width) },
    },
  };
  return commit(focusWindow(nextState, instanceId));
}

export function moveContainer(
  state: WorkspaceState,
  containerId: string,
  index: number,
): WorkspaceState {
  const columns = selectColumns(state);
  const from = columns.findIndex((candidate) => candidate.id === containerId);
  if (from < 0) return state;
  const to = clampIndex(index, columns.length - 1, from);
  if (to === from) return state;
  const [moved] = columns.splice(from, 1);
  if (!moved) return state;
  columns.splice(to, 0, moved);
  return commit(withColumns(state, columns));
}

export function dissolveContainer(state: WorkspaceState, containerId: string): WorkspaceState {
  const container = columnById(state, containerId);
  if (!container || container.windows.length < 2) return state;

  const columns = selectColumns(state);
  const columnIndex = columns.findIndex((candidate) => candidate.id === containerId);
  if (columnIndex < 0) return state;

  const nextColumns: ColumnContainer[] = container.windows.map((windowId, offset) => {
    const window = state.windows[windowId];
    const width = clampColumnWidth(window?.lastTiledWidth ?? DEFAULT_COLUMN_WIDTH);
    return {
      id: uniqueContainerId(state, `${container.id}-${offset + 1}`),
      kind: 'column',
      display: 'normal',
      width,
      lastNonFullWidth: normalizeNonFullWidth(
        width < 1 ? width : DEFAULT_COLUMN_WIDTH,
        DEFAULT_COLUMN_WIDTH,
      ),
      windows: [windowId],
    };
  });

  columns.splice(columnIndex, 1, ...nextColumns);
  const nextState = withColumns(state, columns);
  const focused =
    state.focus.focusedWindowId && container.windows.includes(state.focus.focusedWindowId)
      ? state.focus.focusedWindowId
      : null;
  return commit(focused ? focusWindow(nextState, focused) : nextState);
}

export function setColumnWidth(
  state: WorkspaceState,
  containerId: string,
  width: number,
): WorkspaceState {
  const column = columnById(state, containerId);
  if (!column) return state;
  const nextWidth = clampColumnWidth(width);
  if (Math.abs(nextWidth - column.width) < 1e-9) return state;

  const lastNonFullWidth =
    nextWidth < 1
      ? nextWidth
      : normalizeNonFullWidth(column.lastNonFullWidth, DEFAULT_COLUMN_WIDTH);

  return replaceContainer(state, {
    ...column,
    width: nextWidth,
    lastNonFullWidth,
  });
}

export function toggleColumnFullWidth(state: WorkspaceState, containerId: string): WorkspaceState {
  const column = columnById(state, containerId);
  if (!column) return state;

  if (column.width < 1) {
    return replaceContainer(state, {
      ...column,
      width: 1,
      lastNonFullWidth: column.width,
    });
  }

  const target = normalizeNonFullWidth(column.lastNonFullWidth, DEFAULT_COLUMN_WIDTH);
  return replaceContainer(state, {
    ...column,
    width: target,
    lastNonFullWidth: target,
  });
}

export function setColumnDisplay(
  state: WorkspaceState,
  containerId: string,
  display: ColumnDisplay,
): WorkspaceState {
  const column = columnById(state, containerId);
  if (!column || column.display === display) return state;

  const count = column.windows.length;
  const heights = count > 1 ? normalizeHeights(column.heights, count) : undefined;

  return replaceContainer(state, {
    ...column,
    display,
    ...(heights ? { heights } : { heights: undefined }),
  });
}

export function setRowHeights(
  state: WorkspaceState,
  containerId: string,
  heights: readonly number[],
): WorkspaceState {
  const column = columnById(state, containerId);
  if (!column || column.windows.length < 2) return state;
  return replaceContainer(state, {
    ...column,
    heights: normalizeHeights(heights, column.windows.length),
  });
}

export function equalizeRows(state: WorkspaceState, containerId: string): WorkspaceState {
  const column = columnById(state, containerId);
  if (!column || column.windows.length < 2) return state;
  return replaceContainer(state, {
    ...column,
    heights: equalHeights(column.windows.length),
  });
}

export function floatWindow(state: WorkspaceState, instanceId: WindowInstanceId): WorkspaceState {
  const container = findContainerForWindow(state, instanceId);
  if (!container || container.kind === 'floating') return state;
  const window = state.windows[instanceId];
  if (!window) return state;

  let next = state;
  if (container.windows.length === 1) {
    next = {
      ...state,
      containers: state.containers.filter((candidate) => candidate.id !== container.id),
    };
  } else {
    next = removeFromColumn(state, container, instanceId).state;
  }

  const floating: FloatingContainer = {
    id: uniqueContainerId(next, `float-${instanceId}`),
    kind: 'floating',
    window: instanceId,
    ...clampFloatingBox(undefined),
    zOrder: maxZOrder(state) + 1,
  };

  next = {
    ...next,
    windows: {
      ...next.windows,
      [instanceId]: {
        ...window,
        lastTiledWidth: clampColumnWidth(container.width),
      },
    },
    containers: [...next.containers, floating],
  };

  return commit(focusWindow(next, instanceId));
}

export function dockFloating(
  state: WorkspaceState,
  containerId: string,
  index?: number,
): WorkspaceState {
  const floating = floatingById(state, containerId);
  if (!floating) return state;
  const window = state.windows[floating.window];
  if (!window) return state;

  const columns = selectColumns(state);
  const lastTiledIndex = state.focus.lastTiledContainerId
    ? columns.findIndex((candidate) => candidate.id === state.focus.lastTiledContainerId)
    : -1;
  const insertion = clampIndex(index, columns.length, lastTiledIndex >= 0 ? lastTiledIndex + 1 : 0);

  const width = clampColumnWidth(window.lastTiledWidth ?? DEFAULT_COLUMN_WIDTH);
  const column: ColumnContainer = {
    id: uniqueContainerId(state, `col-${floating.window}`),
    kind: 'column',
    display: 'normal',
    width,
    lastNonFullWidth: normalizeNonFullWidth(
      width < 1 ? width : DEFAULT_COLUMN_WIDTH,
      DEFAULT_COLUMN_WIDTH,
    ),
    windows: [floating.window],
  };
  columns.splice(insertion, 0, column);

  const nextState = withColumns(
    {
      ...state,
      containers: state.containers.filter((candidate) => candidate.id !== containerId),
    },
    columns,
  );
  return commit(focusWindow(nextState, floating.window));
}

export function moveFloating(
  state: WorkspaceState,
  containerId: string,
  x: number,
  y: number,
): WorkspaceState {
  const floating = floatingById(state, containerId);
  if (!floating || !isFiniteNumber(x) || !isFiniteNumber(y)) return state;
  const nextX = Math.max(0, x);
  const nextY = Math.max(0, y);
  if (nextX === floating.x && nextY === floating.y) return state;
  return replaceContainer(state, { ...floating, x: nextX, y: nextY });
}

export function resizeFloating(
  state: WorkspaceState,
  containerId: string,
  width: number,
  height: number,
): WorkspaceState {
  const floating = floatingById(state, containerId);
  if (!floating) return state;
  const box = clampFloatingBox({ ...floating, width, height });
  if (box.width === floating.width && box.height === floating.height) return state;
  return replaceContainer(state, { ...floating, width: box.width, height: box.height });
}

export function raiseFloating(state: WorkspaceState, containerId: string): WorkspaceState {
  const floating = floatingById(state, containerId);
  if (!floating) return state;
  const max = maxZOrder(state);
  if (floating.zOrder === max) return state;
  return replaceContainer(state, { ...floating, zOrder: max + 1 });
}

export function setScrollOffset(state: WorkspaceState, offset: number): WorkspaceState {
  const next = clampScrollOffset(offset, state.scrollOffset);
  if (next === state.scrollOffset) return state;
  return { ...state, scrollOffset: next };
}

/** Pure action reducer used by the store and by host integrations. */
export function reduce(
  state: WorkspaceState,
  action: WorkbenchAction,
  options: ReduceOptions = {},
): WorkspaceState {
  switch (action.type) {
    case 'workspace/replace':
      return commit(action.state);
    case 'workspace/scroll':
      return setScrollOffset(state, action.offset);
    case 'window/open':
      return openWindow(
        state,
        { ...action.input, instanceId: action.instanceId },
        options.createId ?? defaultCreateId,
      ).state;
    case 'window/close':
      return closeWindow(state, action.instanceId);
    case 'window/focus':
      return focusWindow(state, action.instanceId, {
        clearAttention: action.clearAttention,
      });
    case 'window/focus-direction':
      return focusDirection(state, action.direction);
    case 'window/focus-layer':
      return focusLayer(state, action.layer);
    case 'window/update':
      return updateWindow(state, action.instanceId, action.patch);
    case 'window/set-state':
      return setWindowState(state, action.instanceId, action.state);
    case 'window/set-attention':
      return setAttention(state, action.instanceId, action.level, action.payload);
    case 'window/move-to-column':
      return moveWindowToColumn(state, action.instanceId, action.containerId, action.index);
    case 'window/move-to-new-column':
      return moveWindowToNewColumn(state, action.instanceId, action.index, action.width);
    case 'container/merge':
      return mergeContainers(state, action.sourceId, action.targetId, action.mode, action.index);
    case 'container/move':
      return moveContainer(state, action.containerId, action.index);
    case 'container/dissolve':
      return dissolveContainer(state, action.containerId);
    case 'container/set-width':
      return setColumnWidth(state, action.containerId, action.width);
    case 'container/toggle-full-width':
      return toggleColumnFullWidth(state, action.containerId);
    case 'container/set-display':
      return setColumnDisplay(state, action.containerId, action.display);
    case 'container/set-heights':
      return setRowHeights(state, action.containerId, action.heights);
    case 'container/equalize-rows':
      return equalizeRows(state, action.containerId);
    case 'floating/float':
      return floatWindow(state, action.instanceId);
    case 'floating/dock':
      return dockFloating(state, action.containerId, action.index);
    case 'floating/move':
      return moveFloating(state, action.containerId, action.x, action.y);
    case 'floating/resize':
      return resizeFloating(state, action.containerId, action.width, action.height);
    case 'floating/raise':
      return raiseFloating(state, action.containerId);
    default:
      return state;
  }
}
