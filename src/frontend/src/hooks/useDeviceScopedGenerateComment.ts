import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useDeviceId } from './useDeviceId';
import { updateDeviceHistoryEntry } from '../utils/deviceHistoryStorage';
import { toast } from 'sonner';
import type { CommentListId } from '../backend';

interface GenerateSingleCommentParams {
  listId: CommentListId;
}

/**
 * Device-scoped mutation hook for generating a single comment.
 * Updates both backend state and localStorage mirror.
 */
export function useDeviceScopedGenerateComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const deviceId = useDeviceId();

  return useMutation({
    mutationFn: async ({ listId }: GenerateSingleCommentParams): Promise<string | null> => {
      if (!actor) {
        throw new Error('Actor not available');
      }

      const result = await actor.generateSingleComment(listId, deviceId);
      return result;
    },
    onSuccess: (result, { listId }) => {
      if (result) {
        // Update localStorage mirror
        updateDeviceHistoryEntry(deviceId, listId, true);

        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['remainingCount', listId] });
        queryClient.invalidateQueries({ queryKey: ['deviceSingleCommentHistory', deviceId] });
        queryClient.invalidateQueries({ queryKey: ['hasSingleCommentGenerated', deviceId, listId] });

        toast.success('Comment generated successfully!');
      } else {
        toast.error('Unable to generate comment. List may be locked or you have already generated for this list.');
      }
    },
    onError: (error: any) => {
      console.error('Single comment generation error:', error);
      toast.error(error?.message || 'Failed to generate comment');
    },
  });
}
