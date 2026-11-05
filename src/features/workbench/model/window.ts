export const WINDOW_KINDS = ['chat', 'characters', 'members', 'clues', 'combat', 'map'] as const;

export type WindowKind = (typeof WINDOW_KINDS)[number];

export interface WindowInfo {
  title: string;
  width: number;
}

export const WINDOW_INFO: Record<WindowKind, WindowInfo> = {
  chat: { title: '聊天', width: 2 / 3 },
  characters: { title: '角色', width: 1 / 2 },
  members: { title: '成员', width: 1 / 2 },
  clues: { title: '线索', width: 1 / 2 },
  combat: { title: '战斗', width: 1 / 2 },
  map: { title: '地图', width: 1 / 2 },
};

export function isWorkbenchWindowKind(value: string): value is WindowKind {
  return (WINDOW_KINDS as readonly string[]).includes(value);
}
