import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import {
  getApiSpacesSpaceIdMasks,
  getApiSpacesSpaceIdRooms,
  postApiSpacesSpaceIdMasks,
  postApiSpacesSpaceIdRooms,
} from '@/api';
import { ApiError } from '@/lib/orvalClient';

export function actionError(caught: unknown, fallback: string) {
  if (!(caught instanceof ApiError)) return fallback;
  if (caught.status === 403) return '只有空间的主人可以修改';
  return caught.message || fallback;
}

export async function ensureDefaultSpaceContent(spaceId: string): Promise<void> {
  const [roomsResponse, masksResponse] = await Promise.all([
    getApiSpacesSpaceIdRooms(spaceId),
    getApiSpacesSpaceIdMasks(spaceId),
  ]);
  if (masksResponse.status !== 200) throw new Error('无法读取空间面具');
  const rooms = roomsResponse.data.rooms ?? [];
  const masks = masksResponse.data.masks ?? [];
  const setup: Promise<unknown>[] = [];
  if (!rooms.some((room) => room.type === 'session')) {
    setup.push(postApiSpacesSpaceIdRooms(spaceId, { name: '大厅', type: 'session' }));
  }
  if (!masks.some((mask) => mask.type === 'gm')) {
    setup.push(postApiSpacesSpaceIdMasks(spaceId, { name: '主持人', type: 'gm' }));
  }
  const results = await Promise.allSettled(setup);
  const failure = results.find((result) => result.status === 'rejected');
  if (failure?.status === 'rejected') throw failure.reason;
}

export function DialogShell({
  label,
  pending,
  onClose,
  children,
}: {
  label: string;
  pending: boolean;
  onClose: () => void;
  children: ReactNode;
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
        if (!pending) onClose();
      }
      if (event.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const controls = dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
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
  }, [onClose, pending]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-text/40 p-4"
      onClick={() => {
        if (!pending) onClose();
      }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-label={label}
        className="w-full max-w-sm rounded-overlay border border-border-subtle bg-surface px-6 py-6"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function SpaceFields({
  name,
  description,
  onName,
  onDescription,
  disabled,
  autoFocus,
}: {
  name: string;
  description: string;
  onName: (value: string) => void;
  onDescription: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const id = useId();
  const nameId = `${id}-name`;
  const descriptionId = `${id}-description`;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text" htmlFor={nameId}>
          名称
        </label>
        <input
          id={nameId}
          value={name}
          onChange={(event) => onName(event.target.value)}
          className="rounded-control border border-border bg-app-bg px-4 py-2 text-sm text-text outline-none transition-colors focus:border-accent disabled:opacity-50"
          placeholder="给这个团起个名字"
          required
          autoFocus={autoFocus}
          disabled={disabled}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-text" htmlFor={descriptionId}>
          简介
        </label>
        <textarea
          id={descriptionId}
          value={description}
          onChange={(event) => onDescription(event.target.value)}
          className="min-h-20 rounded-control border border-border bg-app-bg px-4 py-2 text-sm text-text outline-none transition-colors focus:border-accent disabled:opacity-50"
          placeholder="可选"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
