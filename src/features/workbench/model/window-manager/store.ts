import { openWindow } from './actions';
import type { WorkbenchAction } from './actionTypes';
import { createId as defaultCreateId, type IdFactory } from './ids';
import { reduce } from './reducer';
import {
  parseWorkspace,
  parseWorkspaceJson,
  serializeWorkspace,
  stringifyWorkspace,
} from './snapshot';
import { createEmptyWorkspace, normalizeWorkspace } from './state';
import type {
  AttentionLevel,
  ColumnDisplay,
  Direction,
  FocusLayer,
  OpenWindowInput,
  RestoreOptions,
  WindowInstanceId,
  WindowPatch,
  WorkspaceSnapshot,
  WorkspaceState,
} from './types';

export interface WorkbenchStoreOptions {
  initial?: WorkspaceState;
  createId?: IdFactory;
}

export interface WorkbenchActions {
  /** Returns the instance id, including the existing instance for singletons. */
  open: (input: OpenWindowInput) => WindowInstanceId;
  close: (instanceId: WindowInstanceId) => void;
  focus: (instanceId: WindowInstanceId, options?: { clearAttention?: boolean }) => void;
  focusDirection: (direction: Direction) => void;
  focusLayer: (layer: FocusLayer) => void;
  update: (instanceId: WindowInstanceId, patch: WindowPatch) => void;
  setWindowState: (instanceId: WindowInstanceId, appState: unknown) => void;
  setAttention: (instanceId: WindowInstanceId, level: AttentionLevel, payload?: unknown) => void;
  merge: (sourceId: string, targetId: string, mode: 'stack' | 'tab', index?: number) => void;
  moveToColumn: (instanceId: WindowInstanceId, containerId: string, index?: number) => void;
  moveToNewColumn: (instanceId: WindowInstanceId, index?: number, width?: number) => void;
  moveContainer: (containerId: string, index: number) => void;
  dissolve: (containerId: string) => void;
  setWidth: (containerId: string, width: number) => void;
  toggleFullWidth: (containerId: string) => void;
  setDisplay: (containerId: string, display: ColumnDisplay) => void;
  setHeights: (containerId: string, heights: number[]) => void;
  equalizeRows: (containerId: string) => void;
  float: (instanceId: WindowInstanceId) => void;
  dock: (containerId: string, index?: number) => void;
  moveFloating: (containerId: string, x: number, y: number) => void;
  resizeFloating: (containerId: string, width: number, height: number) => void;
  raise: (containerId: string) => void;
  scroll: (offset: number) => void;
}

export interface WorkbenchStore {
  getState: () => WorkspaceState;
  subscribe: (listener: () => void) => () => void;
  dispatch: (action: WorkbenchAction) => void;
  replace: (state: WorkspaceState) => void;
  getSnapshot: () => WorkspaceSnapshot;
  stringify: (space?: number) => string;
  restore: (snapshot: unknown, options?: RestoreOptions) => boolean;
  restoreJson: (raw: string, options?: RestoreOptions) => boolean;
  actions: WorkbenchActions;
}

export function createWorkbenchStore(options: WorkbenchStoreOptions = {}): WorkbenchStore {
  const createId = options.createId ?? defaultCreateId;
  let state = normalizeWorkspace(options.initial ?? createEmptyWorkspace());
  const listeners = new Set<() => void>();

  const emit = () => {
    for (const listener of [...listeners]) listener();
  };

  const setState = (next: WorkspaceState) => {
    if (next === state) return;
    state = next;
    emit();
  };

  const dispatch = (action: WorkbenchAction) => {
    setState(reduce(state, action, { createId }));
  };

  const actions: WorkbenchActions = {
    open: (input) => {
      const result = openWindow(state, input, createId);
      setState(result.state);
      return result.instanceId;
    },
    close: (instanceId) => dispatch({ type: 'window/close', instanceId }),
    focus: (instanceId, focusOptions) =>
      dispatch({
        type: 'window/focus',
        instanceId,
        ...(focusOptions?.clearAttention === undefined
          ? {}
          : { clearAttention: focusOptions.clearAttention }),
      }),
    focusDirection: (direction) => dispatch({ type: 'window/focus-direction', direction }),
    focusLayer: (layer) => dispatch({ type: 'window/focus-layer', layer }),
    update: (instanceId, patch) => dispatch({ type: 'window/update', instanceId, patch }),
    setWindowState: (instanceId, appState) =>
      dispatch({ type: 'window/set-state', instanceId, state: appState }),
    setAttention: (instanceId, level, payload) =>
      dispatch({ type: 'window/set-attention', instanceId, level, payload }),
    merge: (sourceId, targetId, mode, index) =>
      dispatch({ type: 'container/merge', sourceId, targetId, mode, index }),
    moveToColumn: (instanceId, containerId, index) =>
      dispatch({ type: 'window/move-to-column', instanceId, containerId, index }),
    moveToNewColumn: (instanceId, index, width) =>
      dispatch({ type: 'window/move-to-new-column', instanceId, index, width }),
    moveContainer: (containerId, index) => dispatch({ type: 'container/move', containerId, index }),
    dissolve: (containerId) => dispatch({ type: 'container/dissolve', containerId }),
    setWidth: (containerId, width) => dispatch({ type: 'container/set-width', containerId, width }),
    toggleFullWidth: (containerId) =>
      dispatch({ type: 'container/toggle-full-width', containerId }),
    setDisplay: (containerId, display) =>
      dispatch({ type: 'container/set-display', containerId, display }),
    setHeights: (containerId, heights) =>
      dispatch({ type: 'container/set-heights', containerId, heights }),
    equalizeRows: (containerId) => dispatch({ type: 'container/equalize-rows', containerId }),
    float: (instanceId) => dispatch({ type: 'floating/float', instanceId }),
    dock: (containerId, index) => dispatch({ type: 'floating/dock', containerId, index }),
    moveFloating: (containerId, x, y) => dispatch({ type: 'floating/move', containerId, x, y }),
    resizeFloating: (containerId, width, height) =>
      dispatch({ type: 'floating/resize', containerId, width, height }),
    raise: (containerId) => dispatch({ type: 'floating/raise', containerId }),
    scroll: (offset) => dispatch({ type: 'workspace/scroll', offset }),
  };

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dispatch,
    replace: (next) => setState(normalizeWorkspace(next)),
    getSnapshot: () => serializeWorkspace(state),
    stringify: (space = 2) => stringifyWorkspace(state, space),
    restore: (snapshot, restoreOptions) => {
      const parsed = parseWorkspace(snapshot, restoreOptions);
      if (!parsed) return false;
      setState(parsed);
      return true;
    },
    restoreJson: (raw, restoreOptions) => {
      const parsed = parseWorkspaceJson(raw, restoreOptions);
      if (!parsed) return false;
      setState(parsed);
      return true;
    },
    actions,
  };
}
