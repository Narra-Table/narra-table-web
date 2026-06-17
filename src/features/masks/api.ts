import { apiFetch } from '@/lib/client';
import type { Mask, MaskListResponse } from '@/types/protocol';

export const maskApi = {
  list: (spaceId: string) =>
    apiFetch<MaskListResponse>(`/api/spaces/${spaceId}/masks`).then((r) => r.masks),

  detail: (spaceId: string, maskId: string) =>
    apiFetch<Mask>(`/api/spaces/${spaceId}/masks/${maskId}`),

  create: (
    spaceId: string,
    data: {
      name: string;
      type: Mask['type'];
      avatars: Record<string, string>;
      currentAvatarId: string;
      defaultAvatarId: string;
    },
  ) =>
    apiFetch<Mask>(`/api/spaces/${spaceId}/masks`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (
    spaceId: string,
    maskId: string,
    data: Partial<
      Pick<Mask, 'name' | 'avatars' | 'currentAvatarId' | 'defaultAvatarId' | 'userIds'>
    >,
  ) =>
    apiFetch<Mask>(`/api/spaces/${spaceId}/masks/${maskId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (spaceId: string, maskId: string) =>
    apiFetch<void>(`/api/spaces/${spaceId}/masks/${maskId}`, { method: 'DELETE' }),
};
