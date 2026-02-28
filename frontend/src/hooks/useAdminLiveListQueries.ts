import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';

export function useGetLiveListEntries() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['liveListEntries'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLiveRatingListEntries();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddLiveListEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addLiveRatingListEntry(id, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liveListEntries'] });
    },
  });
}

export function useDeleteLiveListEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteLiveRatingListEntry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liveListEntries'] });
    },
  });
}
