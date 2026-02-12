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
  useGetAllBulkCommentTotals,
  useClearAllCommentLists,
  useGetLockedCommentListIds,
  useLockCommentList,
  useUnlockCommentList,
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
import { Plus, Trash2, RotateCcw, List, Shield, Database, Settings, MessageCircle, Image as ImageIcon, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';
import BulkGeneratorKeyManager from '../components/BulkGeneratorKeyManager';
import AdminChatPanel from '../components/AdminChatPanel';
import AdminUserImageTable from '../components/AdminUserImageTable';

export default function AdminPanel() {
  const [newListId, setNewListId] = useState('');
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [bulkComments, setBulkComments] = useState('');
  const [singleComment, setSingleComment] = useState('');

  const { data: listIds = [] } = useGetCommentListIds();
  const { data: lockedListIds = [] } = useGetLockedCommentListIds();
  const { data: comments = [] } = useGetCommentList(selectedList);
  const { data: remainingCount = BigInt(0) } = useGetRemainingCount(selectedList);
  const { data: bulkTotals = [] } = useGetAllBulkCommentTotals();

  const { mutate: createList, isPending: isCreating } = useCreateCommentList();
  const { mutate: addComment, isPending: isAdding } = useAddComment();
  const { mutate: removeComment } = useRemoveComment();
  const { mutate: resetList } = useResetCommentList();
  const { mutate: deleteList, isPending: isDeleting } = useDeleteCommentList();
  const { mutate: clearAllLists } = useClearAllCommentLists();
  const { mutate: lockList } = useLockCommentList();
  const { mutate: unlockList } = useUnlockCommentList();

  const lockedListIdsSet = useMemo(() => new Set(lockedListIds), [lockedListIds]);

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
    let hasError = false;

    validLines.forEach((content, index) => {
      const id = `${Date.now()}-${index}`;
      addComment(
        { listId: selectedList, id, content },
        {
          onSuccess: () => {
            successCount++;
            if (successCount === validLines.length && !hasError) {
              setBulkComments('');
              toast.success(`Added ${validLines.length} comments successfully`);
            }
          },
          onError: () => {
            hasError = true;
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

  const handleClearAllLists = () => {
    clearAllLists();
  };

  const handleToggleLock = (listId: string) => {
    const isLocked = lockedListIdsSet.has(listId);
    if (isLocked) {
      unlockList(listId, {
        onSuccess: () => {
          toast.success(`List "${listId}" unlocked`);
        },
      });
    } else {
      lockList(listId, {
        onSuccess: () => {
          toast.success(`List "${listId}" locked`);
        },
      });
    }
  };

  const usedComments = comments.filter((c) => c.used);
  const availableComments = comments.filter((c) => !c.used);
  const bulkTotalsMap = new Map(bulkTotals.map(([listId, total]) => [listId, Number(total)]));

  return (
    <div className="space-y-8 py-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl gradient-bg-diagonal flex items-center justify-center shadow-xl animate-pulse-glow">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-4xl font-extrabold gradient-text">Admin Panel</h2>
          <p className="text-muted-foreground text-lg">Manage comments, images, chat, and settings</p>
        </div>
      </div>

      <Tabs defaultValue="comments" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-14 rounded-xl p-1 bg-accent/50">
          <TabsTrigger value="comments" className="text-base font-semibold rounded-lg data-[state=active]:gradient-bg data-[state=active]:text-white">
            Comments
          </TabsTrigger>
          <TabsTrigger value="images" className="text-base font-semibold rounded-lg data-[state=active]:gradient-bg data-[state=active]:text-white">
            <ImageIcon className="w-4 h-4 mr-2" />
            Images
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
                      {listIds.map((listId) => {
                        const isLocked = lockedListIdsSet.has(listId);
                        return (
                          <div key={listId} className="flex items-center gap-2">
                            <Button
                              variant={selectedList === listId ? 'default' : 'outline'}
                              className={`flex-1 justify-start h-11 rounded-xl text-base font-semibold ${
                                selectedList === listId ? 'gradient-bg btn-glow' : 'border-2 hover:border-[oklch(var(--gradient-mid))]'
                              }`}
                              onClick={() => setSelectedList(listId)}
                            >
                              {listId}
                              {isLocked && (
                                <Badge variant="outline" className="ml-2 text-xs px-2 py-0 border-orange-500/50 text-orange-600 dark:text-orange-400">
                                  <Lock className="w-3 h-3" />
                                </Badge>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleToggleLock(listId)}
                              className="h-11 w-11 rounded-xl border-2"
                              title={isLocked ? 'Unlock list' : 'Lock list'}
                            >
                              {isLocked ? (
                                <Lock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                              ) : (
                                <Unlock className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

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
                      const isLocked = lockedListIdsSet.has(listId);
                      return (
                        <div
                          key={listId}
                          className="p-5 rounded-xl border-2 bg-gradient-to-br from-accent/20 to-accent/5 border-[oklch(var(--gradient-start)/0.2)] hover:border-[oklch(var(--gradient-start)/0.4)] transition-all"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-lg font-bold">{listId}</p>
                                {isLocked && (
                                  <Badge variant="outline" className="text-xs px-2 py-0 border-orange-500/50 text-orange-600 dark:text-orange-400">
                                    <Lock className="w-3 h-3 mr-1" />
                                    Locked
                                  </Badge>
                                )}
                              </div>
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
                            This will permanently delete the list "{selectedList}" and all its comments. This action cannot be undone.
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
                    
                    {bulkComments.trim() && (
                      <div className="p-4 rounded-xl bg-accent/20 border-2 border-[oklch(var(--gradient-start)/0.2)] space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                            Upload Preview
                          </p>
                          <Badge variant="default" className="gradient-bg border-0 font-bold">
                            {totalValidLines} comments
                          </Badge>
                        </div>
                        <div className="space-y-1.5">
                          {previewLines.map((line, idx) => (
                            <p key={idx} className="text-sm text-foreground/80 truncate">
                              {idx + 1}. {line}
                            </p>
                          ))}
                          {totalValidLines > 3 && (
                            <p className="text-sm text-muted-foreground italic">
                              ... and {totalValidLines - 3} more
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      onClick={handleAddBulkComments} 
                      disabled={totalValidLines === 0 || isAdding} 
                      className="w-full h-12 rounded-xl gradient-bg btn-glow font-bold text-base"
                    >
                      {isAdding ? 'Adding...' : `Add ${totalValidLines} Comments`}
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
                      className="w-full h-12 rounded-xl gradient-bg btn-glow font-bold text-base"
                    >
                      {isAdding ? 'Adding...' : 'Add Comment'}
                    </Button>
                  </TabsContent>
                </Tabs>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">Comments in List ({comments.length})</h3>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-sm px-3 py-1 rounded-lg border-2 border-green-500/50 text-green-600 dark:text-green-400">
                        {availableComments.length} available
                      </Badge>
                      <Badge variant="outline" className="text-sm px-3 py-1 rounded-lg border-2 border-orange-500/50 text-orange-600 dark:text-orange-400">
                        {usedComments.length} used
                      </Badge>
                    </div>
                  </div>
                  <ScrollArea className="h-[300px] rounded-xl border-2 border-[oklch(var(--gradient-start)/0.2)] p-4">
                    {comments.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No comments in this list yet</p>
                    ) : (
                      <div className="space-y-2">
                        {comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="p-4 rounded-lg border-2 bg-accent/10 border-[oklch(var(--gradient-start)/0.2)] hover:border-[oklch(var(--gradient-start)/0.4)] transition-all"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <p className="text-sm font-medium leading-relaxed">{comment.content}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge
                                    variant={comment.used ? 'outline' : 'default'}
                                    className={`text-xs ${
                                      comment.used
                                        ? 'border-orange-500/50 text-orange-600 dark:text-orange-400'
                                        : 'gradient-bg border-0'
                                    }`}
                                  >
                                    {comment.used ? 'Used' : 'Available'}
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveComment(comment.id)}
                                className="shrink-0 h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          )}

          {listIds.length > 0 && (
            <Card className="card-glow border-2 border-destructive/30 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-xl text-destructive">Danger Zone</CardTitle>
                <CardDescription className="text-base">
                  Irreversible actions that affect all comment lists
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full h-12 rounded-xl font-bold text-base">
                      <Trash2 className="w-5 h-5 mr-2" />
                      Clear All Comment Lists
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-xl">Clear All Comment Lists?</AlertDialogTitle>
                      <AlertDialogDescription className="text-base">
                        This will permanently delete ALL comment lists and their comments. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleClearAllLists} 
                        className="rounded-xl bg-destructive hover:bg-destructive/90"
                      >
                        Clear All Lists
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="images" className="mt-6">
          <AdminUserImageTable />
        </TabsContent>

        <TabsContent value="chat" className="mt-6">
          <AdminChatPanel />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <BulkGeneratorKeyManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
