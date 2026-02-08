import { useState, useMemo } from 'react';
import {
  useGetCommentListIds,
  useGetCommentList,
  useCreateCommentList,
  useAddComment,
  useRemoveComment,
  useResetCommentList,
  useDeleteCommentList,
  useGetRemainingCount,
  useGetAllRatingImages,
  useRemoveRatingImage,
  useRemoveAllRatingImages,
  useGetAllBulkCommentTotals,
} from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, RotateCcw, List, Upload, Shield, Image as ImageIcon, Database, Settings, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import BulkGeneratorKeyManager from '../components/BulkGeneratorKeyManager';
import AdminChatPanel from '../components/AdminChatPanel';

export default function AdminPanel() {
  const [newListId, setNewListId] = useState('');
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [bulkComments, setBulkComments] = useState('');
  const [singleComment, setSingleComment] = useState('');

  const { data: listIds = [] } = useGetCommentListIds();
  const { data: comments = [] } = useGetCommentList(selectedList);
  const { data: remainingCount = BigInt(0) } = useGetRemainingCount(selectedList);
  const { data: ratingImages = [], isLoading: imagesLoading } = useGetAllRatingImages();
  const { data: bulkTotals = [] } = useGetAllBulkCommentTotals();

  const { mutate: createList, isPending: isCreating } = useCreateCommentList();
  const { mutate: addComment, isPending: isAdding } = useAddComment();
  const { mutate: removeComment } = useRemoveComment();
  const { mutate: resetList } = useResetCommentList();
  const { mutate: deleteList, isPending: isDeleting } = useDeleteCommentList();
  const { mutate: removeImage } = useRemoveRatingImage();
  const { mutate: removeAllImages } = useRemoveAllRatingImages();

  // Calculate valid lines for bulk upload preview
  const validLines = useMemo(() => {
    return bulkComments
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }, [bulkComments]);

  const previewLines = validLines.slice(0, 3);
  const totalValidLines = validLines.length;

  const handleCreateList = () => {
    if (newListId.trim()) {
      createList(newListId.trim(), {
        onSuccess: () => {
          setNewListId('');
          setSelectedList(newListId.trim());
        },
      });
    }
  };

  const handleAddBulkComments = () => {
    if (!selectedList || totalValidLines === 0) return;

    let successCount = 0;
    validLines.forEach((content, index) => {
      const id = `${Date.now()}-${index}`;
      addComment(
        { listId: selectedList, id, content },
        {
          onSuccess: () => {
            successCount++;
            if (successCount === validLines.length) {
              setBulkComments('');
              toast.success(`Added ${validLines.length} comments successfully`);
            }
          },
        }
      );
    });
  };

  const handleAddSingleComment = () => {
    if (!selectedList || !singleComment.trim()) return;

    const id = `${Date.now()}`;
    addComment(
      { listId: selectedList, id, content: singleComment.trim() },
      {
        onSuccess: () => {
          setSingleComment('');
        },
      }
    );
  };

  const handleRemoveComment = (commentId: string) => {
    if (!selectedList) return;
    removeComment({ listId: selectedList, commentId });
  };

  const handleResetList = () => {
    if (!selectedList) return;
    resetList(selectedList);
  };

  const handleDeleteList = (listId: string) => {
    deleteList(listId, {
      onSuccess: () => {
        if (selectedList === listId) {
          setSelectedList(null);
        }
      },
    });
  };

  const handleRemoveImage = (imageId: string) => {
    removeImage(imageId);
  };

  const handleRemoveAllImages = () => {
    removeAllImages();
  };

  const usedComments = comments.filter((c) => c.used);
  const availableComments = comments.filter((c) => !c.used);

  // Create a map for quick lookup of bulk totals
  const bulkTotalsMap = new Map(bulkTotals.map(([listId, total]) => [listId, Number(total)]));

  return (
    <div className="space-y-8 py-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl gradient-bg-diagonal flex items-center justify-center shadow-xl animate-pulse-glow">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-4xl font-extrabold gradient-text">Admin Panel</h2>
          <p className="text-muted-foreground text-lg">Manage comment lists, rating images, chat, and system settings</p>
        </div>
      </div>

      <Tabs defaultValue="comments" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-14 rounded-xl p-1 bg-accent/50">
          <TabsTrigger value="comments" className="text-base font-semibold rounded-lg data-[state=active]:gradient-bg data-[state=active]:text-white">
            Comments
          </TabsTrigger>
          <TabsTrigger value="images" className="text-base font-semibold rounded-lg data-[state=active]:gradient-bg data-[state=active]:text-white">
            Images
            {ratingImages.length > 0 && (
              <Badge variant="secondary" className="ml-2 gradient-bg text-white border-0">
                {ratingImages.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="chat" className="text-base font-semibold rounded-lg data-[state=active]:gradient-bg data-[state=active]:text-white">
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-base font-semibold rounded-lg data-[state=active]:gradient-bg data-[state=active]:text-white">
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comments" className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="card-glow border-2 border-[oklch(var(--gradient-start)/0.2)] rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Plus className="w-5 h-5 text-[oklch(var(--gradient-start))]" />
                  Create New List
                </CardTitle>
                <CardDescription className="text-base">Add a new comment list to the system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="listId" className="text-sm font-semibold">List Name</Label>
                  <Input
                    id="listId"
                    value={newListId}
                    onChange={(e) => setNewListId(e.target.value)}
                    placeholder="e.g., product-reviews"
                    disabled={isCreating}
                    className="h-12 rounded-xl border-2 text-base"
                  />
                </div>
                <Button 
                  onClick={handleCreateList} 
                  disabled={!newListId.trim() || isCreating} 
                  className="w-full h-12 rounded-xl gradient-bg btn-glow font-bold text-base"
                >
                  {isCreating ? 'Creating...' : 'Create List'}
                </Button>
              </CardContent>
            </Card>

            <Card className="card-glow border-2 border-[oklch(var(--gradient-mid)/0.2)] rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <List className="w-5 h-5 text-[oklch(var(--gradient-mid))]" />
                  Existing Lists
                </CardTitle>
                <CardDescription className="text-base">Select a list to manage its comments</CardDescription>
              </CardHeader>
              <CardContent>
                {listIds.length === 0 ? (
                  <p className="text-base text-muted-foreground text-center py-6">No lists created yet</p>
                ) : (
                  <ScrollArea className="h-[140px]">
                    <div className="space-y-2">
                      {listIds.map((listId) => (
                        <Button
                          key={listId}
                          variant={selectedList === listId ? 'default' : 'outline'}
                          className={`w-full justify-start h-11 rounded-xl text-base font-semibold ${
                            selectedList === listId ? 'gradient-bg btn-glow' : 'border-2 hover:border-[oklch(var(--gradient-mid))]'
                          }`}
                          onClick={() => setSelectedList(listId)}
                        >
                          {listId}
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bulk Comment Totals Card */}
          {listIds.length > 0 && (
            <Card className="card-glow border-2 border-[oklch(var(--gradient-end)/0.2)] rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg">
                    <Database className="w-5 h-5 text-white" />
                  </div>
                  Bulk Comment Totals
                </CardTitle>
                <CardDescription className="text-base">
                  Quick summary of total comments in each list
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {listIds.map((listId) => {
                      const total = bulkTotalsMap.get(listId) || 0;
                      return (
                        <div
                          key={listId}
                          className="p-5 rounded-xl border-2 bg-gradient-to-br from-accent/20 to-accent/5 border-[oklch(var(--gradient-start)/0.2)] hover:border-[oklch(var(--gradient-start)/0.4)] transition-all"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <p className="text-lg font-bold mb-1">{listId}</p>
                              <p className="text-sm text-muted-foreground">
                                Total comments in list
                              </p>
                            </div>
                            <Badge 
                              variant="outline" 
                              className="text-2xl px-5 py-2 rounded-xl border-2 border-[oklch(var(--gradient-start)/0.5)] font-bold gradient-text"
                            >
                              {total}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {selectedList && (
            <>
              <Card className="card-glow border-2 border-[oklch(var(--gradient-start)/0.3)] rounded-2xl overflow-hidden">
                <div className="absolute inset-0 gradient-bg-diagonal opacity-5 pointer-events-none" />
                <CardHeader className="relative">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <CardTitle className="text-2xl gradient-text font-bold">Managing: {selectedList}</CardTitle>
                      <CardDescription className="text-base">Add, view, and manage comments in this list</CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-lg px-5 py-2 rounded-xl border-2 border-[oklch(var(--gradient-start)/0.5)] font-bold">
                        {remainingCount.toString()} available
                      </Badge>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-2 hover:border-[oklch(var(--gradient-start))]">
                            <RotateCcw className="w-5 h-5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl">Reset Comment List?</AlertDialogTitle>
                            <AlertDialogDescription className="text-base">
                              This will mark all comments as unused. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleResetList} className="rounded-xl gradient-bg">Reset</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            className="h-11 w-11 rounded-xl"
                            disabled={isDeleting}
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl">Delete Comment List?</AlertDialogTitle>
                            <AlertDialogDescription className="text-base">
                              This will permanently delete the list "{selectedList}" and all its comments ({comments.length} total). This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteList(selectedList)} 
                              className="rounded-xl bg-destructive hover:bg-destructive/90"
                            >
                              Delete List
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <Tabs defaultValue="bulk" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl p-1">
                      <TabsTrigger value="bulk" className="rounded-lg font-semibold data-[state=active]:gradient-bg data-[state=active]:text-white">
                        Bulk Upload
                      </TabsTrigger>
                      <TabsTrigger value="single" className="rounded-lg font-semibold data-[state=active]:gradient-bg data-[state=active]:text-white">
                        Single Comment
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="bulk" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bulk" className="text-sm font-semibold">Comments (one per line)</Label>
                        <Textarea
                          id="bulk"
                          value={bulkComments}
                          onChange={(e) => setBulkComments(e.target.value)}
                          placeholder="Enter comments, one per line..."
                          rows={6}
                          disabled={isAdding}
                          className="rounded-xl border-2 text-base"
                        />
                      </div>
                      
                      {/* Live Preview and Count */}
                      {bulkComments.trim() && (
                        <div className="p-4 rounded-xl bg-accent/20 border-2 border-[oklch(var(--gradient-start)/0.2)] space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                              Upload Preview
                            </p>
                            <Badge variant="default" className="gradient-bg border-0 font-bold">
                              {totalValidLines} {totalValidLines === 1 ? 'line' : 'lines'}
                            </Badge>
                          </div>
                          {totalValidLines > 0 ? (
                            <div className="space-y-2">
                              <p className="text-xs text-muted-foreground">
                                First {Math.min(3, totalValidLines)} {totalValidLines === 1 ? 'line' : 'lines'} to be uploaded:
                              </p>
                              <div className="space-y-1">
                                {previewLines.map((line, index) => (
                                  <div key={index} className="text-sm bg-background/50 px-3 py-2 rounded border border-[oklch(var(--gradient-start)/0.2)]">
                                    {line}
                                  </div>
                                ))}
                              </div>
                              {totalValidLines > 3 && (
                                <p className="text-xs text-muted-foreground italic">
                                  ...and {totalValidLines - 3} more {totalValidLines - 3 === 1 ? 'line' : 'lines'}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No valid lines to upload (empty lines will be ignored)
                            </p>
                          )}
                        </div>
                      )}

                      <Button 
                        onClick={handleAddBulkComments} 
                        disabled={totalValidLines === 0 || isAdding} 
                        className="w-full h-12 rounded-xl gradient-bg btn-glow font-bold"
                      >
                        <Upload className="w-5 h-5 mr-2" />
                        {isAdding ? 'Adding...' : `Add ${totalValidLines} ${totalValidLines === 1 ? 'Comment' : 'Comments'}`}
                      </Button>
                    </TabsContent>
                    <TabsContent value="single" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="single" className="text-sm font-semibold">Comment Text</Label>
                        <Textarea
                          id="single"
                          value={singleComment}
                          onChange={(e) => setSingleComment(e.target.value)}
                          placeholder="Enter a single comment..."
                          rows={4}
                          disabled={isAdding}
                          className="rounded-xl border-2 text-base"
                        />
                      </div>
                      <Button 
                        onClick={handleAddSingleComment} 
                        disabled={!singleComment.trim() || isAdding} 
                        className="w-full h-12 rounded-xl gradient-bg btn-glow font-bold"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        {isAdding ? 'Adding...' : 'Add Comment'}
                      </Button>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              <Card className="card-glow border-2 border-[oklch(var(--gradient-mid)/0.2)] rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl">All Comments ({comments.length})</CardTitle>
                  <CardDescription className="text-base">
                    {availableComments.length} available, {usedComments.length} used
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {comments.length === 0 ? (
                    <p className="text-base text-muted-foreground text-center py-10">No comments in this list yet</p>
                  ) : (
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-3">
                        {comments.map((comment) => (
                          <div
                            key={comment.id}
                            className={`p-5 rounded-xl border-2 transition-all ${
                              comment.used 
                                ? 'bg-muted/30 border-muted' 
                                : 'bg-gradient-to-br from-accent/20 to-accent/5 border-[oklch(var(--gradient-start)/0.2)] hover:border-[oklch(var(--gradient-start)/0.4)]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <p className={`text-base leading-relaxed ${comment.used ? 'text-muted-foreground line-through' : 'font-medium'}`}>
                                  {comment.content}
                                </p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge 
                                    variant={comment.used ? 'secondary' : 'default'} 
                                    className={`text-xs font-semibold ${!comment.used && 'gradient-bg border-0'}`}
                                  >
                                    {comment.used ? 'Used' : 'Available'}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(Number(comment.timestamp) / 1000000).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="shrink-0 rounded-xl hover:bg-destructive/10">
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-2xl">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-xl">Delete Comment?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-base">
                                      This will permanently remove this comment. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleRemoveComment(comment.id)} className="rounded-xl bg-destructive">
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="images" className="space-y-6 mt-6">
          <Card className="card-glow border-2 border-[oklch(var(--gradient-end)/0.2)] rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg">
                      <ImageIcon className="w-5 h-5 text-white" />
                    </div>
                    Uploaded Rating Images
                  </CardTitle>
                  <CardDescription className="text-base">
                    View and manage user-uploaded rating images
                  </CardDescription>
                </div>
                {ratingImages.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="h-11 rounded-xl font-semibold">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove All
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl">Remove All Rating Images?</AlertDialogTitle>
                        <AlertDialogDescription className="text-base">
                          This will permanently delete all {ratingImages.length} rating images. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemoveAllImages} className="rounded-xl bg-destructive">
                          Remove All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {imagesLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-transparent border-t-[oklch(var(--gradient-start))] rounded-full animate-spin mx-auto" />
                    <p className="text-muted-foreground font-medium text-lg">Loading images...</p>
                  </div>
                </div>
              ) : ratingImages.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 rounded-2xl gradient-bg-diagonal flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <ImageIcon className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-base text-muted-foreground font-medium">No rating images uploaded yet</p>
                </div>
              ) : (
                <ScrollArea className="h-[600px] pr-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {ratingImages.map((imageData) => (
                      <Card key={imageData.id} className="overflow-hidden rounded-2xl border-2 border-[oklch(var(--gradient-end)/0.2)] hover:border-[oklch(var(--gradient-end)/0.5)] transition-all card-glow">
                        <div className="aspect-square relative bg-muted">
                          <img
                            src={imageData.image.getDirectURL()}
                            alt={`Rating by ${imageData.uploader.toString().slice(0, 8)}...`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <CardContent className="p-5 space-y-3">
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Uploaded by</p>
                            <p className="text-sm font-mono truncate bg-accent/30 px-2 py-1 rounded">
                              {imageData.uploader.toString().slice(0, 12)}...
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Upload time</p>
                            <p className="text-sm font-medium">
                              {new Date(Number(imageData.timestamp) / 1000000).toLocaleString()}
                            </p>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" className="w-full h-10 rounded-xl font-semibold">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-xl">Remove Rating Image?</AlertDialogTitle>
                                <AlertDialogDescription className="text-base">
                                  This will permanently delete this rating image. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRemoveImage(imageData.id)} className="rounded-xl bg-destructive">
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="space-y-6 mt-6">
          <AdminChatPanel />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6 mt-6">
          <BulkGeneratorKeyManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
