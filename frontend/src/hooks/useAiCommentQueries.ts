import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { toast } from 'sonner';

export function useGenerateAiComments() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentCount,
      commentLength,
    }: {
      commentCount: number;
      commentLength: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const comments = await actor.generateAiComments(BigInt(commentCount), BigInt(commentLength));
      return comments;
    },
    onSuccess: (comments) => {
      queryClient.invalidateQueries({ queryKey: ['aiComments'] });
      toast.success(`${comments.length} comment${comments.length !== 1 ? 's' : ''} generated successfully!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to generate AI comments');
    },
  });
}

export function useGetAllAiComments() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[string, string]>>({
    queryKey: ['aiComments'],
    queryFn: async () => {
      if (!actor) return [];
      // Since backend only has generateAiComments, we'll store generated comments in React Query cache
      // This is a temporary solution - ideally backend should have a getAllAiComments method
      return [];
    },
    enabled: !!actor && !isFetching,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}
