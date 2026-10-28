import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/classNames';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-card border border-border-subtle bg-surface p-4', className)}
      {...props}
    />
  );
}
