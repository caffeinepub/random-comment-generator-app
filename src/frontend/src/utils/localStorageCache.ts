import type { AppEvent } from '../backend';

const CACHE_VERSION = '1';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
}

function getCacheKey(key: string): string {
  return `cache_${key}_v${CACHE_VERSION}`;
}

function isCacheValid<T>(entry: CacheEntry<T> | null): boolean {
  if (!entry) return false;
  if (entry.version !== CACHE_VERSION) return false;
  const now = Date.now();
  return now - entry.timestamp < CACHE_TTL;
}

function saveToCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };
    localStorage.setItem(getCacheKey(key), JSON.stringify(entry));
  } catch (error) {
    console.error('Failed to save to cache:', error);
  }
}

function loadFromCache<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(getCacheKey(key));
    if (!cached) return null;
    
    const entry: CacheEntry<T> = JSON.parse(cached);
    if (!isCacheValid(entry)) {
      localStorage.removeItem(getCacheKey(key));
      return null;
    }
    
    return entry.data;
  } catch (error) {
    console.error('Failed to load from cache:', error);
    return null;
  }
}

export function saveCachedAppEvents(data: AppEvent[]): void {
  saveToCache('appEvents', data);
}

export function loadCachedAppEvents(): AppEvent[] | null {
  return loadFromCache<AppEvent[]>('appEvents');
}

export function clearAllCache(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
}
