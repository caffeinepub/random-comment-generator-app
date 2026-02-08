import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useDeviceId } from './useDeviceId';
import type { CommentListId } from '../backend';
import { updateDeviceHistoryEntry } from '../utils/deviceHistoryStorage';
import { toast } from 'sonner';

/**
 * Device-scoped mutation hook for generating a single comment.
 * Updates both backend state and localStorage mirror.
 */
export function useDeviceScopedGenerateComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const deviceId = useDeviceId();

  return useMutation({
    mutationFn: async (listId: CommentListId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.generateComment(listId, deviceId);
    },
    onSuccess: (comment, listId) => {
      if (comment) {
        // Update localStorage mirror immediately
        updateDeviceHistoryEntry(deviceId, listId, true);
        
        // Invalidate React Query caches
        queryClient.invalidateQueries({ queryKey: ['remainingCount', listId] });
        queryClient.invalidateQueries({ queryKey: ['availableComments', listId] });
        queryClient.invalidateQueries({ queryKey: ['commentList', listId] });
        queryClient.invalidateQueries({ queryKey: ['userCommentHistory', deviceId] });
      }
    },
    onError: (error: Error) => {
      // Show the backend error message directly for restriction errors
      const message = error.message;
      if (message.includes('only generate one comment per list')) {
        toast.error(message);
      } else {
        toast.error(`Failed to generate comment: ${message}`);
      }
    },
  });
}
