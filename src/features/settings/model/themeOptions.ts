import { THEME_LABELS } from '@/lib/appTheme';

export const themeOptions = [
  { backgroundTheme: 'cinematic', id: 'cinematic', label: `${THEME_LABELS.cinematic}主题` },
  { backgroundTheme: 'pure-white', id: 'pure-white', label: `${THEME_LABELS['pure-white']}主题` },
] as const;
