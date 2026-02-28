import { InfoGap } from '../api/client';

interface Props {
  gaps: InfoGap[];
  loading: boolean;
}

function qualityBadge(q: string) {
  const lower = q.toLowerCase();
  if (lower.includes('good') || lower.includes('high') || lower.includes('excellent'))
    return 'bg-green-100 text-green-700';
  if (lower.includes('poor') || lower.includes('low') || lower.includes('bad'))
    return 'bg-red-100 text-red-700';
  return 'bg-amber-100 text-amber-700';
}

export default function InfoGaps({ gaps, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="h-5 bg-gray-200 rounded w-40" />
        </div>
        <div className="p-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (gaps.length === 0) {
    return (
      <div className="text-gray-400 text-center py-12">No information gaps data available</div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Information Gaps
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          Questions customers frequently ask that may lack good answers
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3">Question</th>
              <th className="px-6 py-3 text-right">Frequency</th>
              <th className="px-6 py-3 text-center">Agent Quality</th>
              <th className="px-6 py-3">Shopper Reaction</th>
              <th className="px-6 py-3">Product</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {gaps.map((g, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3 text-gray-800 font-medium max-w-sm">
                  {g.question}
                </td>
                <td className="px-6 py-3 text-right text-gray-600">
                  {g.frequency.toLocaleString()}
                </td>
                <td className="px-6 py-3 text-center">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${qualityBadge(
                      g.agent_quality
                    )}`}
                  >
                    {g.agent_quality}
                  </span>
                </td>
                <td className="px-6 py-3 text-gray-600 text-xs max-w-xs">
                  {g.shopper_reaction}
                </td>
                <td className="px-6 py-3 text-gray-500 text-xs">{g.product}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
