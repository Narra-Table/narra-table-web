import type { Mask } from '@narratable/protocol';
import { queryOptions, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { spaceDetailQueryOptions } from '@/features/spaces/queries';
import { maskApi } from './api';

export const maskKeys = {
  all: ['masks'] as const,
  list: (spaceId: string) => ['masks', spaceId] as const,
  detail: (spaceId: string, maskId: string) => ['masks', spaceId, maskId] as const,
};

export const masksQueryOptions = (spaceId: string) =>
  queryOptions({
    queryKey: maskKeys.list(spaceId),
    queryFn: () => maskApi.list(spaceId),
    enabled: !!spaceId,
  });

export const maskDetailQueryOptions = (spaceId: string, maskId: string) =>
  queryOptions({
    queryKey: maskKeys.detail(spaceId, maskId),
    queryFn: () => maskApi.detail(spaceId, maskId),
    enabled: !!spaceId && !!maskId,
  });

export const useMasksQuery = (spaceId: string) => useQuery(masksQueryOptions(spaceId));

export const useMaskDetailQuery = (spaceId: string, maskId: string) =>
  useQuery(maskDetailQueryOptions(spaceId, maskId));

export const useCreateMaskMutation = (spaceId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof maskApi.create>[1]) => maskApi.create(spaceId, data),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries(masksQueryOptions(spaceId)),
        qc.invalidateQueries(spaceDetailQueryOptions(spaceId)),
      ]);
    },
  });
};

export const useUpdateMaskMutation = (spaceId: string, maskId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      data: Partial<
        Pick<Mask, 'name' | 'avatars' | 'currentAvatarId' | 'defaultAvatarId' | 'userIds'>
      >,
    ) => maskApi.update(spaceId, maskId, data),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries(masksQueryOptions(spaceId)),
        qc.invalidateQueries(maskDetailQueryOptions(spaceId, maskId)),
      ]);
    },
  });
};

export const useDeleteMaskMutation = (spaceId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (maskId: string) => maskApi.delete(spaceId, maskId),
    onSuccess: async (_data, maskId) => {
      await Promise.all([
        qc.invalidateQueries(masksQueryOptions(spaceId)),
        qc.invalidateQueries(spaceDetailQueryOptions(spaceId)),
      ]);
      qc.removeQueries({ queryKey: maskKeys.detail(spaceId, maskId) });
    },
  });
};
