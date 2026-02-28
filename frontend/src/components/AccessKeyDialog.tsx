import React, { useState } from 'react';
import { Eye, EyeOff, Key, X } from 'lucide-react';
import { useVerifyAccessKey } from '../hooks/useQueries';

interface AccessKeyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AccessKeyDialog({ isOpen, onClose, onSuccess }: AccessKeyDialogProps) {
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');

  const verifyMutation = useVerifyAccessKey();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) {
      setError('Please enter the access key');
      return;
    }
    setError('');
    try {
      const valid = await verifyMutation.mutateAsync(key.trim());
      if (valid) {
        setKey('');
        setError('');
        onSuccess();
        onClose();
      } else {
        setError('Invalid access key. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to verify key. Please try again.');
    }
  };

  const handleClose = () => {
    setKey('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6 z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Key className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Access Key Required</h2>
              <p className="text-xs text-muted-foreground">Enter the bulk generator key</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Access Key</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={key}
                onChange={e => { setKey(e.target.value); setError(''); }}
                placeholder="Enter access key..."
                autoFocus
                className="w-full px-3 py-2.5 pr-10 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <p className="mt-1.5 text-xs text-destructive">{error}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-lg border border-border text-foreground font-medium text-sm hover:bg-muted/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={verifyMutation.isPending || !key.trim()}
              className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium text-sm disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
            >
              {verifyMutation.isPending ? (
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : null}
              {verifyMutation.isPending ? 'Verifying...' : 'Unlock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
