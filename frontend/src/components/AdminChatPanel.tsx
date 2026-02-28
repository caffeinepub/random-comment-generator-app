import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function AdminChatPanel() {
  return (
    <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-sm p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
          <MessageCircle className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Chat</h3>
          <p className="text-xs text-muted-foreground">Chat management interface</p>
        </div>
      </div>
      <div className="text-center py-10">
        <MessageCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Chat feature coming soon</p>
      </div>
    </div>
  );
}
