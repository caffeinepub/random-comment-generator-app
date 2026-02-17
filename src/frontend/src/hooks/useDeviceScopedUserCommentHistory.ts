import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useDeviceId } from './useDeviceId';
import { loadDeviceHistory, saveDeviceHistory } from '../utils/deviceHistoryStorage';
import type { CommentListId } from '../backend';

/**
 * Query hook to check if the current device has already generated a single comment for a given listId.
 */
export function useHasSingleCommentGenerated(listId: CommentListId | null) {
  const { actor, isFetching: actorFetching } = useActor();
  const deviceId = useDeviceId();

  return useQuery<boolean>({
    queryKey: ['hasSingleCommentGenerated', deviceId, listId],
    queryFn: async () => {
      if (!actor || !listId) return false;

      // Check backend first
      const hasGenerated = await actor.hasSingleCommentGenerated(deviceId, listId);

      // Update localStorage mirror
      const localHistory = loadDeviceHistory(deviceId);
      localHistory[listId] = hasGenerated;
      saveDeviceHistory(deviceId, localHistory);

      return hasGenerated;
    },
    enabled: !!actor && !actorFetching && !!listId,
    staleTime: 10000,
  });
}

/**
 * Query hook to fetch the device-scoped single-comment history for the current device.
 */
export function useDeviceSingleCommentHistory() {
  const { actor, isFetching: actorFetching } = useActor();
  const deviceId = useDeviceId();

  return useQuery<[CommentListId, boolean][]>({
    queryKey: ['deviceSingleCommentHistory', deviceId],
    queryFn: async () => {
      if (!actor) return [];

      // Fetch from backend
      const history = await actor.getDeviceSingleCommentHistory(deviceId);

      // Update localStorage mirror
      const localHistory: Record<CommentListId, boolean> = {};
      history.forEach(([listId, hasGenerated]) => {
        localHistory[listId] = hasGenerated;
      });
      saveDeviceHistory(deviceId, localHistory);

      return history;
    },
    enabled: !!actor && !actorFetching,
    staleTime: 15000,
  });
}
