import type { ReactNode } from 'react';
import {
  DEFAULT_COLUMN_WIDTH,
  DEFAULT_FLOATING_BOX,
  WIDTH_PRESETS,
} from '../../model/window-manager/geometry';
import type {
  Container,
  FloatingBox,
  OpenWindowInput,
  WindowInstance,
  WindowInstanceId,
  WindowTypeDescriptor,
  WorkspaceState,
} from '../../model/window-manager/types';

/** One entry in a host-declared window menu. The chrome does not invent items. */
export interface WindowMenuItem {
  label: string;
  disabled?: boolean;
  onSelect?: () => void;
}

/** A menu the registration actually declared for the left side of the chrome. */
export interface WindowMenu {
  label: string;
  items: readonly WindowMenuItem[];
}

/**
 * A host window declaration plus the app-level labels the WM may render.
 * `icon` is the optional descriptor icon. `menus` is omitted unless the host
 * declared some; the chrome does not invent a File / Edit strip.
 */
export interface RegisteredWindow extends WindowTypeDescriptor {
  appName?: string;
  appIcon?: string;
  description?: string;
  menus?: readonly WindowMenu[];
}

export interface AppRegistry {
  getWindow(appId: string, windowTypeId: string): RegisteredWindow | undefined;
  listWindows(): readonly RegisteredWindow[];
}

/** Keyed by `appId/windowTypeId`; the last duplicate wins. */
export function createAppRegistry(windows: readonly RegisteredWindow[]): AppRegistry {
  const byKey = new Map<string, RegisteredWindow>();
  for (const window of windows) {
    byKey.set(`${window.appId}/${window.windowTypeId}`, window);
  }
  return {
    getWindow: (appId, windowTypeId) => byKey.get(`${appId}/${windowTypeId}`),
    listWindows: () => windows,
  };
}

export interface WindowRenderContext {
  focused: boolean;
  container: Container | undefined;
  state: WorkspaceState;
}

export type WindowRenderer = (window: WindowInstance, context: WindowRenderContext) => ReactNode;

export type IconRenderer = (
  window: RegisteredWindow | undefined,
  instance: WindowInstance,
) => ReactNode;

export interface WorkbenchMessages {
  workspaceLabel: string;
  taskbarLabel: string;
  emptyTitle: string;
  emptyBody: string;
  close: string;
  closeWindow: string;
  more: string;
  width: string;
  fullWidth: string;
  restoreWidth: string;
  standard: string;
  stacked: string;
  paged: string;
  floating: string;
  switchToTabs: string;
  switchToStack: string;
  dissolve: string;
  float: string;
  dock: string;
  floatingLayer: string;
  launcher: string;
  launcherApps: string;
  launcherWindows: string;
  launcherSearch: string;
  launcherEmpty: string;
  launcherAddToContainer: string;
  renderError: string;
}

export const DEFAULT_MESSAGES: WorkbenchMessages = {
  workspaceLabel: 'Workspace',
  taskbarLabel: 'Taskbar',
  emptyTitle: 'Workspace is empty',
  emptyBody: 'Open a window to get started.',
  close: 'Close',
  closeWindow: 'Close window',
  more: 'More',
  width: 'Width',
  fullWidth: 'Full width',
  restoreWidth: 'Restore width',
  standard: 'Standard',
  stacked: 'Stacked',
  paged: 'Tabs',
  floating: 'Floating',
  switchToTabs: 'Switch to tabs',
  switchToStack: 'Switch to stack',
  dissolve: 'Dissolve',
  float: 'Float',
  dock: 'Dock',
  floatingLayer: 'Floating layer',
  launcher: 'Apps',
  launcherApps: 'Apps',
  launcherWindows: 'Windows',
  launcherSearch: 'Search apps and windows',
  launcherEmpty: 'Nothing matches.',
  launcherAddToContainer: 'Add to current container',
  renderError: 'This window failed to render.',
};

export interface WorkbenchConfig {
  defaultWidth: number;
  widthPresets: readonly number[];
  floatingBox: FloatingBox;
}

export const DEFAULT_WORKBENCH_CONFIG: WorkbenchConfig = {
  defaultWidth: DEFAULT_COLUMN_WIDTH,
  widthPresets: WIDTH_PRESETS,
  floatingBox: DEFAULT_FLOATING_BOX,
};

export type OpenWindowOptions = Omit<
  OpenWindowInput,
  'appId' | 'windowTypeId' | 'title' | 'instanceId'
>;

export type OpenWindow = (
  appId: string,
  windowTypeId: string,
  options?: OpenWindowOptions,
) => WindowInstanceId | null;

export type WidthLabel = (width: number) => string;

export function defaultWidthLabel(width: number): string {
  if (Math.abs(width - 1) < 1e-9) return '1/1';
  if (Math.abs(width - 2 / 3) < 1e-9) return '2/3';
  if (Math.abs(width - 1 / 2) < 1e-9) return '1/2';
  if (Math.abs(width - 1 / 3) < 1e-9) return '1/3';
  return `${Math.round(width * 100)}%`;
}
