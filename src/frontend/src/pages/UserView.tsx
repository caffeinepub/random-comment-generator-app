import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, Sparkles, Lock, Unlock } from 'lucide-react';
import {
  useGetCommentListIds,
  useGetLockedCommentListIds,
  useGetRemainingCount,
} from '../hooks/useQueries';
import { useDeviceId } from '../hooks/useDeviceId';
import { useDeviceScopedGenerateComment } from '../hooks/useDeviceScopedGenerateComment';
import { useHasSingleCommentGenerated } from '../hooks/useDeviceScopedUserCommentHistory';
import { toast } from 'sonner';
import TopDownShooterGame from '../components/TopDownShooterGame';

export default function UserView() {
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [generatedComment, setGeneratedComment] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const deviceId = useDeviceId();
  const { data: listIds = [] } = useGetCommentListIds();
  const { data: lockedListIds = [] } = useGetLockedCommentListIds();
  const { data: remainingCount = 0n } = useGetRemainingCount(selectedListId);
  const { data: hasGenerated = false } = useHasSingleCommentGenerated(selectedListId);
  const { mutate: generateComment, isPending: isGenerating } = useDeviceScopedGenerateComment();

  const lockedListIdsSet = new Set(lockedListIds);
  const isSelectedListLocked = selectedListId ? lockedListIdsSet.has(selectedListId) : false;

  const handleGenerate = () => {
    if (!selectedListId) {
      toast.error('Please select a comment list');
      return;
    }

    if (isSelectedListLocked) {
      toast.error('This comment list is currently locked');
      return;
    }

    if (hasGenerated) {
      toast.error('You have already generated a comment for this list on this device');
      return;
    }

    generateComment(
      { listId: selectedListId },
      {
        onSuccess: (comment) => {
          if (comment) {
            setGeneratedComment(comment);
          }
        },
      }
    );
  };

  const handleCopy = () => {
    if (generatedComment) {
      navigator.clipboard.writeText(generatedComment);
      setCopied(true);
      toast.success('Comment copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-4 animate-fade-slide-in">
      <div className="text-center space-y-3">
        <h2 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-teal-600 to-orange-600 bg-clip-text text-transparent leading-tight">
          Customer View
        </h2>
        <p className="text-muted-foreground text-lg">
          Generate comments and play the mini-game
        </p>
      </div>

      {/* Top-Down Shooter Game */}
      <TopDownShooterGame />

      {/* Single Comment Generator */}
      <Card className="border-2 border-blue-200/50 dark:border-blue-800/50 rounded-3xl overflow-hidden shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <CardHeader className="relative bg-gradient-to-r from-blue-500/10 via-teal-500/10 to-orange-500/10">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            Single Comment Generator
          </CardTitle>
          <CardDescription className="text-base">
            Generate one comment per list per device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 relative pt-6">
          <div className="space-y-2">
            <Label htmlFor="singleListSelect" className="text-sm font-semibold">
              Select Comment List
            </Label>
            <select
              id="singleListSelect"
              value={selectedListId || ''}
              onChange={(e) => {
                setSelectedListId(e.target.value || null);
                setGeneratedComment(null);
              }}
              className="w-full h-12 text-base rounded-2xl border-2 px-4 bg-background"
            >
              <option value="">Choose a list...</option>
              {listIds.map((listId) => (
                <option key={listId} value={listId}>
                  {listId}
                </option>
              ))}
            </select>
          </div>

          {selectedListId && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/50 border-2 border-blue-200/50 dark:border-blue-800/50">
              <div className="flex items-center gap-2">
                {isSelectedListLocked ? (
                  <Lock className="w-5 h-5 text-red-600 dark:text-red-400" />
                ) : (
                  <Unlock className="w-5 h-5 text-green-600 dark:text-green-400" />
                )}
                <span className="text-sm font-semibold">
                  Status:{' '}
                  <span
                    className={
                      isSelectedListLocked
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-green-600 dark:text-green-400'
                    }
                  >
                    {isSelectedListLocked ? 'Locked' : 'Available'}
                  </span>
                </span>
              </div>
              <div className="ml-auto">
                <Badge variant="outline" className="text-sm px-3 py-1 rounded-xl border-2 font-semibold">
                  {Number(remainingCount)} remaining
                </Badge>
              </div>
            </div>
          )}

          {hasGenerated && selectedListId && (
            <div className="p-4 rounded-2xl bg-yellow-50/50 dark:bg-yellow-950/50 border-2 border-yellow-200/50 dark:border-yellow-800/50">
              <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                ⚠️ You have already generated a comment for this list on this device
              </p>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={!selectedListId || isGenerating || isSelectedListLocked || hasGenerated}
            className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            size="lg"
          >
            {isGenerating ? (
              <>
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6 mr-2" />
                Generate Comment
              </>
            )}
          </Button>

          {generatedComment && (
            <div className="space-y-3 p-5 rounded-2xl bg-gradient-to-br from-blue-50 via-teal-50 to-orange-50 dark:from-blue-950 dark:via-teal-950 dark:to-orange-950 border-2 border-blue-200/50 dark:border-blue-800/50">
              <Label className="text-sm font-semibold">Generated Comment</Label>
              <Textarea
                value={generatedComment}
                readOnly
                rows={4}
                className="rounded-2xl border-2 text-base resize-none bg-white/50 dark:bg-gray-900/50"
              />
              <Button
                onClick={handleCopy}
                variant="outline"
                className="w-full h-12 rounded-2xl border-2 font-semibold"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5 mr-2 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 mr-2" />
                    Copy to Clipboard
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
