import { apiFetch } from '@/lib/client';
import type { Resource, ResourceListResponse, ResourceKind } from '@/types/protocol';

export const resourceApi = {
  list: (spaceId: string, filters?: { roomId?: string; kind?: ResourceKind }) => {
    const qs = new URLSearchParams();
    if (filters?.roomId) qs.set('roomId', filters.roomId);
    if (filters?.kind) qs.set('kind', filters.kind);
    const query = qs.toString() ? `?${qs}` : '';
    return apiFetch<ResourceListResponse>(`/api/spaces/${spaceId}/resources${query}`).then(
      (r) => r.resources,
    );
  },

  detail: (spaceId: string, resourceId: string) =>
    apiFetch<Resource>(`/api/spaces/${spaceId}/resources/${resourceId}`),

  create: (
    spaceId: string,
    data: {
      name: string;
      kind: ResourceKind;
      uri: string;
      roomId?: string;
      messageId?: string;
      mimeType?: string;
      sizeBytes?: number;
      metadata?: Record<string, unknown>;
    },
  ) =>
    apiFetch<Resource>(`/api/spaces/${spaceId}/resources`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (spaceId: string, resourceId: string) =>
    apiFetch<void>(`/api/spaces/${spaceId}/resources/${resourceId}`, { method: 'DELETE' }),
};
