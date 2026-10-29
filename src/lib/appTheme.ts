export const THEME_STORAGE_KEY = 'narra-theme';

export const SUPPORTED_THEMES = [
  'kraft-teal',
  'kraft-brown',
  'kraft-pink',
  'pure-white',
  'black-green',
  'black-blue',
  'ink-gold',
] as const;

export type AppTheme = (typeof SUPPORTED_THEMES)[number];

/** 主题的短标签，和外观设置里的「…主题」共用同一套名字。 */
export const THEME_LABELS: Record<AppTheme, string> = {
  'kraft-teal': '青绿',
  'kraft-brown': '暖棕',
  'kraft-pink': '桃粉',
  'pure-white': '黑白',
  'black-green': '黑绿',
  'black-blue': '黑蓝',
  'ink-gold': '墨金',
};

export function isAppTheme(value: string | null): value is AppTheme {
  return SUPPORTED_THEMES.includes(value as AppTheme);
}

export function getStoredTheme(): AppTheme {
  if (typeof window === 'undefined') return 'kraft-teal';
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return isAppTheme(stored) ? stored : 'kraft-teal';
}

export function initTheme(): void {
  document.documentElement.dataset.theme = getStoredTheme();
}

export function saveTheme(theme: AppTheme): void {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  document.documentElement.dataset.theme = theme;
}
