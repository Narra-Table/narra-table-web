export type WindowInstanceId = string;
export type ContainerId = string;
export type AppId = string;
export type WindowTypeId = string;

export type ColumnDisplay = 'normal' | 'tabbed';
export type ChromeMode = 'full' | 'titlebar-hidden';
export type FocusLayer = 'tiling' | 'floating';
export type Direction = 'left' | 'right' | 'up' | 'down';
export type AttentionLevel = 'none' | 'info' | 'urgent';
export type ContainerState = 'standard' | 'stacked' | 'paged' | 'floating';

export interface Attention {
  level: Exclude<AttentionLevel, 'none'>;
  payload?: unknown;
}

/**
 * A window instance is stable for its whole lifetime. Moving, merging,
 * dissolving, docking and floating only change its container.
 */
export interface WindowInstance {
  instanceId: WindowInstanceId;
  appId: AppId;
  windowTypeId: WindowTypeId;
  title: string;
  icon?: string;
  chrome: ChromeMode;
  /** Width to restore when this window is detached back into its own column. */
  lastTiledWidth?: number;
  /** Opaque, app-owned, restorable view state. */
  state?: unknown;
  /** Transient; never serialized. */
  attention?: Attention;
}

export interface ColumnContainer {
  id: ContainerId;
  kind: 'column';
  display: ColumnDisplay;
  /** Fraction of the usable viewport width. */
  width: number;
  /** Memory for the quick full-width toggle. Always below 1. */
  lastNonFullWidth: number;
  windows: WindowInstanceId[];
  /** Row weights for multiple windows; normalized to 1. Kept across tabbed mode. */
  heights?: number[];
}

export interface FloatingContainer {
  id: ContainerId;
  kind: 'floating';
  window: WindowInstanceId;
  x: number;
  y: number;
  width: number;
  height: number;
  zOrder: number;
}

export type Container = ColumnContainer | FloatingContainer;

export interface WorkspaceFocus {
  layer: FocusLayer;
  focusedWindowId: WindowInstanceId | null;
  /** Last focused window for every container, so chrome clicks can restore it. */
  lastFocusedWindowByContainer: Record<ContainerId, WindowInstanceId>;
  /** Last focused column, used when opening from the floating layer. */
  lastTiledContainerId: ContainerId | null;
}

/**
 * Canonical container order is columns first (in strip order) and then
 * floating containers. Floating stacking is ordered by `zOrder`.
 */
export interface WorkspaceState {
  version: 1;
  windows: Record<WindowInstanceId, WindowInstance>;
  containers: Container[];
  focus: WorkspaceFocus;
  scrollOffset: number;
}

export interface FloatingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The subset of an application window declaration the WM consumes. The host
 * registry owns the full declaration and resolves it into `OpenWindowInput`.
 */
export interface WindowTypeDescriptor {
  appId: AppId;
  windowTypeId: WindowTypeId;
  title: string;
  icon?: string;
  defaultWidth?: number;
  defaultDisplay?: ColumnDisplay;
  chrome?: ChromeMode;
  floating?: boolean;
  modal?: boolean;
  singleton?: boolean;
  embeddable?: boolean;
  launcher?: boolean;
  resizable?: boolean;
  dismissible?: boolean;
}

export interface OpenWindowInput {
  appId: AppId;
  windowTypeId: WindowTypeId;
  title: string;
  icon?: string;
  chrome?: ChromeMode;
  /** Resolved width fraction. The host applies request/type/app/global priority. */
  width?: number;
  display?: ColumnDisplay;
  floating?: boolean;
  floatingBox?: Partial<FloatingBox>;
  singleton?: boolean;
  state?: unknown;
  /** Open as a new tab/row inside this column instead of a new column. */
  intoContainerId?: ContainerId;
  /** Insertion index inside `intoContainerId`. Defaults to after the active row/tab. */
  index?: number;
  /** Mostly for tests and restore paths; the store generates one when absent. */
  instanceId?: WindowInstanceId;
}

export interface OpenWindowResult {
  state: WorkspaceState;
  instanceId: WindowInstanceId;
  created: boolean;
}

export interface WindowPatch {
  title?: string;
  icon?: string;
  chrome?: ChromeMode;
}

export interface SnapshotWindow {
  instanceId: WindowInstanceId;
  appId: AppId;
  windowTypeId: WindowTypeId;
  title: string;
  icon?: string;
  chrome: ChromeMode;
  lastTiledWidth?: number;
}

export interface WorkspaceSnapshot {
  version: 1;
  windows: SnapshotWindow[];
  containers: Container[];
  focus: WorkspaceFocus;
  scrollOffset: number;
  /** Opaque view state keyed by instance id. Not business data. */
  appStates: Record<WindowInstanceId, unknown>;
}

export interface RestoreOptions {
  /** Return false for window types that no longer exist in the host registry. */
  isWindowTypeAvailable?: (window: SnapshotWindow) => boolean;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}
