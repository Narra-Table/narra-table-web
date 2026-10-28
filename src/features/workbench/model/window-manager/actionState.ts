import { equalHeights, insertRowHeights, isFiniteNumber, removeRowHeights } from './geometry';
import { selectActiveWindowId } from './selectors';
import { isFloatingContainer, normalizeWorkspace } from './state';
import type {
  ColumnContainer,
  Container,
  FloatingContainer,
  WindowInstanceId,
  WorkspaceState,
} from './types';

export function maxZOrder(state: WorkspaceState): number {
  let max = 0;
  for (const container of state.containers) {
    if (container.kind === 'floating' && container.zOrder > max) max = container.zOrder;
  }
  return max;
}

export function clampIndex(index: number | undefined, max: number, fallback: number): number {
  if (index === undefined || !isFiniteNumber(index)) return fallback;
  return Math.min(max, Math.max(0, Math.trunc(index)));
}

export function columnById(
  state: WorkspaceState,
  containerId: string,
): ColumnContainer | undefined {
  const container = state.containers.find((candidate) => candidate.id === containerId);
  return container && container.kind === 'column' ? container : undefined;
}

export function floatingById(
  state: WorkspaceState,
  containerId: string,
): FloatingContainer | undefined {
  const container = state.containers.find((candidate) => candidate.id === containerId);
  return container && container.kind === 'floating' ? container : undefined;
}

export function replaceContainer(state: WorkspaceState, container: Container): WorkspaceState {
  return {
    ...state,
    containers: state.containers.map((candidate) =>
      candidate.id === container.id ? container : candidate,
    ),
  };
}

export function withColumns(state: WorkspaceState, columns: ColumnContainer[]): WorkspaceState {
  const floats = state.containers.filter(isFloatingContainer);
  return { ...state, containers: [...columns, ...floats] };
}

export function commit(state: WorkspaceState): WorkspaceState {
  return normalizeWorkspace(state);
}

interface InsertIntoColumnResult {
  state: WorkspaceState;
  container: ColumnContainer;
}

export function insertIntoColumn(
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

export function removeFromColumn(
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

export function uniqueContainerId(state: WorkspaceState, base: string): string {
  let candidate = base;
  let suffix = 1;
  while (state.containers.some((container) => container.id === candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}
