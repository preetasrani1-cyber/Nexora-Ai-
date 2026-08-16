import { useState, useRef, useEffect } from "react";

// ---------- tiny markdown renderer (no external deps) ----------
function renderInline(text, keyPrefix) {
  const parts = [];
  let remaining = text;
  let i = 0;
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/;
  while (remaining.length) {
    const m = remaining.match(pattern);
    if (!m) {
      parts.push(remaining);
      break;
    }
    if (m.index > 0) parts.push(remaining.slice(0, m.index));
    const token = m[0];
    if (token.startsWith("**")) {
      parts.push(
        <strong key={`${keyPrefix}-${i++}`} className="font-semibold text-slate-50">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith("`")) {
      parts.push(
        <code key={`${keyPrefix}-${i++}`} className="rounded bg-slate-800 px-1.5 py-0.5 text-[0.85em] text-violet-300">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("[")) {
      const [, label, url] = token.match(/\[([^\]]+)\]\(([^)]+)\)/) || [];
      parts.push(
        <a key={`${keyPrefix}-${i++}`} href={url} target="_blank" rel="noreferrer" className="text-violet-300 underline underline-offset-2">
          {label}
        </a>
      );
    } else {
      parts.push(
        <em key={`${keyPrefix}-${i++}`} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    }
    remaining = remaining.slice(m.index + token.length);
  }
  return parts;
}

function CodeBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="my-2 overflow-hidden rounded-xl border border-slate-700 bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-700 bg-slate-900 px-3 py-1.5">
        <span className="text-xs text-slate-500">{lang || "code"}</span>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(code).catch(() => {});
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
          className="text-xs text-slate-500 hover:text-slate-200"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-[13px] leading-relaxed text-slate-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Markdown({ content }) {
  const blocks = [];
  const lines = content.split("\n");
  let i = 0;
  let key = 0;
  let listBuffer = [];

  const flushList = () => {
    if (listBuffer.length) {
      blocks.push(
        <ul key={`ul-${key++}`} className="my-1.5 list-disc space-y-0.5 pl-5">
          {listBuffer.map((item, idx) => (
            <li key={idx}>{renderInline(item, `li-${key}-${idx}`)}</li>
          ))}
        </ul>
      );
      listBuffer = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      flushList();
      blocks.push(<CodeBlock key={`code-${key++}`} code={codeLines.join("\n")} lang={lang} />);
      i++;
      continue;
    }

    if (/^#{1,3}\s/.test(line)) {
      flushList();
      const level = line.match(/^#+/)[0].length;
      const text = line.replace(/^#+\s/, "");
      const Tag = level === 1 ? "h1" : level === 2 ? "h2" : "h3";
      const cls = level === 1 ? "text-lg font-semibold mt-3 mb-1.5" : level === 2 ? "text-base font-semibold mt-3 mb-1" : "text-sm font-semibold mt-2 mb-1";
      blocks.push(
        <Tag key={`h-${key++}`} className={cls}>
          {renderInline(text, `h-${key}`)}
        </Tag>
      );
      i++;
      continue;
    }

    if (/^[-*]\s/.test(line)) {
      listBuffer.push(line.replace(/^[-*]\s/, ""));
      i++;
      continue;
    }

    if (line.trim() === "") {
      flushList();
      i++;
      continue;
    }

    flushList();
    blocks.push(
      <p key={`p-${key++}`} className="my-1.5 leading-relaxed">
        {renderInline(line, `p-${key}`)}
      </p>
    );
    i++;
  }
  flushList();

  return <div className="text-[15px]">{blocks}</div>;
}

// ---------- app data ----------
const SUGGESTIONS = [
  { title: "Explain quantum computing", subtitle: "Simply, with an analogy" },
  { title: "Help me build a website", subtitle: "Start with the structure" },
  { title: "Write a story about space", subtitle: "Short and vivid" },
  { title: "Teach me Python", subtitle: "Starting from scratch" },
];

function newChat() {
  return { id: crypto.randomUUID(), title: "New chat", messages: [] };
}

function titleFromText(text) {
  const t = text.trim().replace(/\s+/g, " ");
  return t.length > 40 ? t.slice(0, 40) + "…" : t || "New chat";
}

export default function NexoraAI() {
  const [chats, setChats] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [temperature, setTemperature] = useState(1);
  const [showSettings, setShowSettings] = useState(false);

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);
  const stopRef = useRef(false);

  const activeChat = chats.find((c) => c.id === activeId) || null;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chats, activeId]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  }, [input]);

  function updateChat(id, updater) {
    setChats((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
  }

  function handleNewChat() {
    const chat = newChat();
    setChats((prev) => [chat, ...prev]);
    setActiveId(chat.id);
    setInput("");
    setError(null);
    setSidebarOpen(false);
  }

  function handleDeleteChat(id) {
    setChats((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (id === activeId) setActiveId(next[0]?.id || null);
      return next;
    });
  }

  async function handleSend(promptOverride) {
    const text = (promptOverride ?? input).trim();
    if (!text || isStreaming) return;

    setError(null);
    setInput("");
    stopRef.current = false;

    let chatId = activeId;
    let working = activeChat;
    if (!working) {
      working = newChat();
      chatId = working.id;
      setChats((prev) => [working, ...prev]);
      setActiveId(chatId);
    }

    const userMsg = { id: crypto.randomUUID(), role: "user", content: text };
    const aiMsg = { id: crypto.randomUUID(), role: "assistant", content: "" };
    const isFirst = working.messages.length === 0;

    updateChat(chatId, (c) => ({
      ...c,
      title: isFirst ? titleFromText(text) : c.title,
      messages: [...c.messages, userMsg, aiMsg],
    }));

    setIsStreaming(true);

    try {
      const history = [...working.messages, userMsg].map(({ role, content }) => ({ role, content }));

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          temperature,
          system: "You are Nexora AI, a helpful, clear, friendly assistant. Format with markdown when useful. If asked who made you, who created you, or who built this AI, respond that Nexora AI was made by Nakshatra Asrani and Nexora.",
          messages: history,
        }),
      });

      if (!response.ok) {
        throw new Error(
          response.status === 429
            ? "Nexora AI is getting a lot of requests right now. Please try again."
            : "Nexora AI couldn't connect right now. Please try again."
        );
      }

      const data = await response.json();
      const fullText = (data.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("");

      if (!fullText.trim()) {
        updateChat(chatId, (c) => ({
          ...c,
          messages: c.messages.map((m) => (m.id === aiMsg.id ? { ...m, content: "*No response was generated.*" } : m)),
        }));
      } else {
        // reveal progressively for a streaming feel
        const step = Math.max(2, Math.round(fullText.length / 120));
        for (let pos = 0; pos < fullText.length; pos += step) {
          if (stopRef.current) break;
          const slice = fullText.slice(0, pos + step);
          updateChat(chatId, (c) => ({
            ...c,
            messages: c.messages.map((m) => (m.id === aiMsg.id ? { ...m, content: slice } : m)),
          }));
          await new Promise((r) => setTimeout(r, 12));
        }
        if (!stopRef.current) {
          updateChat(chatId, (c) => ({
            ...c,
            messages: c.messages.map((m) => (m.id === aiMsg.id ? { ...m, content: fullText } : m)),
          }));
        }
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      updateChat(chatId, (c) => ({
        ...c,
        messages: c.messages.filter((m) => m.id !== aiMsg.id),
      }));
    } finally {
      setIsStreaming(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && input.trim()) handleSend();
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
      {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/50 sm:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside
        className={`fixed z-30 flex h-full w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900 transition-transform sm:static sm:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2 px-4 py-4">
          <span className="text-violet-400">✦</span>
          <span className="font-semibold tracking-tight text-slate-50">Nexora AI</span>
        </div>

        <div className="px-3">
          <button
            onClick={handleNewChat}
            className="flex w-full items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm font-medium text-slate-100 hover:border-violet-500/50"
          >
            <span className="text-violet-400">+</span> New chat
          </button>
        </div>

        <nav className="mt-3 flex-1 space-y-0.5 overflow-y-auto px-2 pb-2">
          {chats.length === 0 && <p className="px-2 py-4 text-center text-xs text-slate-500">No conversations yet</p>}
          {chats.map((chat) => (
            <div key={chat.id} className="group relative">
              {editingId === chat.id ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => {
                    if (editValue.trim()) updateChat(chat.id, (c) => ({ ...c, title: editValue.trim() }));
                    setEditingId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.target.blur();
                  }}
                  className="w-full rounded-lg bg-slate-800 px-2.5 py-2 text-sm text-slate-100 outline-none ring-1 ring-violet-500"
                />
              ) : (
                <button
                  onClick={() => {
                    setActiveId(chat.id);
                    setSidebarOpen(false);
                  }}
                  className={`flex w-full items-center rounded-lg px-2.5 py-2 text-left text-sm ${
                    chat.id === activeId ? "bg-slate-800 text-slate-50" : "text-slate-300 hover:bg-slate-800/60"
                  }`}
                >
                  <span className="flex-1 truncate">{chat.title}</span>
                </button>
              )}
              {editingId !== chat.id && (
                <div className="absolute right-1.5 top-1.5 hidden items-center gap-0.5 group-hover:flex">
                  <button
                    onClick={() => {
                      setEditingId(chat.id);
                      setEditValue(chat.title);
                    }}
                    className="rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-slate-100"
                    title="Rename"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => handleDeleteChat(chat.id)}
                    className="rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-red-400"
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-800 p-2">
          <button
            onClick={() => setShowSettings(true)}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-slate-300 hover:bg-slate-800/60"
          >
            ⚙ Settings
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-800 px-3 py-2.5 sm:px-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 sm:hidden">
              ☰
            </button>
            <span className="text-sm font-medium text-slate-50 sm:hidden">✦ Nexora AI</span>
          </div>
        </header>

        <main ref={scrollRef} className="flex-1 overflow-y-auto">
          {activeChat && activeChat.messages.length > 0 ? (
            <div className="mx-auto max-w-2xl space-y-4 px-3 py-6 sm:px-4">
              {activeChat.messages.map((m) => {
                const isUser = m.role === "user";
                const isLast = m.id === activeChat.messages[activeChat.messages.length - 1].id;
                return (
                  <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 sm:max-w-[75%] ${
                        isUser ? "rounded-br-sm bg-violet-600 text-white" : "rounded-bl-sm border border-slate-700 bg-slate-900 text-slate-100"
                      }`}
                    >
                      {!isUser && (
                        <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-violet-300">
                          <span>✦</span> Nexora AI
                        </div>
                      )}
                      {isUser ? (
                        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{m.content}</p>
                      ) : (
                        <>
                          <Markdown content={m.content} />
                          {isStreaming && isLast && <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-violet-400 align-middle" />}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-4 text-center">
              <span className="text-4xl text-violet-400">✦</span>
              <h1 className="mt-4 text-2xl font-semibold text-slate-50">Nexora AI</h1>
              <p className="mt-1.5 text-slate-500">Ask anything. Explore everything.</p>
              <div className="mt-8 grid w-full max-w-lg grid-cols-1 gap-2.5 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.title}
                    onClick={() => handleSend(s.title)}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-left hover:border-violet-500/50 hover:bg-slate-800"
                  >
                    <div className="text-sm font-medium text-slate-100">{s.title}</div>
                    <div className="text-xs text-slate-500">{s.subtitle}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>

        {error && (
          <div className="mx-auto mb-2 w-full max-w-2xl px-3 sm:px-4">
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>
          </div>
        )}

        <div className="border-t border-slate-800 bg-slate-950/95 px-3 pb-3 pt-2 sm:px-4 sm:pb-4">
          <div className="mx-auto flex max-w-2xl items-end gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 focus-within:border-violet-500/60">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Nexora AI…"
              rows={1}
              disabled={isStreaming}
              className="max-h-[180px] flex-1 resize-none bg-transparent text-[15px] text-slate-100 placeholder:text-slate-500 focus:outline-none disabled:opacity-50"
            />
            {isStreaming ? (
              <button
                onClick={() => {
                  stopRef.current = true;
                }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 hover:bg-slate-600"
                aria-label="Stop generating"
              >
                <span className="h-2.5 w-2.5 rounded-sm bg-slate-100" />
              </button>
            ) : (
              <button
                onClick={() => handleSend()}
                disabled={!input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500 text-white hover:bg-violet-400 disabled:bg-slate-700 disabled:text-slate-500"
                aria-label="Send message"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 13V3M8 3L3.5 7.5M8 3l4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
          <p className="mx-auto mt-1.5 max-w-2xl text-center text-[11px] text-slate-500">
            Nexora AI can make mistakes. Check important info.
          </p>
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-50">Settings</h2>
              <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-slate-100">
                ✕
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-500">Temperature</label>
                  <span className="text-xs text-slate-300">{temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-violet-500"
                />
              </div>
              <button
                onClick={() => {
                  setChats([]);
                  setActiveId(null);
                  setShowSettings(false);
                }}
                className="w-full rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
              >
                Clear all conversations
              </button>
              <p className="text-center text-[11px] text-slate-500">Nexora AI</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
