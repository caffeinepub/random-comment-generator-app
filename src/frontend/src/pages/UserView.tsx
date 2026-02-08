import { useState, useRef } from 'react';
import { useGetCommentListIds, useGetRemainingCount, useGenerateBulkComments, useUploadRatingImage } from '../hooks/useQueries';
import { useDeviceScopedUserCommentHistory } from '../hooks/useDeviceScopedUserCommentHistory';
import { useDeviceScopedGenerateComment } from '../hooks/useDeviceScopedGenerateComment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Package, Copy, Check, Image as ImageIcon, Upload, Zap, History, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { ExternalBlob } from '../backend';
import type { Comment } from '../backend';
import AccessKeyDialog from '../components/AccessKeyDialog';

export default function UserView() {
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [generatedComment, setGeneratedComment] = useState<Comment | null>(null);
  const [bulkComments, setBulkComments] = useState<Comment[]>([]);
  const [copied, setCopied] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [bulkCount, setBulkCount] = useState<string>('5');
  const [showAccessKeyDialog, setShowAccessKeyDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: listIds = [], isLoading: listsLoading } = useGetCommentListIds();
  const { data: remainingCount = BigInt(0) } = useGetRemainingCount(selectedList);
  const { data: userHistory = [], isLoading: historyLoading } = useDeviceScopedUserCommentHistory();
  const { mutate: generateComment, isPending } = useDeviceScopedGenerateComment();
  const { mutate: generateBulkComments, isPending: isBulkGenerating } = useGenerateBulkComments();
  const { mutate: uploadImage, isPending: isUploading } = useUploadRatingImage();

  // Convert history array to a Map for easy lookup
  const historyMap = new Map(userHistory);

  const handleListChange = (newListId: string) => {
    setSelectedList(newListId);
    // Clear all displayed results when list changes
    setGeneratedComment(null);
    setBulkComments([]);
    setCopied(false);
  };

  const handleGenerate = () => {
    if (!selectedList) return;

    generateComment(selectedList, {
      onSuccess: (comment) => {
        if (comment) {
          setGeneratedComment(comment);
          setBulkComments([]);
          toast.success('Comment generated!');
        } else {
          toast.error('No comments available in this list');
        }
      },
      onError: () => {
        // Error is already handled by the mutation's onError
        // Do not update generatedComment on error
      },
    });
  };

  const handleBulkGenerateClick = () => {
    if (!selectedList) {
      toast.error('Please select a comment list');
      return;
    }

    const count = parseInt(bulkCount);
    if (isNaN(count) || count < 1) {
      toast.error('Please enter a valid number (minimum 1)');
      return;
    }

    if (count > Number(remainingCount)) {
      toast.error(`Only ${remainingCount.toString()} comments available`);
      return;
    }

    // Show access key dialog
    setShowAccessKeyDialog(true);
  };

  const handleAccessKeySubmit = (accessKey: string) => {
    if (!selectedList) return;

    const count = parseInt(bulkCount);
    
    generateBulkComments(
      { listId: selectedList, count, bulkGeneratorKey: accessKey },
      {
        onSuccess: (comments) => {
          if (comments && comments.length > 0) {
            setBulkComments(comments);
            setGeneratedComment(null);
          }
          setShowAccessKeyDialog(false);
        },
        onError: () => {
          // Error is already handled by the mutation's onError
          // Keep dialog open so user can try again
        },
      }
    );
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAll = () => {
    const allContent = bulkComments.map((c) => c.content).join('\n\n');
    navigator.clipboard.writeText(allContent);
    toast.success('All comments copied to clipboard!');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload image
    const arrayReader = new FileReader();
    arrayReader.onload = async (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const uint8Array = new Uint8Array(arrayBuffer);

      const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      uploadImage(blob, {
        onSuccess: () => {
          setPreviewUrl(null);
          setUploadProgress(0);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        },
        onError: () => {
          setPreviewUrl(null);
          setUploadProgress(0);
        },
      });
    };
    arrayReader.readAsArrayBuffer(file);
  };

  if (listsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4 animate-fade-slide-in">
          <div className="w-16 h-16 border-4 border-transparent border-t-[oklch(var(--gradient-start))] rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground font-medium">Loading comment lists...</p>
        </div>
      </div>
    );
  }

  if (listIds.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Card className="max-w-md border-dashed card-glow animate-fade-slide-in">
          <CardHeader className="text-center">
            <div className="w-20 h-20 rounded-2xl gradient-bg-diagonal flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse-glow">
              <Package className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl gradient-text font-bold">No Comment Lists Available</CardTitle>
            <CardDescription className="text-base">
              There are no comment lists yet. Please contact an admin to create some.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <div className="text-center space-y-3 animate-fade-slide-in">
        <h2 className="text-4xl md:text-5xl font-extrabold gradient-text leading-tight">
          Generate Random Comments
        </h2>
        <p className="text-muted-foreground text-lg">
          Select a comment list and generate unique, unused comments
        </p>
      </div>

      {/* User History Section */}
      {!historyLoading && userHistory.length > 0 && (
        <Card className="card-glow border-2 border-[oklch(var(--gradient-mid)/0.2)] rounded-2xl overflow-hidden animate-fade-slide-in">
          <div className="absolute inset-0 gradient-bg opacity-5 pointer-events-none" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center shadow-lg">
                <History className="w-4 h-4 text-white" />
              </div>
              Your History (This Device)
            </CardTitle>
            <CardDescription className="text-sm">
              Lists where you've already generated your comment on this device
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex flex-wrap gap-2">
              {userHistory.map(([listId, hasGenerated]) => (
                hasGenerated && (
                  <div
                    key={listId}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[oklch(var(--gradient-start)/0.15)] to-[oklch(var(--gradient-end)/0.15)] border border-[oklch(var(--gradient-start)/0.3)] text-sm font-medium"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[oklch(var(--gradient-start))]" />
                    <span>{listId}</span>
                  </div>
                )
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="card-glow border-2 border-[oklch(var(--gradient-start)/0.2)] rounded-2xl overflow-hidden animate-fade-slide-in" style={{ animationDelay: '0.1s' }}>
        <div className="absolute inset-0 gradient-bg-diagonal opacity-5 pointer-events-none" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg animate-pulse-glow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            Comment Generator
          </CardTitle>
          <CardDescription className="text-base">Choose a list and click generate to get your comment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 relative">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground">Select Comment List</label>
            <Select value={selectedList || ''} onValueChange={handleListChange}>
              <SelectTrigger className="w-full h-12 text-base rounded-xl border-2 hover:border-[oklch(var(--gradient-start)/0.5)] transition-all duration-300">
                <SelectValue placeholder="Choose a comment list..." />
              </SelectTrigger>
              <SelectContent>
                {listIds.map((listId) => {
                  const hasGenerated = historyMap.get(listId) || false;
                  return (
                    <SelectItem key={listId} value={listId} className="text-base">
                      <div className="flex items-center gap-2">
                        <span>{listId}</span>
                        {hasGenerated && (
                          <CheckCircle2 className="w-4 h-4 text-[oklch(var(--gradient-start))]" />
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {selectedList && (
            <div className="flex items-center justify-between p-5 rounded-xl gradient-bg-diagonal shadow-lg animate-fade-slide-in">
              <span className="text-base font-semibold text-white">Available Comments</span>
              <span className="text-3xl font-extrabold text-white animate-pulse">{remainingCount.toString()}</span>
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={!selectedList || isPending || remainingCount === BigInt(0)}
            className="w-full h-14 text-lg font-bold rounded-xl gradient-bg btn-glow hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group"
            size="lg"
          >
            {isPending ? (
              <>
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6 mr-2 group-hover:animate-pulse" />
                Generate Comment
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedComment && (
        <Card className="card-glow border-2 border-[oklch(var(--gradient-mid)/0.3)] rounded-2xl overflow-hidden animate-fade-slide-in">
          <div className="absolute inset-0 gradient-bg opacity-5 pointer-events-none" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center justify-between text-2xl">
              <span className="gradient-text font-bold">Your Generated Comment</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCopy(generatedComment.content)}
                className="rounded-xl hover:bg-accent/50 transition-all duration-300 h-10 w-10 hover:scale-110"
              >
                {copied ? <Check className="w-5 h-5 text-[oklch(var(--gradient-start))]" /> : <Copy className="w-5 h-5" />}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="p-6 rounded-xl bg-gradient-to-br from-accent/30 to-accent/10 border-2 border-[oklch(var(--gradient-start)/0.2)] hover:border-[oklch(var(--gradient-start)/0.4)] transition-all duration-300">
              <p className="text-lg leading-relaxed font-medium">{generatedComment.content}</p>
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Generated at: {new Date(Number(generatedComment.timestamp) / 1000000).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}

      {bulkComments.length > 0 && (
        <Card className="card-glow border-2 border-[oklch(var(--gradient-end)/0.3)] rounded-2xl overflow-hidden animate-fade-slide-in">
          <div className="absolute inset-0 gradient-bg-diagonal opacity-5 pointer-events-none" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="gradient-text font-bold text-2xl">
                Bulk Generated Comments ({bulkComments.length})
              </CardTitle>
              <Button
                onClick={handleCopyAll}
                variant="outline"
                className="rounded-xl border-2 hover:border-[oklch(var(--gradient-end))] font-semibold"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {bulkComments.map((comment, index) => (
                  <div
                    key={comment.id}
                    className="p-5 rounded-xl bg-gradient-to-br from-accent/30 to-accent/10 border-2 border-[oklch(var(--gradient-end)/0.2)] hover:border-[oklch(var(--gradient-end)/0.4)] transition-all duration-300 animate-fade-slide-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground bg-accent/50 px-2 py-1 rounded">
                            #{index + 1}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(Number(comment.timestamp) / 1000000).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-base leading-relaxed font-medium">{comment.content}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(comment.content)}
                        className="shrink-0 rounded-xl hover:bg-accent/50 transition-all duration-300 h-9 w-9"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Upload Rating Image Section */}
      <Card className="card-glow border-2 border-[oklch(var(--gradient-end)/0.2)] rounded-2xl overflow-hidden animate-fade-slide-in" style={{ animationDelay: '0.15s' }}>
        <div className="absolute inset-0 gradient-bg-diagonal opacity-5 pointer-events-none" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg animate-pulse-glow">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            Upload Rating Image
          </CardTitle>
          <CardDescription className="text-base">
            Share your rating or reaction by uploading an image
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />

          {previewUrl && (
            <div className="relative rounded-xl overflow-hidden border-2 border-[oklch(var(--gradient-end)/0.3)] shadow-lg animate-fade-slide-in">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-56 object-cover"
              />
              {isUploading && (
                <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 border-4 border-transparent border-t-[oklch(var(--gradient-start))] rounded-full animate-spin mx-auto" />
                    <p className="text-lg font-bold gradient-text">{uploadProgress}% uploaded</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            variant="outline"
            className="w-full h-14 text-lg font-bold rounded-xl border-2 border-[oklch(var(--gradient-end)/0.3)] hover:border-[oklch(var(--gradient-end))] hover:bg-gradient-to-r hover:from-[oklch(var(--gradient-end)/0.1)] hover:to-[oklch(var(--gradient-start)/0.1)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            size="lg"
          >
            {isUploading ? (
              <>
                <div className="w-6 h-6 border-3 border-current/30 border-t-current rounded-full animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-6 h-6 mr-2" />
                Choose Image to Upload
              </>
            )}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            Maximum file size: 5MB. Supported formats: JPG, PNG, GIF, WebP
          </p>
        </CardContent>
      </Card>

      {/* Bulk Generator Panel - Now positioned after Upload Image Section */}
      <Card className="card-glow border-2 border-[oklch(var(--gradient-mid)/0.2)] rounded-2xl overflow-hidden animate-fade-slide-in" style={{ animationDelay: '0.2s' }}>
        <div className="absolute inset-0 gradient-bg opacity-5 pointer-events-none" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="w-10 h-10 rounded-xl gradient-bg-diagonal flex items-center justify-center shadow-lg animate-pulse-glow">
              <Zap className="w-5 h-5 text-white" />
            </div>
            Bulk Comment Generator
          </CardTitle>
          <CardDescription className="text-base">
            Generate multiple comments at once (requires access key)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 relative">
          <div className="space-y-3">
            <Label htmlFor="bulk-count" className="text-sm font-semibold">
              Number of Comments
            </Label>
            <Input
              id="bulk-count"
              type="number"
              min="1"
              value={bulkCount}
              onChange={(e) => setBulkCount(e.target.value)}
              placeholder="Enter number of comments"
              className="h-12 text-base rounded-xl border-2"
              disabled={isBulkGenerating}
            />
          </div>

          <Button
            onClick={handleBulkGenerateClick}
            disabled={!selectedList || isBulkGenerating || remainingCount === BigInt(0)}
            variant="outline"
            className="w-full h-14 text-lg font-bold rounded-xl border-2 border-[oklch(var(--gradient-mid)/0.3)] hover:border-[oklch(var(--gradient-mid))] hover:bg-gradient-to-r hover:from-[oklch(var(--gradient-mid)/0.1)] hover:to-[oklch(var(--gradient-end)/0.1)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            size="lg"
          >
            {isBulkGenerating ? (
              <>
                <div className="w-6 h-6 border-3 border-current/30 border-t-current rounded-full animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-6 h-6 mr-2" />
                Generate Bulk Comments
              </>
            )}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            Bulk generation requires an access key. Contact your administrator if you need access.
          </p>
        </CardContent>
      </Card>

      {/* Access Key Dialog */}
      <AccessKeyDialog
        open={showAccessKeyDialog}
        onOpenChange={setShowAccessKeyDialog}
        onSubmit={handleAccessKeySubmit}
        isLoading={isBulkGenerating}
      />
    </div>
  );
}
