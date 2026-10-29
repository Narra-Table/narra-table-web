export function formatAdminTime(value: string): string {
  return new Date(value).toLocaleString('zh-CN');
}
