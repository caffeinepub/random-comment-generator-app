import React, { useState, useRef } from 'react';
import {
  MessageSquare, Plus, Trash2, Lock, Unlock, Upload, BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useGetCommentLists,
  useCreateCommentList,
  useDeleteCommentList,
  useLockCommentList,
  useAddCommentsToList,
  useDeleteCommentFromList,
  useCommentStats,
} from '../hooks/useQueries';

export default function AdminCommentsPanel() {
  const [newListName, setNewListName] = useState('');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [bulkText, setBulkText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: lists = [] } = useGetCommentLists();
  const createList = useCreateCommentList();
  const deleteList = useDeleteCommentList();
  const lockList = useLockCommentList();
  const addComments = useAddCommentsToList();
  const deleteComment = useDeleteCommentFromList();
  const { data: stats } = useCommentStats(selectedListId);

  const selectedList = lists.find(l => l.id === selectedListId) ?? null;

  const handleCreateList = async () => {
    const name = newListName.trim();
    if (!name) { toast.error('Enter a list name'); return; }
    try {
      const created = await createList.mutateAsync(name);
      setNewListName('');
      setSelectedListId(created.id);
      toast.success(`List "${name}" created`);
    } catch {
      toast.error('Failed to create list');
    }
  };

  const handleDeleteList = async () => {
    if (!selectedListId || !selectedList) return;
    try {
      await deleteList.mutateAsync(selectedListId);
      setSelectedListId(null);
      toast.success(`List "${selectedList.name}" deleted`);
    } catch {
      toast.error('Failed to delete list');
    }
  };

  const handleToggleLock = async () => {
    if (!selectedListId || !selectedList) return;
    try {
      await lockList.mutateAsync({ listId: selectedListId, locked: !selectedList.locked });
      toast.success(selectedList.locked ? 'List unlocked' : 'List locked');
    } catch {
      toast.error('Failed to update lock status');
    }
  };

  const handleAddComments = async () => {
    if (!selectedListId) { toast.error('Select a list first'); return; }
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) { toast.error('Enter at least one comment'); return; }
    try {
      await addComments.mutateAsync({ listId: selectedListId, newComments: lines });
      setBulkText('');
      toast.success(`Added ${lines.length} comment${lines.length > 1 ? 's' : ''}`);
    } catch {
      toast.error('Failed to add comments');
    }
  };

  const handleUploadFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!selectedListId) { toast.error('Select a list first'); return; }
    try {
      const text = await file.text();
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length === 0) { toast.error('File is empty'); return; }
      await addComments.mutateAsync({ listId: selectedListId, newComments: lines });
      toast.success(`Uploaded ${lines.length} comment${lines.length > 1 ? 's' : ''} from file`);
    } catch {
      toast.error('Failed to read file');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteComment = async (index: number) => {
    if (!selectedListId) return;
    try {
      await deleteComment.mutateAsync({ listId: selectedListId, commentIndex: index });
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const totalComments = lists.reduce((sum, l) => sum + l.comments.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-teal-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Manage Comments</h2>
          <p className="text-sm text-muted-foreground">Add, view, and manage comments in lists</p>
        </div>
      </div>

      {/* Bulk Comment Totals */}
      <div className="bg-card border border-teal-500/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-teal-400" />
          <h3 className="font-medium text-foreground">Bulk Comment Totals</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-teal-500/5 border border-teal-500/15 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{lists.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total Lists</p>
          </div>
          <div className="bg-teal-500/5 border border-teal-500/15 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{totalComments}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total Comments</p>
          </div>
        </div>
      </div>

      {/* Create New List */}
      <div className="bg-card border border-teal-500/20 rounded-xl p-4">
        <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-teal-400" />
          Create New Comment List
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newListName}
            onChange={e => setNewListName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateList()}
            placeholder="List name..."
            className="flex-1 px-3 py-2 rounded-lg border border-teal-500/20 bg-background/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-sm"
          />
          <button
            onClick={handleCreateList}
            disabled={createList.isPending || !newListName.trim()}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-500 text-white font-medium text-sm disabled:opacity-50 transition-all hover:from-teal-500 hover:to-emerald-400 whitespace-nowrap"
          >
            {createList.isPending ? 'Creating...' : 'Create List'}
          </button>
        </div>
      </div>

      {/* Manage Comments Section */}
      <div className="bg-card border border-teal-500/20 rounded-xl p-4 space-y-4">
        <h3 className="font-medium text-foreground flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-teal-400" />
          Manage Comments
        </h3>

        {/* Select Comment List */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Select Comment List</label>
          <select
            value={selectedListId ?? ''}
            onChange={e => setSelectedListId(e.target.value || null)}
            className="w-full px-3 py-2.5 rounded-lg border border-teal-500/20 bg-background/60 text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/40"
          >
            <option value="">Select a list...</option>
            {lists.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>

        {/* Stats for selected list */}
        {selectedListId && stats && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-teal-500/5 border border-teal-500/15 text-sm">
            <BarChart3 className="w-4 h-4 text-teal-400 shrink-0" />
            <span className="text-muted-foreground">
              <span className="text-foreground font-medium">Used: {stats.used}</span>
              {' | '}
              <span className="text-foreground font-medium">Remaining: {stats.remaining}</span>
              {' | '}
              <span className="text-foreground font-medium">Total: {stats.total}</span>
            </span>
          </div>
        )}

        {/* Lock / Delete buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleToggleLock}
            disabled={!selectedListId || lockList.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-teal-500/20 bg-teal-500/5 text-foreground font-medium text-sm hover:bg-teal-500/15 disabled:opacity-40 transition-colors"
          >
            {selectedList?.locked ? <Unlock className="w-4 h-4 text-teal-400" /> : <Lock className="w-4 h-4 text-teal-400" />}
            {selectedList?.locked ? 'Unlock List' : 'Lock List'}
          </button>
          <button
            onClick={handleDeleteList}
            disabled={!selectedListId || deleteList.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-destructive/40 text-destructive font-medium text-sm hover:bg-destructive/10 disabled:opacity-40 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete List
          </button>
        </div>

        {/* Add Comments (one per line) */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Add Comments (one per line)</label>
          <textarea
            value={bulkText}
            onChange={e => setBulkText(e.target.value)}
            placeholder="Enter comments, one per line..."
            rows={8}
            disabled={!selectedListId || selectedList?.locked}
            className="w-full px-3 py-2.5 rounded-lg border border-teal-500/20 bg-background/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-sm resize-y disabled:opacity-50"
          />
        </div>

        {/* Add Comments + Upload File buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleAddComments}
            disabled={!selectedListId || selectedList?.locked || addComments.isPending || !bulkText.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-500 text-white font-medium text-sm disabled:opacity-50 transition-all hover:from-teal-500 hover:to-emerald-400"
          >
            {addComments.isPending ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Add Comments
          </button>
          <button
            onClick={handleUploadFile}
            disabled={!selectedListId || selectedList?.locked}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-teal-500/20 bg-teal-500/5 text-foreground font-medium text-sm hover:bg-teal-500/15 disabled:opacity-50 transition-colors"
          >
            <Upload className="w-4 h-4 text-teal-400" />
            Upload File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Comment List */}
        {selectedList && selectedList.comments.length > 0 && (
          <div className="space-y-1 max-h-60 overflow-y-auto">
            <p className="text-xs text-muted-foreground mb-2">{selectedList.comments.length} comment{selectedList.comments.length !== 1 ? 's' : ''}</p>
            {selectedList.comments.map((comment, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-teal-500/5 border border-teal-500/10 group">
                <span className="text-xs text-muted-foreground shrink-0 w-5 mt-0.5">{i + 1}.</span>
                <p className="flex-1 text-sm text-foreground leading-relaxed break-words">{comment}</p>
                <button
                  onClick={() => handleDeleteComment(i)}
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
