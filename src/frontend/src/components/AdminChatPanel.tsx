import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, User, Shield } from 'lucide-react';
import { useGetAllMessages, useReplyMessage } from '../hooks/useQueries';
import { MessageSide } from '../backend';

export default function AdminChatPanel() {
  const [replyText, setReplyText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: messages = [], isLoading } = useGetAllMessages();
  const { mutate: replyMessage, isPending } = useReplyMessage();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleReply = () => {
    if (!replyText.trim()) return;

    replyMessage(replyText.trim(), {
      onSuccess: () => {
        setReplyText('');
      },
    });
  };

  // Sort messages by timestamp
  const sortedMessages = [...messages].sort((a, b) => 
    Number(a.timestamp) - Number(b.timestamp)
  );

  // Count unread user messages
  const unreadCount = messages.filter(m => m.side === MessageSide.user && !m.isRead).length;

  return (
    <Card className="card-glow border-2 border-[oklch(var(--gradient-start)/0.3)] rounded-2xl overflow-hidden h-[700px] flex flex-col">
      <div className="absolute inset-0 gradient-bg-diagonal opacity-5 pointer-events-none" />
      <CardHeader className="relative border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg animate-pulse-glow">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl gradient-text">User Messages</CardTitle>
              <CardDescription className="text-base">
                View and reply to user messages
              </CardDescription>
            </div>
          </div>
          {unreadCount > 0 && (
            <Badge variant="default" className="gradient-bg border-0 text-lg px-4 py-1.5">
              {unreadCount} new
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 relative overflow-hidden flex flex-col">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 border-3 border-transparent border-t-[oklch(var(--gradient-start))] rounded-full animate-spin mx-auto" />
                <p className="text-muted-foreground font-medium">Loading messages...</p>
              </div>
            </div>
          ) : sortedMessages.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-20 h-20 rounded-2xl gradient-bg-diagonal flex items-center justify-center mx-auto shadow-lg">
                <MessageCircle className="w-10 h-10 text-white" />
              </div>
              <div>
                <p className="text-lg font-semibold mb-2">No messages yet</p>
                <p className="text-muted-foreground">User messages will appear here</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedMessages.map((msg) => {
                const isUser = msg.side === MessageSide.user;
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isUser ? 'justify-start' : 'justify-end'}`}
                  >
                    {isUser && (
                      <div className="w-10 h-10 rounded-xl bg-accent/50 border-2 border-border/50 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] rounded-xl px-5 py-3 ${
                        isUser
                          ? 'bg-accent/30 border-2 border-border/50'
                          : 'gradient-bg text-white shadow-lg'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold ${isUser ? 'text-muted-foreground' : 'text-white/80'}`}>
                          {isUser ? 'User' : 'Admin'}
                        </span>
                        {isUser && !msg.isRead && (
                          <Badge variant="default" className="gradient-bg border-0 text-xs px-2 py-0">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-base leading-relaxed break-words mb-2">{msg.content}</p>
                      <p className={`text-xs ${isUser ? 'text-muted-foreground' : 'text-white/70'}`}>
                        {new Date(Number(msg.timestamp) / 1000000).toLocaleString()}
                      </p>
                    </div>
                    {!isUser && (
                      <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shrink-0 shadow-md">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Reply Area */}
        <div className="p-6 border-t-2 border-border/50 space-y-4 bg-card/50 backdrop-blur-sm relative">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Reply to User</label>
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply here..."
              rows={3}
              disabled={isPending}
              className="rounded-xl border-2 text-base resize-none focus:border-[oklch(var(--gradient-start))] transition-colors"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleReply();
                }
              }}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">Press Enter to send, Shift+Enter for new line</p>
            <Button
              onClick={handleReply}
              disabled={!replyText.trim() || isPending}
              className="h-12 px-6 rounded-xl gradient-bg btn-glow font-bold text-base"
            >
              {isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Send Reply
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
