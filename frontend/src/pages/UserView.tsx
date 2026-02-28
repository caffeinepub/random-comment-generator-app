import React, { useState, useEffect } from 'react';
import { MessageSquare, Copy, Check, RefreshCw, AlertCircle, Gamepad2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import TopDownShooterGame from '../components/TopDownShooterGame';
import {
  useGetCommentLists,
  useGetNextCommentForDevice,
  useCheckDeviceHasComment,
  useGetDeviceComment,
} from '../hooks/useQueries';

export default function UserView() {
  const [showGame, setShowGame] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [generatedComment, setGeneratedComment] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: lists = [] } = useGetCommentLists();
  const generateMutation = useGetNextCommentForDevice();

  // Check if device already has a comment for the selected list
  const alreadyHasComment = useCheckDeviceHasComment(selectedListId);
  const storedComment = useGetDeviceComment(selectedListId);

  // When list changes, reset state and check for stored comment
  useEffect(() => {
    setError(null);
    if (selectedListId && alreadyHasComment && storedComment) {
      setGeneratedComment(storedComment);
    } else if (selectedListId) {
      setGeneratedComment(null);
    }
  }, [selectedListId, alreadyHasComment, storedComment]);

  const handleGenerate = async () => {
    if (!selectedListId) {
      toast.error('Please select a comment list first');
      return;
    }
    setError(null);

    try {
      const result = await generateMutation.mutateAsync(selectedListId);
      setGeneratedComment(result.comment);
      if (result.alreadyHad) {
        toast.info('Showing your previously generated comment');
      } else {
        toast.success('Comment generated!');
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to generate comment';
      setError(msg);
      toast.error(msg);
    }
  };

  const handleCopy = async () => {
    if (!generatedComment) return;
    try {
      await navigator.clipboard.writeText(generatedComment);
      setCopied(true);
      toast.success('Comment copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const unlockedLists = lists.filter(l => !l.locked);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Game Toggle */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowGame(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 text-primary" />
            </div>
            <span className="font-medium text-foreground">Top-Down Shooter Game</span>
          </div>
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${showGame ? 'rotate-180' : ''}`} />
        </button>
        {showGame && (
          <div className="border-t border-border">
            <TopDownShooterGame />
          </div>
        )}
      </div>

      {/* Single Comment Generator */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Single Comment Generator</h2>
            <p className="text-sm text-muted-foreground">Get one fresh comment per list</p>
          </div>
        </div>

        {/* List Selector */}
        <div className="mb-4">
          <label className="text-sm font-medium text-foreground mb-1.5 block">Select Comment List</label>
          <div className="relative">
            <select
              value={selectedListId ?? ''}
              onChange={e => setSelectedListId(e.target.value || null)}
              className="w-full px-3 py-2.5 pr-8 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
            >
              <option value="">Choose a list...</option>
              {unlockedLists.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Already generated notice */}
        {selectedListId && alreadyHasComment && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/20 text-sm text-success">
            <Check className="w-4 h-4 shrink-0" />
            <span>You already received a comment for this list on this device.</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-start gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={!selectedListId || generateMutation.isPending}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
        >
          {generateMutation.isPending ? (
            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {alreadyHasComment ? 'Show My Comment' : 'Generate Comment'}
        </button>

        {/* Generated Comment Display */}
        {generatedComment && (
          <div className="mt-4 space-y-3">
            <div className="p-4 rounded-xl bg-muted/40 border border-border">
              <p className="text-sm text-foreground leading-relaxed">{generatedComment}</p>
            </div>
            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border bg-background text-foreground font-medium text-sm hover:bg-muted/50 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Comment'}
            </button>
          </div>
        )}

        {/* Info note */}
        <p className="mt-4 text-xs text-muted-foreground text-center">
          Each device can receive one unique comment per list. Comments are tracked locally.
        </p>
      </div>
    </div>
  );
}
