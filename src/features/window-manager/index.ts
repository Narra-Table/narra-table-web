export {
  WINDOW_WIDTHS,
  createEmptyWindowManagerState,
  parseWindowManagerState,
  selectFocusedWindow,
  snapWindowWidth,
  validateWindowManagerState,
  type OpenWindowInput,
  type RestoreOptions,
  type WindowInstance,
  type WindowInstanceId,
  type WindowManagerState,
  type WindowWidth,
} from './model/window-manager';
export {
  createSequentialIdFactory,
  createWindowManagerStore,
  type IdFactory,
  type WindowManagerActions,
  type WindowManagerStore,
  type WindowManagerStoreOptions,
} from './model/store';
export { WindowManager, useWindowManagerStore, type WindowManagerProps } from './ui/WindowManager';
