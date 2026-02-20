import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { toast } from 'sonner';
import type { AppEvent, AppEventId } from '../backend';
import { loadCachedAppEvents, saveCachedAppEvents } from '../utils/localStorageCache';

const ADMIN_ACCESS_CODE = '5676';

export function useGetAllAppEvents() {
  const { actor, isFetching } = useActor();
  const queryClient = useQueryClient();

  return useQuery<AppEvent[]>({
    queryKey: ['allAppEvents'],
    queryFn: async () => {
      if (!actor) {
        // Return cached data if available
        const cached = loadCachedAppEvents();
        if (cached) return cached;
        return [];
      }
      
      const data = await actor.getAllAppEvents(ADMIN_ACCESS_CODE);
      saveCachedAppEvents(data);
      return data;
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
    initialData: () => {
      // Load from cache immediately
      return loadCachedAppEvents() || undefined;
    },
  });
}

export function useCreateAppEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createAppEvent(ADMIN_ACCESS_CODE, name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allAppEvents'] });
      queryClient.invalidateQueries({ queryKey: ['appEventIds'] });
      toast.success('App/Event created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create app/event');
    },
  });
}

export function useAddUsernamesToAppEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      appEventId,
      usernames,
    }: {
      appEventId: AppEventId;
      usernames: string[];
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addUsernamesToAppEvent(ADMIN_ACCESS_CODE, appEventId, usernames);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allAppEvents'] });
      toast.success('Usernames added successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add usernames');
    },
  });
}

export function useRemoveUsernameFromAppEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      appEventId,
      username,
    }: {
      appEventId: AppEventId;
      username: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeUsernameFromAppEvent(ADMIN_ACCESS_CODE, appEventId, username);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allAppEvents'] });
      toast.success('Username removed successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove username');
    },
  });
}

export function useResetAppEventUsernames() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appEventId: AppEventId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.resetAppEventUsernames(ADMIN_ACCESS_CODE, appEventId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allAppEvents'] });
      toast.success('All usernames cleared successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reset usernames');
    },
  });
}

export function useDeleteAppEvent() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appEventId: AppEventId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteAppEvent(ADMIN_ACCESS_CODE, appEventId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allAppEvents'] });
      queryClient.invalidateQueries({ queryKey: ['appEventIds'] });
      toast.success('App/Event deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete app/event');
    },
  });
}
