import { queryOptions, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageKeys } from '@/features/messages/queries';
import type { SpaceDetail, SpaceMember } from '@/types/protocol';
import { spaceApi } from './api';

export const spaceKeys = {
  all: ['spaces'] as const,
  detail: (spaceId: string) => ['spaces', spaceId] as const,
};

export const spacesQueryOptions = queryOptions({
  queryKey: spaceKeys.all,
  queryFn: spaceApi.list,
});

export const spaceDetailQueryOptions = (spaceId: string) =>
  queryOptions({
    queryKey: spaceKeys.detail(spaceId),
    queryFn: () => spaceApi.detail(spaceId),
    enabled: !!spaceId,
  });

export const useSpacesQuery = () => useQuery(spacesQueryOptions);

export const useSpaceDetailQuery = (spaceId: string) => useQuery(spaceDetailQueryOptions(spaceId));

export const useCreateSpaceMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: spaceApi.create,
    onSuccess: () => qc.invalidateQueries(spacesQueryOptions),
  });
};

export const useUpdateSpaceMutation = (spaceId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Pick<SpaceDetail, 'name' | 'description' | 'status'>>) =>
      spaceApi.update(spaceId, data),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries(spacesQueryOptions),
        qc.invalidateQueries(spaceDetailQueryOptions(spaceId)),
      ]);
    },
  });
};

export const useDeleteSpaceMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: spaceApi.delete,
    onSuccess: async (_data, spaceId) => {
      await qc.invalidateQueries(spacesQueryOptions);
      qc.removeQueries({ queryKey: spaceKeys.detail(spaceId) });
    },
  });
};

export const useInviteMemberMutation = (spaceId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { userId: string; role: SpaceMember['role'] }) =>
      spaceApi.inviteMember(spaceId, data),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries(spacesQueryOptions),
        qc.invalidateQueries(spaceDetailQueryOptions(spaceId)),
      ]);
    },
  });
};

export const useRevealAllVeilsMutation = (spaceId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => spaceApi.revealAllVeils(spaceId),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries(spaceDetailQueryOptions(spaceId)),
        qc.invalidateQueries({ queryKey: messageKeys.space(spaceId) }),
      ]);
    },
  });
};
