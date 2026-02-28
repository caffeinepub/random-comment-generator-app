import React, { useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare, Image, MessageCircle, List, Settings, Key,
} from 'lucide-react';
import AdminCommentsPanel from '../components/AdminCommentsPanel';
import AdminImagesPanel from '../components/AdminImagesPanel';
import AdminChatPanel from '../components/AdminChatPanel';
import AdminLiveListPanel from '../pages/AdminLiveListPanel';
import AdminSettingsPanel from '../components/AdminSettingsPanel';
import AdminAccessKeysPanel from '../components/AdminAccessKeysPanel';

type AdminTab = 'comments' | 'images' | 'chat' | 'livelist' | 'settings' | 'accesskeys';

const TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
  { id: 'comments', label: 'Comments', icon: <MessageSquare className="w-3.5 h-3.5" /> },
  { id: 'images', label: 'Images', icon: <Image className="w-3.5 h-3.5" /> },
  { id: 'chat', label: 'Chat', icon: <MessageCircle className="w-3.5 h-3.5" /> },
  { id: 'livelist', label: 'Live List', icon: <List className="w-3.5 h-3.5" /> },
  { id: 'accesskeys', label: 'Access Keys', icon: <Key className="w-3.5 h-3.5" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-3.5 h-3.5" /> },
];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('comments');
  const qc = useQueryClient();

  const handleTabHover = useCallback((tab: AdminTab) => {
    if (tab === 'livelist') {
      qc.prefetchQuery({ queryKey: ['liveRatingListEntries'], staleTime: 5 * 60 * 1000 });
    }
    if (tab === 'comments') {
      qc.prefetchQuery({ queryKey: ['commentLists'], staleTime: 5 * 60 * 1000 });
    }
    if (tab === 'accesskeys') {
      qc.prefetchQuery({ queryKey: ['accessKeys'], staleTime: 30 * 1000 });
    }
  }, [qc]);

  const content = useMemo(() => {
    switch (activeTab) {
      case 'comments': return <AdminCommentsPanel />;
      case 'images': return <AdminImagesPanel />;
      case 'chat': return <AdminChatPanel />;
      case 'livelist': return <AdminLiveListPanel />;
      case 'accesskeys': return <AdminAccessKeysPanel />;
      case 'settings': return <AdminSettingsPanel />;
      default: return null;
    }
  }, [activeTab]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
          Admin Panel
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Manage comments, images, live list, and access keys</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1 scrollbar-thin">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            onMouseEnter={() => handleTabHover(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-150 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-teal-600 to-emerald-500 text-white shadow-md shadow-teal-900/20'
                : 'text-muted-foreground hover:text-teal-400 hover:bg-teal-500/10 border border-transparent hover:border-teal-500/20'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="animate-fade-slide-in">
        {content}
      </div>
    </div>
  );
}
