import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Plus, Trash2, RotateCcw, Lock, Unlock, Image as ImageIcon, MessageSquare, Settings as SettingsIcon, ListChecks } from 'lucide-react';
import {
  useGetCommentListIds,
  useGetCommentList,
  useCreateCommentList,
  useAddComment,
  useRemoveComment,
  useResetCommentList,
  useDeleteCommentList,
  useLockCommentList,
  useUnlockCommentList,
  useGetLockedCommentListIds,
  useGetAllBulkCommentTotals,
} from '../hooks/useQueries';
import BulkGeneratorKeyManager from '../components/BulkGeneratorKeyManager';
import AdminChatPanel from '../components/AdminChatPanel';
import AdminUserImageTable from '../components/AdminUserImageTable';
import LiveListCheckerAdminSection from '../components/live-list-checker/LiveListCheckerAdminSection';

export default function AdminPanel() {
  const [newListId, setNewListId] = useState('');
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [newCommentContent, setNewCommentContent] = useState('');
  const [bulkCommentText, setBulkCommentText] = useState('');

  const { data: commentListIds = [], isLoading: loadingListIds } = useGetCommentListIds();
  const { data: lockedListIds = [] } = useGetLockedCommentListIds();
  const { data: comments = [], isLoading: loadingComments } = useGetCommentList(selectedListId);
  const { data: bulkTotals = [] } = useGetAllBulkCommentTotals();

  const createListMutation = useCreateCommentList();
  const addCommentMutation = useAddComment();
  const removeCommentMutation = useRemoveComment();
  const resetListMutation = useResetCommentList();
  const deleteListMutation = useDeleteCommentList();
  const lockListMutation = useLockCommentList();
  const unlockListMutation = useUnlockCommentList();

  const isListLocked = selectedListId ? lockedListIds.includes(selectedListId) : false;

  const handleCreateList = async () => {
    if (!newListId.trim()) return;
    await createListMutation.mutateAsync(newListId.trim());
    setNewListId('');
  };

  const handleAddComment = async () => {
    if (!selectedListId || !newCommentContent.trim()) return;
    const commentId = `comment_${Date.now()}`;
    await addCommentMutation.mutateAsync({
      listId: selectedListId,
      id: commentId,
      content: newCommentContent.trim(),
    });
    setNewCommentContent('');
  };

  const handleBulkAddComments = async () => {
    if (!selectedListId || !bulkCommentText.trim()) return;
    const commentsArray = bulkCommentText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    for (const content of commentsArray) {
      const commentId = `comment_${Date.now()}_${Math.random()}`;
      await addCommentMutation.mutateAsync({
        listId: selectedListId,
        id: commentId,
        content,
      });
    }
    setBulkCommentText('');
  };

  const handleRemoveComment = async (commentId: string) => {
    if (!selectedListId) return;
    await removeCommentMutation.mutateAsync({ listId: selectedListId, commentId });
  };

  const handleResetList = async () => {
    if (!selectedListId) return;
    await resetListMutation.mutateAsync(selectedListId);
  };

  const handleDeleteList = async () => {
    if (!selectedListId) return;
    await deleteListMutation.mutateAsync(selectedListId);
    setSelectedListId('');
  };

  const handleToggleLock = async () => {
    if (!selectedListId) return;
    if (isListLocked) {
      await unlockListMutation.mutateAsync(selectedListId);
    } else {
      await lockListMutation.mutateAsync(selectedListId);
    }
  };

  const getTotalForList = (listId: string): number => {
    const found = bulkTotals.find(([id]) => id === listId);
    return found ? Number(found[1]) : 0;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold gradient-text mb-2">Admin Panel</h1>
          <p className="text-muted-foreground text-lg">Manage comments, images, chat, and list checker</p>
        </div>
        <div className="flex gap-4">
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Locked Lists</p>
                <p className="text-3xl font-bold gradient-text">{lockedListIds.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="comments" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-14 rounded-xl p-1 bg-accent/50">
          <TabsTrigger value="comments" className="text-base font-bold rounded-lg data-[state=active]:gradient-bg data-[state=active]:text-white transition-all duration-300">
            Comments
          </TabsTrigger>
          <TabsTrigger value="images" className="text-base font-bold rounded-lg data-[state=active]:gradient-bg data-[state=active]:text-white transition-all duration-300">
            <ImageIcon className="w-4 h-4 mr-2" />
            Images
          </TabsTrigger>
          <TabsTrigger value="chat" className="text-base font-bold rounded-lg data-[state=active]:gradient-bg data-[state=active]:text-white transition-all duration-300">
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="list-checker" className="text-base font-bold rounded-lg data-[state=active]:gradient-bg data-[state=active]:text-white transition-all duration-300">
            <ListChecks className="w-4 h-4 mr-2" />
            List Checker
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-base font-bold rounded-lg data-[state=active]:gradient-bg data-[state=active]:text-white transition-all duration-300">
            <SettingsIcon className="w-4 h-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comments" className="space-y-6 mt-6">
          <Card className="shadow-xl border-2 border-border/50">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Create New Comment List</CardTitle>
              <CardDescription>Add a new list to organize comments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter list ID (e.g., list_1)"
                  value={newListId}
                  onChange={(e) => setNewListId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
                  className="flex-1 h-12 text-base border-2"
                />
                <Button
                  onClick={handleCreateList}
                  disabled={!newListId.trim() || createListMutation.isPending}
                  className="h-12 px-6 gradient-bg hover:opacity-90 transition-opacity"
                >
                  {createListMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      Create
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-2 border-border/50">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Manage Comments</CardTitle>
              <CardDescription>Select a list to view and manage its comments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-bold">Select Comment List</label>
                <Select value={selectedListId} onValueChange={setSelectedListId} disabled={loadingListIds}>
                  <SelectTrigger className="w-full h-12 text-base border-2">
                    <SelectValue placeholder={loadingListIds ? 'Loading...' : 'Choose a list'} />
                  </SelectTrigger>
                  <SelectContent>
                    {commentListIds.map((listId) => {
                      const isLocked = lockedListIds.includes(listId);
                      const total = getTotalForList(listId);
                      return (
                        <SelectItem key={listId} value={listId}>
                          <div className="flex items-center gap-2">
                            {isLocked ? <Lock className="w-4 h-4 text-red-500" /> : <Unlock className="w-4 h-4 text-green-500" />}
                            <span>{listId}</span>
                            <Badge variant="secondary" className="ml-2">
                              {total} comments
                            </Badge>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {selectedListId && (
                <div className="space-y-6">
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={handleToggleLock}
                      variant={isListLocked ? 'destructive' : 'default'}
                      disabled={lockListMutation.isPending || unlockListMutation.isPending}
                      className="gap-2"
                    >
                      {isListLocked ? (
                        <>
                          <Unlock className="w-4 h-4" />
                          Unlock List
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          Lock List
                        </>
                      )}
                    </Button>
                    <Button onClick={handleResetList} variant="outline" disabled={resetListMutation.isPending} className="gap-2">
                      <RotateCcw className="w-4 h-4" />
                      Reset Used Status
                    </Button>
                    <Button onClick={handleDeleteList} variant="destructive" disabled={deleteListMutation.isPending} className="gap-2">
                      <Trash2 className="w-4 h-4" />
                      Delete List
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-bold">Add Single Comment</label>
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Enter comment text..."
                        value={newCommentContent}
                        onChange={(e) => setNewCommentContent(e.target.value)}
                        className="flex-1 min-h-[80px] border-2"
                      />
                      <Button
                        onClick={handleAddComment}
                        disabled={!newCommentContent.trim() || addCommentMutation.isPending}
                        className="h-full gradient-bg hover:opacity-90"
                      >
                        {addCommentMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-bold">Bulk Add Comments</label>
                    <Textarea
                      placeholder="Paste multiple comments (one per line)..."
                      value={bulkCommentText}
                      onChange={(e) => setBulkCommentText(e.target.value)}
                      className="min-h-[120px] border-2 font-mono text-sm"
                    />
                    <Button
                      onClick={handleBulkAddComments}
                      disabled={!bulkCommentText.trim() || addCommentMutation.isPending}
                      className="w-full gradient-bg-diagonal hover:opacity-90"
                    >
                      {addCommentMutation.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="w-5 h-5 mr-2" />
                          Add All Comments
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold">Comments in List</label>
                      <Badge variant="secondary" className="text-base px-3 py-1">
                        {comments.length} total
                      </Badge>
                    </div>
                    <ScrollArea className="h-[400px] rounded-lg border-2 p-4">
                      {loadingComments ? (
                        <div className="flex items-center justify-center h-32">
                          <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                      ) : comments.length === 0 ? (
                        <div className="flex items-center justify-center h-32 text-muted-foreground">No comments yet</div>
                      ) : (
                        <div className="space-y-3">
                          {comments.map((comment) => (
                            <div key={comment.id} className="flex items-start gap-3 p-4 rounded-lg bg-accent/5 border border-border/50 hover:border-accent/50 transition-colors">
                              <div className="flex-1 space-y-2">
                                <p className="text-sm leading-relaxed">{comment.content}</p>
                                <div className="flex items-center gap-2">
                                  <Badge variant={comment.used ? 'secondary' : 'default'} className="text-xs">
                                    {comment.used ? 'Used' : 'Available'}
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                onClick={() => handleRemoveComment(comment.id)}
                                variant="ghost"
                                size="sm"
                                disabled={removeCommentMutation.isPending}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images" className="mt-6">
          <AdminUserImageTable />
        </TabsContent>

        <TabsContent value="chat" className="mt-6">
          <AdminChatPanel />
        </TabsContent>

        <TabsContent value="list-checker" className="mt-6">
          <LiveListCheckerAdminSection />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <BulkGeneratorKeyManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
