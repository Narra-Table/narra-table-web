import { useEffect, useState } from 'react';

export interface ThemePalette {
  appBg: string;
  text: string;
  accent: string;
  danger: string;
  warning: string;
  success: string;
  info: string;
}

const FALLBACK: ThemePalette = {
  appBg: '#fff6f1',
  text: '#15110d',
  accent: '#0da898',
  danger: '#dc2626',
  warning: '#d97706',
  success: '#16a34a',
  info: '#0891b2',
};

const VARIABLES: Record<keyof ThemePalette, string> = {
  appBg: '--theme-app-bg',
  text: '--theme-text',
  accent: '--theme-accent',
  danger: '--theme-danger',
  warning: '--theme-warning',
  success: '--theme-success',
  info: '--theme-info',
};

/** 读取当前主题的语义色值，供对比度计算使用。 */
export function useThemePalette(): ThemePalette {
  const [palette, setPalette] = useState<ThemePalette>(FALLBACK);

  useEffect(() => {
    const read = () => {
      const style = getComputedStyle(document.documentElement);
      const next = { ...FALLBACK };
      for (const key of Object.keys(VARIABLES) as (keyof ThemePalette)[]) {
        const value = style.getPropertyValue(VARIABLES[key]).trim();
        if (value) next[key] = value;
      }
      setPalette(next);
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'style'],
    });
    return () => observer.disconnect();
  }, []);

  return palette;
}
