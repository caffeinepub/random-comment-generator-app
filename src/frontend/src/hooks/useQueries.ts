import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { toast } from 'sonner';
import type { Comment, CommentListId, CommentId, RatingImageMetadata, Message, MessageId } from '../backend';
import { ExternalBlob } from '../backend';
import { ADMIN_ACCESS_CODE } from '../utils/adminPinSession';
import type { ClaimRecord, ClaimId, LiveListSettings, LiveListTotals, ContactInfo, LiveListCheckerBackend } from '../types/liveListChecker';

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
      toast.error(error?.message || 'Failed to create comment list');
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
    onSuccess: (_, { listId }) => {
      queryClient.invalidateQueries({ queryKey: ['commentList', listId] });
      queryClient.invalidateQueries({ queryKey: ['remainingCount', listId] });
      queryClient.invalidateQueries({ queryKey: ['allBulkCommentTotals'] });
      toast.success('Comment added successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to add comment');
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
    onSuccess: (_, { listId }) => {
      queryClient.invalidateQueries({ queryKey: ['commentList', listId] });
      queryClient.invalidateQueries({ queryKey: ['remainingCount', listId] });
      queryClient.invalidateQueries({ queryKey: ['allBulkCommentTotals'] });
      toast.success('Comment removed successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to remove comment');
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
      toast.error(error?.message || 'Failed to reset comment list');
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
      queryClient.invalidateQueries({ queryKey: ['allBulkCommentTotals'] });
      queryClient.invalidateQueries({ queryKey: ['lockedCommentListIds'] });
      toast.success('Comment list deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete comment list');
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
      queryClient.invalidateQueries({ queryKey: ['allBulkCommentTotals'] });
      queryClient.invalidateQueries({ queryKey: ['lockedCommentListIds'] });
      toast.success('All comment lists cleared successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to clear comment lists');
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
    onSuccess: (comments, { listId }) => {
      queryClient.invalidateQueries({ queryKey: ['remainingCount', listId] });
      queryClient.invalidateQueries({ queryKey: ['commentList', listId] });
      toast.success(`Generated ${comments.length} comment(s) successfully`);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to generate comments');
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
      toast.success('Comment list locked successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to lock comment list');
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
      toast.success('Comment list unlocked successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to unlock comment list');
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
      queryClient.invalidateQueries({ queryKey: ['totalUserRatingCount'] });
      toast.success('Rating image uploaded successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to upload rating image');
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
    staleTime: 30000,
  });
}

export function useGetTotalUserRatingCount() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['totalUserRatingCount'],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getTotalUserRatingCount(ADMIN_ACCESS_CODE);
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
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
      queryClient.invalidateQueries({ queryKey: ['totalUserRatingCount'] });
      toast.success('Rating image removed successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to remove rating image');
    },
  });
}

export function useRemoveAllUserRatingImages() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeAllUserRatingImages(ADMIN_ACCESS_CODE);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUserRatingImages'] });
      queryClient.invalidateQueries({ queryKey: ['totalUserRatingCount'] });
      toast.success('All rating images removed successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to remove all rating images');
    },
  });
}

export function useGetBulkGeneratorKey(masked: boolean = true) {
  const { actor, isFetching } = useActor();

  return useQuery<string | null>({
    queryKey: ['bulkGeneratorKey', masked],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getBulkGeneratorKey(ADMIN_ACCESS_CODE, masked);
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
      toast.success('Bulk generator key updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update bulk generator key');
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
      toast.error(error?.message || 'Failed to reset bulk generator key');
    },
  });
}

export function useGetAllMessages() {
  const { actor, isFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ['allMessages'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMessages(ADMIN_ACCESS_CODE);
    },
    enabled: !!actor && !isFetching,
    staleTime: 5000,
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
      toast.success('Reply sent successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to send reply');
    },
  });
}

// ==================== Live List Checker Hooks ====================

export function useUploadNameList() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (names: string[]) => {
      if (!actor) throw new Error('Actor not available');
      const extendedActor = actor as any as LiveListCheckerBackend;
      return extendedActor.uploadNameList(ADMIN_ACCESS_CODE, names);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeNameList'] });
      queryClient.invalidateQueries({ queryKey: ['liveListTotals'] });
      toast.success('Name list uploaded successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to upload name list');
    },
  });
}

export function useGetActiveNameList() {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['activeNameList'],
    queryFn: async () => {
      if (!actor) return [];
      const extendedActor = actor as any as LiveListCheckerBackend;
      return extendedActor.getActiveNameList();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
  });
}

export function useCheckNameAvailability(name: string) {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['nameAvailability', name],
    queryFn: async () => {
      if (!actor || !name) return false;
      const extendedActor = actor as any as LiveListCheckerBackend;
      return extendedActor.checkNameAvailability(name);
    },
    enabled: !!actor && !isFetching && !!name,
    staleTime: 10000,
  });
}

export function useCreateClaim() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, upiId }: { name: string; upiId: string }) => {
      if (!actor) throw new Error('Actor not available');
      const extendedActor = actor as any as LiveListCheckerBackend;
      return extendedActor.createClaim(name, upiId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claimStatus'] });
      queryClient.invalidateQueries({ queryKey: ['nameAvailability'] });
      queryClient.invalidateQueries({ queryKey: ['allClaims'] });
      queryClient.invalidateQueries({ queryKey: ['liveListTotals'] });
      toast.success('Claim submitted successfully');
    },
    onError: (error: any) => {
      const message = error?.message || 'Failed to create claim';
      if (message.includes('already claimed') || message.includes('already taken')) {
        toast.error('This name has already been claimed');
      } else if (message.includes('limit')) {
        toast.error('Claim limit reached');
      } else {
        toast.error(message);
      }
    },
  });
}

export function useGetClaimStatus(name: string) {
  const { actor, isFetching } = useActor();

  return useQuery<ClaimRecord | null>({
    queryKey: ['claimStatus', name],
    queryFn: async () => {
      if (!actor || !name) return null;
      const extendedActor = actor as any as LiveListCheckerBackend;
      return extendedActor.getClaimStatus(name);
    },
    enabled: !!actor && !isFetching && !!name,
    staleTime: 10000,
  });
}

export function useGetAllClaims() {
  const { actor, isFetching } = useActor();

  return useQuery<ClaimRecord[]>({
    queryKey: ['allClaims'],
    queryFn: async () => {
      if (!actor) return [];
      const extendedActor = actor as any as LiveListCheckerBackend;
      return extendedActor.getAllClaims(ADMIN_ACCESS_CODE);
    },
    enabled: !!actor && !isFetching,
    staleTime: 15000,
  });
}

export function useApproveClaim() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (claimId: ClaimId) => {
      if (!actor) throw new Error('Actor not available');
      const extendedActor = actor as any as LiveListCheckerBackend;
      return extendedActor.approveClaim(ADMIN_ACCESS_CODE, claimId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allClaims'] });
      queryClient.invalidateQueries({ queryKey: ['liveListTotals'] });
      queryClient.invalidateQueries({ queryKey: ['claimStatus'] });
      toast.success('Claim approved successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to approve claim');
    },
  });
}

export function useRejectClaim() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (claimId: ClaimId) => {
      if (!actor) throw new Error('Actor not available');
      const extendedActor = actor as any as LiveListCheckerBackend;
      return extendedActor.rejectClaim(ADMIN_ACCESS_CODE, claimId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allClaims'] });
      queryClient.invalidateQueries({ queryKey: ['liveListTotals'] });
      queryClient.invalidateQueries({ queryKey: ['claimStatus'] });
      toast.success('Claim rejected successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to reject claim');
    },
  });
}

export function useGetLiveListTotals() {
  const { actor, isFetching } = useActor();

  return useQuery<LiveListTotals>({
    queryKey: ['liveListTotals'],
    queryFn: async () => {
      if (!actor) return {
        pendingCount: BigInt(0),
        approvedCount: BigInt(0),
        rejectedCount: BigInt(0),
        pendingTotalAmount: BigInt(0),
        approvedTotalAmount: BigInt(0),
      };
      const extendedActor = actor as any as LiveListCheckerBackend;
      return extendedActor.getLiveListTotals(ADMIN_ACCESS_CODE);
    },
    enabled: !!actor && !isFetching,
    staleTime: 15000,
  });
}

export function useSetLiveListSettings() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: LiveListSettings) => {
      if (!actor) throw new Error('Actor not available');
      const extendedActor = actor as any as LiveListCheckerBackend;
      return extendedActor.setLiveListSettings(ADMIN_ACCESS_CODE, settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liveListSettings'] });
      queryClient.invalidateQueries({ queryKey: ['liveListTotals'] });
      toast.success('Settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update settings');
    },
  });
}

export function useGetLiveListSettings() {
  const { actor, isFetching } = useActor();

  return useQuery<LiveListSettings>({
    queryKey: ['liveListSettings'],
    queryFn: async () => {
      if (!actor) return { maxClaims: BigInt(0), perClaimAmount: BigInt(0) };
      const extendedActor = actor as any as LiveListCheckerBackend;
      return extendedActor.getLiveListSettings(ADMIN_ACCESS_CODE);
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
  });
}

export function useSetContactInfo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (info: ContactInfo) => {
      if (!actor) throw new Error('Actor not available');
      const extendedActor = actor as any as LiveListCheckerBackend;
      return extendedActor.setContactInfo(ADMIN_ACCESS_CODE, info);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contactInfo'] });
      toast.success('Contact info updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update contact info');
    },
  });
}

export function useGetContactInfo() {
  const { actor, isFetching } = useActor();

  return useQuery<ContactInfo>({
    queryKey: ['contactInfo'],
    queryFn: async () => {
      if (!actor) return { whatsappNumber: '', email: '', additionalInfo: '' };
      const extendedActor = actor as any as LiveListCheckerBackend;
      return extendedActor.getContactInfo();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60000,
  });
}
