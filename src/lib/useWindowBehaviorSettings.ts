import { useSyncExternalStore } from 'react';
import { getWindowEdgeAutoScroll, subscribeWindowEdgeAutoScroll } from './windowBehaviorSettings';

export function useWindowEdgeAutoScroll(): boolean {
  return useSyncExternalStore(subscribeWindowEdgeAutoScroll, getWindowEdgeAutoScroll, () => false);
}
