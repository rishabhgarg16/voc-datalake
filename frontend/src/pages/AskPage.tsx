import { useState, useEffect, useRef } from 'react';
import { useBrand } from '@/App';
import { askCustomers, AskResponse } from '@/api/client';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Send,
  Loader2,
  Sparkles,
  Bot,
  User,
  MessageSquare,
  Activity,
  ShoppingCart,
} from 'lucide-react';

interface Message {
  type: 'user' | 'ai';
  content: string;
  conversationsAnalyzed?: number;
}

const SUGGESTED_QUESTIONS = [
  'Why are customers not buying after chatting with the bot?',
  'What are the top 3 concerns about our subscription model?',
  'Which product gets the most ingredient questions?',
];

const AI_WELCOME_MESSAGE =
  "Hi! I'm your VoC AI analyst. I have access to **1,877 chat transcripts**, **57,243 browsing sessions**, and **3,372 orders** from your Shopify store. Ask me anything about your customers \u2014 why they buy, why they don't, what concerns them, or how they compare you to competitors.";

export default function AskPage() {
  const { selectedBrandId } = useBrand();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedBrandId) return;

    const question = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { type: 'user', content: question }]);
    setLoading(true);

    try {
      const res: AskResponse = await askCustomers(selectedBrandId, question);
      setMessages((prev) => [
        ...prev,
        { type: 'ai', content: res.answer, conversationsAnalyzed: res.conversations_analyzed },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { type: 'ai', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleChipClick = (question: string) => {
    setInput(question);
    /* auto-submit after a tick so the input state is updated */
    setTimeout(() => {
      formRef.current?.requestSubmit();
    }, 0);
  };

  /* ── Render markdown bold (**text**) ─────────────────────────── */
  const renderBold = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <span key={i} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          Ask Your Customers
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Get AI-powered answers from your customer data with cited quotes
        </p>

        {/* Data Context Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="inline-flex items-center gap-1.5 bg-zinc-800/60 border border-zinc-700/50 rounded-full px-3 py-1 text-xs text-muted-foreground">
            <MessageSquare className="h-3 w-3 text-blue-400" />
            1,877 chat transcripts
          </span>
          <span className="inline-flex items-center gap-1.5 bg-zinc-800/60 border border-zinc-700/50 rounded-full px-3 py-1 text-xs text-muted-foreground">
            <Activity className="h-3 w-3 text-violet-400" />
            57,243 sessions
          </span>
          <span className="inline-flex items-center gap-1.5 bg-zinc-800/60 border border-zinc-700/50 rounded-full px-3 py-1 text-xs text-muted-foreground">
            <ShoppingCart className="h-3 w-3 text-amber-400" />
            3,372 orders
          </span>
          <span className="inline-flex items-center gap-1.5 bg-zinc-800/60 border border-zinc-700/50 rounded-full px-3 py-1 text-xs text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            AI ready
          </span>
        </div>
      </div>

      {/* Chat interface */}
      <div className="flex flex-col h-[calc(100vh-16rem)]">
        {/* Messages */}
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4 pb-4">
            {/* Empty state — welcome */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 mb-4">
                  <Sparkles className="h-8 w-8 text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  Ask Your Customers
                </h3>
                <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
                  {renderBold(AI_WELCOME_MESSAGE)}
                </p>
              </div>
            )}

            {/* Message bubbles */}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex gap-3',
                  msg.type === 'user' ? 'flex-row-reverse' : 'justify-start'
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    'h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1',
                    msg.type === 'ai'
                      ? 'bg-gradient-to-br from-indigo-500/30 to-violet-500/30 border border-indigo-500/20'
                      : 'bg-primary'
                  )}
                >
                  {msg.type === 'ai' ? (
                    <Bot className="h-3.5 w-3.5 text-indigo-300" />
                  ) : (
                    <User className="h-3.5 w-3.5 text-primary-foreground" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={cn(
                    'max-w-[75%] rounded-xl px-4 py-3',
                    msg.type === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-card border border-border rounded-tl-sm shadow-sm'
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </p>

                  {/* Conversations analyzed count */}
                  {msg.type === 'ai' &&
                    msg.conversationsAnalyzed !== undefined &&
                    msg.conversationsAnalyzed > 0 && (
                      <p className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        Based on {msg.conversationsAnalyzed} conversation
                        {msg.conversationsAnalyzed !== 1 ? 's' : ''} analyzed
                      </p>
                    )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500/30 to-violet-500/30 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="h-3.5 w-3.5 text-indigo-300" />
                </div>
                <Card className="rounded-tl-sm border-zinc-800/60">
                  <CardContent className="px-4 py-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                    <span className="text-sm text-muted-foreground">Analyzing your data...</span>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Suggested Question Chips */}
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2 mb-3 justify-center">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleChipClick(q)}
                className="text-xs bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 hover:border-zinc-600/50 text-muted-foreground hover:text-foreground rounded-full px-3 py-1.5 transition-colors duration-150 max-w-xs truncate"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form ref={formRef} onSubmit={handleSubmit} className="flex-shrink-0 mt-2">
          <Card className="border-zinc-800/60">
            <CardContent className="p-2 flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about your customers..."
                disabled={loading || !selectedBrandId}
                className="border-0 shadow-none focus-visible:ring-0 h-10"
              />
              <Button
                type="submit"
                disabled={loading || !input.trim() || !selectedBrandId}
                size="default"
                className="flex-shrink-0"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Ask</span>
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
