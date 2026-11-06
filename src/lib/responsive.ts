import { useEffect, useState } from 'react';

export const VIEWPORT_BREAKPOINTS = {
  tablet: 640,
  desktop: 1024,
} as const;

export const MEDIA_QUERIES = {
  mobile: `(max-width: ${VIEWPORT_BREAKPOINTS.tablet - 1}px)`,
  tablet: `(min-width: ${VIEWPORT_BREAKPOINTS.tablet}px) and (max-width: ${VIEWPORT_BREAKPOINTS.desktop - 1}px)`,
  desktop: `(min-width: ${VIEWPORT_BREAKPOINTS.desktop}px)`,
  compact: `(max-width: ${VIEWPORT_BREAKPOINTS.desktop - 1}px)`,
  compactPortrait: `(max-width: ${VIEWPORT_BREAKPOINTS.desktop - 1}px) and (orientation: portrait)`,
  reducedMotion: '(prefers-reduced-motion: reduce)',
} as const;

export type MediaQueryName = keyof typeof MEDIA_QUERIES;

export function matchesMediaQuery(name: MediaQueryName): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(MEDIA_QUERIES[name]).matches;
}

export function useMediaQuery(name: MediaQueryName): boolean {
  const [matches, setMatches] = useState(() => matchesMediaQuery(name));

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia(MEDIA_QUERIES[name]);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [name]);

  return matches;
}
