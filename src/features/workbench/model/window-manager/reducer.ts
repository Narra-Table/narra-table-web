import {
  closeWindow,
  dissolveContainer,
  dockFloating,
  equalizeRows,
  floatWindow,
  focusDirection,
  focusLayer,
  focusWindow,
  mergeContainers,
  moveContainer,
  moveFloating,
  moveWindowToColumn,
  moveWindowToNewColumn,
  openWindow,
  raiseFloating,
  resizeFloating,
  setAttention,
  setColumnDisplay,
  setColumnWidth,
  setRowHeights,
  setScrollOffset,
  setWindowState,
  toggleColumnFullWidth,
  updateWindow,
} from './actions';
import type { ReduceOptions, WorkbenchAction } from './actionTypes';
import { createId as defaultCreateId } from './ids';
import { normalizeWorkspace } from './state';
import type { WorkspaceState } from './types';

/** Pure action reducer used by the store and by host integrations. */
export function reduce(
  state: WorkspaceState,
  action: WorkbenchAction,
  options: ReduceOptions = {},
): WorkspaceState {
  switch (action.type) {
    case 'workspace/replace':
      return normalizeWorkspace(action.state);
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
