import { Segment } from '../api/client';

interface Props {
  segments: Segment[];
  loading: boolean;
}

const PERSONA_COLORS = [
  { bg: 'bg-indigo-50', border: 'border-indigo-200', accent: 'text-indigo-700', bar: 'bg-indigo-500' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', accent: 'text-emerald-700', bar: 'bg-emerald-500' },
  { bg: 'bg-amber-50', border: 'border-amber-200', accent: 'text-amber-700', bar: 'bg-amber-500' },
  { bg: 'bg-rose-50', border: 'border-rose-200', accent: 'text-rose-700', bar: 'bg-rose-500' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', accent: 'text-cyan-700', bar: 'bg-cyan-500' },
  { bg: 'bg-purple-50', border: 'border-purple-200', accent: 'text-purple-700', bar: 'bg-purple-500' },
];

export default function PersonaCards({ segments, loading }: Props) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-32 mb-4" />
            <div className="h-4 bg-gray-100 rounded w-20 mb-2" />
            <div className="h-4 bg-gray-100 rounded w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (segments.length === 0) {
    return (
      <div className="text-gray-400 text-center py-12">No persona data available</div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {segments.map((seg, idx) => {
        const c = PERSONA_COLORS[idx % PERSONA_COLORS.length];
        return (
          <div
            key={seg.segment_name}
            className={`${c.bg} ${c.border} border rounded-xl p-6 hover:shadow-md transition-shadow`}
          >
            <h3 className={`text-lg font-bold ${c.accent} mb-3`}>{seg.segment_name}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Count</span>
                <span className="font-semibold text-gray-800">{seg.count.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Share</span>
                <span className="font-semibold text-gray-800">{seg.pct.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Conv Rate</span>
                <span className="font-semibold text-gray-800">{seg.conversion_rate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Engagement</span>
                <span className="font-semibold text-gray-800">{seg.avg_engagement.toFixed(1)}</span>
              </div>
              {/* Mini bar for conversion rate */}
              <div className="pt-2">
                <div className="w-full bg-white/60 rounded-full h-2">
                  <div
                    className={`${c.bar} h-2 rounded-full transition-all`}
                    style={{ width: `${Math.min(seg.conversion_rate * 2, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
