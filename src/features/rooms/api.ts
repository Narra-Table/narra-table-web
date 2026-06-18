import type { Room, RoomsListResponse } from '@narratable/protocol';
import { apiFetch } from '@/lib/client';

export const roomApi = {
  list: (spaceId: string) =>
    apiFetch<RoomsListResponse>(`/api/spaces/${spaceId}/rooms`).then((r) => r.rooms),

  detail: (spaceId: string, roomId: string) =>
    apiFetch<Room>(`/api/spaces/${spaceId}/rooms/${roomId}`),

  create: (
    spaceId: string,
    data: {
      name: string;
      type: Room['type'];
      description?: string;
      sortOrder?: number;
      visibleUserIds?: string[];
    },
  ) =>
    apiFetch<{ room: Room; joinCode: string }>(`/api/spaces/${spaceId}/rooms`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (
    spaceId: string,
    roomId: string,
    data: Partial<Pick<Room, 'name' | 'description' | 'sortOrder' | 'visibleMemberIds'>>,
  ) =>
    apiFetch<Room>(`/api/spaces/${spaceId}/rooms/${roomId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (spaceId: string, roomId: string) =>
    apiFetch<void>(`/api/spaces/${spaceId}/rooms/${roomId}`, { method: 'DELETE' }),

  join: (spaceId: string, roomId: string, data?: { maskId?: string; code?: string }) =>
    apiFetch<{ roomId: string; memberCount: number; joinedAt: string }>(
      `/api/spaces/${spaceId}/rooms/${roomId}/join`,
      { method: 'POST', body: JSON.stringify(data ?? {}) },
    ),

  leave: (spaceId: string, roomId: string) =>
    apiFetch<{ roomId: string; memberCount: number }>(
      `/api/spaces/${spaceId}/rooms/${roomId}/leave`,
      { method: 'POST' },
    ),

  regenerateCode: (spaceId: string, roomId: string) =>
    apiFetch<{ joinCode: string }>(`/api/spaces/${spaceId}/rooms/${roomId}/regenerate-code`, {
      method: 'POST',
    }),
};
