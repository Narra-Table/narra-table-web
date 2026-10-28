import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useId, useState, type FormEvent, type ReactNode } from 'react';
import {
  getApiSpacesSpaceIdMasks,
  getApiSpacesSpaceIdRooms,
  getApiSpacesSpaceId,
  getGetApiSpacesQueryKey,
  patchApiSpacesSpaceId,
  postApiSpaces,
  postApiSpacesSpaceIdMasks,
  postApiSpacesSpaceIdRooms,
} from '@/api';
import { ApiError } from '@/lib/orvalClient';
import { unpinSpace } from './pinnedSpaces';
import type { SpaceListItem } from './SpaceCard';

function actionError(caught: unknown, fallback: string) {
  if (!(caught instanceof ApiError)) return fallback;
  if (caught.status === 403) return '只有空间的主人可以修改';
  return caught.message || fallback;
}

async function ensureDefaultSpaceContent(spaceId: string): Promise<void> {
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
  await Promise.all(setup);
}

function DialogShell({
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
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !pending) onClose();
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
        role="dialog"
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

function SpaceFields({
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

export function CreateSpaceDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [createdSpaceId, setCreatedSpaceId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('请填写空间名称');
      return;
    }
    setPending(true);
    setError('');
    let createdDuringAttempt = false;
    try {
      let spaceId = createdSpaceId;
      if (!spaceId) {
        const space = await postApiSpaces({
          name: trimmed,
          description: description.trim() || undefined,
        });
        const created = space.data;
        if (!('spaceId' in created) || !created.spaceId) {
          throw new Error('空间创建后没有返回编号');
        }
        spaceId = created.spaceId;
        createdDuringAttempt = true;
        setCreatedSpaceId(spaceId);
      }
      await ensureDefaultSpaceContent(spaceId);
      await queryClient.invalidateQueries({ queryKey: getGetApiSpacesQueryKey() });
      onClose();
      await navigate({ to: '/spaces/$spaceId', params: { spaceId } });
    } catch (caught) {
      setError(
        createdSpaceId || createdDuringAttempt
          ? caught instanceof ApiError
            ? `空间已创建，但初始化失败：${caught.message}`
            : '空间已创建，但默认房间或主持人面具初始化失败，请重试'
          : caught instanceof ApiError
            ? caught.message
            : '创建空间失败，请稍后重试',
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <DialogShell label="创建空间" pending={pending} onClose={onClose}>
      <h2 className="text-xl font-semibold text-text">
        {createdSpaceId ? '完成空间初始化' : '创建空间'}
      </h2>
      {createdSpaceId ? (
        <p className="mt-2 text-sm text-text-muted">
          空间已经创建，只需完成默认房间和主持人面具设置。
        </p>
      ) : null}
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        <SpaceFields
          name={name}
          description={description}
          onName={setName}
          onDescription={setDescription}
          disabled={pending || Boolean(createdSpaceId)}
          autoFocus
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-control border border-border px-4 py-2 text-sm text-text disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-control bg-accent px-4 py-2 text-sm font-semibold text-accent-text disabled:opacity-50"
          >
            {pending ? '处理中...' : createdSpaceId ? '重试初始化' : '创建并进入'}
          </button>
        </div>
      </form>
    </DialogShell>
  );
}

export function EditSpaceDialog({ space, onClose }: { space: SpaceListItem; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(space.name ?? '');
  const [description, setDescription] = useState(space.description ?? '');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!space.spaceId) return;
    let cancelled = false;
    void getApiSpacesSpaceId(space.spaceId)
      .then((response) => {
        if (cancelled) return;
        setName(response.data.name ?? '');
        setDescription(response.data.description ?? '');
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setError('读取空间信息失败');
      });
    return () => {
      cancelled = true;
    };
  }, [space.spaceId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!space.spaceId || !ready) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError('请填写空间名称');
      return;
    }
    setPending(true);
    setError('');
    try {
      await patchApiSpacesSpaceId(space.spaceId, {
        name: trimmed,
        description: description.trim(),
      });
      await queryClient.invalidateQueries({ queryKey: getGetApiSpacesQueryKey() });
      onClose();
    } catch (caught) {
      setError(actionError(caught, '保存失败，请稍后重试'));
    } finally {
      setPending(false);
    }
  }

  return (
    <DialogShell label="编辑空间信息" pending={pending} onClose={onClose}>
      <h2 className="text-xl font-semibold text-text">编辑空间信息</h2>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        <SpaceFields
          name={name}
          description={description}
          onName={setName}
          onDescription={setDescription}
          disabled={!ready || pending}
          autoFocus
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-control border border-border px-4 py-2 text-sm text-text disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={!ready || pending}
            className="rounded-control bg-accent px-4 py-2 text-sm font-semibold text-accent-text disabled:opacity-50"
          >
            {pending ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </DialogShell>
  );
}

export function ArchiveSpaceDialog({
  space,
  onClose,
}: {
  space: SpaceListItem;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const name = space.name ?? '未命名空间';

  async function confirm() {
    if (!space.spaceId) return;
    setPending(true);
    setError('');
    try {
      await patchApiSpacesSpaceId(space.spaceId, { status: 'archived' });
      unpinSpace(space.spaceId);
      await queryClient.invalidateQueries({ queryKey: getGetApiSpacesQueryKey() });
      onClose();
    } catch (caught) {
      setError(actionError(caught, '归档失败，请稍后重试'));
    } finally {
      setPending(false);
    }
  }

  return (
    <DialogShell label="归档空间" pending={pending} onClose={onClose}>
      <h2 className="text-xl font-semibold text-text">归档空间</h2>
      <p className="mt-3 text-sm leading-snug text-text-muted">
        归档后，「{name}」会从主页列表里消失。
      </p>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={pending}
          className="rounded-control border border-border px-4 py-2 text-sm text-text disabled:opacity-50"
        >
          取消
        </button>
        <button
          type="button"
          onClick={() => void confirm()}
          disabled={pending}
          className="rounded-control border border-danger bg-surface px-4 py-2 text-sm font-semibold text-danger disabled:opacity-50"
        >
          {pending ? '归档中...' : '确认归档'}
        </button>
      </div>
    </DialogShell>
  );
}
