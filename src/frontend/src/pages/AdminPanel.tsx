import { useState, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare,
  Image as ImageIcon,
  MessageCircle,
  Settings as SettingsIcon,
  Lock,
  Unlock,
  Trash2,
  Plus,
  Upload,
  List as ListIcon,
  Download,
  AlertTriangle,
  Music,
  X,
  Sparkles,
} from 'lucide-react';
import {
  useGetCommentListIds,
  useCreateCommentList,
  useAddComment,
  useDeleteCommentList,
  useGetCommentList,
  useLockCommentList,
  useUnlockCommentList,
  useGetLockedCommentListIds,
  useGetAllBulkCommentTotals,
  useRemoveComment,
  useClearEverything,
} from '../hooks/useQueries';
import { toast } from 'sonner';
import AdminChatPanel from '../components/AdminChatPanel';
import AdminUserImageTable from '../components/AdminUserImageTable';
import BulkGeneratorKeyManager from '../components/BulkGeneratorKeyManager';
import AdminLiveListPanel from './AdminLiveListPanel';
import AdminMusicManager from '../components/AdminMusicManager';
import AiCommentGenerator from '../components/AiCommentGenerator';
import Css3DCube from '../components/Css3DCube';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { exportAllData } from '../utils/dataExport';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('comments');
  const [newListId, setNewListId] = useState('');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [commentsText, setCommentsText] = useState('');
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [showDeleteCommentDialog, setShowDeleteCommentDialog] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: listIds = [] } = useGetCommentListIds();
  const { data: lockedListIds = [] } = useGetLockedCommentListIds();
  const { data: selectedListComments = [] } = useGetCommentList(selectedListId);
  const { data: bulkTotals = [] } = useGetAllBulkCommentTotals();
  const { mutate: createList, isPending: isCreating } = useCreateCommentList();
  const { mutate: addComment, isPending: isAdding } = useAddComment();
  const { mutate: deleteList, isPending: isDeleting } = useDeleteCommentList();
  const { mutate: lockList } = useLockCommentList();
  const { mutate: unlockList } = useUnlockCommentList();
  const { mutate: removeComment } = useRemoveComment();
  const { mutate: clearEverything, isPending: isClearing } = useClearEverything();

  const lockedListIdsSet = new Set(lockedListIds);
  const lockedTotal = lockedListIds.length;

  const handleCreateList = () => {
    if (!newListId.trim()) {
      toast.error('Please enter a list ID');
      return;
    }

    createList(newListId.trim(), {
      onSuccess: () => {
        setNewListId('');
      },
    });
  };

  const handleAddComments = () => {
    if (!selectedListId) {
      toast.error('Please select a comment list');
      return;
    }

    if (!commentsText.trim()) {
      toast.error('Please enter comments');
      return;
    }

    const lines = commentsText.split('\n').filter((line) => line.trim());
    let addedCount = 0;

    lines.forEach((line, index) => {
      const commentId = `comment_${Date.now()}_${index}`;
      addComment(
        { listId: selectedListId, id: commentId, content: line.trim() },
        {
          onSuccess: () => {
            addedCount++;
            if (addedCount === lines.length) {
              setCommentsText('');
              toast.success(`${addedCount} comment${addedCount !== 1 ? 's' : ''} added successfully`);
            }
          },
        }
      );
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!selectedListId) {
      toast.error('Please select a comment list first');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter((line) => line.trim());
      let addedCount = 0;

      lines.forEach((line, index) => {
        const commentId = `comment_${Date.now()}_${index}`;
        addComment(
          { listId: selectedListId, id: commentId, content: line.trim() },
          {
            onSuccess: () => {
              addedCount++;
              if (addedCount === lines.length) {
                toast.success(`${addedCount} comment${addedCount !== 1 ? 's' : ''} added from file`);
              }
            },
          }
        );
      });
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteList = () => {
    if (!selectedListId) {
      toast.error('Please select a comment list');
      return;
    }

    deleteList(selectedListId, {
      onSuccess: () => {
        setSelectedListId(null);
      },
    });
  };

  const handleToggleLock = (listId: string) => {
    if (lockedListIdsSet.has(listId)) {
      unlockList(listId);
    } else {
      lockList(listId);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    setCommentToDelete(commentId);
    setShowDeleteCommentDialog(true);
  };

  const confirmDeleteComment = () => {
    if (selectedListId && commentToDelete) {
      removeComment({ listId: selectedListId, commentId: commentToDelete });
    }
    setShowDeleteCommentDialog(false);
    setCommentToDelete(null);
  };

  const handleClearAll = () => {
    clearEverything();
    setShowClearAllDialog(false);
  };

  const handleExportData = async () => {
    try {
      await exportAllData();
      toast.success('Data exported successfully!');
    } catch (error) {
      toast.error('Failed to export data');
      console.error('Export error:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-4 animate-fade-slide-in relative">
      {/* 3D Cube - only visible on AI Comments tab */}
      {activeTab === 'ai-comments' && <Css3DCube />}

      <div className="text-center space-y-3">
        <h2 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-teal-600 to-orange-600 bg-clip-text text-transparent leading-tight">
          Admin Panel
        </h2>
        <p className="text-muted-foreground text-lg">Manage comments, images, chat, and settings</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 h-14 rounded-3xl p-1.5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-lg border-2 border-blue-200/50 dark:border-blue-800/50">
          <TabsTrigger
            value="comments"
            className="text-sm font-bold rounded-2xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-teal-500 data-[state=active]:text-white transition-all duration-300"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Comments
          </TabsTrigger>
          <TabsTrigger
            value="ai-comments"
            className="text-sm font-bold rounded-2xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white transition-all duration-300"
          >
            <Sparkles className="w-4 h-4 mr-1" />
            AI Comments
          </TabsTrigger>
          <TabsTrigger
            value="images"
            className="text-sm font-bold rounded-2xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-teal-500 data-[state=active]:text-white transition-all duration-300"
          >
            <ImageIcon className="w-4 h-4 mr-1" />
            Images
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="text-sm font-bold rounded-2xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-teal-500 data-[state=active]:text-white transition-all duration-300"
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            Chat
          </TabsTrigger>
          <TabsTrigger
            value="liveList"
            className="text-sm font-bold rounded-2xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-teal-500 data-[state=active]:text-white transition-all duration-300"
          >
            <ListIcon className="w-4 h-4 mr-1" />
            Live List
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="text-sm font-bold rounded-2xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-teal-500 data-[state=active]:text-white transition-all duration-300"
          >
            <SettingsIcon className="w-4 h-4 mr-1" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comments" className="mt-6 space-y-6">
          {/* Bulk Totals Display */}
          <Card className="border-2 border-blue-200/50 dark:border-blue-800/50 rounded-3xl overflow-hidden shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-500/10 via-teal-500/10 to-orange-500/10">
              <CardTitle className="flex items-center gap-3">
                <ListIcon className="w-6 h-6" />
                Bulk Comment Totals
              </CardTitle>
              <CardDescription>Overview of all comment lists</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bulkTotals.map(([listId, total]) => (
                  <div
                    key={listId}
                    className="p-4 rounded-2xl border-2 border-blue-200/50 dark:border-blue-800/50 bg-gradient-to-br from-blue-50 to-teal-50 dark:from-blue-950 dark:to-teal-950 transition-all duration-200 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {lockedListIdsSet.has(listId) ? (
                          <Lock className="w-4 h-4 text-red-600 dark:text-red-400" />
                        ) : (
                          <Unlock className="w-4 h-4 text-green-600 dark:text-green-400" />
                        )}
                        <span className="font-semibold text-sm">{listId}</span>
                      </div>
                      <Badge variant="secondary" className="rounded-xl font-bold">
                        {Number(total)}
                      </Badge>
                    </div>
                  </div>
                ))}
                {bulkTotals.length === 0 && (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    No comment lists created yet
                  </div>
                )}
              </div>
              <div className="mt-4 p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/50 border-2 border-blue-200/50 dark:border-blue-800/50">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Locked Lists:</span>
                  <Badge variant="outline" className="rounded-xl font-bold">
                    {lockedTotal}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Create New List */}
          <Card className="border-2 border-blue-200/50 dark:border-blue-800/50 rounded-3xl overflow-hidden shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-500/10 via-teal-500/10 to-orange-500/10">
              <CardTitle className="flex items-center gap-3">
                <Plus className="w-6 h-6" />
                Create New Comment List
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex gap-3">
                <Input
                  value={newListId}
                  onChange={(e) => setNewListId(e.target.value)}
                  placeholder="Enter list ID..."
                  className="h-12 text-base rounded-2xl border-2 transition-all duration-200 focus:scale-[1.01] focus:ring-2 focus:ring-blue-500"
                />
                <Button
                  onClick={handleCreateList}
                  disabled={isCreating || !newListId.trim()}
                  className="h-12 px-6 rounded-2xl bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white font-bold transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Manage Comments */}
          <Card className="border-2 border-blue-200/50 dark:border-blue-800/50 rounded-3xl overflow-hidden shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-500/10 via-teal-500/10 to-orange-500/10">
              <CardTitle className="flex items-center gap-3">
                <MessageSquare className="w-6 h-6" />
                Manage Comments
              </CardTitle>
              <CardDescription>Add, view, and manage comments in lists</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="listSelect" className="text-sm font-semibold">
                  Select Comment List
                </Label>
                <select
                  id="listSelect"
                  value={selectedListId || ''}
                  onChange={(e) => setSelectedListId(e.target.value || null)}
                  className="w-full h-12 text-base rounded-2xl border-2 px-4 bg-background transition-all duration-200 hover:border-blue-400 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a list...</option>
                  {listIds.map((listId) => (
                    <option key={listId} value={listId}>
                      {listId} {lockedListIdsSet.has(listId) ? '🔒' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {selectedListId && (
                <>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleToggleLock(selectedListId)}
                      variant="outline"
                      className="flex-1 h-12 rounded-2xl border-2 font-semibold transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                    >
                      {lockedListIdsSet.has(selectedListId) ? (
                        <>
                          <Unlock className="w-5 h-5 mr-2" />
                          Unlock List
                        </>
                      ) : (
                        <>
                          <Lock className="w-5 h-5 mr-2" />
                          Lock List
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleDeleteList}
                      disabled={isDeleting}
                      variant="destructive"
                      className="flex-1 h-12 rounded-2xl font-semibold transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                    >
                      <Trash2 className="w-5 h-5 mr-2" />
                      Delete List
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="commentsText" className="text-sm font-semibold">
                      Add Comments (one per line)
                    </Label>
                    <Textarea
                      id="commentsText"
                      value={commentsText}
                      onChange={(e) => setCommentsText(e.target.value)}
                      placeholder="Enter comments, one per line..."
                      rows={6}
                      className="text-base rounded-2xl border-2 transition-all duration-200 focus:scale-[1.01] focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={handleAddComments}
                      disabled={isAdding || !commentsText.trim()}
                      className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white font-bold transition-all duration-200 hover:scale-[1.02] active:scale-95"
                    >
                      {isAdding ? 'Adding...' : 'Add Comments'}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      className="h-12 px-6 rounded-2xl border-2 font-semibold transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      Upload File
                    </Button>
                  </div>

                  {selectedListComments.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">
                        Comments in List ({selectedListComments.length})
                      </Label>
                      <ScrollArea className="h-64 rounded-2xl border-2 p-4">
                        <div className="space-y-2">
                          {selectedListComments.map((comment) => (
                            <div
                              key={comment.id}
                              className="flex items-start justify-between p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/50 border border-blue-200/50 dark:border-blue-800/50 transition-all duration-200 hover:shadow-md"
                            >
                              <span className="text-sm flex-1">{comment.content}</span>
                              <Button
                                onClick={() => handleDeleteComment(comment.id)}
                                variant="ghost"
                                size="sm"
                                className="ml-2 h-8 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-comments" className="mt-6">
          <AiCommentGenerator />
        </TabsContent>

        <TabsContent value="images" className="mt-6">
          <AdminUserImageTable />
        </TabsContent>

        <TabsContent value="chat" className="mt-6">
          <AdminChatPanel />
        </TabsContent>

        <TabsContent value="liveList" className="mt-6">
          <AdminLiveListPanel />
        </TabsContent>

        <TabsContent value="settings" className="mt-6 space-y-6">
          <BulkGeneratorKeyManager />
          <AdminMusicManager />

          <Card className="border-2 border-red-200/50 dark:border-red-800/50 rounded-3xl overflow-hidden shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10">
              <CardTitle className="flex items-center gap-3 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-6 h-6" />
                Danger Zone
              </CardTitle>
              <CardDescription>Irreversible actions - use with caution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="flex gap-3">
                <Button
                  onClick={handleExportData}
                  variant="outline"
                  className="flex-1 h-12 rounded-2xl border-2 font-semibold transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Export All Data
                </Button>
                <Button
                  onClick={() => setShowClearAllDialog(true)}
                  disabled={isClearing}
                  variant="destructive"
                  className="flex-1 h-12 rounded-2xl font-semibold transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  Clear Everything
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
        <AlertDialogContent className="rounded-3xl animate-scale-in">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Everything?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete ALL data including comments, images, messages, and settings. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl transition-all duration-200">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              className="rounded-2xl bg-destructive hover:bg-destructive/90 transition-all duration-200"
            >
              Clear Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteCommentDialog} onOpenChange={setShowDeleteCommentDialog}>
        <AlertDialogContent className="rounded-3xl animate-scale-in">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this comment. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl transition-all duration-200">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteComment}
              className="rounded-2xl bg-destructive hover:bg-destructive/90 transition-all duration-200"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
