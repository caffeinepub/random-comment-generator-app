import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Key, Save, AlertTriangle, Download, Trash2, Music } from 'lucide-react';
import { toast } from 'sonner';
import { useGetAccessKey, useSetAccessKey } from '../hooks/useQueries';
import AdminMusicManager from './AdminMusicManager';
import { exportAllData } from '../utils/dataExport';

export default function AdminSettingsPanel() {
  const [showKey, setShowKey] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [clearConfirm, setClearConfirm] = useState(false);

  const { data: currentKey = '' } = useGetAccessKey();
  const setAccessKeyMutation = useSetAccessKey();

  useEffect(() => {
    if (currentKey) setNewKey(currentKey);
  }, [currentKey]);

  const handleSaveKey = async () => {
    const key = newKey.trim();
    if (!key) { toast.error('Enter an access key'); return; }
    try {
      await setAccessKeyMutation.mutateAsync(key);
      toast.success('Access key saved successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save access key');
    }
  };

  const handleExport = async () => {
    try {
      await exportAllData();
      toast.success('Data exported successfully');
    } catch {
      toast.error('Failed to export data');
    }
  };

  const handleClearEverything = () => {
    if (!clearConfirm) {
      setClearConfirm(true);
      setTimeout(() => setClearConfirm(false), 5000);
      return;
    }
    const keysToKeep = ['admin_access_key'];
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    setClearConfirm(false);
    toast.success('All data cleared');
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Access Key Section */}
      <div className="bg-card border border-teal-500/20 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30 flex items-center justify-center">
            <Key className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Bulk Generator Access Key</h3>
            <p className="text-sm text-muted-foreground">Set the global key required to generate bulk comments</p>
          </div>
        </div>

        {/* Current key status */}
        <div className="mb-4 px-3 py-2 rounded-lg bg-teal-500/5 border border-teal-500/15 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <span className={`text-sm font-medium ${currentKey ? 'text-emerald-400' : 'text-warning'}`}>
            {currentKey ? 'Key Set ✓' : 'Not Set'}
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Access Key</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={newKey}
                onChange={e => setNewKey(e.target.value)}
                placeholder="Enter access key..."
                className="w-full px-3 py-2 pr-10 rounded-lg border border-teal-500/20 bg-background/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/40"
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-teal-400 transition-colors"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button
            onClick={handleSaveKey}
            disabled={setAccessKeyMutation.isPending || !newKey.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-500 text-white font-medium disabled:opacity-50 transition-all hover:from-teal-500 hover:to-emerald-400"
          >
            {setAccessKeyMutation.isPending ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Access Key
          </button>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-warning">
            Keep this key secure. Anyone with this key can generate bulk comments.
          </p>
        </div>
      </div>

      {/* Background Music */}
      <div className="bg-card border border-teal-500/20 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 flex items-center justify-center">
            <Music className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Background Music</h3>
            <p className="text-sm text-muted-foreground">Manage background music for the app</p>
          </div>
        </div>
        <AdminMusicManager />
      </div>

      {/* Danger Zone */}
      <div className="bg-card border border-destructive/30 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-destructive">Danger Zone</h3>
            <p className="text-sm text-muted-foreground">Irreversible actions — proceed with caution</p>
          </div>
        </div>
        <div className="space-y-3">
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-teal-500/20 bg-teal-500/5 text-foreground font-medium hover:bg-teal-500/10 transition-colors"
          >
            <Download className="w-4 h-4 text-teal-400" />
            Export All Data (JSON)
          </button>
          <button
            onClick={handleClearEverything}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-colors ${
              clearConfirm
                ? 'bg-destructive text-destructive-foreground'
                : 'border border-destructive/40 text-destructive hover:bg-destructive/10'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            {clearConfirm ? 'Click again to confirm — this cannot be undone!' : 'Clear Everything'}
          </button>
        </div>
      </div>
    </div>
  );
}
