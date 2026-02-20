import { useQuery, useMutation } from '@tanstack/react-query';
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
    staleTime: 30000,
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
