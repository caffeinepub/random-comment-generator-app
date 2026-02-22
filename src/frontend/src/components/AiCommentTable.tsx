import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Copy, Check, Trash2, List, Clipboard } from 'lucide-react';
import { useGetAllAiComments, useDeleteAiComment } from '../hooks/useAiCommentQueries';
import { toast } from 'sonner';
import { useTypingEffect } from '../hooks/useTypingEffect';
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

function TypingComment({ content, delay }: { content: string; delay: number }) {
  const displayedText = useTypingEffect(content, 30, delay);
  return <div className="line-clamp-2 text-sm">{displayedText}</div>;
}

export default function AiCommentTable() {
  const { data: aiComments = [], isLoading, isFetching } = useGetAllAiComments();
  const { mutate: deleteComment } = useDeleteAiComment();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  const handleCopy = useCallback((content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success('Comment copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleCopyAll = useCallback(() => {
    if (aiComments.length === 0) {
      toast.error('No comments to copy');
      return;
    }

    const allComments = aiComments.map(comment => comment.content).join('\n');
    navigator.clipboard.writeText(allComments);
    setCopiedAll(true);
    toast.success(`${aiComments.length} comments copied to clipboard!`);
    setTimeout(() => setCopiedAll(false), 2000);
  }, [aiComments]);

  const handleDeleteClick = useCallback((id: string) => {
    setCommentToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (commentToDelete) {
      deleteComment(commentToDelete);
      setDeleteDialogOpen(false);
      setCommentToDelete(null);
    }
  }, [commentToDelete, deleteComment]);

  const formatTimestamp = useCallback((timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleString();
  }, []);

  const sortedComments = useMemo(() => {
    return [...aiComments].sort((a, b) => Number(b.timestamp - a.timestamp));
  }, [aiComments]);

  if (isLoading || isFetching) {
    return (
      <Card className="border-2 border-purple-200/50 dark:border-purple-800/50 rounded-3xl overflow-hidden shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <List className="w-6 h-6" />
            Generated Comments
          </CardTitle>
          <CardDescription>Loading comments...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4 rounded-xl" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (aiComments.length === 0) {
    return (
      <Card className="border-2 border-purple-200/50 dark:border-purple-800/50 rounded-3xl overflow-hidden shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <List className="w-6 h-6" />
            Generated Comments
          </CardTitle>
          <CardDescription>No AI comments generated yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Generate your first AI comment to see it here
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-2 border-purple-200/50 dark:border-purple-800/50 rounded-3xl overflow-hidden shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm animate-fade-in">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-xl">
                <List className="w-6 h-6" />
                Generated Comments
              </CardTitle>
              <CardDescription>
                {aiComments.length} comment{aiComments.length !== 1 ? 's' : ''} generated
              </CardDescription>
            </div>
            <Button
              onClick={handleCopyAll}
              variant="outline"
              className="h-10 px-4 rounded-2xl border-2 font-semibold transition-all duration-200 hover:scale-105 hover:shadow-md"
            >
              {copiedAll ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  Copied All!
                </>
              ) : (
                <>
                  <Clipboard className="w-4 h-4 mr-2" />
                  Copy All
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border-2 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-purple-50/50 dark:bg-purple-950/50 transition-colors duration-200">
                  <TableHead className="font-bold">Comment</TableHead>
                  <TableHead className="font-bold">App</TableHead>
                  <TableHead className="font-bold">Symbol</TableHead>
                  <TableHead className="font-bold">Timestamp</TableHead>
                  <TableHead className="font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedComments.map((comment, index) => (
                  <TableRow key={comment.id} className="transition-colors duration-200 hover:bg-purple-50/30 dark:hover:bg-purple-950/30">
                    <TableCell className="max-w-md">
                      <TypingComment content={comment.content} delay={index * 200} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-xl transition-all duration-200 hover:scale-105">
                        {comment.appLinkOrName}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-xl transition-all duration-200 hover:scale-105">
                        {comment.ratingSymbol}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatTimestamp(comment.timestamp)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          onClick={() => handleCopy(comment.content, comment.id)}
                          variant="ghost"
                          size="sm"
                          className="h-9 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-md"
                        >
                          {copiedId === comment.id ? (
                            <>
                              <Check className="w-4 h-4 mr-1 text-green-600" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-1" />
                              Copy
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleDeleteClick(comment.id)}
                          variant="ghost"
                          size="sm"
                          className="h-9 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-200 hover:scale-105"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl animate-scale-in">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete AI Comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this AI-generated comment. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl transition-all duration-200">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="rounded-2xl bg-destructive hover:bg-destructive/90 transition-all duration-200"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
