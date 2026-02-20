import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { toast } from 'sonner';
import type { Comment, CommentListId, CommentId, RatingImageMetadata, Message, MessageId } from '../backend';
import { ExternalBlob } from '../backend';

const ADMIN_ACCESS_CODE = '5676';

// Comment List Management
export function useGetCommentListIds() {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['commentListIds'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCommentListIds();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
  });
}

export function useGetLockedCommentListIds() {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['lockedCommentListIds'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLockedCommentListIds();
    },
    enabled: !!actor && !isFetching,
    staleTime: 10000,
  });
}

export function useGetCommentList(listId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Comment[]>({
    queryKey: ['commentList', listId],
    queryFn: async () => {
      if (!actor || !listId) return [];
      return actor.getCommentList(ADMIN_ACCESS_CODE, listId);
    },
    enabled: !!actor && !isFetching && !!listId,
    staleTime: 30000,
  });
}

export function useGetRemainingCount(listId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['remainingCount', listId],
    queryFn: async () => {
      if (!actor || !listId) return 0n;
      return actor.getRemainingCount(listId);
    },
    enabled: !!actor && !isFetching && !!listId,
    staleTime: 10000,
  });
}

export function useGetAllBulkCommentTotals() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[CommentListId, bigint]>>({
    queryKey: ['allBulkCommentTotals'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllBulkCommentTotals(ADMIN_ACCESS_CODE);
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
  });
}

export function useCreateCommentList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createCommentList(ADMIN_ACCESS_CODE, listId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentListIds'] });
      queryClient.invalidateQueries({ queryKey: ['allBulkCommentTotals'] });
      toast.success('Comment list created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create comment list');
    },
  });
}

export function useAddComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, id, content }: { listId: string; id: string; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addComment(ADMIN_ACCESS_CODE, listId, id, content);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['commentList', variables.listId] });
      queryClient.invalidateQueries({ queryKey: ['allBulkCommentTotals'] });
      queryClient.invalidateQueries({ queryKey: ['remainingCount', variables.listId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add comment');
    },
  });
}

export function useRemoveComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, commentId }: { listId: string; commentId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeComment(ADMIN_ACCESS_CODE, listId, commentId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['commentList', variables.listId] });
      queryClient.invalidateQueries({ queryKey: ['allBulkCommentTotals'] });
      queryClient.invalidateQueries({ queryKey: ['remainingCount', variables.listId] });
      toast.success('Comment deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete comment');
    },
  });
}

export function useDeleteCommentList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteCommentList(ADMIN_ACCESS_CODE, listId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentListIds'] });
      queryClient.invalidateQueries({ queryKey: ['commentList'] });
      queryClient.invalidateQueries({ queryKey: ['allBulkCommentTotals'] });
      toast.success('Comment list deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete comment list');
    },
  });
}

export function useLockCommentList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.lockCommentList(ADMIN_ACCESS_CODE, listId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lockedCommentListIds'] });
      toast.success('Comment list locked successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to lock comment list');
    },
  });
}

export function useUnlockCommentList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.unlockCommentList(ADMIN_ACCESS_CODE, listId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lockedCommentListIds'] });
      toast.success('Comment list unlocked successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to unlock comment list');
    },
  });
}

export function useClearEverything() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.clearEverything(ADMIN_ACCESS_CODE);
    },
    onSuccess: () => {
      queryClient.clear();
      toast.success('All data cleared successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to clear data');
    },
  });
}

// Bulk Comment Generation
export function useGenerateBulkComments() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listId,
      count,
      bulkGeneratorKey,
    }: {
      listId: string;
      count: number;
      bulkGeneratorKey: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.generateBulkComments(bulkGeneratorKey, listId, BigInt(count));
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['remainingCount', variables.listId] });
      queryClient.invalidateQueries({ queryKey: ['commentList', variables.listId] });
      toast.success('Bulk comments generated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to generate bulk comments');
    },
  });
}

// Bulk Generator Key Management
export function useGetBulkGeneratorKey() {
  const { actor, isFetching } = useActor();

  return useQuery<string | null>({
    queryKey: ['bulkGeneratorKey'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getBulkGeneratorKey(ADMIN_ACCESS_CODE, true);
    },
    enabled: !!actor && !isFetching,
    staleTime: 60000,
  });
}

export function useSetBulkGeneratorKey() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newKey: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setBulkGeneratorKey(ADMIN_ACCESS_CODE, newKey);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulkGeneratorKey'] });
      toast.success('Bulk generator key updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update key');
    },
  });
}

export function useResetBulkGeneratorKey() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.resetBulkGeneratorKey(ADMIN_ACCESS_CODE);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulkGeneratorKey'] });
      toast.success('Bulk generator key reset successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reset key');
    },
  });
}

// Rating Images
export function useGetAllUserRatingImages() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[string, RatingImageMetadata[]]>>({
    queryKey: ['allUserRatingImages'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUserRatingImages(ADMIN_ACCESS_CODE);
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
  });
}

export function useUploadRatingImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userName, image }: { userName: string; image: ExternalBlob }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadRatingImage(ADMIN_ACCESS_CODE, userName, image);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUserRatingImages'] });
      toast.success('Image uploaded successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload image');
    },
  });
}

export function useRemoveRatingImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userName, imageId }: { userName: string; imageId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeRatingImage(ADMIN_ACCESS_CODE, userName, imageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUserRatingImages'] });
      toast.success('Image removed successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove image');
    },
  });
}

// Messages
export function useGetAllMessages() {
  const { actor, isFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ['allMessages'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMessages(ADMIN_ACCESS_CODE);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
  });
}

export function useReplyMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (replyContent: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.replyMessage(ADMIN_ACCESS_CODE, replyContent);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allMessages'] });
      toast.success('Reply sent successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send reply');
    },
  });
}

export function useDeleteMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: MessageId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteMessage(ADMIN_ACCESS_CODE, messageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allMessages'] });
      toast.success('Message deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete message');
    },
  });
}
