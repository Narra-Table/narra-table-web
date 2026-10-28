import { useMemo, useSyncExternalStore } from 'react';
import type { WorkbenchStore } from '../core/store';
import type { WorkspaceState } from '../core/types';

/** Subscribe a component to the whole workspace state. */
export function useWorkbenchStore(store: WorkbenchStore): WorkspaceState {
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}

/**
 * Subscribe to a derived value. The selector runs when the state or the
 * selector identity changes, so inline selectors stay safe.
 */
export function useWorkbenchSelector<T>(
  store: WorkbenchStore,
  selector: (state: WorkspaceState) => T,
): T {
  const state = useWorkbenchStore(store);
  return useMemo(() => selector(state), [state, selector]);
}

export function useWorkbenchActions(store: WorkbenchStore): WorkbenchStore['actions'] {
  return store.actions;
}
