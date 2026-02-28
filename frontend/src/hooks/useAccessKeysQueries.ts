import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { AccessKey } from '../backend';

export function useGetAccessKeys() {
  const { actor, isFetching } = useActor();

  return useQuery<AccessKey[]>({
    queryKey: ['accessKeys'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAccessKeys();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30 * 1000,
  });
}

export function useCreateAccessKey() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ description, key }: { description: string; key: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.createAccessKey(description, key);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accessKeys'] });
    },
  });
}

export function useUpdateAccessKey() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      key,
      newDescription,
      newKey,
    }: {
      key: string;
      newDescription: string;
      newKey: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateAccessKey(key, newDescription, newKey);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accessKeys'] });
    },
  });
}

export function useDeleteAccessKey() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (key: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteAccessKey(key);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accessKeys'] });
    },
  });
}
