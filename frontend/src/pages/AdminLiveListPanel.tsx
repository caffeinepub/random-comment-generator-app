import React, { useState } from 'react';
import { Plus, Trash2, List, Users, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useGetLiveListEntries, useAddLiveListEntry, useDeleteLiveListEntry } from '../hooks/useAdminLiveListQueries';

const APPS = ['Meesho', 'Flipkart', 'Amazon', 'Myntra', 'Ajio', 'Nykaa', 'Snapdeal'];

export default function AdminLiveListPanel() {
  const [selectedApp, setSelectedApp] = useState(APPS[0]);
  const [newUsername, setNewUsername] = useState('');
  const [newEntryName, setNewEntryName] = useState('');

  const { data: entries = [], isLoading, refetch } = useGetLiveListEntries();
  const addEntry = useAddLiveListEntry();
  const deleteEntry = useDeleteLiveListEntry();

  const handleAddEntry = async () => {
    const name = newEntryName.trim();
    if (!name) { toast.error('Enter an entry name'); return; }
    const id = `${selectedApp}_${Date.now()}`;
    try {
      await addEntry.mutateAsync({ id, name });
      setNewEntryName('');
      toast.success(`Entry "${name}" added to ${selectedApp}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add entry');
    }
  };

  const handleAddUsername = () => {
    const username = newUsername.trim();
    if (!username) { toast.error('Enter a username'); return; }
    const key = `live_usernames_${selectedApp}`;
    try {
      const existing: string[] = JSON.parse(localStorage.getItem(key) || '[]');
      if (existing.includes(username)) {
        toast.error('Username already exists');
        return;
      }
      localStorage.setItem(key, JSON.stringify([...existing, username]));
      setNewUsername('');
      toast.success(`Username "${username}" added to ${selectedApp}`);
    } catch {
      toast.error('Failed to add username');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await deleteEntry.mutateAsync(id);
      toast.success('Entry deleted');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete entry');
    }
  };

  const getUsernames = (app: string): string[] => {
    try {
      return JSON.parse(localStorage.getItem(`live_usernames_${app}`) || '[]');
    } catch {
      return [];
    }
  };

  const handleDeleteUsername = (app: string, username: string) => {
    const key = `live_usernames_${app}`;
    try {
      const existing: string[] = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify(existing.filter(u => u !== username)));
      toast.success(`Username "${username}" removed`);
      refetch();
    } catch {
      toast.error('Failed to remove username');
    }
  };

  const appUsernames = getUsernames(selectedApp);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/30 flex items-center justify-center">
            <List className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Live Rating List</h2>
            <p className="text-sm text-muted-foreground">Manage live list entries and usernames</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="w-8 h-8 rounded-lg border border-teal-500/20 bg-teal-500/5 text-teal-400 hover:bg-teal-500/15 flex items-center justify-center transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* App selector */}
      <div className="bg-card border border-teal-500/20 rounded-xl p-4">
        <label className="text-sm font-medium text-foreground mb-2 block">Select App</label>
        <div className="flex flex-wrap gap-2">
          {APPS.map(app => (
            <button
              key={app}
              onClick={() => setSelectedApp(app)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedApp === app
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-500 text-white shadow-sm'
                  : 'border border-teal-500/20 bg-teal-500/5 text-muted-foreground hover:text-teal-400 hover:bg-teal-500/10'
              }`}
            >
              {app}
            </button>
          ))}
        </div>
      </div>

      {/* Add username to selected app */}
      <div className="bg-card border border-teal-500/20 rounded-xl p-4">
        <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-teal-400" />
          Add Username to {selectedApp}
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newUsername}
            onChange={e => setNewUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddUsername()}
            placeholder="Enter username..."
            className="flex-1 px-3 py-2 rounded-lg border border-teal-500/20 bg-background/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-sm"
          />
          <button
            onClick={handleAddUsername}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-500 text-white font-medium text-sm hover:from-teal-500 hover:to-emerald-400 transition-all whitespace-nowrap"
          >
            Add
          </button>
        </div>

        {/* Username list */}
        {appUsernames.length > 0 && (
          <div className="mt-3 space-y-1 max-h-40 overflow-y-auto">
            {appUsernames.map(username => (
              <div key={username} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-teal-500/5 border border-teal-500/10 group">
                <span className="text-sm text-foreground">{username}</span>
                <button
                  onClick={() => handleDeleteUsername(selectedApp, username)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add backend entry */}
      <div className="bg-card border border-teal-500/20 rounded-xl p-4">
        <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-teal-400" />
          Add Live List Entry (Backend)
        </h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newEntryName}
            onChange={e => setNewEntryName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddEntry()}
            placeholder="Entry name..."
            className="flex-1 px-3 py-2 rounded-lg border border-teal-500/20 bg-background/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/40 text-sm"
          />
          <button
            onClick={handleAddEntry}
            disabled={addEntry.isPending}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-500 text-white font-medium text-sm disabled:opacity-50 hover:from-teal-500 hover:to-emerald-400 transition-all whitespace-nowrap"
          >
            {addEntry.isPending ? 'Adding...' : 'Add Entry'}
          </button>
        </div>
      </div>

      {/* Backend entries list */}
      <div className="bg-card border border-teal-500/20 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <List className="w-4 h-4 text-teal-400" />
            Backend Entries
          </h3>
          <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20">
            {entries.length} entries
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-10 rounded-lg bg-teal-500/5 animate-pulse" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No entries yet</p>
        ) : (
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {entries.map(entry => (
              <div key={entry.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-teal-500/5 border border-teal-500/10 group">
                <div>
                  <p className="text-sm text-foreground">{entry.name}</p>
                  <p className="text-xs text-muted-foreground">{entry.id}</p>
                </div>
                <button
                  onClick={() => handleDeleteEntry(entry.id)}
                  disabled={deleteEntry.isPending}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80 disabled:opacity-50"
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
