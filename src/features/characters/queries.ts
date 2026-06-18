import type { CharacterCard } from '@narratable/protocol';
import { queryOptions, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maskKeys } from '@/features/masks/queries';
import { characterApi } from './api';

export const characterCardKeys = {
  all: ['characterCards'] as const,
  list: (maskId: string) => ['characterCards', maskId] as const,
  detail: (maskId: string, cardId: string) => ['characterCards', maskId, cardId] as const,
};

export const characterCardsQueryOptions = (maskId: string) =>
  queryOptions({
    queryKey: characterCardKeys.list(maskId),
    queryFn: () => characterApi.list(maskId),
    enabled: !!maskId,
  });

export const characterCardDetailQueryOptions = (maskId: string, cardId: string) =>
  queryOptions({
    queryKey: characterCardKeys.detail(maskId, cardId),
    queryFn: () => characterApi.detail(maskId, cardId),
    enabled: !!maskId && !!cardId,
  });

export const useCharacterCardsQuery = (maskId: string) =>
  useQuery(characterCardsQueryOptions(maskId));

export const useCharacterCardDetailQuery = (maskId: string, cardId: string) =>
  useQuery(characterCardDetailQueryOptions(maskId, cardId));

export const useCreateCharacterCardMutation = (maskId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof characterApi.create>[1]) =>
      characterApi.create(maskId, data),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries(characterCardsQueryOptions(maskId)),
        qc.invalidateQueries({ queryKey: maskKeys.all }),
      ]);
    },
  });
};

export const useUpdateCharacterCardMutation = (maskId: string, cardId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Pick<CharacterCard, 'name' | 'attributes' | 'templateId'>>) =>
      characterApi.update(maskId, cardId, data),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries(characterCardsQueryOptions(maskId)),
        qc.invalidateQueries(characterCardDetailQueryOptions(maskId, cardId)),
      ]);
    },
  });
};

export const useDeleteCharacterCardMutation = (maskId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string) => characterApi.delete(maskId, cardId),
    onSuccess: async (_data, cardId) => {
      await Promise.all([
        qc.invalidateQueries(characterCardsQueryOptions(maskId)),
        qc.invalidateQueries({ queryKey: maskKeys.all }),
      ]);
      qc.removeQueries({ queryKey: characterCardKeys.detail(maskId, cardId) });
    },
  });
};
