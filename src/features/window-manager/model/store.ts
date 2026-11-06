import {
  createEmptyWindowManagerState,
  parseWindowManagerState,
  snapWindowWidth,
  type OpenWindowInput,
  type RestoreOptions,
  type WindowInstanceId,
  type WindowManagerState,
} from './window-manager';

export type IdFactory = () => string;

export interface WindowManagerActions {
  open(input: OpenWindowInput): WindowInstanceId;
  close(instanceId: WindowInstanceId): void;
  focus(instanceId: WindowInstanceId): void;
  resize(instanceId: WindowInstanceId, width: number): void;
  setScrollLeft(scrollLeft: number): void;
  setWindowState(instanceId: WindowInstanceId, state: unknown): void;
}

export interface WindowManagerStore {
  getState: () => WindowManagerState;
  subscribe: (listener: () => void) => () => void;
  stringify: (space?: number) => string;
  restore: (snapshot: unknown, options?: RestoreOptions) => boolean;
  actions: WindowManagerActions;
}

export interface WindowManagerStoreOptions {
  initial?: WindowManagerState;
  createId?: IdFactory;
}

export function createSequentialIdFactory(start = 1): IdFactory {
  let next = start;
  return () => `win-${next++}`;
}

function createId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `win-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createWindowManagerStore(
  options: WindowManagerStoreOptions = {},
): WindowManagerStore {
  let state = options.initial ?? createEmptyWindowManagerState();
  const idFactory = options.createId ?? createId;
  const listeners = new Set<() => void>();

  const nextId = () => {
    let candidate = idFactory();
    while (state.windows.some((window) => window.instanceId === candidate)) {
      candidate = idFactory();
    }
    return candidate;
  };

  const replace = (next: WindowManagerState) => {
    state = next;
    for (const listener of [...listeners]) listener();
  };

  const actions: WindowManagerActions = {
    open: (input) => {
      const instanceId = nextId();
      replace({
        ...state,
        windows: [
          ...state.windows,
          {
            instanceId,
            appId: input.appId,
            windowTypeId: input.windowTypeId,
            title: input.title,
            width: snapWindowWidth(input.width),
            ...(input.state === undefined ? {} : { state: input.state }),
          },
        ],
        focusedWindowId: instanceId,
      });
      return instanceId;
    },
    close: (instanceId) => {
      const index = state.windows.findIndex((window) => window.instanceId === instanceId);
      if (index < 0) return;
      const windows = state.windows.filter((window) => window.instanceId !== instanceId);
      const focusedWindowId =
        state.focusedWindowId === instanceId
          ? (windows[Math.min(index, windows.length - 1)]?.instanceId ?? null)
          : state.focusedWindowId;
      replace({ ...state, windows, focusedWindowId });
    },
    focus: (instanceId) => {
      if (
        state.focusedWindowId === instanceId ||
        !state.windows.some((window) => window.instanceId === instanceId)
      ) {
        return;
      }
      replace({ ...state, focusedWindowId: instanceId });
    },
    resize: (instanceId, width) => {
      const snappedWidth = snapWindowWidth(width);
      const windows = state.windows.map((window) =>
        window.instanceId === instanceId && window.width !== snappedWidth
          ? { ...window, width: snappedWidth }
          : window,
      );
      if (windows.every((window, index) => window === state.windows[index])) return;
      replace({ ...state, windows });
    },
    setScrollLeft: (scrollLeft) => {
      const normalized = Number.isFinite(scrollLeft) ? Math.max(0, scrollLeft) : 0;
      if (Math.abs(state.scrollLeft - normalized) < 1) return;
      replace({ ...state, scrollLeft: normalized });
    },
    setWindowState: (instanceId, windowState) => {
      const windows = state.windows.map((window) =>
        window.instanceId === instanceId ? { ...window, state: windowState } : window,
      );
      if (windows.every((window, index) => window === state.windows[index])) return;
      replace({ ...state, windows });
    },
  };

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    stringify: (space = 2) => JSON.stringify(state, null, space),
    restore: (snapshot, restoreOptions) => {
      const parsed = parseWindowManagerState(snapshot, restoreOptions);
      if (!parsed) return false;
      replace(parsed);
      return true;
    },
    actions,
  };
}
