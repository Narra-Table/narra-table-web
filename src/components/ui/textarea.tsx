import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/classNames';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'min-h-20 w-full rounded-control border border-border bg-app-bg px-4 py-2 text-sm text-text outline-none transition-colors placeholder:text-text-muted focus:border-accent disabled:opacity-50',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';
