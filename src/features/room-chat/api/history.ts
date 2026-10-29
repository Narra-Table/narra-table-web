import type { GithubComNarraTableBackendPkgProtocolPaginatedMessages } from '@/api/model/githubComNarraTableBackendPkgProtocolPaginatedMessages';
import { orvalFetch } from '@/lib/apiClient';
import type { RoomMessage } from '../model/types';

export interface HistoryQuery {
  limit?: number;
  cursor?: string;
  sort?: 'asc' | 'desc';
  pinnedOnly?: boolean;
}

export async function fetchRoomMessages(
  spaceId: string,
  roomId: string,
  query: HistoryQuery = {},
  signal?: AbortSignal,
): Promise<GithubComNarraTableBackendPkgProtocolPaginatedMessages> {
  const params = new URLSearchParams();
  if (query.limit !== undefined) params.set('limit', String(query.limit));
  if (query.cursor) params.set('cursor', query.cursor);
  if (query.sort) params.set('sort', query.sort);
  if (query.pinnedOnly) params.set('pinnedOnly', 'true');
  const search = params.toString();
  const path = `/api/spaces/${encodeURIComponent(spaceId)}/rooms/${encodeURIComponent(roomId)}/messages${search ? `?${search}` : ''}`;
  const response = await orvalFetch<{
    data: GithubComNarraTableBackendPkgProtocolPaginatedMessages;
  }>(path, {
    method: 'GET',
    signal,
  });
  return response.data ?? {};
}

export function chronological(messages: RoomMessage[]): RoomMessage[] {
  return [...messages].reverse();
}
