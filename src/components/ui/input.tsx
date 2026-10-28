import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/classNames';

export const inputClassName =
  'w-full rounded-control border border-border bg-app-bg px-4 py-2 text-sm font-normal text-text outline-none transition-colors placeholder:text-text-muted focus:border-accent disabled:opacity-50';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(inputClassName, className)} {...props} />
  ),
);
Input.displayName = 'Input';
