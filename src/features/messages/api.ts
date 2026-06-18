import type {
  Message,
  PaginatedMessages,
  MessageBlock,
  VeilVisibility,
} from '@narratable/protocol';
import { apiFetch } from '@/lib/client';

export interface MessagesQueryParams {
  cursor?: string | null;
  limit?: number;
  sort?: 'asc' | 'desc';
  pinnedOnly?: boolean;
  maskId?: string;
}

export const messageApi = {
  list: (spaceId: string, roomId: string, params: MessagesQueryParams = {}) => {
    const qs = new URLSearchParams();
    if (params.cursor) qs.set('cursor', params.cursor);
    if (params.limit != null) qs.set('limit', String(params.limit));
    if (params.sort) qs.set('sort', params.sort);
    if (params.pinnedOnly) qs.set('pinnedOnly', 'true');
    if (params.maskId) qs.set('maskId', params.maskId);
    const query = qs.toString() ? `?${qs}` : '';
    return apiFetch<PaginatedMessages>(`/api/spaces/${spaceId}/rooms/${roomId}/messages${query}`);
  },

  update: (
    messageId: string,
    data: { content?: MessageBlock[]; clue?: Partial<NonNullable<Message['clue']>> },
  ) =>
    apiFetch<Message>(`/api/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (messageId: string) => apiFetch<void>(`/api/messages/${messageId}`, { method: 'DELETE' }),

  pin: (messageId: string, pinned: boolean) =>
    apiFetch<Message>(`/api/messages/${messageId}/pin`, {
      method: 'POST',
      body: JSON.stringify({ pinned }),
    }),

  fold: (messageId: string, folded: boolean) =>
    apiFetch<Message>(`/api/messages/${messageId}/fold`, {
      method: 'POST',
      body: JSON.stringify({ folded }),
    }),

  updateVeil: (messageId: string, data: { visibility: VeilVisibility; visibleTo?: string[] }) =>
    apiFetch<Message>(`/api/messages/${messageId}/veil`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};
