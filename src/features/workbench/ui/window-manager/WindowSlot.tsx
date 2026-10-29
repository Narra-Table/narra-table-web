import { cn } from './utils';

/** A place where the stable window host currently renders its portal target. */
export function WindowSlot({ instanceId, className }: { instanceId: string; className?: string }) {
  return <div className={cn('wm-window-slot', className)} data-wm-slot={instanceId} />;
}
