import { SessionDetail } from '../api/client';

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

  // Pages
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

  // Events
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

  // Interventions / Nudges
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

  // Chat
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

  // Order
  if (d.order) {
    items.push({
      time: (d.order.created_at as string) || '',
      type: 'order',
      title: 'Order Placed',
      detail: `₹${((d.order.total_price as number) || 0).toLocaleString()}`,
    });
  }

  // Sort by time
  items.sort((a, b) => {
    if (!a.time) return 1;
    if (!b.time) return -1;
    return new Date(a.time).getTime() - new Date(b.time).getTime();
  });

  return items;
}

const TYPE_STYLES: Record<string, { dot: string; bg: string }> = {
  page: { dot: 'bg-blue-500', bg: 'bg-blue-50' },
  event: { dot: 'bg-purple-500', bg: 'bg-purple-50' },
  nudge: { dot: 'bg-amber-500', bg: 'bg-amber-50' },
  chat: { dot: 'bg-green-500', bg: 'bg-green-50' },
  order: { dot: 'bg-emerald-600', bg: 'bg-emerald-50' },
};

export default function JourneyTimeline({ detail, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 items-start">
            <div className="w-3 h-3 rounded-full bg-gray-200 mt-1.5" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-48 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!detail) {
    return <div className="text-gray-400 text-center py-8">No session data</div>;
  }

  const items = buildTimeline(detail);

  if (items.length === 0) {
    return <div className="text-gray-400 text-center py-8">No timeline events</div>;
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[7px] top-3 bottom-3 w-px bg-gray-200" />

      <div className="space-y-4">
        {items.map((item, idx) => {
          const style = TYPE_STYLES[item.type] || TYPE_STYLES.event;
          return (
            <div key={idx} className="relative flex gap-4 items-start pl-0">
              {/* Dot */}
              <div
                className={`w-3.5 h-3.5 rounded-full ${style.dot} mt-1 flex-shrink-0 ring-2 ring-white z-10`}
              />
              {/* Content */}
              <div
                className={`flex-1 ${style.bg} rounded-lg px-4 py-2.5 border border-gray-100`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800">{item.title}</span>
                  {item.time && (
                    <span className="text-xs text-gray-400 ml-4 flex-shrink-0">
                      {new Date(item.time).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
                {item.detail && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-3">{item.detail}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
