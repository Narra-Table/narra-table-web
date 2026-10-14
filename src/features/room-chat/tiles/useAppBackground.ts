import { useEffect, useState } from 'react';

const FALLBACK = '#fff6f1';

export function useAppBackground(): string {
  const [background, setBackground] = useState(FALLBACK);

  useEffect(() => {
    const read = () => {
      const value = getComputedStyle(document.documentElement)
        .getPropertyValue('--theme-app-bg')
        .trim();
      if (value) setBackground(value);
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'style'],
    });
    return () => observer.disconnect();
  }, []);

  return background;
}
