import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSessions, SessionListItem } from '../api/client';
import { useBrand } from '../App';

export default function SessionExplorer() {
  const { selectedBrandId } = useBrand();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterChat, setFilterChat] = useState<boolean | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedBrandId) return;
    setLoading(true);
    fetchSessions(selectedBrandId, page, filterChat)
      .then((data) => {
        setSessions(data.sessions);
        setTotal(data.total);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedBrandId, page, filterChat]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Filter:</span>
          <button
            onClick={() => setFilterChat(undefined)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterChat === undefined
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterChat(true)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterChat === true
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            With Chat
          </button>
          <button
            onClick={() => setFilterChat(false)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterChat === false
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            No Chat
          </button>
        </div>
        <span className="text-xs text-gray-400 ml-auto">
          {total.toLocaleString()} total sessions
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="spinner" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No sessions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Session ID</th>
                  <th className="px-6 py-3">Started</th>
                  <th className="px-6 py-3 text-right">Pages</th>
                  <th className="px-6 py-3 text-center">Chat</th>
                  <th className="px-6 py-3 text-center">Order</th>
                  <th className="px-6 py-3 text-right">Engagement</th>
                  <th className="px-6 py-3">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessions.map((s) => (
                  <tr
                    key={s.session_id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/sessions/${s.session_id}`)}
                  >
                    <td className="px-6 py-3 font-mono text-xs text-brand-600">
                      {s.session_id.substring(0, 12)}...
                    </td>
                    <td className="px-6 py-3 text-gray-600 text-xs">
                      {new Date(s.started_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-3 text-right text-gray-600">{s.page_count}</td>
                    <td className="px-6 py-3 text-center">
                      {s.has_chat ? (
                        <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                      ) : (
                        <span className="inline-block w-2 h-2 rounded-full bg-gray-300" />
                      )}
                    </td>
                    <td className="px-6 py-3 text-center">
                      {s.has_order ? (
                        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                      ) : (
                        <span className="inline-block w-2 h-2 rounded-full bg-gray-300" />
                      )}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span
                        className={`font-semibold ${
                          s.engagement_score >= 7
                            ? 'text-green-600'
                            : s.engagement_score >= 4
                            ? 'text-amber-600'
                            : 'text-gray-500'
                        }`}
                      >
                        {s.engagement_score?.toFixed(1) ?? '--'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs">
                      {s.utm_source || '(direct)'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="text-gray-500">Page {page}</span>
        <button
          disabled={sessions.length < 20}
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
