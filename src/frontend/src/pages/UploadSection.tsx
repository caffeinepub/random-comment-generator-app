import { useState, useRef } from 'react';
import { useGetCommentListIds, useAddComment, useUploadRatingImage, useGenerateBulkComments } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Image as ImageIcon, Upload, Zap, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { ExternalBlob } from '../backend';
import type { Comment } from '../backend';
import AccessKeyDialog from '../components/AccessKeyDialog';
import AdminDetailsCard from '../components/AdminDetailsCard';

export default function UploadSection() {
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [bulkCount, setBulkCount] = useState<string>('5');
  const [bulkComments, setBulkComments] = useState<Comment[]>([]);
  const [showAccessKeyDialog, setShowAccessKeyDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: listIds = [], isLoading: listsLoading } = useGetCommentListIds();
  const { mutate: addComment, isPending: isAddingComment } = useAddComment();
  const { mutate: uploadImage, isPending: isUploadingImage } = useUploadRatingImage();
  const { mutate: generateBulkComments, isPending: isBulkGenerating } = useGenerateBulkComments();

  const handleAddComment = () => {
    if (!selectedList) {
      toast.error('Please select a comment list');
      return;
    }

    if (!commentText.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    const id = `${Date.now()}`;
    addComment(
      { listId: selectedList, id, content: commentText.trim() },
      {
        onSuccess: () => {
          setCommentText('');
          setSelectedList(null);
        },
      }
    );
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
        <h2 className="text-4xl md:text-5xl font-extrabold gradient-text leading-tight">Upload Section</h2>
        <p className="text-muted-foreground text-lg">
          Upload comments, generate bulk comments, and upload rating images
        </p>
      </div>

      {/* Admin Details Card */}
      <AdminDetailsCard />

      {/* Comment Upload Card */}
      <Card className="card-glow border-2 border-[oklch(var(--gradient-mid)/0.2)] rounded-2xl overflow-hidden">
        <div className="absolute inset-0 gradient-bg opacity-5 pointer-events-none" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            Upload Comment
          </CardTitle>
          <CardDescription className="text-base">
            Add a new comment to a selected list
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 relative">
          <div className="space-y-2">
            <Label htmlFor="commentList" className="text-sm font-semibold">
              Select Comment List
            </Label>
            <Select value={selectedList || ''} onValueChange={setSelectedList}>
              <SelectTrigger
                id="commentList"
                className="w-full h-12 text-base rounded-xl border-2 hover:border-[oklch(var(--gradient-mid)/0.5)] transition-colors"
              >
                <SelectValue placeholder="Choose a comment list..." />
              </SelectTrigger>
              <SelectContent>
                {listIds.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No comment lists available
                  </div>
                ) : (
                  listIds.map((listId) => (
                    <SelectItem key={listId} value={listId} className="text-base">
                      {listId}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="commentText" className="text-sm font-semibold">
              Comment Text
            </Label>
            <Textarea
              id="commentText"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Enter your comment here..."
              rows={5}
              disabled={isAddingComment}
              className="rounded-xl border-2 text-base resize-none"
            />
          </div>

          <Button
            onClick={handleAddComment}
            disabled={!selectedList || !commentText.trim() || isAddingComment}
            className="w-full h-14 text-lg font-bold rounded-xl gradient-bg btn-glow hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            size="lg"
          >
            {isAddingComment ? (
              <>
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-6 h-6 mr-2" />
                Upload Comment
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Bulk Generator Panel */}
      <Card className="card-glow border-2 border-[oklch(var(--gradient-start)/0.2)] rounded-2xl overflow-hidden">
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
                className="w-full h-12 text-base rounded-xl border-2 hover:border-[oklch(var(--gradient-start)/0.5)] transition-colors"
              >
                <SelectValue placeholder="Choose a comment list..." />
              </SelectTrigger>
              <SelectContent>
                {listIds.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No comment lists available
                  </div>
                ) : (
                  listIds.map((listId) => (
                    <SelectItem key={listId} value={listId} className="text-base">
                      {listId}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

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
              disabled={isBulkGenerating || !selectedList}
              className="h-12 rounded-xl border-2 text-base"
            />
          </div>

          <div className="p-4 rounded-xl bg-accent/20 border-2 border-[oklch(var(--gradient-start)/0.2)]">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> The bulk generator requires a valid access key. You will be prompted to enter the key when you click the button below.
            </p>
          </div>

          <Button
            onClick={handleBulkGenerateClick}
            disabled={!selectedList || isBulkGenerating || !bulkCount}
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

      {/* Rating Image Upload Card */}
      <Card className="card-glow border-2 border-[oklch(var(--gradient-end)/0.2)] rounded-2xl overflow-hidden">
        <div className="absolute inset-0 gradient-bg-diagonal opacity-5 pointer-events-none" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg">
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
            disabled={isUploadingImage}
          />

          {previewUrl && (
            <div className="relative rounded-xl overflow-hidden border-2 border-[oklch(var(--gradient-end)/0.3)] shadow-lg animate-fade-slide-in">
              <img src={previewUrl} alt="Preview" className="w-full h-56 object-cover" />
              {isUploadingImage && (
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
            disabled={isUploadingImage}
            variant="outline"
            className="w-full h-14 text-lg font-bold rounded-xl border-2 border-[oklch(var(--gradient-end)/0.3)] hover:border-[oklch(var(--gradient-end))] hover:bg-gradient-to-r hover:from-[oklch(var(--gradient-end)/0.1)] hover:to-[oklch(var(--gradient-start)/0.1)] transition-all duration-300"
            size="lg"
          >
            {isUploadingImage ? (
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
