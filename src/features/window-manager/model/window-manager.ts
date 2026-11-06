export type WindowInstanceId = string;
export const WINDOW_WIDTHS = [1 / 3, 1 / 2, 2 / 3, 1] as const;
export type WindowWidth = (typeof WINDOW_WIDTHS)[number];

export interface WindowInstance {
  instanceId: WindowInstanceId;
  appId: string;
  windowTypeId: string;
  title: string;
  width: WindowWidth;
  state?: unknown;
}

export interface WindowManagerState {
  version: 2;
  windows: WindowInstance[];
  focusedWindowId: WindowInstanceId | null;
  scrollLeft: number;
}

export interface OpenWindowInput {
  appId: string;
  windowTypeId: string;
  title: string;
  width?: number;
  state?: unknown;
}

export interface RestoreOptions {
  isWindowTypeAvailable?: (window: WindowInstance) => boolean;
}

export function snapWindowWidth(width = 1 / 2): WindowWidth {
  return WINDOW_WIDTHS.reduce((nearest, candidate) =>
    Math.abs(candidate - width) < Math.abs(nearest - width) ? candidate : nearest,
  );
}

export function createEmptyWindowManagerState(): WindowManagerState {
  return { version: 2, windows: [], focusedWindowId: null, scrollLeft: 0 };
}

export function selectFocusedWindow(state: WindowManagerState): WindowInstance | undefined {
  return state.windows.find((window) => window.instanceId === state.focusedWindowId);
}

export function parseWindowManagerState(
  value: unknown,
  options: RestoreOptions = {},
): WindowManagerState | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as {
    version?: unknown;
    windows?: unknown;
    focusedWindowId?: unknown;
    scrollLeft?: unknown;
  };
  if (candidate.version !== 2 || !Array.isArray(candidate.windows)) return null;

  const seen = new Set<string>();
  const windows: WindowInstance[] = [];
  for (const item of candidate.windows) {
    if (!item || typeof item !== 'object') return null;
    const window = item as Partial<WindowInstance>;
    if (
      typeof window.instanceId !== 'string' ||
      typeof window.appId !== 'string' ||
      typeof window.windowTypeId !== 'string' ||
      typeof window.title !== 'string' ||
      typeof window.width !== 'number' ||
      seen.has(window.instanceId)
    ) {
      return null;
    }
    const normalized: WindowInstance = {
      instanceId: window.instanceId,
      appId: window.appId,
      windowTypeId: window.windowTypeId,
      title: window.title,
      width: snapWindowWidth(window.width),
      ...(window.state === undefined ? {} : { state: window.state }),
    };
    if (options.isWindowTypeAvailable && !options.isWindowTypeAvailable(normalized)) continue;
    seen.add(normalized.instanceId);
    windows.push(normalized);
  }

  const focusedWindowId =
    typeof candidate.focusedWindowId === 'string' && seen.has(candidate.focusedWindowId)
      ? candidate.focusedWindowId
      : (windows[0]?.instanceId ?? null);
  const scrollLeft =
    typeof candidate.scrollLeft === 'number' && Number.isFinite(candidate.scrollLeft)
      ? Math.max(0, candidate.scrollLeft)
      : 0;
  return { version: 2, windows, focusedWindowId, scrollLeft };
}

export function validateWindowManagerState(state: WindowManagerState): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const window of state.windows) {
    if (ids.has(window.instanceId)) errors.push(`duplicate window ${window.instanceId}`);
    ids.add(window.instanceId);
  }
  if (state.focusedWindowId && !ids.has(state.focusedWindowId)) {
    errors.push(`focused window ${state.focusedWindowId} does not exist`);
  }
  return errors;
}
