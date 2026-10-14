import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { AdminUserStatus } from '@/lib/adminClient';
import { statusLabel } from './copy';

export const controlClass =
  'rounded-control border border-border bg-app-bg px-4 py-2 text-sm font-normal text-text outline-none transition-colors focus:border-accent';

export function PrimaryButton({
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`rounded-control bg-accent px-5 py-2.5 text-sm font-semibold text-accent-text transition-opacity hover:opacity-90 disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

export function GhostButton({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`rounded-control border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-muted disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

export function DangerButton({
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`rounded-control border border-danger bg-surface px-4 py-2 text-sm font-semibold text-danger transition-colors hover:bg-surface-muted disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

export function TextField({
  label,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-text">
      {label}
      <input className={controlClass} {...props} />
    </label>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  return <p className="text-sm text-danger">{children}</p>;
}

export function StatusBadge({ status }: { status: AdminUserStatus }) {
  const tone =
    status === 'active'
      ? 'bg-success/15 text-success'
      : status === 'disabled'
        ? 'bg-warning/15 text-warning'
        : 'bg-surface-muted text-text-muted';
  return (
    <span className={`inline-flex rounded-sm px-2 py-0.5 text-xs font-medium ${tone}`}>
      {statusLabel(status)}
    </span>
  );
}

export function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const root = document.getElementById('modal-root') ?? document.body;
  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-text/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-lg rounded-overlay border border-border-subtle bg-surface p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-semibold text-text">{title}</h2>
          <button type="button" onClick={onClose} className="text-sm text-text-muted">
            关闭
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>,
    root,
  );
}

export function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', { hour12: false });
}
