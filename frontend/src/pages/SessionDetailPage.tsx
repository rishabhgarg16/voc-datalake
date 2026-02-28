import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBrand } from '../App';
import { fetchSessionDetail, SessionDetail } from '../api/client';
import JourneyTimeline from '../components/JourneyTimeline';
import ChatTranscript from '../components/ChatTranscript';
import SessionExplorer from '../components/SessionExplorer';

export default function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { selectedBrandId } = useBrand();
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // If sessionId is "explorer", show the session list
  const isExplorer = sessionId === 'explorer';

  useEffect(() => {
    if (isExplorer || !selectedBrandId || !sessionId) return;
    setLoading(true);
    fetchSessionDetail(selectedBrandId, sessionId)
      .then(setDetail)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedBrandId, sessionId, isExplorer]);

  if (isExplorer) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-1">Session Explorer</h2>
          <p className="text-sm text-gray-400">
            Browse individual customer sessions and their journeys
          </p>
        </div>
        <SessionExplorer />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          to="/sessions/explorer"
          className="text-brand-600 hover:text-brand-800 transition-colors"
        >
          Sessions
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-600 font-mono text-xs">
          {sessionId?.substring(0, 16)}...
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Journey Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
              Journey Timeline
            </h3>
            <JourneyTimeline detail={detail} loading={loading} />
          </div>

          {/* Chat Transcript */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
              Chat Transcript
            </h3>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="spinner" />
              </div>
            ) : (
              <ChatTranscript
                messages={detail?.chat as Array<Record<string, unknown>> | null}
              />
            )}
          </div>
        </div>

        {/* Right: Enrichment + Order */}
        <div className="space-y-6">
          {/* Enrichment */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
              Enrichment
            </h3>
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-4 bg-gray-100 rounded w-full" />
                ))}
              </div>
            ) : detail?.enrichment ? (
              <div className="space-y-3 text-sm">
                {Object.entries(detail.enrichment).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-start">
                    <span className="text-gray-500 capitalize text-xs">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-gray-800 font-medium text-right max-w-[60%]">
                      {typeof value === 'object'
                        ? JSON.stringify(value)
                        : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No enrichment data</p>
            )}
          </div>

          {/* Profile */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
              Visitor Profile
            </h3>
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-4 bg-gray-100 rounded w-full" />
                ))}
              </div>
            ) : detail?.profile ? (
              <div className="space-y-3 text-sm">
                {Object.entries(detail.profile).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-start">
                    <span className="text-gray-500 capitalize text-xs">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-gray-800 font-medium text-right max-w-[60%]">
                      {typeof value === 'object'
                        ? JSON.stringify(value)
                        : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No profile data</p>
            )}
          </div>

          {/* Order */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">
              Order Details
            </h3>
            {loading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-full" />
                <div className="h-4 bg-gray-100 rounded w-3/4" />
              </div>
            ) : detail?.order ? (
              <div className="space-y-3 text-sm">
                {Object.entries(detail.order).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-start">
                    <span className="text-gray-500 capitalize text-xs">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-gray-800 font-medium text-right max-w-[60%]">
                      {key.includes('price') || key.includes('total') || key.includes('amount')
                        ? `₹${Number(value).toLocaleString()}`
                        : typeof value === 'object'
                        ? JSON.stringify(value)
                        : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400 text-sm">No order in this session</p>
                <div className="mt-2 inline-block bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-500">
                  Browse-only session
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
