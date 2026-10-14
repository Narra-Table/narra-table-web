import { AdminApiError, type AdminUserStatus } from '@/lib/adminClient';

const messages: Record<string, string> = {
  'invalid username or password': '用户名或密码错误',
  'old password and new password are required': '请填写当前密码和新密码',
  'incorrect old password': '当前密码不正确',
  invalid_password: '新密码需要 8 到 72 个字符',
  rate_limited: '尝试过于频繁，请稍后再试',
  'user not found': '找不到这个用户',
  'plugin not found': '找不到这个插件',
  'built-in plugins are read-only': '内置插件只能查看',
  'plugin source failed to load': '插件源码没有通过试加载',
  'name, displayName, version and source are required': '请填写名称、显示名、版本和源码',
  'source is required': '请填写插件源码',
  'plugin name already exists': '已经有同名插件',
  'user is already anonymized': '这个账号已经匿名化',
  'confirm must be true': '需要确认后才能匿名化',
};

export function adminErrorMessage(error: unknown): string {
  if (!(error instanceof AdminApiError)) return '请求失败，请稍后再试';
  return messages[error.message] ?? messages[error.code] ?? error.message;
}

export function statusLabel(status: AdminUserStatus): string {
  if (status === 'active') return '正常';
  if (status === 'disabled') return '已禁用';
  return '已匿名化';
}

export type UserAction = 'disable' | 'restore' | 'temporaryPassword' | 'anonymize';

export function availableUserActions(status: AdminUserStatus): UserAction[] {
  if (status === 'active') return ['disable', 'temporaryPassword', 'anonymize'];
  if (status === 'disabled') return ['restore', 'temporaryPassword', 'anonymize'];
  return [];
}
