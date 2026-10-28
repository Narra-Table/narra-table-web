import { focusWindow } from './actions';
import {
  clampIndex,
  commit,
  floatingById,
  maxZOrder,
  removeFromColumn,
  replaceContainer,
  uniqueContainerId,
  withColumns,
} from './actionState';
import {
  clampColumnWidth,
  clampFloatingBox,
  DEFAULT_COLUMN_WIDTH,
  isFiniteNumber,
  normalizeNonFullWidth,
} from './geometry';
import { selectColumns } from './selectors';
import { findContainerForWindow } from './state';
import type { ColumnContainer, FloatingContainer, WindowInstanceId, WorkspaceState } from './types';

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
