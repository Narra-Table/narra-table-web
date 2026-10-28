import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useRef, useState, type FormEvent } from 'react';
import { getGetApiSpacesQueryKey, postApiSpaces } from '@/api';
import { ApiError } from '@/lib/orvalClient';
import { DialogShell, ensureDefaultSpaceContent, SpaceFields } from './shared';

export function CreateSpaceDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [createdSpaceId, setCreatedSpaceId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError('请填写空间名称');
      return;
    }
    inFlight.current = true;
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
      if (createdSpaceId || createdDuringAttempt) {
        await queryClient.invalidateQueries({ queryKey: getGetApiSpacesQueryKey() });
      }
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
      inFlight.current = false;
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
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
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
