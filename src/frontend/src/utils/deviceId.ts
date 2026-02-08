/**
 * Device ID utility for per-device history tracking.
 * Generates and persists a unique device identifier in localStorage.
 * The ID is independent of the authenticated principal and resets when storage is cleared.
 */

const DEVICE_ID_KEY = 'caffeine_device_id';

/**
 * Generate a new cryptographically-random device identifier
 */
function generateDeviceId(): string {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback: generate random hex string using crypto.getRandomValues
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get or create the device identifier.
 * Returns the stored deviceId from localStorage, or generates a new one if missing.
 */
export function getDeviceId(): string {
  try {
    // Try to read from localStorage
    const stored = localStorage.getItem(DEVICE_ID_KEY);
    if (stored) {
      return stored;
    }
    
    // Generate new ID if not found
    const newId = generateDeviceId();
    localStorage.setItem(DEVICE_ID_KEY, newId);
    return newId;
  } catch (error) {
    // If localStorage is not available, generate a session-only ID
    console.warn('localStorage not available, using session-only device ID');
    return generateDeviceId();
  }
}

/**
 * Clear the device identifier (for testing purposes only)
 */
export function clearDeviceId(): void {
  try {
    localStorage.removeItem(DEVICE_ID_KEY);
  } catch (error) {
    console.warn('Failed to clear device ID from localStorage');
  }
}
