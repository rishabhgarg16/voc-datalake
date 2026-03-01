import { useState, useRef, useEffect } from 'react';
import { askCustomers, AskResponse } from '@/api/client';
import { useBrand } from '@/App';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User, Send, Loader2, Sparkles, Quote } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  type: 'user' | 'ai';
  content: string;
  sources?: Array<{ quote: string; session_id: string }>;
}

const SAMPLE_QUESTIONS = [
  'Why are customers not buying?',
  'What do customers say about shipping?',
  'What are the top objections?',
  'How do returning customers behave?',
];

export default function AskCustomers() {
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
        {
          type: 'ai',
          content: res.answer,
          sources: res.sources,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          type: 'ai',
          content: 'Sorry, something went wrong. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Messages area */}
      <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
        <div className="space-y-4 pb-4">
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

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                'flex gap-3',
                msg.type === 'user' ? 'flex-row-reverse' : 'justify-start'
              )}
            >
              <Avatar className="h-7 w-7 flex-shrink-0 mt-1">
                <AvatarFallback
                  className={cn(
                    'text-xs',
                    msg.type === 'ai'
                      ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300'
                      : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300'
                  )}
                >
                  {msg.type === 'ai' ? (
                    <Bot className="h-3.5 w-3.5" />
                  ) : (
                    <User className="h-3.5 w-3.5" />
                  )}
                </AvatarFallback>
              </Avatar>

              <div
                className={cn(
                  'max-w-[75%] rounded-xl px-4 py-3',
                  msg.type === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-zinc-100 dark:bg-zinc-800 rounded-tl-sm shadow-sm'
                )}
              >
                <div className={cn(
                  "text-sm whitespace-pre-wrap leading-relaxed",
                  msg.type === 'user'
                    ? 'text-white'
                    : 'text-zinc-900 dark:text-zinc-100'
                )}>
                  {msg.content}
                </div>

                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-zinc-300 dark:border-zinc-600 space-y-2">
                    <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                      Sources
                    </p>
                    {msg.sources.map((src, si) => (
                      <div
                        key={si}
                        className="flex items-start gap-2 text-xs bg-zinc-200 dark:bg-zinc-700 rounded-lg px-3 py-2 border-l-2 border-indigo-400"
                      >
                        <Quote className="h-3 w-3 flex-shrink-0 mt-0.5 text-zinc-400" />
                        <div>
                          <p className="italic text-zinc-600 dark:text-zinc-300">{src.quote}</p>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 font-mono">
                            Session: {src.session_id.substring(0, 12)}...
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <Avatar className="h-7 w-7 flex-shrink-0 mt-1">
                <AvatarFallback className="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300">
                  <Bot className="h-3.5 w-3.5" />
                </AvatarFallback>
              </Avatar>
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
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
