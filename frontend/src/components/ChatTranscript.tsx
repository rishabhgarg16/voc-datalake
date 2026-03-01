import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User } from 'lucide-react';

interface Props {
  messages: Array<Record<string, unknown>> | null;
}

export default function ChatTranscript({ messages }: Props) {
  if (!messages || messages.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-8 text-sm">
        No chat in this session
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((msg, idx) => {
        const role = (
          (msg.role as string) ||
          (msg.sender as string) ||
          'unknown'
        ).toLowerCase();
        const content =
          (msg.content as string) || (msg.message as string) || '';
        const isAgent =
          role === 'agent' || role === 'assistant' || role === 'bot';

        return (
          <div
            key={idx}
            className={cn('flex gap-3', isAgent ? 'justify-start' : 'flex-row-reverse')}
          >
            <Avatar className="h-7 w-7 flex-shrink-0">
              <AvatarFallback
                className={cn(
                  'text-xs',
                  isAgent
                    ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300'
                    : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300'
                )}
              >
                {isAgent ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
              </AvatarFallback>
            </Avatar>
            <div
              className={cn(
                'max-w-[80%] rounded-xl px-4 py-2.5 text-sm',
                isAgent
                  ? 'bg-muted text-foreground rounded-tl-sm'
                  : 'bg-indigo-600 text-white rounded-tr-sm'
              )}
            >
              <p className="text-[10px] font-semibold mb-1 opacity-60 uppercase tracking-wider">
                {isAgent ? 'Agent' : 'Customer'}
              </p>
              <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
