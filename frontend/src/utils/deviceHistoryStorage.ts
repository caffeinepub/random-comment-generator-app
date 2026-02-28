// Placeholder for device history storage
// Not used in simplified backend

type CommentListId = string;

export function loadDeviceHistory(deviceId: string): Map<CommentListId, boolean> {
  return new Map();
}

export function saveDeviceHistory(deviceId: string, history: Map<CommentListId, boolean>): void {
  // No-op
}

export function updateDeviceHistory(deviceId: string, listId: CommentListId, generated: boolean): void {
  // No-op
}

export function clearDeviceHistory(deviceId: string): void {
  // No-op
}
