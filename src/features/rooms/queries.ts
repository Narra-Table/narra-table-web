import { queryOptions, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { spaceDetailQueryOptions } from '@/features/spaces/queries';
import type { Room } from '@/types/protocol';
import { roomApi } from './api';

export const roomKeys = {
  all: ['rooms'] as const,
  list: (spaceId: string) => ['rooms', spaceId] as const,
  detail: (spaceId: string, roomId: string) => ['rooms', spaceId, roomId] as const,
};

export const roomsQueryOptions = (spaceId: string) =>
  queryOptions({
    queryKey: roomKeys.list(spaceId),
    queryFn: () => roomApi.list(spaceId),
    enabled: !!spaceId,
  });

export const roomDetailQueryOptions = (spaceId: string, roomId: string) =>
  queryOptions({
    queryKey: roomKeys.detail(spaceId, roomId),
    queryFn: () => roomApi.detail(spaceId, roomId),
    enabled: !!spaceId && !!roomId,
  });

export const useRoomsQuery = (spaceId: string) => useQuery(roomsQueryOptions(spaceId));

export const useRoomDetailQuery = (spaceId: string, roomId: string) =>
  useQuery(roomDetailQueryOptions(spaceId, roomId));

export const useCreateRoomMutation = (spaceId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof roomApi.create>[1]) => roomApi.create(spaceId, data),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries(roomsQueryOptions(spaceId)),
        qc.invalidateQueries(spaceDetailQueryOptions(spaceId)),
      ]);
    },
  });
};

export const useUpdateRoomMutation = (spaceId: string, roomId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Partial<Pick<Room, 'name' | 'description' | 'sortOrder' | 'visibleMemberIds'>>,
    ) => roomApi.update(spaceId, roomId, data),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries(roomsQueryOptions(spaceId)),
        qc.invalidateQueries(roomDetailQueryOptions(spaceId, roomId)),
      ]);
    },
  });
};

export const useDeleteRoomMutation = (spaceId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (roomId: string) => roomApi.delete(spaceId, roomId),
    onSuccess: async (_data, roomId) => {
      await Promise.all([
        qc.invalidateQueries(roomsQueryOptions(spaceId)),
        qc.invalidateQueries(spaceDetailQueryOptions(spaceId)),
      ]);
      qc.removeQueries({ queryKey: roomKeys.detail(spaceId, roomId) });
    },
  });
};

export const useJoinRoomMutation = (spaceId: string, roomId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data?: { maskId?: string; code?: string }) => roomApi.join(spaceId, roomId, data),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries(roomsQueryOptions(spaceId)),
        qc.invalidateQueries(roomDetailQueryOptions(spaceId, roomId)),
      ]);
    },
  });
};

export const useLeaveRoomMutation = (spaceId: string, roomId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => roomApi.leave(spaceId, roomId),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries(roomsQueryOptions(spaceId)),
        qc.invalidateQueries(roomDetailQueryOptions(spaceId, roomId)),
      ]);
    },
  });
};
