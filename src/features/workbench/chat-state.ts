import type { WindowInstance } from '@/features/workbench/core';

export interface ChatWindowState {
  roomId?: string;
  scene?: string;
  query?: string;
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
