import { useMemo } from 'react';
import { getDeviceId } from '../utils/deviceId';

/**
 * React hook that exposes the current device identifier.
 * The deviceId is stable across renders and persists in localStorage.
 */
export function useDeviceId(): string {
  const deviceId = useMemo(() => getDeviceId(), []);
  return deviceId;
}
