import React, { useState } from 'react';
import { Key, Plus, Trash2, Edit2, Check, X, Eye, EyeOff, RefreshCw, Copy, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useGetAccessKeys,
  useCreateAccessKey,
  useUpdateAccessKey,
  useDeleteAccessKey,
} from '../hooks/useAccessKeysQueries';
import { AccessKey } from '../backend';

function generateRandomKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const segments = [8, 4, 4, 4, 12];
  return segments
    .map(len => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join(''))
    .join('-');
}

interface EditState {
  description: string;
  key: string;
  showKey: boolean;
}

export default function AdminAccessKeysPanel() {
  const [newDescription, setNewDescription] = useState('');
  const [newKey, setNewKey] = useState('');
  const [showNewKey, setShowNewKey] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ description: '', key: '', showKey: false });
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const { data: accessKeys = [], isLoading } = useGetAccessKeys();
  const createMutation = useCreateAccessKey();
  const updateMutation = useUpdateAccessKey();
  const deleteMutation = useDeleteAccessKey();

  const handleCreate = async () => {
    const desc = newDescription.trim();
    const key = newKey.trim();
    if (!desc) { toast.error('Enter a description'); return; }
    if (!key) { toast.error('Enter a key string'); return; }
    try {
      await createMutation.mutateAsync({ description: desc, key });
      setNewDescription('');
      setNewKey('');
      toast.success('Access key created successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create access key');
    }
  };

  const handleStartEdit = (ak: AccessKey) => {
    setEditingKey(ak.key);
    setEditState({ description: ak.description, key: ak.key, showKey: false });
    setDeletingKey(null);
  };

  const handleSaveEdit = async (originalKey: string) => {
    const desc = editState.description.trim();
    const key = editState.key.trim();
    if (!desc) { toast.error('Description cannot be empty'); return; }
    if (!key) { toast.error('Key string cannot be empty'); return; }
    try {
      await updateMutation.mutateAsync({ key: originalKey, newDescription: desc, newKey: key });
      setEditingKey(null);
      toast.success('Access key updated');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update access key');
    }
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
  };

  const handleDeleteClick = (key: string) => {
    if (deletingKey === key) {
      // Second click — confirm delete
      handleConfirmDelete(key);
    } else {
      setDeletingKey(key);
      setEditingKey(null);
      setTimeout(() => setDeletingKey(prev => prev === key ? null : prev), 5000);
    }
  };

  const handleConfirmDelete = async (key: string) => {
    try {
      await deleteMutation.mutateAsync(key);
      setDeletingKey(null);
      toast.success('Access key deleted');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete access key');
    }
  };

  const handleCopyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      toast.success('Key copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30 flex items-center justify-center">
          <Key className="w-5 h-5 text-teal-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Access Key Management</h2>
          <p className="text-sm text-muted-foreground">Create and manage global access keys for the Bulk Generator</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="p-3 rounded-xl bg-teal-500/5 border border-teal-500/15 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Access keys are <span className="text-teal-400 font-medium">global</span> — any user who receives a key can unlock the Bulk Comment Generator. Deleted keys are immediately invalidated.
        </p>
      </div>

      {/* Create new key */}
      <div className="bg-card border border-teal-500/20 rounded-xl p-4 space-y-3">
        <h3 className="font-medium text-foreground flex items-center gap-2">
          <Plus className="w-4 h-4 text-teal-400" />
          Create New Access Key
        </h3>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Description / Label</label>
          <input
            type="text"
            value={newDescription}
            onChange={e => setNewDescription(e.target.value)}
            placeholder="e.g. User John Doe, Team Alpha..."
            className="w-full px-3 py-2 rounded-lg border border-teal-500/20 bg-background/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Key String</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type={showNewKey ? 'text' : 'password'}
                value={newKey}
                onChange={e => setNewKey(e.target.value)}
                placeholder="Enter or generate a key..."
                className="w-full px-3 py-2 pr-10 rounded-lg border border-teal-500/20 bg-background/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowNewKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-teal-400 transition-colors"
              >
                {showNewKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              type="button"
              onClick={() => { setNewKey(generateRandomKey()); setShowNewKey(true); }}
              className="px-3 py-2 rounded-lg border border-teal-500/20 bg-teal-500/5 text-teal-400 hover:bg-teal-500/15 transition-colors text-xs flex items-center gap-1.5 whitespace-nowrap"
              title="Generate random key"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Generate
            </button>
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={createMutation.isPending || !newDescription.trim() || !newKey.trim()}
          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-500 text-white font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:from-teal-500 hover:to-emerald-400 transition-all"
        >
          {createMutation.isPending ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          {createMutation.isPending ? 'Creating...' : 'Create Access Key'}
        </button>
      </div>

      {/* Keys list */}
      <div className="bg-card border border-teal-500/20 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <Key className="w-4 h-4 text-teal-400" />
            Active Keys
          </h3>
          <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20">
            {accessKeys.length} key{accessKeys.length !== 1 ? 's' : ''}
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : accessKeys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Key className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No access keys yet</p>
            <p className="text-xs mt-1">Create one above to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {accessKeys.map((ak) => (
              <div
                key={ak.key}
                className={`rounded-xl border p-3 transition-all ${
                  deletingKey === ak.key
                    ? 'border-destructive/40 bg-destructive/5'
                    : editingKey === ak.key
                    ? 'border-teal-500/40 bg-teal-500/5'
                    : 'border-teal-500/15 bg-background/40'
                }`}
              >
                {editingKey === ak.key ? (
                  /* Edit mode */
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                      <input
                        type="text"
                        value={editState.description}
                        onChange={e => setEditState(s => ({ ...s, description: e.target.value }))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-teal-500/20 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Key String</label>
                      <div className="relative">
                        <input
                          type={editState.showKey ? 'text' : 'password'}
                          value={editState.key}
                          onChange={e => setEditState(s => ({ ...s, key: e.target.value }))}
                          className="w-full px-2.5 py-1.5 pr-8 rounded-lg border border-teal-500/20 bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40"
                        />
                        <button
                          type="button"
                          onClick={() => setEditState(s => ({ ...s, showKey: !s.showKey }))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-teal-400"
                        >
                          {editState.showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(ak.key)}
                        disabled={updateMutation.isPending}
                        className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {updateMutation.isPending ? (
                          <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 py-1.5 rounded-lg border border-border text-foreground text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-muted/50"
                      >
                        <X className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
                      <Key className="w-4 h-4 text-teal-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{ak.description}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                        {'•'.repeat(Math.min(ak.key.length, 20))}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleCopyKey(ak.key)}
                        className="w-7 h-7 rounded-lg border border-teal-500/20 bg-teal-500/5 text-teal-400 hover:bg-teal-500/15 flex items-center justify-center transition-colors"
                        title="Copy key"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleStartEdit(ak)}
                        className="w-7 h-7 rounded-lg border border-teal-500/20 bg-teal-500/5 text-teal-400 hover:bg-teal-500/15 flex items-center justify-center transition-colors"
                        title="Edit key"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(ak.key)}
                        disabled={deleteMutation.isPending && deletingKey === ak.key}
                        className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors ${
                          deletingKey === ak.key
                            ? 'border-destructive/60 bg-destructive text-white'
                            : 'border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/15'
                        }`}
                        title={deletingKey === ak.key ? 'Click again to confirm delete' : 'Delete key'}
                      >
                        {deleteMutation.isPending && deletingKey === ak.key ? (
                          <span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Delete confirmation message */}
                {deletingKey === ak.key && editingKey !== ak.key && (
                  <p className="mt-2 text-xs text-destructive flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Click the delete button again to confirm. This cannot be undone.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
