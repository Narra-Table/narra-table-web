import { useEffect } from 'react';
import type { WindowManagerStore } from '@/features/window-manager';
import { writeSpaceSnapshot } from '../lib/persistence';

const SAVE_DELAY_MS = 120;

export function useSpacePersistence(spaceId: string, store: WindowManagerStore): void {
  useEffect(() => {
    let timer: number | undefined;
    let dirty = false;

    const flush = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      timer = undefined;
      if (!dirty) return;
      dirty = false;
      writeSpaceSnapshot(spaceId, store);
    };

    const schedule = () => {
      dirty = true;
      if (timer !== undefined) window.clearTimeout(timer);
      timer = window.setTimeout(flush, SAVE_DELAY_MS);
    };

    schedule();
    const unsubscribe = store.subscribe(schedule);
    window.addEventListener('pagehide', flush);

    return () => {
      unsubscribe();
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [spaceId, store]);
}
