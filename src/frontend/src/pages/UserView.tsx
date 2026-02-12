import { useState, useRef, useMemo } from 'react';
import { useGetCommentListIds, useGetRemainingCount, useUploadRatingImage, useGetLockedCommentListIds } from '../hooks/useQueries';
import { useGenerateBulkComments } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Image as ImageIcon, Upload, Zap, Copy, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { ExternalBlob } from '../backend';
import type { Comment } from '../backend';
import AccessKeyDialog from '../components/AccessKeyDialog';

export default function UserView() {
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [bulkCount, setBulkCount] = useState<string>('5');
  const [bulkComments, setBulkComments] = useState<Comment[]>([]);
  const [showAccessKeyDialog, setShowAccessKeyDialog] = useState(false);
  const [imageUserName, setImageUserName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: listIds = [], isLoading: listsLoading } = useGetCommentListIds();
  const { data: lockedListIds = [] } = useGetLockedCommentListIds();
  const { data: remainingCount = BigInt(0) } = useGetRemainingCount(selectedList);
  const { mutate: uploadImage, isPending: isUploadingImage } = useUploadRatingImage();
  const { mutate: generateBulkComments, isPending: isBulkGenerating } = useGenerateBulkComments();

  const lockedListIdsSet = useMemo(() => new Set(lockedListIds), [lockedListIds]);
  const isSelectedListLocked = selectedList ? lockedListIdsSet.has(selectedList) : false;

  const handleBulkGenerateClick = () => {
    if (!selectedList) {
      toast.error('Please select a comment list');
      return;
    }

    if (isSelectedListLocked) {
      toast.error('This list is locked by the admin. Bulk generation is disabled.');
      return;
    }

    const count = parseInt(bulkCount);
    if (isNaN(count) || count < 1) {
      toast.error('Please enter a valid number (minimum 1)');
      return;
    }

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
          }
          setShowAccessKeyDialog(false);
        },
        onError: () => {
          // Keep dialog open for retry
        },
      }
    );
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard!');
  };

  const handleCopyAll = () => {
    const allContent = bulkComments.map((c) => c.content).join('\n\n');
    navigator.clipboard.writeText(allContent);
    toast.success('All comments copied to clipboard!');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!imageUserName.trim()) {
      toast.error('Please enter a user name first');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    const arrayReader = new FileReader();
    arrayReader.onload = async (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const uint8Array = new Uint8Array(arrayBuffer);

      const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      uploadImage({ userName: imageUserName.trim(), image: blob }, {
        onSuccess: () => {
          setPreviewUrl(null);
          setUploadProgress(0);
          setImageUserName('');
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
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-transparent border-t-[oklch(var(--gradient-start))] rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 animate-fade-slide-in">
      <div className="text-center space-y-3">
        <h2 className="text-4xl md:text-5xl font-extrabold gradient-text leading-tight">Customer View</h2>
        <p className="text-muted-foreground text-lg">
          Generate comments, upload images, and view your activity
        </p>
      </div>

      <Card className="card-glow border-2 border-[oklch(var(--gradient-end)/0.2)] rounded-2xl overflow-hidden">
        <div className="absolute inset-0 gradient-bg-diagonal opacity-5 pointer-events-none" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg animate-pulse-glow">
              <Zap className="w-5 h-5 text-white" />
            </div>
            Bulk Comment Generator
          </CardTitle>
          <CardDescription className="text-base">
            Generate multiple comments at once (requires access key)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 relative">
          <div className="space-y-2">
            <Label htmlFor="bulkList" className="text-sm font-semibold">
              Select Comment List
            </Label>
            <Select value={selectedList || ''} onValueChange={setSelectedList}>
              <SelectTrigger
                id="bulkList"
                className="w-full h-12 text-base rounded-xl border-2 hover:border-[oklch(var(--gradient-end)/0.5)] transition-colors"
              >
                <SelectValue placeholder="Choose a comment list..." />
              </SelectTrigger>
              <SelectContent>
                {listIds.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No comment lists available
                  </div>
                ) : (
                  listIds.map((listId) => {
                    const isLocked = lockedListIdsSet.has(listId);
                    return (
                      <SelectItem key={listId} value={listId} className="text-base">
                        <div className="flex items-center gap-2">
                          {listId}
                          {isLocked && (
                            <Badge variant="outline" className="text-xs px-2 py-0 border-orange-500/50 text-orange-600 dark:text-orange-400">
                              <Lock className="w-3 h-3 mr-1" />
                              Locked
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedList && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-accent/20 border-2 border-[oklch(var(--gradient-start)/0.2)]">
              <span className="text-sm font-semibold">Available Comments:</span>
              <Badge variant="outline" className="text-lg px-4 py-1 rounded-xl border-2 border-[oklch(var(--gradient-start)/0.5)] font-bold">
                {remainingCount.toString()}
              </Badge>
            </div>
          )}

          {isSelectedListLocked && (
            <div className="p-4 rounded-xl bg-orange-500/10 border-2 border-orange-500/30">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                  This list is locked by the admin. Bulk generation is disabled for locked lists.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="bulkCount" className="text-sm font-semibold">
              Number of Comments
            </Label>
            <Input
              id="bulkCount"
              type="number"
              min="1"
              value={bulkCount}
              onChange={(e) => setBulkCount(e.target.value)}
              placeholder="Enter number of comments..."
              disabled={isBulkGenerating || !selectedList || isSelectedListLocked}
              className="h-12 rounded-xl border-2 text-base"
            />
          </div>

          <Button
            onClick={handleBulkGenerateClick}
            disabled={!selectedList || isBulkGenerating || !bulkCount || isSelectedListLocked}
            className="w-full h-14 text-lg font-bold rounded-xl gradient-bg btn-glow hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            size="lg"
          >
            {isBulkGenerating ? (
              <>
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-6 h-6 mr-2" />
                Generate Bulk Comments
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {bulkComments.length > 0 && (
        <Card className="card-glow border-2 border-[oklch(var(--gradient-start)/0.3)] rounded-2xl overflow-hidden animate-fade-slide-in">
          <div className="absolute inset-0 gradient-bg opacity-5 pointer-events-none" />
          <CardHeader className="relative">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="gradient-text font-bold text-2xl">
                Generated Comments ({bulkComments.length})
              </CardTitle>
              <Button
                onClick={handleCopyAll}
                variant="outline"
                className="rounded-xl border-2 border-[oklch(var(--gradient-start)/0.5)] font-semibold hover:bg-accent"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {bulkComments.map((comment, idx) => (
                  <div
                    key={comment.id}
                    className="p-4 rounded-xl bg-gradient-to-br from-accent/30 to-accent/10 border-2 border-[oklch(var(--gradient-mid)/0.2)] hover:border-[oklch(var(--gradient-mid)/0.4)] transition-all duration-300"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-xs font-bold text-muted-foreground mb-2">Comment {idx + 1}</p>
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

      <Card className="card-glow border-2 border-[oklch(var(--gradient-mid)/0.2)] rounded-2xl overflow-hidden">
        <div className="absolute inset-0 gradient-bg-diagonal opacity-5 pointer-events-none" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg animate-pulse-glow">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            Upload Rating Image
          </CardTitle>
          <CardDescription className="text-base">
            Upload your rating image with your name
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 relative">
          <div className="space-y-2">
            <Label htmlFor="imageUserName" className="text-sm font-semibold">
              Your Name
            </Label>
            <Input
              id="imageUserName"
              value={imageUserName}
              onChange={(e) => setImageUserName(e.target.value)}
              placeholder="Enter your name..."
              disabled={isUploadingImage}
              className="h-12 rounded-xl border-2 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ratingImage" className="text-sm font-semibold">
              Select Image
            </Label>
            <Input
              ref={fileInputRef}
              id="ratingImage"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isUploadingImage || !imageUserName.trim()}
              className="h-12 rounded-xl border-2 text-base cursor-pointer"
            />
          </div>

          {previewUrl && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Preview</Label>
              <div className="relative rounded-xl overflow-hidden border-2 border-[oklch(var(--gradient-mid)/0.3)]">
                <img src={previewUrl} alt="Preview" className="w-full h-64 object-cover" />
                {isUploadingImage && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                      <p className="text-white font-bold text-lg">{uploadProgress}%</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AccessKeyDialog
        open={showAccessKeyDialog}
        onOpenChange={setShowAccessKeyDialog}
        onSubmit={handleAccessKeySubmit}
        isLoading={isBulkGenerating}
      />
    </div>
  );
}
