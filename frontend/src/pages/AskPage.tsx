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
} from 'lucide-react';

interface Message {
  type: 'user' | 'ai';
  content: string;
  conversationsAnalyzed?: number;
}

const SAMPLE_QUESTIONS = [
  'Why are customers not buying?',
  'What do customers say about shipping?',
  'What are the top objections?',
  'How do returning customers behave?',
];

export default function AskPage() {
  const { selectedBrandId } = useBrand();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold text-foreground tracking-tight">
          Ask Your Customers
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Get AI-powered answers from your customer data with cited quotes
        </p>
      </div>

      {/* Chat interface */}
      <div className="flex flex-col h-[calc(100vh-14rem)]">
        {/* Messages */}
        <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
          <div className="space-y-4 pb-4">
            {/* Empty state */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="p-4 rounded-2xl bg-muted mb-4">
                  <Sparkles className="h-8 w-8 text-indigo-500" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Ask Your Customers
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Ask any question about your customers and get AI-powered answers
                  with cited quotes from real sessions.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {SAMPLE_QUESTIONS.map((q) => (
                    <Button
                      key={q}
                      variant="outline"
                      size="sm"
                      onClick={() => setInput(q)}
                      className="h-auto py-1.5 text-xs"
                    >
                      {q}
                    </Button>
                  ))}
                </div>
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
                    msg.type === 'ai' ? 'bg-muted' : 'bg-primary'
                  )}
                >
                  {msg.type === 'ai' ? (
                    <Bot className="h-3.5 w-3.5 text-muted-foreground" />
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
                  {msg.conversationsAnalyzed !== undefined && msg.conversationsAnalyzed > 0 && (
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      Based on {msg.conversationsAnalyzed} conversation{msg.conversationsAnalyzed !== 1 ? 's' : ''} analyzed
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <Card className="rounded-tl-sm">
                  <CardContent className="px-4 py-3 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex-shrink-0 mt-4">
          <Card>
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
