import {
  clampColumnWidth,
  clampFloatingBox,
  clampScrollOffset,
  DEFAULT_COLUMN_WIDTH,
  isFiniteNumber,
  normalizeNonFullWidth,
} from './geometry';
import { cloneContainer, normalizeWorkspace } from './state';
import type {
  ColumnContainer,
  Container,
  FloatingContainer,
  RestoreOptions,
  SnapshotWindow,
  WindowInstance,
  WindowInstanceId,
  WorkspaceFocus,
  WorkspaceSnapshot,
  WorkspaceState,
} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function toSnapshotWindow(window: WindowInstance): SnapshotWindow {
  return {
    instanceId: window.instanceId,
    appId: window.appId,
    windowTypeId: window.windowTypeId,
    title: window.title,
    ...(window.icon ? { icon: window.icon } : {}),
    chrome: window.chrome,
    ...(window.lastTiledWidth === undefined ? {} : { lastTiledWidth: window.lastTiledWidth }),
  };
}

function cloneFocus(focus: WorkspaceFocus): WorkspaceFocus {
  return {
    layer: focus.layer,
    focusedWindowId: focus.focusedWindowId,
    lastFocusedWindowByContainer: { ...focus.lastFocusedWindowByContainer },
    lastTiledContainerId: focus.lastTiledContainerId,
  };
}

/**
 * Snapshot serialization deliberately drops transient fields: attention is
 * runtime-only and app view state lives in `appStates`, not on the window list.
 */
export function serializeWorkspace(state: WorkspaceState): WorkspaceSnapshot {
  const normalized = normalizeWorkspace(state);
  const windows = Object.values(normalized.windows).map(toSnapshotWindow);
  const appStates: Record<WindowInstanceId, unknown> = {};
  for (const window of Object.values(normalized.windows)) {
    if (window.state !== undefined) appStates[window.instanceId] = window.state;
  }
  return {
    version: 1,
    windows,
    containers: normalized.containers.map(cloneContainer),
    focus: cloneFocus(normalized.focus),
    scrollOffset: normalized.scrollOffset,
    appStates,
  };
}

export function stringifyWorkspace(state: WorkspaceState, space = 2): string {
  return JSON.stringify(serializeWorkspace(state), null, space);
}

function parseFocus(value: unknown): WorkspaceFocus {
  if (!isRecord(value)) {
    return {
      layer: 'tiling',
      focusedWindowId: null,
      lastFocusedWindowByContainer: {},
      lastTiledContainerId: null,
    };
  }
  const layer = value.layer === 'floating' ? 'floating' : 'tiling';
  const focusedWindowId = typeof value.focusedWindowId === 'string' ? value.focusedWindowId : null;
  const lastFocusedWindowByContainer: Record<string, WindowInstanceId> = {};
  if (isRecord(value.lastFocusedWindowByContainer)) {
    for (const [containerId, windowId] of Object.entries(value.lastFocusedWindowByContainer)) {
      if (typeof windowId === 'string') {
        lastFocusedWindowByContainer[containerId] = windowId;
      }
    }
  }
  const lastTiledContainerId =
    typeof value.lastTiledContainerId === 'string' ? value.lastTiledContainerId : null;
  return {
    layer,
    focusedWindowId,
    lastFocusedWindowByContainer,
    lastTiledContainerId,
  };
}

function parseSnapshotWindow(value: unknown, options: RestoreOptions): SnapshotWindow | undefined {
  if (!isRecord(value)) return undefined;
  const instanceId = readString(value.instanceId);
  const appId = readString(value.appId);
  const windowTypeId = readString(value.windowTypeId);
  if (!instanceId || !appId || !windowTypeId) return undefined;

  const window: SnapshotWindow = {
    instanceId,
    appId,
    windowTypeId,
    title: typeof value.title === 'string' ? value.title : '',
    ...(readString(value.icon) ? { icon: value.icon as string } : {}),
    chrome: value.chrome === 'titlebar-hidden' ? 'titlebar-hidden' : 'full',
    ...(isFiniteNumber(value.lastTiledWidth)
      ? { lastTiledWidth: clampColumnWidth(value.lastTiledWidth) }
      : {}),
  };
  if (options.isWindowTypeAvailable && !options.isWindowTypeAvailable(window)) {
    return undefined;
  }
  return window;
}

function parseContainer(
  value: unknown,
  windows: Record<WindowInstanceId, WindowInstance>,
  usedWindows: Set<WindowInstanceId>,
  seenIds: Set<string>,
): Container | undefined {
  if (!isRecord(value)) return undefined;
  const id = readString(value.id);
  if (!id || seenIds.has(id)) return undefined;

  if (value.kind === 'column') {
    const rawWindows = Array.isArray(value.windows) ? value.windows : [];
    const list: WindowInstanceId[] = [];
    for (const candidate of rawWindows) {
      if (typeof candidate !== 'string') continue;
      if (!windows[candidate] || usedWindows.has(candidate)) continue;
      usedWindows.add(candidate);
      list.push(candidate);
    }
    if (list.length === 0) return undefined;

    const width = clampColumnWidth(value.width);
    const display = value.display === 'tabbed' ? 'tabbed' : 'normal';
    const rawHeights = Array.isArray(value.heights)
      ? value.heights.filter(isFiniteNumber)
      : undefined;
    const container: ColumnContainer = {
      id,
      kind: 'column',
      display,
      width,
      lastNonFullWidth: normalizeNonFullWidth(
        value.lastNonFullWidth,
        width < 1 ? width : DEFAULT_COLUMN_WIDTH,
      ),
      windows: list,
      ...(list.length > 1 && rawHeights && rawHeights.length === list.length
        ? { heights: rawHeights }
        : {}),
    };
    seenIds.add(id);
    return container;
  }

  if (value.kind === 'floating') {
    const windowId = typeof value.window === 'string' ? value.window : undefined;
    if (!windowId || !windows[windowId] || usedWindows.has(windowId)) {
      return undefined;
    }
    usedWindows.add(windowId);
    const box = clampFloatingBox({
      x: isFiniteNumber(value.x) ? value.x : undefined,
      y: isFiniteNumber(value.y) ? value.y : undefined,
      width: isFiniteNumber(value.width) ? value.width : undefined,
      height: isFiniteNumber(value.height) ? value.height : undefined,
    });
    const container: FloatingContainer = {
      id,
      kind: 'floating',
      window: windowId,
      ...box,
      zOrder: isFiniteNumber(value.zOrder) ? value.zOrder : 1,
    };
    seenIds.add(id);
    return container;
  }

  return undefined;
}

/**
 * Parse a snapshot. Returns null when the payload is not a version 1
 * workspace; structurally invalid pieces are pruned by normalization.
 * An empty snapshot is valid and produces an empty workspace.
 */
export function parseWorkspace(
  value: unknown,
  options: RestoreOptions = {},
): WorkspaceState | null {
  if (!isRecord(value)) return null;
  if (value.version !== 1) return null;
  if (!Array.isArray(value.windows) || !Array.isArray(value.containers)) return null;

  const windows: Record<WindowInstanceId, WindowInstance> = {};
  for (const rawWindow of value.windows) {
    const window = parseSnapshotWindow(rawWindow, options);
    if (!window || windows[window.instanceId]) continue;
    windows[window.instanceId] = window;
  }

  const containers: Container[] = [];
  const usedWindows = new Set<WindowInstanceId>();
  const seenIds = new Set<string>();
  for (const rawContainer of value.containers) {
    const container = parseContainer(rawContainer, windows, usedWindows, seenIds);
    if (container) containers.push(container);
  }

  if (isRecord(value.appStates)) {
    for (const [instanceId, appState] of Object.entries(value.appStates)) {
      const window = windows[instanceId];
      if (window) window.state = appState;
    }
  }

  const state: WorkspaceState = {
    version: 1,
    windows,
    containers,
    focus: parseFocus(value.focus),
    scrollOffset: isFiniteNumber(value.scrollOffset) ? clampScrollOffset(value.scrollOffset) : 0,
  };
  return normalizeWorkspace(state);
}

export function parseWorkspaceJson(
  raw: string,
  options: RestoreOptions = {},
): WorkspaceState | null {
  try {
    return parseWorkspace(JSON.parse(raw) as unknown, options);
  } catch {
    return null;
  }
}
