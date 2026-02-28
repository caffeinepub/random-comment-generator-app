import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';

// ─── Comment Lists (localStorage-based) ───────────────────────────────────────

export interface CommentList {
  id: string;
  name: string;
  locked: boolean;
  comments: string[];
}

const LISTS_KEY = 'comment_lists';

function loadLists(): CommentList[] {
  try {
    const raw = localStorage.getItem(LISTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLists(lists: CommentList[]) {
  localStorage.setItem(LISTS_KEY, JSON.stringify(lists));
}

export function useGetCommentLists() {
  return useQuery<CommentList[]>({
    queryKey: ['commentLists'],
    queryFn: () => loadLists(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCommentList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const lists = loadLists();
      const newList: CommentList = {
        id: `list_${Date.now()}`,
        name,
        locked: false,
        comments: [],
      };
      saveLists([...lists, newList]);
      return newList;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentLists'] });
    },
  });
}

export function useDeleteCommentList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (listId: string) => {
      const lists = loadLists();
      saveLists(lists.filter(l => l.id !== listId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentLists'] });
      queryClient.invalidateQueries({ queryKey: ['commentStats'] });
    },
  });
}

export function useLockCommentList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ listId, locked }: { listId: string; locked: boolean }) => {
      const lists = loadLists();
      saveLists(lists.map(l => l.id === listId ? { ...l, locked } : l));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentLists'] });
    },
  });
}

export function useAddCommentsToList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ listId, newComments }: { listId: string; newComments: string[] }) => {
      const lists = loadLists();
      saveLists(lists.map(l =>
        l.id === listId ? { ...l, comments: [...l.comments, ...newComments] } : l
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentLists'] });
      queryClient.invalidateQueries({ queryKey: ['commentStats'] });
    },
  });
}

export function useDeleteCommentFromList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ listId, commentIndex }: { listId: string; commentIndex: number }) => {
      const lists = loadLists();
      saveLists(lists.map(l =>
        l.id === listId
          ? { ...l, comments: l.comments.filter((_, i) => i !== commentIndex) }
          : l
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentLists'] });
      queryClient.invalidateQueries({ queryKey: ['commentStats'] });
    },
  });
}

// ─── Comment Stats (per-list, localStorage-based) ─────────────────────────────

export function useCommentStats(listId: string | null) {
  return useQuery({
    queryKey: ['commentStats', listId],
    queryFn: () => {
      if (!listId) return { total: 0, used: 0, remaining: 0 };
      const lists = loadLists();
      const list = lists.find(l => l.id === listId);
      if (!list) return { total: 0, used: 0, remaining: 0 };
      const total = list.comments.length;
      // Track used comments via localStorage key per list
      const usedKey = `used_comments_${listId}`;
      let usedCount = 0;
      try {
        const raw = localStorage.getItem(usedKey);
        usedCount = raw ? JSON.parse(raw).length : 0;
      } catch {
        usedCount = 0;
      }
      const remaining = Math.max(0, total - usedCount);
      return { total, used: usedCount, remaining };
    },
    enabled: !!listId,
    staleTime: 0,
  });
}

// ─── Single Comment Generation (device-scoped, localStorage) ──────────────────

export function useGetNextCommentForDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (listId: string) => {
      const deviceKey = `device_comment_${listId}`;
      const cached = localStorage.getItem(deviceKey);
      if (cached) {
        return { comment: cached, alreadyHad: true };
      }

      const lists = loadLists();
      const list = lists.find(l => l.id === listId);
      if (!list || list.comments.length === 0) {
        throw new Error('No comments available in this list');
      }

      const usedKey = `used_comments_${listId}`;
      let usedIndices: number[] = [];
      try {
        const raw = localStorage.getItem(usedKey);
        usedIndices = raw ? JSON.parse(raw) : [];
      } catch {
        usedIndices = [];
      }

      const availableIndices = list.comments
        .map((_, i) => i)
        .filter(i => !usedIndices.includes(i));

      if (availableIndices.length === 0) {
        throw new Error('No unused comments available. All comments have been used.');
      }

      const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      const comment = list.comments[randomIndex];

      // Mark as used
      const newUsed = [...usedIndices, randomIndex];
      localStorage.setItem(usedKey, JSON.stringify(newUsed));
      localStorage.setItem(deviceKey, comment);

      return { comment, alreadyHad: false };
    },
    onSuccess: (_, listId) => {
      queryClient.invalidateQueries({ queryKey: ['commentStats', listId] });
    },
  });
}

export function useCheckDeviceHasComment(listId: string | null): boolean {
  if (!listId) return false;
  try {
    return !!localStorage.getItem(`device_comment_${listId}`);
  } catch {
    return false;
  }
}

export function useGetDeviceComment(listId: string | null): string | null {
  if (!listId) return null;
  try {
    return localStorage.getItem(`device_comment_${listId}`);
  } catch {
    return null;
  }
}

// ─── Bulk Comment Generation (backend AI) ─────────────────────────────────────

export function useGenerateAiComments() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async ({ count, length }: { count: number; length: number }) => {
      if (!actor) throw new Error('Actor not available');
      const results = await actor.generateAiComments(BigInt(count), BigInt(length));
      return results.map(([, content]) => content);
    },
  });
}

// ─── Backend Bulk Comments (admin upload) ─────────────────────────────────────

export function useAddBulkCommentsToBackend() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (commentsArray: string[]) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addBulkComments(commentsArray);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backendComments'] });
      queryClient.invalidateQueries({ queryKey: ['commentStats'] });
    },
  });
}

// ─── Backend Comment Stats ─────────────────────────────────────────────────────

export function useBackendCommentStats() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['backendCommentStats'],
    queryFn: async () => {
      if (!actor) return { total: 0, used: 0, remaining: 0 };
      const [total, used, remaining] = await actor.getCommentStats();
      return {
        total: Number(total),
        used: Number(used),
        remaining: Number(remaining),
      };
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
  });
}

// ─── Access Key (localStorage-based display, backend validateAccessKey for verify) ───

export function useGetAccessKey() {
  // Store the key locally so admin can see what was last saved.
  return useQuery({
    queryKey: ['accessKey'],
    queryFn: () => {
      try {
        return localStorage.getItem('admin_access_key') ?? '';
      } catch {
        return '';
      }
    },
    staleTime: 0,
  });
}

export function useSetAccessKey() {
  // The backend no longer has a setAccessKey method.
  // We store the key in localStorage only (for admin display purposes).
  // The actual validation is done via actor.validateAccessKey in useVerifyAccessKey.
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => {
      try {
        localStorage.setItem('admin_access_key', key);
      } catch {
        throw new Error('Failed to save access key locally');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accessKey'] });
    },
  });
}

export function useVerifyAccessKey() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (key: string) => {
      if (!actor) throw new Error('Actor not available');
      // Use the backend's validateAccessKey method
      return actor.validateAccessKey(key);
    },
  });
}

// ─── Images ───────────────────────────────────────────────────────────────────

export function useGetImages() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['images'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getImages();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUploadImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      if (!actor) throw new Error('Actor not available');
      const { ExternalBlob } = await import('../backend');
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(bytes);
      return actor.uploadImage(blob);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images'] });
    },
  });
}

// ─── Live Rating List ─────────────────────────────────────────────────────────

export function useGetLiveRatingList() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['liveRatingList'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLiveRatingListEntries();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
  });
}
