import React, { useState, useCallback, useMemo } from 'react';
import { CheckSquare, Search, ChevronDown, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetLiveRatingListEntries } from '../hooks/useLiveListQueries';

// Local storage for username lists per app
const APP_USERNAMES_KEY = 'appUsernames';

function getAppUsernames(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(APP_USERNAMES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

interface CheckResult {
  appId: string;
  appName: string;
  username: string;
  found: boolean;
}

export default function LiveListChecker() {
  const [selectedAppIds, setSelectedAppIds] = useState<Set<string>>(new Set());
  const [usernamesText, setUsernamesText] = useState('');
  const [results, setResults] = useState<CheckResult[]>([]);
  const [hasChecked, setHasChecked] = useState(false);

  const { data: entries = [], isLoading } = useGetLiveRatingListEntries();

  const allSelected = useMemo(
    () => entries.length > 0 && selectedAppIds.size === entries.length,
    [entries, selectedAppIds]
  );

  const handleToggleApp = useCallback((id: string) => {
    setSelectedAppIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedAppIds(new Set());
    } else {
      setSelectedAppIds(new Set(entries.map(e => e.id)));
    }
  }, [allSelected, entries]);

  const handleCheck = useCallback(() => {
    const usernames = usernamesText
      .split('\n')
      .map(u => u.trim())
      .filter(Boolean);

    if (usernames.length === 0 || selectedAppIds.size === 0) return;

    const appUsernames = getAppUsernames();
    const newResults: CheckResult[] = [];

    for (const appId of selectedAppIds) {
      const app = entries.find(e => e.id === appId);
      if (!app) continue;
      const usernameList = appUsernames[appId] || [];
      for (const username of usernames) {
        const found = usernameList.some(u => u.toLowerCase() === username.toLowerCase());
        newResults.push({ appId, appName: app.name, username, found });
      }
    }

    setResults(newResults);
    setHasChecked(true);
  }, [usernamesText, selectedAppIds, entries]);

  const groupedResults = useMemo(() => {
    const groups: Record<string, CheckResult[]> = {};
    for (const r of results) {
      if (!groups[r.appId]) groups[r.appId] = [];
      groups[r.appId].push(r);
    }
    return groups;
  }, [results]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
          Live List Checker
        </h1>
        <p className="text-muted-foreground mt-1">Check if usernames exist in app/event lists</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm p-5 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <CheckSquare className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Username Checker</h2>
            <p className="text-xs text-muted-foreground">Select apps/events and enter usernames to check</p>
          </div>
        </div>

        {/* App Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-foreground">Select Apps/Events</label>
            {entries.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="text-xs text-primary hover:text-primary/80 transition-colors"
              >
                {allSelected ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full rounded-lg" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4 border border-white/10 rounded-lg">
              No apps/events available. Ask admin to create some.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {entries.map(entry => (
                <label
                  key={entry.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg border border-white/10 hover:border-white/20 bg-background/40 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={selectedAppIds.has(entry.id)}
                    onCheckedChange={() => handleToggleApp(entry.id)}
                  />
                  <span className="text-sm text-foreground flex-1">{entry.name}</span>
                  {selectedAppIds.has(entry.id) && (
                    <Badge variant="secondary" className="text-xs">Selected</Badge>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Usernames Input */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Usernames to Check (one per line)
          </label>
          <Textarea
            value={usernamesText}
            onChange={e => setUsernamesText(e.target.value)}
            placeholder="Enter usernames, one per line..."
            className="min-h-[100px] bg-background/80 border-white/20 resize-none"
          />
        </div>

        <Button
          onClick={handleCheck}
          disabled={selectedAppIds.size === 0 || !usernamesText.trim()}
          className="w-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white font-semibold"
        >
          <span className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Check Usernames ({selectedAppIds.size} app{selectedAppIds.size !== 1 ? 's' : ''} selected)
          </span>
        </Button>
      </div>

      {/* Results */}
      {hasChecked && results.length > 0 && (
        <div className="space-y-3 animate-fade-in">
          {Object.entries(groupedResults).map(([appId, appResults]) => (
            <div key={appId} className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm p-4">
              <h3 className="font-semibold text-foreground mb-3 text-sm">
                {appResults[0].appName}
                <span className="ml-2 text-xs text-muted-foreground">
                  ({appResults.filter(r => r.found).length}/{appResults.length} found)
                </span>
              </h3>
              <div className="space-y-1.5">
                {appResults.map((r, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                      r.found
                        ? 'bg-green-500/10 border border-green-500/20'
                        : 'bg-red-500/10 border border-red-500/20'
                    }`}
                  >
                    {r.found ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <span className={r.found ? 'text-green-300' : 'text-red-300'}>{r.username}</span>
                    <Badge
                      variant={r.found ? 'default' : 'destructive'}
                      className="ml-auto text-xs"
                    >
                      {r.found ? 'Found' : 'Not Found'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {hasChecked && results.length === 0 && (
        <div className="text-center py-6 text-muted-foreground text-sm">
          No results to display
        </div>
      )}
    </div>
  );
}
