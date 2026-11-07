import { createWindowManagerStore, type WindowManagerStore } from '@/features/window-manager';
import type { WorkspacePort } from '../application/workspace';
import { createWindowManagerWorkspace } from '../infrastructure/window-manager-workspace';
import { isSpaceWindowKind, WINDOW_INFO, type WindowKind } from '../model/window';

const SNAPSHOT_PREFIX = 'narratable.space.snapshot';

export interface SpaceRuntime {
  manager: WindowManagerStore;
  workspace: WorkspacePort;
}

function snapshotKey(spaceId: string): string {
  return `${SNAPSHOT_PREFIX}.${spaceId}`;
}

export function readSpaceSnapshot(spaceId: string): unknown {
  try {
    const raw = localStorage.getItem(snapshotKey(spaceId));
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

export function writeSpaceSnapshot(spaceId: string, store: WindowManagerStore): void {
  try {
    localStorage.setItem(snapshotKey(spaceId), store.stringify(0));
  } catch {
    // The space continues in memory when storage is unavailable.
  }
}

export function openKind(workspace: WorkspacePort, kind: WindowKind, state?: unknown): string {
  const info = WINDOW_INFO[kind];
  return workspace.openWindow({
    windowTypeId: kind,
    title: info.title,
    width: info.width,
    ...(state === undefined ? {} : { state }),
  });
}

function seedDefaultLayout(workspace: WorkspacePort): void {
  const chatId = openKind(workspace, 'chat');
  openKind(workspace, 'characters');
  openKind(workspace, 'members');
  workspace.focusWindow(chatId);
}

export function createSpaceRuntime(spaceId: string): SpaceRuntime {
  const manager = createWindowManagerStore();
  const workspace = createWindowManagerWorkspace(manager);
  const snapshot = readSpaceSnapshot(spaceId);
  if (
    snapshot &&
    manager.restore(snapshot, {
      isWindowTypeAvailable: (window) =>
        window.appId === 'narratable' && isSpaceWindowKind(window.windowTypeId),
    })
  ) {
    return { manager, workspace };
  }

  seedDefaultLayout(workspace);
  return { manager, workspace };
}
