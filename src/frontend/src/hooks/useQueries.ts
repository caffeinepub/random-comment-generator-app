import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Comment, CommentListId, RatingImageMetadata, Message } from '../backend';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';
import { ADMIN_ACCESS_CODE } from '../utils/adminPinSession';

// Export admin query key for use in Header
export const ADMIN_QUERY_KEY = ['isAdmin'] as const;

// Admin Check - Never throws, returns false for non-admin or errors
export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ADMIN_QUERY_KEY,
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isCallerAdmin();
      } catch (error) {
        // Silently return false for any authorization errors
        // This prevents error toasts for non-admin users
        return false;
      }
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    retry: false, // Don't retry on failure
  });
}

// Comment List IDs
export function useGetCommentListIds() {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['commentListIds'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCommentListIds();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });
}

// Remaining Count
export function useGetRemainingCount(listId: CommentListId | null) {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['remainingCount', listId],
    queryFn: async () => {
      if (!actor || !listId) return BigInt(0);
      return actor.getRemainingCount(listId);
    },
    enabled: !!actor && !isFetching && !!listId,
    refetchInterval: 3000,
  });
}

// NOTE: useGetUserCommentHistory and useGenerateComment have been replaced
// by device-scoped versions in useDeviceScopedUserCommentHistory.ts and
// useDeviceScopedGenerateComment.ts to support per-device history tracking.

// Generate Bulk Comments - Now requires bulk generator key
export function useGenerateBulkComments() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, count, bulkGeneratorKey }: { listId: CommentListId; count: number; bulkGeneratorKey: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.generateBulkComments(bulkGeneratorKey, listId, BigInt(count));
    },
    onSuccess: (comments, variables) => {
      if (comments && comments.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['remainingCount', variables.listId] });
        queryClient.invalidateQueries({ queryKey: ['availableComments', variables.listId] });
        queryClient.invalidateQueries({ queryKey: ['commentList', variables.listId] });
        queryClient.invalidateQueries({ queryKey: ['bulkGenerationLog'] });
        toast.success(`Generated ${comments.length} comments successfully`);
      } else {
        toast.error('No comments available in this list');
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate bulk comments: ${error.message}`);
    },
  });
}

// Admin: Get Bulk Generator Key
export function useGetBulkGeneratorKey(masked: boolean = true) {
  const { actor, isFetching } = useActor();

  return useQuery<string | null>({
    queryKey: ['bulkGeneratorKey', masked],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getBulkGeneratorKey(ADMIN_ACCESS_CODE, masked);
    },
    enabled: !!actor && !isFetching,
  });
}

// Admin: Set Bulk Generator Key
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
      toast.success('Bulk Generator access key updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to set access key: ${error.message}`);
    },
  });
}

// Admin: Reset Bulk Generator Key
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
      toast.success('Bulk Generator access key reset successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to reset access key: ${error.message}`);
    },
  });
}

// Admin: Get Comment List
export function useGetCommentList(listId: CommentListId | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Comment[]>({
    queryKey: ['commentList', listId],
    queryFn: async () => {
      if (!actor || !listId) return [];
      return actor.getCommentList(ADMIN_ACCESS_CODE, listId);
    },
    enabled: !!actor && !isFetching && !!listId,
  });
}

// Admin: Create Comment List
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
      toast.success('Comment list created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create list: ${error.message}`);
    },
  });
}

// Add Comment
export function useAddComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, id, content }: { listId: CommentListId; id: string; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addComment(listId, id, content);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['commentList', variables.listId] });
      queryClient.invalidateQueries({ queryKey: ['remainingCount', variables.listId] });
      queryClient.invalidateQueries({ queryKey: ['commentListIds'] });
      queryClient.invalidateQueries({ queryKey: ['bulkCommentTotals'] });
      toast.success('Comment added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add comment: ${error.message}`);
    },
  });
}

// Admin: Remove Comment
export function useRemoveComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, commentId }: { listId: CommentListId; commentId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeComment(ADMIN_ACCESS_CODE, listId, commentId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['commentList', variables.listId] });
      queryClient.invalidateQueries({ queryKey: ['remainingCount', variables.listId] });
      queryClient.invalidateQueries({ queryKey: ['bulkCommentTotals'] });
      toast.success('Comment removed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove comment: ${error.message}`);
    },
  });
}

// Admin: Reset Comment List
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
    onError: (error: Error) => {
      toast.error(`Failed to reset list: ${error.message}`);
    },
  });
}

// Admin: Delete Comment List
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
      queryClient.invalidateQueries({ queryKey: ['bulkCommentTotals'] });
      toast.success('Comment list deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete list: ${error.message}`);
    },
  });
}

// Admin: Clear All Comment Lists
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
      queryClient.invalidateQueries({ queryKey: ['bulkCommentTotals'] });
      toast.success('All comment lists cleared');
    },
    onError: (error: Error) => {
      toast.error(`Failed to clear lists: ${error.message}`);
    },
  });
}

// Admin: Get All Bulk Comment Totals
export function useGetAllBulkCommentTotals() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[CommentListId, bigint]>>({
    queryKey: ['bulkCommentTotals'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllBulkCommentTotals(ADMIN_ACCESS_CODE);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });
}

// Rating Image Upload
export function useUploadRatingImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (imageBlob: ExternalBlob) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadRatingImage(imageBlob);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratingImages'] });
      toast.success('Rating image uploaded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload image: ${error.message}`);
    },
  });
}

// Admin: Get All Rating Images
export function useGetAllRatingImages() {
  const { actor, isFetching } = useActor();

  return useQuery<RatingImageMetadata[]>({
    queryKey: ['ratingImages'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllRatingImages(ADMIN_ACCESS_CODE);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });
}

// Admin: Remove Rating Image
export function useRemoveRatingImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (imageId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeRatingImage(ADMIN_ACCESS_CODE, imageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratingImages'] });
      toast.success('Rating image removed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove image: ${error.message}`);
    },
  });
}

// Admin: Remove All Rating Images
export function useRemoveAllRatingImages() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeAllRatingImages(ADMIN_ACCESS_CODE);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ratingImages'] });
      toast.success('All rating images removed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove all images: ${error.message}`);
    },
  });
}

// Chat/Message Functions

// User: Get Messages (conversation history)
export function useGetMessages() {
  const { actor, isFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ['messages'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMessages();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 3000, // Poll every 3 seconds for new messages
  });
}

// User: Send Message
export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendMessage(content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['adminMessages'] });
      toast.success('Message sent successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to send message: ${error.message}`);
    },
  });
}

// Admin: Get All Messages
export function useGetAllMessages() {
  const { actor, isFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ['adminMessages'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMessages(ADMIN_ACCESS_CODE);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 3000, // Poll every 3 seconds for new messages
  });
}

// Admin: Reply to Message
export function useReplyMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (replyContent: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.replyMessage(ADMIN_ACCESS_CODE, replyContent);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMessages'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast.success('Reply sent successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to send reply: ${error.message}`);
    },
  });
}
