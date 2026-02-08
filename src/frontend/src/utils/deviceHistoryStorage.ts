/**
 * Local storage utilities for mirroring device-scoped comment history.
 * Each deviceId has its own history stored separately in localStorage.
 */

import type { CommentListId } from '../backend';

const HISTORY_KEY_PREFIX = 'caffeine_device_history_';

export type DeviceHistory = Record<CommentListId, boolean>;

/**
 * Get the localStorage key for a specific device's history
 */
function getHistoryKey(deviceId: string): string {
  return `${HISTORY_KEY_PREFIX}${deviceId}`;
}

/**
 * Load the mirrored history for a specific device from localStorage
 */
export function loadDeviceHistory(deviceId: string): DeviceHistory {
  try {
    const key = getHistoryKey(deviceId);
    const stored = localStorage.getItem(key);
    if (!stored) {
      return {};
    }
    return JSON.parse(stored) as DeviceHistory;
  } catch (error) {
    console.warn('Failed to load device history from localStorage', error);
    return {};
  }
}

/**
 * Save the mirrored history for a specific device to localStorage
 */
export function saveDeviceHistory(deviceId: string, history: DeviceHistory): void {
  try {
    const key = getHistoryKey(deviceId);
    localStorage.setItem(key, JSON.stringify(history));
  } catch (error) {
    console.warn('Failed to save device history to localStorage', error);
  }
}

/**
 * Update a single listId entry in the device's mirrored history
 */
export function updateDeviceHistoryEntry(deviceId: string, listId: CommentListId, hasGenerated: boolean): void {
  const history = loadDeviceHistory(deviceId);
  history[listId] = hasGenerated;
  saveDeviceHistory(deviceId, history);
}

/**
 * Clear all mirrored history for a specific device
 */
export function clearDeviceHistory(deviceId: string): void {
  try {
    const key = getHistoryKey(deviceId);
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to clear device history from localStorage', error);
  }
}
