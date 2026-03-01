import { SessionDetail } from '@/api/client';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  FileText,
  Zap,
  Bell,
  MessageSquare,
  ShoppingCart,
} from 'lucide-react';

interface Props {
  detail: SessionDetail | null;
  loading: boolean;
}

interface TimelineItem {
  time: string;
  type: 'page' | 'event' | 'nudge' | 'chat' | 'order';
  title: string;
  detail?: string;
}

function buildTimeline(d: SessionDetail): TimelineItem[] {
  const items: TimelineItem[] = [];

  if (d.pages) {
    d.pages.forEach((p) => {
      items.push({
        time: (p.viewed_at as string) || '',
        type: 'page',
        title: `Viewed: ${(p.page_path as string) || (p.url as string) || 'Page'}`,
        detail: p.title as string,
      });
    });
  }

  if (d.events) {
    d.events.forEach((e) => {
      items.push({
        time: (e.timestamp as string) || (e.created_at as string) || '',
        type: 'event',
        title: `Event: ${(e.event_type as string) || (e.name as string) || 'Unknown'}`,
        detail: (e.detail as string) || (e.metadata as string) || undefined,
      });
    });
  }

  if (d.interventions) {
    d.interventions.forEach((n) => {
      items.push({
        time: (n.triggered_at as string) || (n.timestamp as string) || '',
        type: 'nudge',
        title: `Nudge: ${(n.trigger_type as string) || (n.type as string) || 'Intervention'}`,
        detail: (n.message as string) || undefined,
      });
    });
  }

  if (d.chat && Array.isArray(d.chat)) {
    d.chat.forEach((msg) => {
      items.push({
        time: (msg.timestamp as string) || (msg.created_at as string) || '',
        type: 'chat',
        title: `${(msg.role as string) || (msg.sender as string) || 'Message'}`,
        detail: (msg.content as string) || (msg.message as string) || undefined,
      });
    });
  }

  if (d.order) {
    items.push({
      time: (d.order.created_at as string) || '',
      type: 'order',
      title: 'Order Placed',
      detail: `₹${((d.order.total_price as number) || 0).toLocaleString()}`,
    });
  }

  items.sort((a, b) => {
    if (!a.time) return 1;
    if (!b.time) return -1;
    return new Date(a.time).getTime() - new Date(b.time).getTime();
  });

  return items;
}

const TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; dotColor: string; bgColor: string }
> = {
  page: { icon: FileText, dotColor: 'bg-blue-500', bgColor: 'bg-blue-500/10 dark:bg-blue-500/20' },
  event: { icon: Zap, dotColor: 'bg-purple-500', bgColor: 'bg-purple-500/10 dark:bg-purple-500/20' },
  nudge: { icon: Bell, dotColor: 'bg-amber-500', bgColor: 'bg-amber-500/10 dark:bg-amber-500/20' },
  chat: { icon: MessageSquare, dotColor: 'bg-emerald-500', bgColor: 'bg-emerald-500/10 dark:bg-emerald-500/20' },
  order: { icon: ShoppingCart, dotColor: 'bg-green-600', bgColor: 'bg-green-500/10 dark:bg-green-500/20' },
};

export default function JourneyTimeline({ detail, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 items-start">
            <div className="w-3 h-3 rounded-full bg-muted mt-1.5" />
            <div className="flex-1">
              <div className="h-4 bg-muted rounded w-48 mb-2" />
              <div className="h-3 bg-muted rounded w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="text-muted-foreground text-center py-8 text-sm">
        No session data
      </div>
    );
  }

  const items = buildTimeline(detail);

  if (items.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-8 text-sm">
        No timeline events
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[15px] top-3 bottom-3 w-px bg-border" />

      <div className="space-y-3">
        {items.map((item, idx) => {
          const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.event;
          const Icon = config.icon;
          return (
            <div key={idx} className="relative flex gap-4 items-start">
              {/* Dot */}
              <div
                className={cn(
                  'w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0 z-10 ring-4 ring-background',
                  config.dotColor
                )}
              >
                <Icon className="h-3.5 w-3.5 text-white" />
              </div>
              {/* Content */}
              <div
                className={cn(
                  'flex-1 rounded-lg px-4 py-2.5 border border-border',
                  config.bgColor
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-foreground">{item.title}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="outline" className="text-[10px]">
                      {item.type}
                    </Badge>
                    {item.time && (
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {new Date(item.time).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                </div>
                {item.detail && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                    {item.detail}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
