import type { WorkbenchStore } from '@/features/workbench/core';
import { createWorkbenchStore, selectFocusedWindow } from '@/features/workbench/core';
import type { WindowKind } from './apps/windows';
import { mergeChatState, readChatState } from './chat-state';
import {
  isWorkbenchWindowKind,
  WORKBENCH_APP_ID,
  WORKBENCH_REGISTRY,
  workbenchWindowTitle,
} from './registry';

const SNAPSHOT_PREFIX = 'narratable.workbench-next.snapshot';
const ROOM_PREFIX = 'narratable.workbench-next.room';
const LEGACY_ROOM_PREFIX = 'narratable.workspace';

export interface RoomLike {
  roomId?: string;
  type?: string;
}

function snapshotKey(spaceId: string): string {
  return `${SNAPSHOT_PREFIX}.${spaceId}`;
}

function roomKey(spaceId: string): string {
  return `${ROOM_PREFIX}.${spaceId}`;
}

export function readWorkbenchSnapshot(spaceId: string): unknown {
  try {
    const raw = localStorage.getItem(snapshotKey(spaceId));
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

export function writeWorkbenchSnapshot(spaceId: string, store: WorkbenchStore): void {
  try {
    localStorage.setItem(snapshotKey(spaceId), store.stringify(0));
  } catch {
    // Private mode or a full quota; the workbench still works in memory.
  }
}

export function readWorkbenchRoomId(spaceId: string): string {
  try {
    const roomId = localStorage.getItem(roomKey(spaceId));
    if (roomId) return roomId;
  } catch {
    return '';
  }

  const legacyRoomId = readLegacyRoomId(spaceId);
  if (legacyRoomId) writeWorkbenchRoomId(spaceId, legacyRoomId);
  return legacyRoomId;
}

export function writeWorkbenchRoomId(spaceId: string, roomId: string): void {
  try {
    localStorage.setItem(roomKey(spaceId), roomId);
  } catch {
    // Ignore storage failures.
  }
}

function readLegacyRoomId(spaceId: string): string {
  try {
    const raw = localStorage.getItem(`${LEGACY_ROOM_PREFIX}.${spaceId}`);
    if (!raw) return '';
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') return '';
    const roomId = (value as { roomId?: unknown }).roomId;
    return typeof roomId === 'string' ? roomId : '';
  } catch {
    return '';
  }
}

export function primeWorkbenchRoom(spaceId: string, roomId: string): void {
  if (!roomId) return;
  writeWorkbenchRoomId(spaceId, roomId);
  if (!readWorkbenchSnapshot(spaceId)) return;

  const store = createWorkbenchStoreForSpace(spaceId);
  const state = store.getState();
  const focused = selectFocusedWindow(state);
  const chats = Object.values(state.windows).filter((window) => window.windowTypeId === 'chat');
  const chat =
    chats.find((window) => readChatState(window).roomId === roomId) ??
    (focused?.windowTypeId === 'chat' ? focused : chats[0]);
  const nextState = { roomId, scene: undefined, query: '' };
  if (chat) {
    store.actions.setWindowState(chat.instanceId, mergeChatState(chat, nextState));
    store.actions.focus(chat.instanceId);
  } else {
    openKind(store, 'chat', { state: nextState });
  }
  writeWorkbenchSnapshot(spaceId, store);
}

export function defaultRoomId(rooms: readonly RoomLike[]): string {
  const session = rooms.find((room) => room.type === 'session') ?? rooms[0];
  return session?.roomId ?? '';
}

export function resolveRoomId(saved: string, rooms: readonly RoomLike[] | undefined): string {
  if (!rooms) return saved;
  if (saved && rooms.some((room) => room.roomId === saved)) return saved;
  return defaultRoomId(rooms);
}

export function openKind(
  store: WorkbenchStore,
  kind: WindowKind,
  options: { width?: number; state?: unknown } = {},
): string | null {
  const descriptor = WORKBENCH_REGISTRY.getWindow(WORKBENCH_APP_ID, kind);
  if (!descriptor) return null;
  return store.actions.open({
    appId: descriptor.appId,
    windowTypeId: descriptor.windowTypeId,
    title: descriptor.title,
    width: options.width ?? descriptor.defaultWidth,
    display: descriptor.defaultDisplay,
    chrome: descriptor.chrome,
    floating: descriptor.floating,
    singleton: descriptor.singleton,
    ...(options.state === undefined ? {} : { state: options.state }),
  });
}

function seedDefaultLayout(store: WorkbenchStore, roomId: string): void {
  const chatId = openKind(store, 'chat', {
    width: 2 / 3,
    state: { roomId, scene: undefined, query: '' },
  });
  openKind(store, 'characters');
  if (chatId) store.actions.focus(chatId);
}

export function createWorkbenchStoreForSpace(spaceId: string): WorkbenchStore {
  const store = createWorkbenchStore();
  const snapshot = readWorkbenchSnapshot(spaceId);
  if (
    snapshot &&
    store.restore(snapshot, {
      isWindowTypeAvailable: (window) =>
        window.appId === WORKBENCH_APP_ID && isWorkbenchWindowKind(window.windowTypeId),
    })
  ) {
    return store;
  }

  const roomId = readWorkbenchRoomId(spaceId);
  seedDefaultLayout(store, roomId);
  if (roomId) writeWorkbenchRoomId(spaceId, roomId);
  return store;
}

export function workbenchKindTitle(kind: WindowKind): string {
  return workbenchWindowTitle(kind);
}
