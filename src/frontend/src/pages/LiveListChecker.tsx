import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useGetAppEventIds, useCheckUsernames } from '../hooks/useLiveListQueries';
import { Checkbox } from '@/components/ui/checkbox';

export default function LiveListChecker() {
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([]);
  const [usernamesText, setUsernamesText] = useState('');
  const [results, setResults] = useState<Array<{ appName: string; username: string; found: boolean }>>([]);

  const { data: appEvents = [], isLoading: appsLoading } = useGetAppEventIds();
  const { mutate: checkUsernames, isPending: isChecking } = useCheckUsernames();

  const handleAppToggle = (appId: string) => {
    setSelectedAppIds((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  };

  const handleRunCheck = () => {
    if (selectedAppIds.length === 0) {
      toast.error('Please select at least one app/event');
      return;
    }

    if (!usernamesText.trim()) {
      toast.error('Please enter at least one username');
      return;
    }

    // Parse usernames (comma-separated or newline-separated)
    const usernames = usernamesText
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (usernames.length === 0) {
      toast.error('Please enter valid usernames');
      return;
    }

    // Check each app/event
    const allResults: Array<{ appName: string; username: string; found: boolean }> = [];
    let completed = 0;

    selectedAppIds.forEach((appId) => {
      const appName = appEvents.find(([id]) => id === appId)?.[1] || appId;

      checkUsernames(
        { appEventId: appId, usernames },
        {
          onSuccess: (checkResults) => {
            checkResults.forEach(([username, found]) => {
              allResults.push({ appName, username, found });
            });

            completed++;
            if (completed === selectedAppIds.length) {
              setResults(allResults);
              toast.success('Check completed!');
            }
          },
          onError: () => {
            completed++;
            if (completed === selectedAppIds.length) {
              setResults(allResults);
            }
          },
        }
      );
    });
  };

  const handleReset = () => {
    setResults([]);
    setUsernamesText('');
    setSelectedAppIds([]);
  };

  if (appsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 animate-fade-slide-in">
      <div className="text-center space-y-3">
        <h2 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-teal-600 to-orange-600 bg-clip-text text-transparent leading-tight">
          Live List Checker
        </h2>
        <p className="text-muted-foreground text-lg">
          Check if usernames exist in tracked apps/events
        </p>
      </div>

      <Card className="border-2 border-blue-200/50 dark:border-blue-800/50 rounded-3xl overflow-hidden shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <CardHeader className="relative bg-gradient-to-r from-blue-500/10 via-teal-500/10 to-orange-500/10">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center shadow-lg">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            Select Apps/Events to Check
          </CardTitle>
          <CardDescription className="text-base">
            Choose which apps or events to search
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 relative pt-6">
          {appEvents.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/20 to-teal-500/20 flex items-center justify-center mx-auto">
                <CheckSquare className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-lg font-semibold mb-2">No apps available</p>
                <p className="text-muted-foreground">Contact admin to add apps.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {appEvents.map(([appId, appName]) => (
                <div
                  key={appId}
                  className="flex items-center space-x-3 p-4 rounded-2xl border-2 border-blue-200/50 dark:border-blue-800/50 hover:border-blue-400 dark:hover:border-blue-600 transition-colors bg-white/50 dark:bg-gray-900/50"
                >
                  <Checkbox
                    id={appId}
                    checked={selectedAppIds.includes(appId)}
                    onCheckedChange={() => handleAppToggle(appId)}
                    className="h-5 w-5"
                  />
                  <Label
                    htmlFor={appId}
                    className="text-base font-semibold cursor-pointer flex-1"
                  >
                    {appName}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-2 border-blue-200/50 dark:border-blue-800/50 rounded-3xl overflow-hidden shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <CardHeader className="relative bg-gradient-to-r from-blue-500/10 via-teal-500/10 to-orange-500/10">
          <CardTitle className="text-2xl">Enter Usernames to Check</CardTitle>
          <CardDescription className="text-base">
            Enter usernames separated by commas or new lines
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 relative pt-6">
          <div className="space-y-2">
            <Label htmlFor="usernames" className="text-sm font-semibold">
              Usernames
            </Label>
            <Textarea
              id="usernames"
              value={usernamesText}
              onChange={(e) => setUsernamesText(e.target.value)}
              placeholder="user1, user2, user3&#10;or one per line..."
              rows={6}
              className="rounded-2xl border-2 text-base resize-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleRunCheck}
              disabled={isChecking || selectedAppIds.length === 0 || !usernamesText.trim()}
              className="flex-1 h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              size="lg"
            >
              {isChecking ? (
                <>
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Checking...
                </>
              ) : (
                <>
                  <CheckSquare className="w-6 h-6 mr-2" />
                  Run Check
                </>
              )}
            </Button>

            {results.length > 0 && (
              <Button
                onClick={handleReset}
                variant="outline"
                className="h-14 px-6 rounded-2xl border-2 font-bold"
                size="lg"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card className="border-2 border-blue-200/50 dark:border-blue-800/50 rounded-3xl overflow-hidden shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm animate-fade-slide-in">
          <CardHeader className="relative bg-gradient-to-r from-blue-500/10 via-teal-500/10 to-orange-500/10">
            <CardTitle className="text-2xl">Results</CardTitle>
            <CardDescription className="text-base">
              Username verification results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 relative pt-6">
            {results.map((result, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-2xl border-2 border-blue-200/50 dark:border-blue-800/50 bg-white/50 dark:bg-gray-900/50"
              >
                <div className="flex items-center gap-3 flex-1">
                  {result.found ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 shrink-0" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-base">{result.username}</p>
                    <p className="text-sm text-muted-foreground">{result.appName}</p>
                  </div>
                </div>
                <Badge
                  variant={result.found ? 'default' : 'destructive'}
                  className={`text-sm px-4 py-1 rounded-xl font-bold ${
                    result.found
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  {result.found ? '✓ Found' : '✗ Not Found'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
