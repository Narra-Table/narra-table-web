import { selectFocusedWindow, type WindowManagerStore } from '@/features/window-manager';
import type { WorkspacePort } from '../application/workspace';

export function createWindowManagerWorkspace(store: WindowManagerStore): WorkspacePort {
  return {
    listWindows: () => store.getState().windows,
    getWindow: (instanceId) =>
      store.getState().windows.find((window) => window.instanceId === instanceId),
    getFocusedWindow: () => selectFocusedWindow(store.getState()),
    openWindow: (input) =>
      store.actions.open({
        appId: 'narratable',
        windowTypeId: input.windowTypeId,
        title: input.title,
        width: input.width,
        ...(input.state === undefined ? {} : { state: input.state }),
      }),
    closeWindow: (instanceId) => store.actions.close(instanceId),
    focusWindow: (instanceId) => store.actions.focus(instanceId),
    setWindowState: (instanceId, state) => store.actions.setWindowState(instanceId, state),
  };
}
