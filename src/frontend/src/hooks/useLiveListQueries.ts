import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { toast } from 'sonner';
import type { AppEventId } from '../backend';

export function useGetAppEventIds() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[AppEventId, string]>>({
    queryKey: ['appEventIds'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAppEventIds();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useCheckUsernames() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({
      appEventId,
      usernames,
    }: {
      appEventId: AppEventId;
      usernames: string[];
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.checkUsernamesInAppEvent(appEventId, usernames);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to check usernames');
    },
  });
}
