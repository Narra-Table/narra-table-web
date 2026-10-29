import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';
import { getApiSpacesSpaceId, getGetApiSpacesQueryKey, patchApiSpacesSpaceId } from '@/api';
import { Button } from '@/components/ui/button';
import type { SpaceListItem } from '../../model/types';
import { actionError, DialogShell, SpaceFields } from './shared';

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
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            取消
          </Button>
          <Button type="submit" disabled={!ready || pending}>
            {pending ? '保存中...' : '保存'}
          </Button>
        </div>
      </form>
    </DialogShell>
  );
}
