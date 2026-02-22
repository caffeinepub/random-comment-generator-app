import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckSquare, Search } from 'lucide-react';
import { useGetAppEventIds, useCheckUsernames } from '../hooks/useLiveListQueries';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function LiveListChecker() {
  const [selectedAppEventId, setSelectedAppEventId] = useState<string | null>(null);
  const [usernamesToCheck, setUsernamesToCheck] = useState('');
  const [checkResults, setCheckResults] = useState<Array<[string, boolean]>>([]);
  const queryClient = useQueryClient();

  const { data: appEventIds = [], isLoading: appEventIdsLoading } = useGetAppEventIds();
  const { mutate: checkUsernames, isPending: isChecking } = useCheckUsernames();

  // Prefetch app event IDs on mount for instant loading
  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ['appEventIds'],
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);

  const handleCheck = () => {
    if (!selectedAppEventId) {
      toast.error('Please select an app/event');
      return;
    }

    if (!usernamesToCheck.trim()) {
      toast.error('Please enter usernames to check');
      return;
    }

    const usernames = usernamesToCheck
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u);

    checkUsernames(
      { appEventId: selectedAppEventId, usernames },
      {
        onSuccess: (results) => {
          setCheckResults(results);
          toast.success('Username check completed');
        },
      }
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-4 animate-fade-slide-in">
      <div className="text-center space-y-3">
        <h2 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-teal-600 to-orange-600 bg-clip-text text-transparent leading-tight">
          Live List Checker
        </h2>
        <p className="text-muted-foreground text-lg">
          Check if usernames exist in app/event lists
        </p>
      </div>

      <Card className="border-2 border-blue-200/50 dark:border-blue-800/50 rounded-3xl overflow-hidden shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <CardHeader className="relative bg-gradient-to-r from-blue-500/10 via-teal-500/10 to-orange-500/10">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center shadow-lg">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            Username Checker
          </CardTitle>
          <CardDescription className="text-base">
            Select an app/event and enter usernames to check
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label htmlFor="appEventSelect" className="text-sm font-semibold">
              Select App/Event
            </Label>
            {appEventIdsLoading ? (
              <div className="w-full h-12 rounded-2xl border-2 px-4 bg-background flex items-center">
                <div className="w-5 h-5 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mr-2" />
                <span className="text-muted-foreground">Loading apps/events...</span>
              </div>
            ) : (
              <select
                id="appEventSelect"
                value={selectedAppEventId || ''}
                onChange={(e) => {
                  setSelectedAppEventId(e.target.value || null);
                  setCheckResults([]);
                }}
                className="w-full h-12 text-base rounded-2xl border-2 px-4 bg-background"
              >
                <option value="">Choose an app/event...</option>
                {appEventIds.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="usernamesInput" className="text-sm font-semibold">
              Usernames to Check (one per line)
            </Label>
            <Textarea
              id="usernamesInput"
              value={usernamesToCheck}
              onChange={(e) => setUsernamesToCheck(e.target.value)}
              placeholder="Enter usernames, one per line..."
              rows={8}
              className="rounded-2xl border-2 text-base resize-none"
            />
          </div>

          <Button
            onClick={handleCheck}
            disabled={!selectedAppEventId || !usernamesToCheck.trim() || isChecking}
            className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {isChecking ? (
              <>
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Checking...
              </>
            ) : (
              <>
                <Search className="w-6 h-6 mr-2" />
                Check Usernames
              </>
            )}
          </Button>

          {checkResults.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Check Results</Label>
              <div className="rounded-2xl border-2 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-50/50 dark:bg-blue-950/50">
                      <TableHead className="font-bold">Username</TableHead>
                      <TableHead className="font-bold text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {checkResults.map(([username, exists]) => (
                      <TableRow key={username}>
                        <TableCell className="font-medium">{username}</TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={exists ? 'default' : 'secondary'}
                            className={`rounded-xl font-semibold ${
                              exists
                                ? 'bg-green-500 hover:bg-green-600 text-white'
                                : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                          >
                            {exists ? '✓ Found' : '✗ Not Found'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
