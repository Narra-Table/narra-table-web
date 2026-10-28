import { useEffect } from 'react';
import { writeWorkbenchSnapshot } from '../lib/persistence';
import type { WorkbenchStore } from '../model/window-manager';

const SAVE_DELAY_MS = 120;

export function useWorkbenchPersistence(spaceId: string, store: WorkbenchStore): void {
  useEffect(() => {
    let timer: number | undefined;

    const flush = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      timer = undefined;
      writeWorkbenchSnapshot(spaceId, store);
    };

    const schedule = () => {
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
