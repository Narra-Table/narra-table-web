export interface WorkspaceWindow {
  instanceId: string;
  windowTypeId: string;
  title: string;
  state?: unknown;
}

export interface OpenWorkspaceWindow {
  windowTypeId: string;
  title: string;
  width: number;
  state?: unknown;
}

/** Space-owned boundary for opening and activating product windows. */
export interface WorkspacePort {
  listWindows: () => readonly WorkspaceWindow[];
  getWindow: (instanceId: string) => WorkspaceWindow | undefined;
  getFocusedWindow: () => WorkspaceWindow | undefined;
  openWindow: (input: OpenWorkspaceWindow) => string;
  closeWindow: (instanceId: string) => void;
  focusWindow: (instanceId: string) => void;
  setWindowState: (instanceId: string, state: unknown) => void;
}
