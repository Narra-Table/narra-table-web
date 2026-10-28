import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { getGetApiSpacesQueryKey, patchApiSpacesSpaceId } from '@/api';
import { unpinSpace } from '../../model/pinnedSpaces';
import type { SpaceListItem } from '../../model/types';
import { actionError, DialogShell } from './shared';

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
      {error ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      ) : null}
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
