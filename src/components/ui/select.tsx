import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/classNames';
import { inputClassName } from './input';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select ref={ref} className={cn(inputClassName, className)} {...props} />
  ),
);
Select.displayName = 'Select';
