import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { toast } from 'sonner';
import type { AIComment, AiCommentId } from '../backend';

const ADMIN_ACCESS_CODE = '5676';

export function useCreateAiComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      content,
      appLinkOrName,
      ratingSymbol,
    }: {
      content: string;
      appLinkOrName: string;
      ratingSymbol: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const commentId = await actor.createAiComment(ADMIN_ACCESS_CODE, content, appLinkOrName, ratingSymbol);
      return { commentId, content, appLinkOrName, ratingSymbol };
    },
    onSuccess: () => {
      // Immediate invalidation for instant visibility
      queryClient.invalidateQueries({ queryKey: ['aiComments'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to generate AI comment');
    },
  });
}

export function useGetAllAiComments() {
  const { actor, isFetching } = useActor();

  return useQuery<AIComment[]>({
    queryKey: ['aiComments'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAiComments(ADMIN_ACCESS_CODE);
    },
    enabled: !!actor && !isFetching,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}

export function useDeleteAiComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (aiCommentId: AiCommentId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteAiComment(ADMIN_ACCESS_CODE, aiCommentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiComments'] });
      toast.success('AI comment deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete AI comment');
    },
  });
}

export function useClearAllAiComments() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.clearAllAiComments(ADMIN_ACCESS_CODE);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiComments'] });
      toast.success('All AI comments cleared successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to clear AI comments');
    },
  });
}
