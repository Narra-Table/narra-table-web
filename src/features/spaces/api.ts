import { apiFetch } from '@/lib/client';
import type { SpaceSummary, SpaceDetail, SpacesListResponse, SpaceMember } from '@/types/protocol';

export const spaceApi = {
  list: () => apiFetch<SpacesListResponse>('/api/spaces').then((r) => r.spaces),

  detail: (spaceId: string) => apiFetch<SpaceDetail>(`/api/spaces/${spaceId}`),

  create: (data: { name: string; description?: string }) =>
    apiFetch<SpaceDetail>('/api/spaces', { method: 'POST', body: JSON.stringify(data) }),

  update: (spaceId: string, data: Partial<Pick<SpaceDetail, 'name' | 'description' | 'status'>>) =>
    apiFetch<SpaceDetail>(`/api/spaces/${spaceId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (spaceId: string) => apiFetch<void>(`/api/spaces/${spaceId}`, { method: 'DELETE' }),

  inviteMember: (spaceId: string, data: { userId: string; role: SpaceMember['role'] }) =>
    apiFetch<SpaceMember>(`/api/spaces/${spaceId}/members`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateMemberRole: (spaceId: string, userId: string, role: SpaceMember['role']) =>
    apiFetch<SpaceMember>(`/api/spaces/${spaceId}/members/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),

  removeMember: (spaceId: string, userId: string) =>
    apiFetch<void>(`/api/spaces/${spaceId}/members/${userId}`, { method: 'DELETE' }),

  revealAllVeils: (spaceId: string) =>
    apiFetch<{ messageIds: string[]; count: number }>(`/api/spaces/${spaceId}/reveal-all-veils`, {
      method: 'POST',
    }),
};

// keep backward-compat alias used by SpaceList
export type Space = SpaceSummary;
