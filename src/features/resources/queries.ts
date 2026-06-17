import { queryOptions, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ResourceKind } from '@/types/protocol';
import { resourceApi } from './api';

type ResourceFilters = { roomId?: string; kind?: ResourceKind };

export const resourceKeys = {
  all: ['resources'] as const,
  space: (spaceId: string) => ['resources', spaceId] as const,
  list: (spaceId: string, filters?: ResourceFilters) => ['resources', spaceId, filters] as const,
  detail: (spaceId: string, resourceId: string) => ['resources', spaceId, resourceId] as const,
};

export const resourcesQueryOptions = (spaceId: string, filters?: ResourceFilters) =>
  queryOptions({
    queryKey: resourceKeys.list(spaceId, filters),
    queryFn: () => resourceApi.list(spaceId, filters),
    enabled: !!spaceId,
  });

export const resourceDetailQueryOptions = (spaceId: string, resourceId: string) =>
  queryOptions({
    queryKey: resourceKeys.detail(spaceId, resourceId),
    queryFn: () => resourceApi.detail(spaceId, resourceId),
    enabled: !!spaceId && !!resourceId,
  });

export const useResourcesQuery = (spaceId: string, filters?: ResourceFilters) =>
  useQuery(resourcesQueryOptions(spaceId, filters));

export const useResourceDetailQuery = (spaceId: string, resourceId: string) =>
  useQuery(resourceDetailQueryOptions(spaceId, resourceId));

export const useCreateResourceMutation = (spaceId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof resourceApi.create>[1]) =>
      resourceApi.create(spaceId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: resourceKeys.space(spaceId) }),
  });
};

export const useDeleteResourceMutation = (spaceId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (resourceId: string) => resourceApi.delete(spaceId, resourceId),
    onSuccess: async (_data, resourceId) => {
      await qc.invalidateQueries({ queryKey: resourceKeys.space(spaceId) });
      qc.removeQueries({ queryKey: resourceKeys.detail(spaceId, resourceId) });
    },
  });
};
