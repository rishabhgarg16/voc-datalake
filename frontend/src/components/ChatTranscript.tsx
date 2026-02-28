interface Props {
  messages: Array<Record<string, unknown>> | null;
}

export default function ChatTranscript({ messages }: Props) {
  if (!messages || messages.length === 0) {
    return (
      <div className="text-gray-400 text-center py-8 text-sm">
        No chat in this session
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((msg, idx) => {
        const role = ((msg.role as string) || (msg.sender as string) || 'unknown').toLowerCase();
        const content = (msg.content as string) || (msg.message as string) || '';
        const isAgent = role === 'agent' || role === 'assistant' || role === 'bot';

        return (
          <div
            key={idx}
            className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                isAgent
                  ? 'bg-gray-100 text-gray-800 rounded-bl-md'
                  : 'bg-brand-600 text-white rounded-br-md'
              }`}
            >
              <p className="text-xs font-medium mb-1 opacity-70">
                {isAgent ? 'Agent' : 'Customer'}
              </p>
              <p className="whitespace-pre-wrap">{content}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
