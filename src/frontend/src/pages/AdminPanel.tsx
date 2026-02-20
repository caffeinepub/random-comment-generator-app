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
      toast.error('Please enter at least one comment');
      return;
    }

    const comments = commentsText
      .split('\n')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (comments.length === 0) {
      toast.error('Please enter valid comments');
      return;
    }

    let completed = 0;
    comments.forEach((content, index) => {
      const commentId = `comment_${Date.now()}_${index}`;
      addComment(
        { listId: selectedListId, id: commentId, content },
        {
          onSuccess: () => {
            completed++;
            if (completed === comments.length) {
              setCommentsText('');
              toast.success(`${comments.length} comment(s) added successfully!`);
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
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    if (!file.name.endsWith('.txt')) {
      toast.error('Please select a .txt file');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCommentsText(content);
      toast.success('File loaded! Review and click "Add Comments" to save.');
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteList = (listId: string) => {
    if (confirm(`Are you sure you want to delete the list "${listId}"?`)) {
      deleteList(listId, {
        onSuccess: () => {
          if (selectedListId === listId) {
            setSelectedListId(null);
          }
        },
      });
    }
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
    if (!selectedListId || !commentToDelete) return;

    removeComment(
      { listId: selectedListId, commentId: commentToDelete },
      {
        onSuccess: () => {
          setShowDeleteCommentDialog(false);
          setCommentToDelete(null);
        },
      }
    );
  };

  const handleClearAll = () => {
    setShowClearAllDialog(true);
  };

  const confirmClearAll = () => {
    clearEverything(undefined, {
      onSuccess: () => {
        setShowClearAllDialog(false);
        setSelectedListId(null);
        toast.success('All data cleared successfully!');
      },
    });
  };

  const handleDownloadAll = async () => {
    try {
      await exportAllData();
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 py-4 animate-fade-slide-in">
      <div className="text-center space-y-3">
        <h2 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-teal-600 to-orange-600 bg-clip-text text-transparent leading-tight">
          Admin Panel
        </h2>
        <p className="text-muted-foreground text-lg">
          Manage comments, images, chat, live lists, music, and settings
        </p>
      </div>

      {/* Admin Actions Bar */}
      <div className="flex flex-wrap gap-3 justify-center">
        <Button
          onClick={handleDownloadAll}
          variant="outline"
          className="h-12 px-6 rounded-2xl border-2 border-blue-500/50 font-bold hover:bg-blue-500/10"
        >
          <Download className="w-5 h-5 mr-2" />
          Download All Data
        </Button>
        <Button
          onClick={handleClearAll}
          variant="outline"
          className="h-12 px-6 rounded-2xl border-2 border-red-500/50 text-red-600 dark:text-red-400 hover:bg-red-500/10 font-bold"
        >
          <AlertTriangle className="w-5 h-5 mr-2" />
          Clear All Data
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 h-14 rounded-3xl p-1.5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm mb-8 shadow-lg border-2 border-blue-200/50 dark:border-blue-800/50">
          <TabsTrigger
            value="comments"
            className="text-base font-bold rounded-2xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-teal-500 data-[state=active]:text-white transition-all duration-300"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            Comments
          </TabsTrigger>
          <TabsTrigger
            value="images"
            className="text-base font-bold rounded-2xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-teal-500 data-[state=active]:text-white transition-all duration-300"
          >
            <ImageIcon className="w-5 h-5 mr-2" />
            Images
          </TabsTrigger>
          <TabsTrigger
            value="chat"
            className="text-base font-bold rounded-2xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-teal-500 data-[state=active]:text-white transition-all duration-300"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger
            value="liveList"
            className="text-base font-bold rounded-2xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-teal-500 data-[state=active]:text-white transition-all duration-300"
          >
            <ListIcon className="w-5 h-5 mr-2" />
            Live List
          </TabsTrigger>
          <TabsTrigger
            value="music"
            className="text-base font-bold rounded-2xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-teal-500 data-[state=active]:text-white transition-all duration-300"
          >
            <Music className="w-5 h-5 mr-2" />
            Music
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="text-base font-bold rounded-2xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-teal-500 data-[state=active]:text-white transition-all duration-300"
          >
            <SettingsIcon className="w-5 h-5 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comments" className="mt-0 space-y-8">
          {/* Create Comment List */}
          <Card className="border-2 border-blue-200/50 dark:border-blue-800/50 rounded-3xl overflow-hidden shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="relative bg-gradient-to-r from-blue-500/10 via-teal-500/10 to-orange-500/10">
              <CardTitle className="text-2xl">Create Comment List</CardTitle>
              <CardDescription className="text-base">
                Add a new comment list for generators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 relative pt-6">
              <div className="space-y-2">
                <Label htmlFor="newListId" className="text-sm font-semibold">
                  List ID
                </Label>
                <Input
                  id="newListId"
                  value={newListId}
                  onChange={(e) => setNewListId(e.target.value)}
                  placeholder="e.g., positive-reviews"
                  className="h-12 text-base rounded-2xl border-2"
                />
              </div>

              <Button
                onClick={handleCreateList}
                disabled={!newListId.trim() || isCreating}
                className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
              >
                {isCreating ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-6 h-6 mr-2" />
                    Create List
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Manage Comments */}
          <Card className="border-2 border-blue-200/50 dark:border-blue-800/50 rounded-3xl overflow-hidden shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="relative bg-gradient-to-r from-blue-500/10 via-teal-500/10 to-orange-500/10">
              <CardTitle className="text-2xl">Manage Comments</CardTitle>
              <CardDescription className="text-base">
                Add comments to existing lists (paste/type or upload file)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 relative pt-6">
              <div className="space-y-2">
                <Label htmlFor="selectList" className="text-sm font-semibold">
                  Select Comment List
                </Label>
                <div className="flex gap-3">
                  <select
                    id="selectList"
                    value={selectedListId || ''}
                    onChange={(e) => setSelectedListId(e.target.value || null)}
                    className="flex-1 h-12 text-base rounded-2xl border-2 px-4 bg-background"
                  >
                    <option value="">Choose a list...</option>
                    {listIds.map((listId) => (
                      <option key={listId} value={listId}>
                        {listId}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedListId && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="commentsText" className="text-sm font-semibold">
                        Add Comments (one per line)
                      </Label>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          variant="outline"
                          size="sm"
                          className="h-9 px-4 rounded-xl border-2 font-semibold"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload .txt
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".txt"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>
                    </div>
                    <Textarea
                      id="commentsText"
                      value={commentsText}
                      onChange={(e) => setCommentsText(e.target.value)}
                      placeholder="Enter comments, one per line..."
                      rows={6}
                      className="rounded-2xl border-2 text-base resize-none"
                    />
                  </div>

                  <Button
                    onClick={handleAddComments}
                    disabled={!commentsText.trim() || isAdding}
                    className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    size="lg"
                  >
                    {isAdding ? (
                      <>
                        <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="w-6 h-6 mr-2" />
                        Add Comments
                      </>
                    )}
                  </Button>

                  {/* Current Comments */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">
                      Current Comments ({selectedListComments.length})
                    </Label>
                    {selectedListComments.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No comments in this list yet
                      </div>
                    ) : (
                      <ScrollArea className="h-[300px] rounded-2xl border-2 border-blue-200/50 dark:border-blue-800/50 p-4">
                        <div className="space-y-2">
                          {selectedListComments.map((comment) => (
                            <div
                              key={comment.id}
                              className="flex items-start justify-between gap-3 p-3 rounded-xl bg-white/50 dark:bg-gray-900/50 border border-blue-200/50 dark:border-blue-800/50"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm break-words">{comment.content}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge
                                    variant={comment.used ? 'secondary' : 'outline'}
                                    className="text-xs"
                                  >
                                    {comment.used ? 'Used' : 'Available'}
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                onClick={() => handleDeleteComment(comment.id)}
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-lg hover:bg-red-500/10 hover:text-red-600 flex-shrink-0"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Comment Lists Overview */}
          <Card className="border-2 border-blue-200/50 dark:border-blue-800/50 rounded-3xl overflow-hidden shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <CardHeader className="relative bg-gradient-to-r from-blue-500/10 via-teal-500/10 to-orange-500/10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">All Comment Lists ({listIds.length})</CardTitle>
                  <CardDescription className="text-base">
                    Manage locks and view totals
                  </CardDescription>
                </div>
                {lockedTotal > 0 && (
                  <Badge
                    variant="outline"
                    className="text-lg px-4 py-1.5 rounded-xl border-2 border-red-500/50 font-bold"
                  >
                    {lockedTotal} locked
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="relative pt-6">
              {listIds.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/20 to-teal-500/20 flex items-center justify-center mx-auto">
                    <MessageSquare className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold mb-2">No comment lists created yet</p>
                    <p className="text-muted-foreground">Create your first list above</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {listIds.map((listId) => {
                    const isLocked = lockedListIdsSet.has(listId);
                    const total = bulkTotals.find(([id]) => id === listId)?.[1] || 0n;

                    return (
                      <div
                        key={listId}
                        className="p-4 rounded-2xl border-2 border-blue-200/50 dark:border-blue-800/50 bg-white/50 dark:bg-gray-900/50 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-lg truncate">{listId}</h3>
                          <Badge variant="outline" className="text-sm px-3 py-1 rounded-xl border-2">
                            {Number(total)} total
                          </Badge>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleToggleLock(listId)}
                            variant="outline"
                            size="sm"
                            className={`flex-1 h-10 rounded-xl border-2 font-semibold ${
                              isLocked
                                ? 'border-red-500/50 text-red-600 dark:text-red-400 hover:bg-red-500/10'
                                : 'border-green-500/50 text-green-600 dark:text-green-400 hover:bg-green-500/10'
                            }`}
                          >
                            {isLocked ? (
                              <>
                                <Lock className="w-4 h-4 mr-2" />
                                Unlock
                              </>
                            ) : (
                              <>
                                <Unlock className="w-4 h-4 mr-2" />
                                Lock
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={() => handleDeleteList(listId)}
                            variant="outline"
                            size="sm"
                            className="h-10 px-4 rounded-xl border-2 border-red-500/50 text-red-600 dark:text-red-400 hover:bg-red-500/10 font-semibold"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images" className="mt-0">
          <AdminUserImageTable />
        </TabsContent>

        <TabsContent value="chat" className="mt-0">
          <AdminChatPanel />
        </TabsContent>

        <TabsContent value="liveList" className="mt-0">
          <AdminLiveListPanel />
        </TabsContent>

        <TabsContent value="music" className="mt-0">
          <AdminMusicManager />
        </TabsContent>

        <TabsContent value="settings" className="mt-0">
          <BulkGeneratorKeyManager />
        </TabsContent>
      </Tabs>

      {/* Clear All Confirmation Dialog */}
      <AlertDialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-6 h-6" />
              Clear All Data?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-semibold">
                This will permanently delete ALL data including:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>All comment lists and comments</li>
                <li>All app/event entries and usernames</li>
                <li>All user images</li>
                <li>All chat messages</li>
                <li>Bulk generator key</li>
              </ul>
              <p className="font-bold text-red-600 dark:text-red-400">
                This action cannot be undone!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClearAll}
              disabled={isClearing}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isClearing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Clearing...
                </>
              ) : (
                'Yes, Clear Everything'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Comment Confirmation Dialog */}
      <AlertDialog open={showDeleteCommentDialog} onOpenChange={setShowDeleteCommentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCommentToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteComment}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
