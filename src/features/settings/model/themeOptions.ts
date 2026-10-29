import { THEME_LABELS } from '@/lib/appTheme';

export const themeOptions = [
  { backgroundTheme: 'kraft-teal', id: 'kraft-teal', label: `${THEME_LABELS['kraft-teal']}主题` },
  { backgroundTheme: 'kraft-teal', id: 'kraft-brown', label: `${THEME_LABELS['kraft-brown']}主题` },
  { backgroundTheme: 'kraft-teal', id: 'kraft-pink', label: `${THEME_LABELS['kraft-pink']}主题` },
  { backgroundTheme: 'pure-white', id: 'pure-white', label: `${THEME_LABELS['pure-white']}主题` },
  {
    backgroundTheme: 'black-green',
    id: 'black-green',
    label: `${THEME_LABELS['black-green']}主题`,
  },
  { backgroundTheme: 'black-blue', id: 'black-blue', label: `${THEME_LABELS['black-blue']}主题` },
  { backgroundTheme: 'ink-gold', id: 'ink-gold', label: `${THEME_LABELS['ink-gold']}主题` },
] as const;
