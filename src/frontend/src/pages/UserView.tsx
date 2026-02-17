import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Copy, CheckCircle2, Lock, Unlock, Sparkles, ListChecks } from 'lucide-react';
import { useGetCommentListIds, useGetLockedCommentListIds, useGetRemainingCount } from '../hooks/useQueries';
import { useDeviceId } from '../hooks/useDeviceId';
import { useDeviceScopedGenerateComment } from '../hooks/useDeviceScopedGenerateComment';
import { useHasSingleCommentGenerated } from '../hooks/useDeviceScopedUserCommentHistory';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LiveListCheckerUserSection from '../components/live-list-checker/LiveListCheckerUserSection';

export default function UserView() {
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [generatedComment, setGeneratedComment] = useState<string>('');

  const deviceId = useDeviceId();
  const { data: commentListIds = [], isLoading: loadingListIds } = useGetCommentListIds();
  const { data: lockedListIds = [] } = useGetLockedCommentListIds();
  const { data: remainingCount = BigInt(0), isLoading: loadingRemaining } = useGetRemainingCount(selectedListId);
  const generateCommentMutation = useDeviceScopedGenerateComment();
  const { data: hasGenerated = false } = useHasSingleCommentGenerated(selectedListId);

  const isListLocked = selectedListId ? lockedListIds.includes(selectedListId) : false;
  const canGenerate = selectedListId && !hasGenerated && !isListLocked && Number(remainingCount) > 0;

  const handleGenerateComment = async () => {
    if (!selectedListId) return;

    try {
      const comment = await generateCommentMutation.mutateAsync({ listId: selectedListId });
      if (comment) {
        setGeneratedComment(comment);
        toast.success('Comment generated successfully!');
      } else {
        toast.error('Unable to generate comment. The list may be locked or you have already generated a comment.');
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to generate comment');
    }
  };

  const handleCopyComment = () => {
    if (generatedComment) {
      navigator.clipboard.writeText(generatedComment);
      toast.success('Comment copied to clipboard!');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <Tabs defaultValue="comments" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-14 rounded-xl p-1 bg-accent/50 mb-6">
          <TabsTrigger 
            value="comments" 
            className="text-base font-bold rounded-lg data-[state=active]:gradient-bg data-[state=active]:text-white transition-all duration-300"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Comments
          </TabsTrigger>
          <TabsTrigger 
            value="list-checker" 
            className="text-base font-bold rounded-lg data-[state=active]:gradient-bg data-[state=active]:text-white transition-all duration-300"
          >
            <ListChecks className="w-4 h-4 mr-2" />
            List Checker
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comments" className="space-y-8">
          {/* Single Comment Generator */}
          <Card className="shadow-2xl border-2 border-accent/20 overflow-hidden">
            <div className="gradient-bg-diagonal h-2"></div>
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-extrabold gradient-text">Single Comment Generator</CardTitle>
                  <CardDescription className="text-base mt-1">
                    Generate one comment per list per device
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-foreground">Select Comment List</label>
                <Select value={selectedListId} onValueChange={setSelectedListId} disabled={loadingListIds}>
                  <SelectTrigger className="w-full h-12 text-base border-2 border-accent/30 focus:border-accent transition-colors">
                    <SelectValue placeholder={loadingListIds ? 'Loading lists...' : 'Choose a comment list'} />
                  </SelectTrigger>
                  <SelectContent>
                    {commentListIds.map((listId) => {
                      const isLocked = lockedListIds.includes(listId);
                      return (
                        <SelectItem key={listId} value={listId} disabled={isLocked}>
                          <div className="flex items-center gap-2">
                            {isLocked ? <Lock className="w-4 h-4 text-red-500" /> : <Unlock className="w-4 h-4 text-green-500" />}
                            <span>{listId}</span>
                            {isLocked && <Badge variant="destructive" className="ml-2">Locked</Badge>}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {selectedListId && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-accent/10 border-2 border-accent/20">
                    <span className="text-sm font-semibold text-muted-foreground">Remaining Comments</span>
                    <Badge variant="secondary" className="text-lg font-bold px-4 py-1">
                      {loadingRemaining ? <Loader2 className="w-4 h-4 animate-spin" /> : remainingCount.toString()}
                    </Badge>
                  </div>

                  {isListLocked && (
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                        <Lock className="w-5 h-5" />
                        <span className="font-semibold">This list is currently locked</span>
                      </div>
                    </div>
                  )}

                  {hasGenerated && !isListLocked && (
                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-semibold">You have already generated a comment from this list</span>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleGenerateComment}
                    disabled={!canGenerate || generateCommentMutation.isPending}
                    className="w-full h-14 text-lg font-bold gradient-bg hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50"
                  >
                    {generateCommentMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Generate Comment
                      </>
                    )}
                  </Button>

                  {generatedComment && (
                    <div className="space-y-3 p-6 rounded-xl bg-gradient-to-br from-accent/5 to-accent/10 border-2 border-accent/30">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-muted-foreground">Your Generated Comment</span>
                        <Button
                          onClick={handleCopyComment}
                          variant="outline"
                          size="sm"
                          className="gap-2 border-2 border-accent/30 hover:border-accent"
                        >
                          <Copy className="w-4 h-4" />
                          Copy
                        </Button>
                      </div>
                      <p className="text-base leading-relaxed p-4 rounded-lg bg-background/50 border border-accent/20">
                        {generatedComment}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list-checker">
          <LiveListCheckerUserSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
