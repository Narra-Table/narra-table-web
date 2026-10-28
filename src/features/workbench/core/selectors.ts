import {
  containerWindowIds,
  findContainerForWindow,
  isColumnContainer,
  isFloatingContainer,
} from './state';
import type {
  Attention,
  ColumnContainer,
  Container,
  ContainerState,
  Direction,
  FloatingContainer,
  WindowInstance,
  WindowInstanceId,
  WorkspaceState,
} from './types';

export interface TaskbarItem {
  instanceId: WindowInstanceId;
  title: string;
  icon?: string;
  attention?: Attention;
  focused: boolean;
}

export interface TaskbarGroup {
  containerId: string;
  kind: 'column' | 'floating';
  state: ContainerState;
  title: string;
  items: TaskbarItem[];
}

export function selectColumns(state: WorkspaceState): ColumnContainer[] {
  return state.containers.filter(isColumnContainer);
}

/** Floating containers from bottom to top. */
export function selectFloating(state: WorkspaceState): FloatingContainer[] {
  return state.containers
    .filter(isFloatingContainer)
    .slice()
    .sort((left, right) => left.zOrder - right.zOrder);
}

export function selectContainer(state: WorkspaceState, containerId: string): Container | undefined {
  return state.containers.find((container) => container.id === containerId);
}

export function selectWindow(
  state: WorkspaceState,
  instanceId: WindowInstanceId,
): WindowInstance | undefined {
  return state.windows[instanceId];
}

export function selectContainerForWindow(
  state: WorkspaceState,
  instanceId: WindowInstanceId,
): Container | undefined {
  return findContainerForWindow(state, instanceId);
}

export function selectContainerState(container: Container): ContainerState {
  if (container.kind === 'floating') return 'floating';
  if (container.display === 'tabbed') return 'paged';
  return container.windows.length > 1 ? 'stacked' : 'standard';
}

export function selectWindowIndex(
  container: ColumnContainer,
  instanceId: WindowInstanceId,
): number {
  return container.windows.indexOf(instanceId);
}

export function selectActiveWindowId(
  state: WorkspaceState,
  container: Container,
): WindowInstanceId | null {
  if (container.kind === 'floating') return container.window;
  const remembered = state.focus.lastFocusedWindowByContainer[container.id];
  if (remembered && container.windows.includes(remembered)) return remembered;
  return container.windows[0] ?? null;
}

export function selectFocusedWindowId(state: WorkspaceState): WindowInstanceId | null {
  return state.focus.focusedWindowId;
}

export function selectFocusedWindow(state: WorkspaceState): WindowInstance | undefined {
  const instanceId = state.focus.focusedWindowId;
  return instanceId ? state.windows[instanceId] : undefined;
}

export function selectFocusedContainer(state: WorkspaceState): Container | undefined {
  const instanceId = state.focus.focusedWindowId;
  return instanceId ? findContainerForWindow(state, instanceId) : undefined;
}

export function selectIsFocused(state: WorkspaceState, instanceId: WindowInstanceId): boolean {
  return state.focus.focusedWindowId === instanceId;
}

export function selectAttention(
  state: WorkspaceState,
  instanceId: WindowInstanceId,
): Attention | undefined {
  return state.windows[instanceId]?.attention;
}

export function selectFocusedRowIndex(state: WorkspaceState, container: ColumnContainer): number {
  const active = selectActiveWindowId(state, container);
  return active ? container.windows.indexOf(active) : -1;
}

export function selectColumnIndex(state: WorkspaceState, containerId: string): number {
  return selectColumns(state).findIndex((column) => column.id === containerId);
}

export function selectAdjacentColumn(
  state: WorkspaceState,
  containerId: string,
  direction: Extract<Direction, 'left' | 'right'>,
): ColumnContainer | undefined {
  const columns = selectColumns(state);
  const index = columns.findIndex((column) => column.id === containerId);
  if (index < 0) return undefined;
  return columns[index + (direction === 'left' ? -1 : 1)];
}

/** Column order, then floating order from bottom to top. */
export function selectWindowOrder(state: WorkspaceState): WindowInstanceId[] {
  const ids: WindowInstanceId[] = [];
  for (const container of state.containers) ids.push(...containerWindowIds(container));
  return ids;
}

/**
 * Taskbar projection: every open window instance, grouped by container.
 * Tiling columns keep strip order; floating groups are most recently focused
 * first.
 */
export function selectTaskbarGroups(state: WorkspaceState): TaskbarGroup[] {
  const groups: TaskbarGroup[] = [];
  const focused = state.focus.focusedWindowId;

  for (const container of selectColumns(state)) {
    const items = container.windows.map((instanceId) => {
      const window = state.windows[instanceId];
      return {
        instanceId,
        title: window?.title ?? '',
        ...(window?.icon ? { icon: window.icon } : {}),
        ...(window?.attention ? { attention: window.attention } : {}),
        focused: instanceId === focused,
      } satisfies TaskbarItem;
    });
    const active = selectActiveWindowId(state, container);
    groups.push({
      containerId: container.id,
      kind: 'column',
      state: selectContainerState(container),
      title: (active ? state.windows[active]?.title : undefined) ?? '',
      items,
    });
  }

  const floats = selectFloating(state).reverse();
  for (const container of floats) {
    const window = state.windows[container.window];
    if (!window) continue;
    groups.push({
      containerId: container.id,
      kind: 'floating',
      state: 'floating',
      title: window.title,
      items: [
        {
          instanceId: window.instanceId,
          title: window.title,
          ...(window.icon ? { icon: window.icon } : {}),
          ...(window.attention ? { attention: window.attention } : {}),
          focused: window.instanceId === focused,
        },
      ],
    });
  }

  return groups;
}
