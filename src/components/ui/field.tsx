import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/classNames';
import { Input } from './input';

export function Field({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('flex flex-col gap-1.5', className)}>{children}</div>;
}

export function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-text">
      {children}
    </label>
  );
}

export function FieldError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-sm text-danger">
      {children}
    </p>
  );
}

export function TextField({
  label,
  id: providedId,
  className,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  return (
    <Field className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input id={id} {...props} />
    </Field>
  );
}
