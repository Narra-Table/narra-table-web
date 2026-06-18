import type { Message, MessageBlock, VeilVisibility } from '@narratable/protocol';
import {
  queryOptions,
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  infiniteQueryOptions,
} from '@tanstack/react-query';
import { messageApi, type MessagesQueryParams } from './api';

export const messageKeys = {
  all: ['messages'] as const,
  space: (spaceId: string) => ['messages', spaceId] as const,
  room: (spaceId: string, roomId: string) => ['messages', spaceId, roomId] as const,
  pinned: (spaceId: string, roomId: string) => ['messages', spaceId, roomId, 'pinned'] as const,
  infinite: (spaceId: string, roomId: string, opts: Omit<MessagesQueryParams, 'cursor'>) =>
    ['messages', spaceId, roomId, opts] as const,
};

// ── Pinned messages (finite list) ─────────────────────────────────────────────

export const pinnedMessagesQueryOptions = (spaceId: string, roomId: string) =>
  queryOptions({
    queryKey: messageKeys.pinned(spaceId, roomId),
    queryFn: () => messageApi.list(spaceId, roomId, { pinnedOnly: true, limit: 50, sort: 'asc' }),
    enabled: !!spaceId && !!roomId,
    select: (data) => data.messages,
  });

export const usePinnedMessagesQuery = (spaceId: string, roomId: string) =>
  useQuery(pinnedMessagesQueryOptions(spaceId, roomId));

// ── Room messages (infinite / paginated) ─────────────────────────────────────

export const roomMessagesInfiniteQueryOptions = (
  spaceId: string,
  roomId: string,
  opts: Omit<MessagesQueryParams, 'cursor'> = {},
) =>
  infiniteQueryOptions({
    queryKey: messageKeys.infinite(spaceId, roomId, opts),
    queryFn: ({ pageParam }) =>
      messageApi.list(spaceId, roomId, { ...opts, cursor: pageParam ?? undefined }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!spaceId && !!roomId,
  });

export const useRoomMessagesQuery = (
  spaceId: string,
  roomId: string,
  opts: Omit<MessagesQueryParams, 'cursor'> = { sort: 'asc', limit: 20 },
) => useInfiniteQuery(roomMessagesInfiniteQueryOptions(spaceId, roomId, opts));

// ── Mutations ─────────────────────────────────────────────────────────────────

export const useUpdateMessageMutation = (spaceId: string, roomId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      messageId,
      data,
    }: {
      messageId: string;
      data: { content?: MessageBlock[]; clue?: Partial<NonNullable<Message['clue']>> };
    }) => messageApi.update(messageId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: messageKeys.room(spaceId, roomId) }),
  });
};

export const useDeleteMessageMutation = (spaceId: string, roomId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => messageApi.delete(messageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: messageKeys.room(spaceId, roomId) }),
  });
};

export const usePinMessageMutation = (spaceId: string, roomId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, pinned }: { messageId: string; pinned: boolean }) =>
      messageApi.pin(messageId, pinned),
    onSuccess: () => qc.invalidateQueries({ queryKey: messageKeys.room(spaceId, roomId) }),
  });
};

export const useFoldMessageMutation = (spaceId: string, roomId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, folded }: { messageId: string; folded: boolean }) =>
      messageApi.fold(messageId, folded),
    onSuccess: () => qc.invalidateQueries({ queryKey: messageKeys.room(spaceId, roomId) }),
  });
};

export const useUpdateVeilMutation = (spaceId: string, roomId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      messageId,
      data,
    }: {
      messageId: string;
      data: { visibility: VeilVisibility; visibleTo?: string[] };
    }) => messageApi.updateVeil(messageId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: messageKeys.room(spaceId, roomId) }),
  });
};
