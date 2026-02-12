import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { toast } from 'sonner';
import type { Comment, CommentListId, CommentId, RatingImageMetadata } from '../backend';
import { ExternalBlob } from '../backend';
import { ADMIN_ACCESS_CODE } from '../utils/adminPinSession';

export function useGetCommentListIds() {
  const { actor, isFetching } = useActor();

  return useQuery<CommentListId[]>({
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

  return useQuery<CommentListId[]>({
    queryKey: ['lockedCommentListIds'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLockedCommentListIds();
    },
    enabled: !!actor && !isFetching,
    staleTime: 10000,
    refetchInterval: 15000,
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
    staleTime: 20000,
  });
}

export function useGetRemainingCount(listId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['remainingCount', listId],
    queryFn: async () => {
      if (!actor || !listId) return BigInt(0);
      return actor.getRemainingCount(listId);
    },
    enabled: !!actor && !isFetching && !!listId,
    staleTime: 15000,
  });
}

export function useGetAllBulkCommentTotals() {
  const { actor, isFetching } = useActor();

  return useQuery<[CommentListId, bigint][]>({
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
    mutationFn: async (listId: CommentListId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createCommentList(ADMIN_ACCESS_CODE, listId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentListIds'] });
      queryClient.invalidateQueries({ queryKey: ['allBulkCommentTotals'] });
      toast.success('Comment list created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create comment list');
    },
  });
}

export function useAddComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, id, content }: { listId: CommentListId; id: CommentId; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addComment(ADMIN_ACCESS_CODE, listId, id, content);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['commentList', variables.listId] });
      queryClient.invalidateQueries({ queryKey: ['remainingCount', variables.listId] });
      queryClient.invalidateQueries({ queryKey: ['allBulkCommentTotals'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add comment');
    },
  });
}

export function useRemoveComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, commentId }: { listId: CommentListId; commentId: CommentId }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeComment(ADMIN_ACCESS_CODE, listId, commentId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['commentList', variables.listId] });
      queryClient.invalidateQueries({ queryKey: ['remainingCount', variables.listId] });
      queryClient.invalidateQueries({ queryKey: ['allBulkCommentTotals'] });
      toast.success('Comment removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove comment');
    },
  });
}

export function useResetCommentList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listId: CommentListId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.resetCommentList(ADMIN_ACCESS_CODE, listId);
    },
    onSuccess: (_, listId) => {
      queryClient.invalidateQueries({ queryKey: ['commentList', listId] });
      queryClient.invalidateQueries({ queryKey: ['remainingCount', listId] });
      toast.success('Comment list reset successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reset comment list');
    },
  });
}

export function useDeleteCommentList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listId: CommentListId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteCommentList(ADMIN_ACCESS_CODE, listId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentListIds'] });
      queryClient.invalidateQueries({ queryKey: ['commentList'] });
      queryClient.invalidateQueries({ queryKey: ['remainingCount'] });
      queryClient.invalidateQueries({ queryKey: ['allBulkCommentTotals'] });
      queryClient.invalidateQueries({ queryKey: ['lockedCommentListIds'] });
      toast.success('Comment list deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete comment list');
    },
  });
}

export function useClearAllCommentLists() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.clearAllCommentLists(ADMIN_ACCESS_CODE);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentListIds'] });
      queryClient.invalidateQueries({ queryKey: ['commentList'] });
      queryClient.invalidateQueries({ queryKey: ['remainingCount'] });
      queryClient.invalidateQueries({ queryKey: ['allBulkCommentTotals'] });
      queryClient.invalidateQueries({ queryKey: ['lockedCommentListIds'] });
      toast.success('All comment lists cleared successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to clear all comment lists');
    },
  });
}

export function useLockCommentList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listId: CommentListId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.lockCommentList(ADMIN_ACCESS_CODE, listId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lockedCommentListIds'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to lock comment list');
    },
  });
}

export function useUnlockCommentList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listId: CommentListId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.unlockCommentList(ADMIN_ACCESS_CODE, listId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lockedCommentListIds'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to unlock comment list');
    },
  });
}

export function useGenerateBulkComments() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, count, bulkGeneratorKey }: { listId: CommentListId; count: number; bulkGeneratorKey: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.generateBulkComments(bulkGeneratorKey, listId, BigInt(count));
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['commentList', variables.listId] });
      queryClient.invalidateQueries({ queryKey: ['remainingCount', variables.listId] });
      toast.success('Bulk comments generated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to generate bulk comments');
    },
  });
}

export function useGetBulkGeneratorKey(masked: boolean) {
  const { actor, isFetching } = useActor();

  return useQuery<string | null>({
    queryKey: ['bulkGeneratorKey', masked],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getBulkGeneratorKey(ADMIN_ACCESS_CODE, masked);
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
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
      toast.success('Bulk generator key updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update bulk generator key');
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
      toast.success('Bulk generator key reset successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reset bulk generator key');
    },
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
      toast.success('Image uploaded successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload image');
    },
  });
}

export function useGetAllUserRatingImages() {
  const { actor, isFetching } = useActor();

  return useQuery<[string, RatingImageMetadata[]][]>({
    queryKey: ['allUserRatingImages'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUserRatingImages(ADMIN_ACCESS_CODE);
    },
    enabled: !!actor && !isFetching,
    staleTime: 20000,
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
      toast.success('Image removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove image');
    },
  });
}

export function useGetAllMessages() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['allMessages'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMessages(ADMIN_ACCESS_CODE);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
    staleTime: 3000,
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
      toast.success('Reply sent successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send reply');
    },
  });
}
