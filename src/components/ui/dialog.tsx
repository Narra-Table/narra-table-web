import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/classNames';
import { Button } from './button';

const focusableSelector =
  'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Dialog({
  label,
  title,
  children,
  onClose,
  closeDisabled = false,
  className,
}: {
  label?: string;
  title?: string;
  children: ReactNode;
  onClose: () => void;
  closeDisabled?: boolean;
  className?: string;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [opener] = useState(() => document.activeElement);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.contains(document.activeElement)) dialog.focus();
    return () => {
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, [opener]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (!closeDisabled) onClose();
      }
      if (event.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const controls = dialog.querySelectorAll<HTMLElement>(focusableSelector);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!first) {
        event.preventDefault();
        dialog.focus();
      } else if (!dialog.contains(document.activeElement) || document.activeElement === dialog) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [closeDisabled, onClose]);

  const root = document.getElementById('modal-root') ?? document.body;
  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-text/40 p-4"
      onClick={() => {
        if (!closeDisabled) onClose();
      }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-label={label ?? title}
        className={cn(
          'w-full max-w-lg rounded-overlay border border-border-subtle bg-surface p-6 outline-none',
          className,
        )}
        onClick={(event) => event.stopPropagation()}
      >
        {title ? (
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-semibold text-text">{title}</h2>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={closeDisabled}>
              关闭
            </Button>
          </div>
        ) : null}
        <div className={cn(title && 'mt-4')}>{children}</div>
      </div>
    </div>,
    root,
  );
}
