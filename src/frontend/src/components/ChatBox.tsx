import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, X, Send, User, Shield } from 'lucide-react';
import { useSendMessage, useGetMessages } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { MessageSide } from '../backend';

export default function ChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { identity } = useInternetIdentity();
  const { mutate: sendMessage, isPending } = useSendMessage();
  const { data: messages = [], isLoading } = useGetMessages();

  const isAuthenticated = !!identity;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!message.trim() || !isAuthenticated) return;

    sendMessage(message.trim(), {
      onSuccess: () => {
        setMessage('');
      },
    });
  };

  // Sort messages by timestamp
  const sortedMessages = [...messages].sort((a, b) => 
    Number(a.timestamp) - Number(b.timestamp)
  );

  return (
    <>
      {/* Floating Chat Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full gradient-bg btn-glow shadow-2xl transition-all duration-300 ${
          isOpen ? 'scale-0' : 'scale-100 hover:scale-110'
        }`}
        size="icon"
      >
        <MessageCircle className="w-7 h-7 text-white" />
      </Button>

      {/* Chat Box */}
      <div
        className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ease-out ${
          isOpen
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-8 opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <Card className="w-[420px] max-w-[calc(100vw-3rem)] h-[600px] card-glow border-2 border-[oklch(var(--gradient-start)/0.3)] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          <div className="absolute inset-0 gradient-bg-diagonal opacity-5 pointer-events-none" />
          <CardHeader className="relative pb-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg animate-pulse-glow">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl gradient-text">Chat with Admin</CardTitle>
                  <CardDescription className="text-sm">
                    {isAuthenticated ? 'Send messages and get replies' : 'Login to chat'}
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-9 w-9 rounded-xl hover:bg-accent/50"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          {/* Messages Area */}
          <CardContent className="flex-1 p-0 relative overflow-hidden flex flex-col">
            {!isAuthenticated ? (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl gradient-bg-diagonal flex items-center justify-center mx-auto shadow-lg">
                    <MessageCircle className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-muted-foreground font-medium">
                    Please login to start chatting with the admin
                  </p>
                </div>
              </div>
            ) : (
              <>
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-8 h-8 border-2 border-transparent border-t-[oklch(var(--gradient-start))] rounded-full animate-spin" />
                    </div>
                  ) : sortedMessages.length === 0 ? (
                    <div className="text-center py-8 space-y-2">
                      <p className="text-muted-foreground text-sm">No messages yet</p>
                      <p className="text-xs text-muted-foreground">Start the conversation!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sortedMessages.map((msg) => {
                        const isUser = msg.side === MessageSide.user;
                        return (
                          <div
                            key={msg.id}
                            className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                          >
                            {!isUser && (
                              <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center shrink-0 shadow-md">
                                <Shield className="w-4 h-4 text-white" />
                              </div>
                            )}
                            <div
                              className={`max-w-[75%] rounded-xl px-4 py-2.5 ${
                                isUser
                                  ? 'gradient-bg text-white shadow-lg'
                                  : 'bg-accent/50 border border-border/50'
                              }`}
                            >
                              <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                              <p className={`text-xs mt-1 ${isUser ? 'text-white/70' : 'text-muted-foreground'}`}>
                                {new Date(Number(msg.timestamp) / 1000000).toLocaleTimeString()}
                              </p>
                            </div>
                            {isUser && (
                              <div className="w-8 h-8 rounded-lg bg-accent/50 border border-border/50 flex items-center justify-center shrink-0">
                                <User className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 border-t border-border/50 space-y-3 bg-card/50 backdrop-blur-sm">
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here..."
                    rows={2}
                    disabled={isPending}
                    className="rounded-xl border-2 text-base resize-none focus:border-[oklch(var(--gradient-start))] transition-colors"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">Press Enter to send</p>
                    <Button
                      onClick={handleSend}
                      disabled={!message.trim() || isPending}
                      className="h-10 px-5 rounded-xl gradient-bg btn-glow font-bold"
                    >
                      {isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
