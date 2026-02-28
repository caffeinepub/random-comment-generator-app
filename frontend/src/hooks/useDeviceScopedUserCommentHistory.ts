// Real localStorage-based device comment history hooks

export function useCheckDeviceCommentHistory(listId: string | null): boolean {
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
