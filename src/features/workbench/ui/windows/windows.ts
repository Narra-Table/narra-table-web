export const WINDOW_KINDS = ['chat', 'characters', 'members', 'clues', 'combat', 'map'] as const;

export type WindowKind = (typeof WINDOW_KINDS)[number];

export interface WindowInfo {
  title: string;
}

export const WINDOW_INFO: Record<WindowKind, WindowInfo> = {
  chat: { title: '聊天' },
  characters: { title: '角色' },
  members: { title: '成员' },
  clues: { title: '线索' },
  combat: { title: '战斗' },
  map: { title: '地图' },
};
