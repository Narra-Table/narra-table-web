import {
  clampColumnWidth,
  clampFloatingBox,
  clampScrollOffset,
  DEFAULT_COLUMN_WIDTH,
  isFiniteNumber,
  MIN_COLUMN_WIDTH,
  normalizeHeights,
  normalizeNonFullWidth,
} from './geometry';
import type {
  ColumnContainer,
  Container,
  FloatingContainer,
  FocusLayer,
  ValidationResult,
  WindowInstance,
  WindowInstanceId,
  WorkspaceFocus,
  WorkspaceState,
} from './types';

export const WORKSPACE_VERSION = 1 as const;

export interface WorkspaceInit {
  windows?: readonly WindowInstance[] | Record<WindowInstanceId, WindowInstance>;
  containers?: readonly Container[];
  focus?: Partial<WorkspaceFocus>;
  scrollOffset?: number;
}

export function isColumnContainer(container: Container): container is ColumnContainer {
  return container.kind === 'column';
}

export function isFloatingContainer(container: Container): container is FloatingContainer {
  return container.kind === 'floating';
}

export function containerWindowIds(container: Container): WindowInstanceId[] {
  return container.kind === 'column' ? [...container.windows] : [container.window];
}

export function createEmptyWorkspace(): WorkspaceState {
  return {
    version: WORKSPACE_VERSION,
    windows: {},
    containers: [],
    focus: {
      layer: 'tiling',
      focusedWindowId: null,
      lastFocusedWindowByContainer: {},
      lastTiledContainerId: null,
    },
    scrollOffset: 0,
  };
}

function toWindowRecord(
  windows: WorkspaceInit['windows'],
): Record<WindowInstanceId, WindowInstance> {
  if (!windows) return {};
  if (Array.isArray(windows)) {
    const record: Record<WindowInstanceId, WindowInstance> = {};
    for (const window of windows) record[window.instanceId] = window;
    return record;
  }
  return { ...(windows as Record<WindowInstanceId, WindowInstance>) };
}

export function createWorkspace(init: WorkspaceInit = {}): WorkspaceState {
  const focus = init.focus;
  const state: WorkspaceState = {
    version: WORKSPACE_VERSION,
    windows: toWindowRecord(init.windows),
    containers: init.containers ? [...init.containers] : [],
    focus: {
      layer: focus?.layer ?? 'tiling',
      focusedWindowId: focus?.focusedWindowId ?? null,
      lastFocusedWindowByContainer: {
        ...(focus?.lastFocusedWindowByContainer ?? {}),
      },
      lastTiledContainerId: focus?.lastTiledContainerId ?? null,
    },
    scrollOffset: init.scrollOffset ?? 0,
  };
  return normalizeWorkspace(state);
}

export function cloneContainer(container: Container): Container {
  if (container.kind === 'column') {
    return {
      id: container.id,
      kind: 'column',
      display: container.display,
      width: container.width,
      lastNonFullWidth: container.lastNonFullWidth,
      windows: [...container.windows],
      ...(container.heights ? { heights: [...container.heights] } : {}),
    };
  }
  return {
    id: container.id,
    kind: 'floating',
    window: container.window,
    x: container.x,
    y: container.y,
    width: container.width,
    height: container.height,
    zOrder: container.zOrder,
  };
}

function normalizeAttention(window: WindowInstance): WindowInstance['attention'] {
  const attention = window.attention;
  if (!attention || (attention.level !== 'info' && attention.level !== 'urgent')) {
    return undefined;
  }
  return { level: attention.level, payload: attention.payload };
}

function cloneWindow(window: WindowInstance): WindowInstance {
  const lastTiledWidth = isFiniteNumber(window.lastTiledWidth)
    ? clampColumnWidth(window.lastTiledWidth)
    : undefined;
  const attention = normalizeAttention(window);
  return {
    instanceId: window.instanceId,
    appId: window.appId,
    windowTypeId: window.windowTypeId,
    title: typeof window.title === 'string' ? window.title : '',
    ...(typeof window.icon === 'string' ? { icon: window.icon } : {}),
    chrome: window.chrome === 'titlebar-hidden' ? 'titlebar-hidden' : 'full',
    ...(lastTiledWidth === undefined ? {} : { lastTiledWidth }),
    ...(window.state === undefined ? {} : { state: window.state }),
    ...(attention === undefined ? {} : { attention }),
  };
}

function firstWindowId(container: Container): WindowInstanceId {
  return container.kind === 'column' ? (container.windows[0] ?? '') : container.window;
}

function activeWindowId(
  container: Container,
  lastFocused: Record<string, WindowInstanceId>,
): WindowInstanceId {
  if (container.kind === 'floating') return container.window;
  const remembered = lastFocused[container.id];
  return remembered && container.windows.includes(remembered)
    ? remembered
    : (container.windows[0] ?? '');
}

/**
 * Repairs a state without inventing focus history. It drops dangling
 * references, canonicalizes order, and makes every invariant in
 * `validateWorkspace` hold.
 */
export function normalizeWorkspace(state: WorkspaceState): WorkspaceState {
  const sourceWindows = state.windows && typeof state.windows === 'object' ? state.windows : {};

  const candidateWindows: Record<WindowInstanceId, WindowInstance> = {};
  for (const [key, candidate] of Object.entries(sourceWindows)) {
    if (!candidate || typeof candidate !== 'object') continue;
    const instanceId =
      typeof candidate.instanceId === 'string' && candidate.instanceId ? candidate.instanceId : key;
    if (!instanceId || candidateWindows[instanceId]) continue;
    if (
      typeof candidate.appId !== 'string' ||
      !candidate.appId ||
      typeof candidate.windowTypeId !== 'string' ||
      !candidate.windowTypeId
    ) {
      continue;
    }
    candidateWindows[instanceId] = cloneWindow({ ...candidate, instanceId });
  }

  const usedWindows = new Set<WindowInstanceId>();
  const seenContainerIds = new Set<string>();
  const columns: ColumnContainer[] = [];
  const floats: FloatingContainer[] = [];
  const rawContainers = Array.isArray(state.containers) ? state.containers : [];

  for (const candidate of rawContainers) {
    if (!candidate || typeof candidate !== 'object') continue;
    if (typeof candidate.id !== 'string' || !candidate.id) continue;
    if (seenContainerIds.has(candidate.id)) continue;

    if (candidate.kind === 'column') {
      const rawWindows = Array.isArray(candidate.windows) ? candidate.windows : [];
      const windows: WindowInstanceId[] = [];
      for (const windowId of rawWindows) {
        if (typeof windowId !== 'string') continue;
        if (!candidateWindows[windowId] || usedWindows.has(windowId)) continue;
        usedWindows.add(windowId);
        windows.push(windowId);
      }
      if (windows.length === 0) continue;

      const width = clampColumnWidth(candidate.width);
      const display = candidate.display === 'tabbed' ? 'tabbed' : 'normal';
      const heights =
        windows.length > 1 ? normalizeHeights(candidate.heights, windows.length) : undefined;

      columns.push({
        id: candidate.id,
        kind: 'column',
        display,
        width,
        lastNonFullWidth: normalizeNonFullWidth(
          candidate.lastNonFullWidth,
          width < 1 ? width : DEFAULT_COLUMN_WIDTH,
        ),
        windows,
        ...(heights ? { heights } : {}),
      });
      seenContainerIds.add(candidate.id);
      continue;
    }

    if (candidate.kind === 'floating') {
      const windowId = typeof candidate.window === 'string' ? candidate.window : '';
      if (!candidateWindows[windowId] || usedWindows.has(windowId)) continue;
      usedWindows.add(windowId);
      const box = clampFloatingBox({
        x: candidate.x,
        y: candidate.y,
        width: candidate.width,
        height: candidate.height,
      });
      floats.push({
        id: candidate.id,
        kind: 'floating',
        window: windowId,
        ...box,
        zOrder: isFiniteNumber(candidate.zOrder) ? candidate.zOrder : floats.length + 1,
      });
      seenContainerIds.add(candidate.id);
    }
  }

  // Drop windows that are not referenced by any surviving container.
  const windows: Record<WindowInstanceId, WindowInstance> = {};
  for (const container of [...columns, ...floats]) {
    for (const windowId of containerWindowIds(container)) {
      windows[windowId] = candidateWindows[windowId] as WindowInstance;
    }
  }

  // Canonical float order by zOrder, then normalized to 1..n.
  floats.sort((a, b) => a.zOrder - b.zOrder);
  floats.forEach((container, index) => {
    container.zOrder = index + 1;
  });

  const containers: Container[] = [...columns, ...floats];
  const containerById = new Map(containers.map((container) => [container.id, container]));
  const containerByWindow = new Map<WindowInstanceId, Container>();
  for (const container of containers) {
    for (const windowId of containerWindowIds(container)) {
      containerByWindow.set(windowId, container);
    }
  }

  const rawFocus = state.focus ?? {
    layer: 'tiling' as FocusLayer,
    focusedWindowId: null,
    lastFocusedWindowByContainer: {},
    lastTiledContainerId: null,
  };

  const lastFocusedWindowByContainer: Record<string, WindowInstanceId> = {};
  for (const container of containers) {
    const remembered = rawFocus.lastFocusedWindowByContainer?.[container.id];
    const valid =
      remembered && containerWindowIds(container).includes(remembered) && windows[remembered];
    lastFocusedWindowByContainer[container.id] = valid ? remembered : firstWindowId(container);
  }

  let lastTiledContainerId: string | null = null;
  const rememberedTiled = rawFocus.lastTiledContainerId;
  if (rememberedTiled && containerById.get(rememberedTiled)?.kind === 'column') {
    lastTiledContainerId = rememberedTiled;
  }

  let focusedWindowId: WindowInstanceId | null = null;
  const rememberedFocus = rawFocus.focusedWindowId;
  if (rememberedFocus && windows[rememberedFocus]) {
    focusedWindowId = rememberedFocus;
  } else if (columns.length > 0) {
    const column =
      (lastTiledContainerId ? containerById.get(lastTiledContainerId) : undefined) ?? columns[0];
    focusedWindowId = column ? activeWindowId(column, lastFocusedWindowByContainer) : null;
  } else if (floats.length > 0) {
    focusedWindowId = floats[floats.length - 1]?.window ?? null;
  }

  let layer: FocusLayer = 'tiling';
  const focusedContainer = focusedWindowId ? containerByWindow.get(focusedWindowId) : undefined;
  if (focusedContainer) {
    layer = focusedContainer.kind === 'floating' ? 'floating' : 'tiling';
    lastFocusedWindowByContainer[focusedContainer.id] = focusedWindowId as string;
    if (focusedContainer.kind === 'column') {
      lastTiledContainerId = focusedContainer.id;
    }
  } else {
    focusedWindowId = null;
    if (rawFocus.layer === 'floating' && floats.length > 0) {
      layer = 'floating';
      focusedWindowId = floats[floats.length - 1]?.window ?? null;
      if (focusedWindowId) {
        lastFocusedWindowByContainer[floats[floats.length - 1]!.id] = focusedWindowId;
      }
    } else if (columns.length > 0) {
      const column =
        (lastTiledContainerId ? containerById.get(lastTiledContainerId) : undefined) ?? columns[0];
      if (column) {
        lastTiledContainerId = column.id;
        focusedWindowId = activeWindowId(column, lastFocusedWindowByContainer);
        lastFocusedWindowByContainer[column.id] = focusedWindowId;
      }
    } else if (floats.length > 0) {
      const top = floats[floats.length - 1]!;
      layer = 'floating';
      focusedWindowId = top.window;
      lastFocusedWindowByContainer[top.id] = top.window;
    }
  }

  if (!lastTiledContainerId) {
    if (focusedContainer?.kind === 'column') {
      lastTiledContainerId = focusedContainer.id;
    } else if (columns.length > 0) {
      lastTiledContainerId = columns[0]?.id ?? null;
    }
  }

  return {
    version: WORKSPACE_VERSION,
    windows,
    containers,
    focus: {
      layer,
      focusedWindowId,
      lastFocusedWindowByContainer,
      lastTiledContainerId,
    },
    scrollOffset: clampScrollOffset(state.scrollOffset),
  };
}

/** Structural checks for tests, dev assertions and restore diagnostics. */
export function validateWorkspace(state: WorkspaceState): ValidationResult {
  const errors: string[] = [];
  if (!state || typeof state !== 'object') {
    return { ok: false, errors: ['state must be an object'] };
  }
  if (state.version !== WORKSPACE_VERSION) {
    errors.push(`unsupported version: ${String(state.version)}`);
  }

  const containers = Array.isArray(state.containers) ? state.containers : [];
  const windows = state.windows ?? {};
  const containerIds = new Set<string>();
  const referenced = new Map<WindowInstanceId, string>();
  const usedWindowIds = new Set<WindowInstanceId>();

  if (Object.keys(windows).length === 0 && containers.length > 0) {
    errors.push('containers exist without windows');
  }

  for (const [key, window] of Object.entries(windows)) {
    if (!window || typeof window !== 'object') {
      errors.push(`window ${key} is not an object`);
      continue;
    }
    if (window.instanceId !== key) {
      errors.push(`window key ${key} does not match instanceId ${window.instanceId}`);
    }
    if (!window.appId) errors.push(`window ${key} has no appId`);
    if (!window.windowTypeId) errors.push(`window ${key} has no windowTypeId`);
    if (window.chrome !== 'full' && window.chrome !== 'titlebar-hidden') {
      errors.push(`window ${key} has invalid chrome`);
    }
  }

  for (const container of containers) {
    if (!container || typeof container !== 'object') {
      errors.push('container is not an object');
      continue;
    }
    if (!container.id) {
      errors.push('container has no id');
      continue;
    }
    if (containerIds.has(container.id)) {
      errors.push(`duplicate container id: ${container.id}`);
    }
    containerIds.add(container.id);

    if (container.kind === 'column') {
      if (container.display !== 'normal' && container.display !== 'tabbed') {
        errors.push(`column ${container.id} has invalid display`);
      }
      if (
        !isFiniteNumber(container.width) ||
        container.width < MIN_COLUMN_WIDTH ||
        container.width > 1
      ) {
        errors.push(`column ${container.id} has invalid width`);
      }
      if (
        !isFiniteNumber(container.lastNonFullWidth) ||
        container.lastNonFullWidth < MIN_COLUMN_WIDTH ||
        container.lastNonFullWidth >= 1
      ) {
        errors.push(`column ${container.id} has invalid lastNonFullWidth`);
      }
      const list = Array.isArray(container.windows) ? container.windows : [];
      if (list.length === 0) errors.push(`column ${container.id} is empty`);
      if (new Set(list).size !== list.length) {
        errors.push(`column ${container.id} repeats a window`);
      }
      for (const windowId of list) {
        if (!windows[windowId]) errors.push(`column ${container.id} references ${windowId}`);
        if (referenced.has(windowId)) {
          errors.push(`window ${windowId} is in more than one container`);
        }
        referenced.set(windowId, container.id);
        usedWindowIds.add(windowId);
      }
      if (container.heights !== undefined) {
        if (container.heights.length !== list.length) {
          errors.push(`column ${container.id} heights length mismatch`);
        } else {
          const total = container.heights.reduce((sum, height) => sum + height, 0);
          if (container.heights.some((height) => !isFiniteNumber(height) || height <= 0)) {
            errors.push(`column ${container.id} has invalid heights`);
          } else if (Math.abs(total - 1) > 1e-6) {
            errors.push(`column ${container.id} heights do not sum to 1`);
          }
        }
        if (list.length < 2) {
          errors.push(`column ${container.id} stores heights for fewer than two windows`);
        }
      }
    } else if (container.kind === 'floating') {
      if (!windows[container.window]) {
        errors.push(`floating container ${container.id} references ${container.window}`);
      }
      if (referenced.has(container.window)) {
        errors.push(`window ${container.window} is in more than one container`);
      }
      referenced.set(container.window, container.id);
      usedWindowIds.add(container.window);
      if (
        !isFiniteNumber(container.x) ||
        !isFiniteNumber(container.y) ||
        !isFiniteNumber(container.width) ||
        !isFiniteNumber(container.height) ||
        container.width < 240 ||
        container.height < 160
      ) {
        errors.push(`floating container ${container.id} has invalid geometry`);
      }
      if (!isFiniteNumber(container.zOrder) || container.zOrder <= 0) {
        errors.push(`floating container ${container.id} has invalid zOrder`);
      }
    }
  }

  for (const windowId of Object.keys(windows)) {
    if (!usedWindowIds.has(windowId)) {
      errors.push(`window ${windowId} is not in any container`);
    }
  }

  const focus = state.focus;
  if (!focus || (focus.layer !== 'tiling' && focus.layer !== 'floating')) {
    errors.push('focus has invalid layer');
  } else {
    if (focus.focusedWindowId === null) {
      if (usedWindowIds.size > 0) errors.push('focus is null while windows are open');
    } else if (!usedWindowIds.has(focus.focusedWindowId)) {
      errors.push('focused window does not exist');
    }

    for (const [containerId, windowId] of Object.entries(
      focus.lastFocusedWindowByContainer ?? {},
    )) {
      const container = containers.find((candidate) => candidate.id === containerId);
      if (!container) {
        errors.push(`lastFocused references missing container ${containerId}`);
      } else if (!containerWindowIds(container).includes(windowId)) {
        errors.push(`lastFocused for ${containerId} is not in that container`);
      }
    }

    if (focus.lastTiledContainerId !== null) {
      const column = containers.find((candidate) => candidate.id === focus.lastTiledContainerId);
      if (!column || column.kind !== 'column') {
        errors.push('lastTiledContainerId is not a column');
      }
    }

    if (focus.focusedWindowId) {
      const container = containers.find((candidate) =>
        containerWindowIds(candidate).includes(focus.focusedWindowId as string),
      );
      if (container) {
        const expectedLayer = container.kind === 'floating' ? 'floating' : 'tiling';
        if (focus.layer !== expectedLayer) {
          errors.push('focus layer does not match focused container');
        }
      }
    }
  }

  if (!isFiniteNumber(state.scrollOffset) || state.scrollOffset < 0) {
    errors.push('scrollOffset must be a non-negative number');
  }

  return { ok: errors.length === 0, errors };
}

export function isWorkspaceEmpty(state: WorkspaceState): boolean {
  return state.containers.length === 0;
}

export function findContainerForWindow(
  state: WorkspaceState,
  instanceId: WindowInstanceId,
): Container | undefined {
  return state.containers.find((container) =>
    container.kind === 'column'
      ? container.windows.includes(instanceId)
      : container.window === instanceId,
  );
}

export function getContainer(state: WorkspaceState, containerId: string): Container | undefined {
  return state.containers.find((container) => container.id === containerId);
}
