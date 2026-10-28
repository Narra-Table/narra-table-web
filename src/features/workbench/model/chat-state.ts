import type { WindowInstance } from '@/modules/workbench';

export interface ChatWindowState {
  roomId?: string;
  scene?: string;
  query?: string;
}

export function findChatWindowForRoom(
  windows: Iterable<WindowInstance>,
  roomId: string,
): WindowInstance | undefined {
  for (const window of windows) {
    if (window.windowTypeId === 'chat' && readChatState(window).roomId === roomId) return window;
  }
  return undefined;
}

export function readChatState(window: WindowInstance | undefined): ChatWindowState {
  if (!window || !window.state || typeof window.state !== 'object') return {};
  const state = window.state as Record<string, unknown>;
  return {
    ...(typeof state.roomId === 'string' ? { roomId: state.roomId } : {}),
    ...(typeof state.scene === 'string' ? { scene: state.scene } : {}),
    ...(typeof state.query === 'string' ? { query: state.query } : {}),
  };
}

export function mergeChatState(
  window: WindowInstance | undefined,
  patch: ChatWindowState,
): ChatWindowState & Record<string, unknown> {
  const current =
    window?.state && typeof window.state === 'object'
      ? (window.state as Record<string, unknown>)
      : {};
  return { ...current, ...patch };
}
