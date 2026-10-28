import { useMediaQuery } from '@/lib/useMediaQuery';

export function useNarrow(breakpoint = 1024): boolean {
  return useMediaQuery(`(max-width: ${breakpoint - 1}px)`);
}
