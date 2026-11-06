import { useId, type ReactNode } from 'react';
import {
  getApiSpacesSpaceIdMasks,
  getApiSpacesSpaceIdRooms,
  postApiSpacesSpaceIdMasks,
  postApiSpacesSpaceIdRooms,
} from '@/api';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/apiClient';

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
  return (
    <Dialog label={label} closeDisabled={pending} onClose={onClose} className="max-w-sm">
      {children}
    </Dialog>
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
        <Input
          id={nameId}
          value={name}
          onChange={(event) => onName(event.target.value)}
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
        <Textarea
          id={descriptionId}
          value={description}
          onChange={(event) => onDescription(event.target.value)}
          placeholder="可选"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
