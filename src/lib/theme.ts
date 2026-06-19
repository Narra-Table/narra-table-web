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
