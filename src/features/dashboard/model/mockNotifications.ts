export type DashboardNotificationKind = 'invite' | 'mention' | 'session' | 'system';

export type DashboardNotification = {
  detail: string;
  id: string;
  kind: DashboardNotificationKind;
  read: boolean;
  time: string;
  title: string;
};

export const mockNotifications: DashboardNotification[] = [
  {
    id: 'invite-mist-harbor',
    kind: 'invite',
    title: '林澈邀请你加入空间',
    detail: '雾港夜航',
    time: '2 分钟前',
    read: false,
  },
  {
    id: 'session-gray-tower',
    kind: 'session',
    title: '跑团将在 30 分钟后开始',
    detail: '灰塔档案 · 第 7 幕',
    time: '12 分钟前',
    read: false,
  },
  {
    id: 'mention-gatekeeper',
    kind: 'mention',
    title: '你在「守门人」中被提及',
    detail: '“调查员需要决定下一步行动。”',
    time: '1 小时前',
    read: false,
  },
  {
    id: 'system-character-sheet',
    kind: 'system',
    title: '角色卡已更新',
    detail: '塞勒斯的技能配置发生了变化',
    time: '昨天',
    read: true,
  },
];
