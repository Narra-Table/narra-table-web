import { apiFetch } from '@/lib/client';
import type { CharacterCard, CharacterCardListResponse } from '@/types/protocol';

export const characterApi = {
  list: (maskId: string) =>
    apiFetch<CharacterCardListResponse>(`/api/masks/${maskId}/cards`).then((r) => r.cards),

  detail: (maskId: string, cardId: string) =>
    apiFetch<CharacterCard>(`/api/masks/${maskId}/cards/${cardId}`),

  create: (
    maskId: string,
    data: { name: string; attributes?: Record<string, unknown>; templateId?: string },
  ) =>
    apiFetch<CharacterCard>(`/api/masks/${maskId}/cards`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (
    maskId: string,
    cardId: string,
    data: Partial<Pick<CharacterCard, 'name' | 'attributes' | 'templateId'>>,
  ) =>
    apiFetch<CharacterCard>(`/api/masks/${maskId}/cards/${cardId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (maskId: string, cardId: string) =>
    apiFetch<void>(`/api/masks/${maskId}/cards/${cardId}`, { method: 'DELETE' }),
};
