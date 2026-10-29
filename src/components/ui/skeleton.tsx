import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/classNames';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('animate-pulse rounded-control bg-surface-muted', className)} {...props} />
  );
}
