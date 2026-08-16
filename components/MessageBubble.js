import Markdown from "./Markdown";

export default function MessageBubble({ role, content, isStreaming }) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-up`}>
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? "bg-nebula-600 text-white rounded-br-sm"
            : "bg-void-850 text-starlight-100 rounded-bl-sm border border-void-700"
        }`}
      >
        {!isUser && (
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-nebula-300">
            <span>✦</span>
            <span>Nexora AI</span>
          </div>
        )}
        {isUser ? (
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{content}</p>
        ) : (
          <div className="text-[15px]">
            <Markdown content={content || (isStreaming ? "" : "")} />
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-nebula-400 ml-0.5 align-middle animate-pulse-soft" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
