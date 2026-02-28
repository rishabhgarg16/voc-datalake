import { useState } from 'react';
import { askCustomers, AskResponse } from '../api/client';
import { useBrand } from '../App';

interface Message {
  type: 'user' | 'ai';
  content: string;
  sources?: Array<{ quote: string; session_id: string }>;
}

export default function AskCustomers() {
  const { selectedBrandId } = useBrand();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

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
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { type: 'ai', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">💬</p>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Ask Your Customers
            </h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              Ask any question about your customers and get AI-powered answers with
              cited quotes from real sessions.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {[
                'Why are customers not buying?',
                'What do customers say about shipping?',
                'What are the top objections?',
                'How do returning customers behave?',
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-5 py-3 ${
                msg.type === 'user'
                  ? 'bg-brand-600 text-white rounded-br-md'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

              {/* Sources */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Sources
                  </p>
                  {msg.sources.map((src, si) => (
                    <div
                      key={si}
                      className="text-xs bg-gray-50 rounded-lg px-3 py-2 border-l-3 border-brand-400"
                    >
                      <p className="italic text-gray-600">"{src.quote}"</p>
                      <p className="text-gray-400 mt-1 font-mono">
                        Session: {src.session_id.substring(0, 12)}...
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-5 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="spinner" />
                <span className="text-sm text-gray-500">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex-shrink-0 bg-white border border-gray-200 rounded-xl p-2 flex gap-2 shadow-sm"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about your customers..."
          className="flex-1 px-4 py-2.5 text-sm border-0 focus:outline-none bg-transparent"
          disabled={loading || !selectedBrandId}
        />
        <button
          type="submit"
          disabled={loading || !input.trim() || !selectedBrandId}
          className="px-5 py-2.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
