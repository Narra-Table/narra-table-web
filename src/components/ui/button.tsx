import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/classNames';

export type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';
export type ButtonSize = 'sm' | 'default' | 'icon';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent font-semibold text-accent-text transition-opacity hover:opacity-90 disabled:opacity-50',
  secondary:
    'border border-border bg-surface font-medium text-text transition-colors hover:bg-surface-muted disabled:opacity-50',
  destructive:
    'border border-danger bg-surface font-semibold text-danger transition-colors hover:bg-surface-muted disabled:opacity-50',
  ghost:
    'font-medium text-text-muted transition-colors hover:bg-surface-muted hover:text-text disabled:opacity-40',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  default: 'px-4 py-2 text-sm',
  icon: 'size-8 p-0',
};

export function buttonClassName({
  variant = 'primary',
  size = 'default',
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-control outline-none focus-visible:ring-2 focus-visible:ring-accent',
    variants[variant],
    sizes[size],
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={buttonClassName({ variant, size, className })}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
