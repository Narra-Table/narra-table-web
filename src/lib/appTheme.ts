export const THEME_STORAGE_KEY = 'narra-theme';

export const SUPPORTED_THEMES = ['cinematic', 'pure-white'] as const;

export type AppTheme = (typeof SUPPORTED_THEMES)[number];

/** 主题的短标签，和外观设置里的「…主题」共用同一套名字。 */
export const THEME_LABELS: Record<AppTheme, string> = {
  cinematic: '黑色',
  'pure-white': '白色',
};

export function isAppTheme(value: string | null): value is AppTheme {
  return SUPPORTED_THEMES.includes(value as AppTheme);
}

export function getStoredTheme(): AppTheme {
  if (typeof window === 'undefined') return 'cinematic';
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return isAppTheme(stored) ? stored : 'cinematic';
}

export function initTheme(): void {
  document.documentElement.dataset.theme = getStoredTheme();
}

export function saveTheme(theme: AppTheme): void {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  document.documentElement.dataset.theme = theme;
}
