import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { LiveRatingListEntry } from '../backend';

const STALE_TIME = 5 * 60 * 1000;

export function useGetLiveRatingListEntries() {
  const { actor, isFetching } = useActor();
  return useQuery<LiveRatingListEntry[]>({
    queryKey: ['liveRatingListEntries'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLiveRatingListEntries();
    },
    enabled: !!actor && !isFetching,
    staleTime: STALE_TIME,
  });
}

export function useAddLiveRatingListEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addLiveRatingListEntry(id, name);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['liveRatingListEntries'] });
    },
  });
}

export function useDeleteLiveRatingListEntry() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteLiveRatingListEntry(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['liveRatingListEntries'] });
    },
  });
}

export function useCheckLiveNameExists() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ appId, name }: { appId: string; name: string }) => {
      if (!actor) throw new Error('Actor not available');
      // Check against the cached entries for instant response
      const cached = qc.getQueryData<LiveRatingListEntry[]>(['liveRatingListEntries']);
      if (cached) {
        const entry = cached.find(e => e.id === appId);
        if (entry) {
          return entry.name.toLowerCase().includes(name.toLowerCase());
        }
      }
      return actor.checkLiveNameExists(name);
    },
  });
}

// Check a username against multiple apps using cached data
export function useCheckUsernameInApps() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ appIds, username }: { appIds: string[]; username: string }) => {
      const cached = qc.getQueryData<LiveRatingListEntry[]>(['liveRatingListEntries']) ?? [];
      const results: Record<string, boolean> = {};
      for (const appId of appIds) {
        const entry = cached.find(e => e.id === appId);
        if (entry) {
          // Simple name match - check if username matches the entry name
          results[appId] = entry.name.toLowerCase() === username.toLowerCase();
        } else {
          results[appId] = false;
        }
      }
      return results;
    },
  });
}
