// Placeholder for local storage cache
// Not used in simplified backend

type AppEvent = { id: string; name: string; usernames: string[] };

export function loadAppEventsCache(): AppEvent[] {
  return [];
}

export function saveAppEventsCache(events: AppEvent[]): void {
  // No-op
}

export function clearAppEventsCache(): void {
  // No-op
}
