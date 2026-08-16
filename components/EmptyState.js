const SUGGESTIONS = [
  { title: "Explain quantum computing", subtitle: "Simply, with an analogy" },
  { title: "Help me build a website", subtitle: "Start with the structure" },
  { title: "Write a story about space", subtitle: "Short and vivid" },
  { title: "Teach me Python", subtitle: "Starting from scratch" },
];

export default function EmptyState({ onSuggestionClick }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center animate-fade-in">
      <span className="text-4xl text-nebula-400">✦</span>
      <h1 className="mt-4 text-2xl font-semibold text-starlight-50">Nexora AI</h1>
      <p className="mt-1.5 text-starlight-500">Ask anything. Explore everything.</p>

      <div className="mt-8 grid w-full max-w-lg grid-cols-1 gap-2.5 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.title}
            onClick={() => onSuggestionClick(s.title)}
            className="rounded-xl border border-void-600 bg-void-850 px-4 py-3 text-left transition-colors hover:border-nebula-500/50 hover:bg-void-800"
          >
            <div className="text-sm font-medium text-starlight-100">{s.title}</div>
            <div className="text-xs text-starlight-500">{s.subtitle}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
