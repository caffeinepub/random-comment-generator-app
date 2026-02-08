import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useDeviceId } from './useDeviceId';
import type { CommentListId } from '../backend';
import { loadDeviceHistory, saveDeviceHistory } from '../utils/deviceHistoryStorage';

/**
 * Device-scoped React Query hook for fetching user comment history.
 * Includes localStorage mirroring for offline-first behavior.
 */
export function useDeviceScopedUserCommentHistory() {
  const { actor, isFetching } = useActor();
  const deviceId = useDeviceId();

  return useQuery<Array<[CommentListId, boolean]>>({
    queryKey: ['userCommentHistory', deviceId],
    queryFn: async () => {
      if (!actor) return [];
      
      // Fetch from backend
      const backendHistory = await actor.getUserCommentHistory(deviceId);
      
      // Reconcile with localStorage: backend is source of truth
      const historyMap: Record<CommentListId, boolean> = {};
      backendHistory.forEach(([listId, hasGenerated]) => {
        historyMap[listId] = hasGenerated;
      });
      
      // Save reconciled history to localStorage
      saveDeviceHistory(deviceId, historyMap);
      
      return backendHistory;
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
    // Seed initial data from localStorage for instant UI
    initialData: () => {
      const localHistory = loadDeviceHistory(deviceId);
      return Object.entries(localHistory) as Array<[CommentListId, boolean]>;
    },
  });
}
