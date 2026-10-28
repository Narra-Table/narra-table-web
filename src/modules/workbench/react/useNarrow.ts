import { useMediaQuery } from '@/lib/react';

export function useNarrow(breakpoint = 1024): boolean {
  return useMediaQuery(`(max-width: ${breakpoint - 1}px)`);
}
