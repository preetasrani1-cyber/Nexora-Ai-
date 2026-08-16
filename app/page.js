"use client";

import { useEffect, useRef, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Composer from "@/components/Composer";
import MessageBubble from "@/components/MessageBubble";
import EmptyState from "@/components/EmptyState";
import SettingsModal from "@/components/SettingsModal";
import Logo from "@/components/Logo";
import {
  loadChats,
  saveChats,
  loadSettings,
  saveSettings,
  newChat,
  titleFromMessage,
  fetchChatsRemote,
  upsertChatRemote,
  deleteChatRemote,
} from "@/lib/storage";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const MODELS = [{ id: "llama-3.3-70b-versatile", label: "Nexora Standard" }];

export default function Home() {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [user, setUser] = useState(null);
  const [syncError, setSyncError] = useState(null);

  const abortRef = useRef(null);
  const scrollRef = useRef(null);
  const supabase = getSupabaseBrowserClient();

  // Hydrate from localStorage on mount
  useEffect(() => {
    const storedChats = loadChats();
    const storedSettings = loadSettings();
    setChats(storedChats);
    setSettings(storedSettings);
    setActiveChatId(storedChats[0]?.id || null);
    setHydrated(true);
  }, []);

  // Persist chats/settings whenever they change (after hydration).
  // Local storage always acts as an offline cache, even when signed in.
  useEffect(() => {
    if (hydrated) saveChats(chats);
  }, [chats, hydrated]);

  useEffect(() => {
    if (hydrated && settings) saveSettings(settings);
  }, [settings, hydrated]);

  // Track auth state and load/merge remote chat history on sign-in.
  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) {
        setUser(data.session?.user || null);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      cancelled = true;
      listener?.subscription?.unsubscribe();
    };
  }, [supabase]);

  // On sign-in: pull remote history. If the account has none yet but this
  // browser has local chats, upload them once so nothing is lost.
  useEffect(() => {
    if (!user || !hydrated) return;
    let cancelled = false;

    (async () => {
      try {
        const remoteChats = await fetchChatsRemote(supabase);
        if (cancelled) return;

        if (remoteChats.length === 0 && chats.length > 0) {
          for (const chat of chats) {
            await upsertChatRemote(supabase, user.id, chat);
          }
          if (!cancelled) setChats(chats);
        } else {
          setChats(remoteChats);
          setActiveChatId(remoteChats[0]?.id || null);
        }
        setSyncError(null);
      } catch (err) {
        if (!cancelled) setSyncError("Couldn't sync chat history. Your chats are still saved on this device.");
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, supabase]);

  async function handleSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    const storedChats = loadChats();
    setChats(storedChats);
    setActiveChatId(storedChats[0]?.id || null);
  }

  // Apply theme class to <html>
  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;
    root.classList.toggle("dark", settings.theme === "dark");
    root.classList.toggle("light", settings.theme === "light");
  }, [settings]);

  // Auto-scroll to bottom on new content
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chats, activeChatId]);

  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  function updateChatLocal(id, updater) {
    setChats((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
  }

  function updateChat(id, updater) {
    setChats((prev) => {
      const next = prev.map((c) => (c.id === id ? updater(c) : c));
      if (user) {
        const updated = next.find((c) => c.id === id);
        if (updated) {
          upsertChatRemote(supabase, user.id, updated).catch(() => setSyncError("Couldn't save to your account. Changes are kept on this device."));
        }
      }
      return next;
    });
  }

  function handleNewChat() {
    const chat = newChat();
    setChats((prev) => [chat, ...prev]);
    setActiveChatId(chat.id);
    setInput("");
    setError(null);
    setSidebarOpen(false);
    if (user) {
      upsertChatRemote(supabase, user.id, chat).catch(() => setSyncError("Couldn't save to your account. Changes are kept on this device."));
    }
  }

  function handleSelectChat(id) {
    setActiveChatId(id);
    setError(null);
    setSidebarOpen(false);
  }

  function handleDeleteChat(id) {
    setChats((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (id === activeChatId) setActiveChatId(next[0]?.id || null);
      return next;
    });
    if (user) {
      deleteChatRemote(supabase, id).catch(() => setSyncError("Couldn't delete from your account. It's removed on this device."));
    }
  }

  function handleRenameChat(id, title) {
    updateChat(id, (c) => ({ ...c, title }));
  }

  function handleClearAll() {
    if (user) {
      chats.forEach((c) => {
        deleteChatRemote(supabase, c.id).catch(() => {});
      });
    }
    setChats([]);
    setActiveChatId(null);
    setShowSettings(false);
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  async function handleSend(promptOverride) {
    const text = (promptOverride ?? input).trim();
    if (!text || isStreaming) return;

    setError(null);
    setInput("");

    let chatId = activeChatId;
    let workingChat = activeChat;

    // Create a chat on first message if none is active
    if (!workingChat) {
      workingChat = newChat();
      chatId = workingChat.id;
      setChats((prev) => [workingChat, ...prev]);
      setActiveChatId(chatId);
    }

    const userMessage = { id: crypto.randomUUID(), role: "user", content: text };
    const assistantMessage = { id: crypto.randomUUID(), role: "assistant", content: "" };

    const isFirstMessage = workingChat.messages.length === 0;

    updateChat(chatId, (c) => ({
      ...c,
      title: isFirstMessage ? titleFromMessage(text) : c.title,
      updatedAt: Date.now(),
      messages: [...c.messages, userMessage, assistantMessage],
    }));

    setIsStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const history = [...workingChat.messages, userMessage].map(({ role, content }) => ({
        role,
        content,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          model: settings?.model,
          temperature: settings?.temperature,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Nexora AI couldn't connect right now. Please try again.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        const errorMarker = "[[NEXORA_ERROR]]";
        const markerIndex = chunk.indexOf(errorMarker);
        if (markerIndex !== -1) {
          full += chunk.slice(0, markerIndex);
          const errMsg = chunk.slice(markerIndex + errorMarker.length);
          setError(errMsg || "Something went wrong. Please try again.");
          break;
        }

        full += chunk;
        updateChatLocal(chatId, (c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === assistantMessage.id ? { ...m, content: full } : m
          ),
        }));
      }

      if (!full.trim()) {
        full = "*No response was generated.*";
      }
      // Final content, synced to the account once per message rather than per chunk.
      updateChat(chatId, (c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === assistantMessage.id ? { ...m, content: full } : m
        ),
      }));
    } catch (err) {
      if (err.name !== "AbortError") {
        setError(err.message || "Something went wrong. Please try again.");
        updateChat(chatId, (c) => ({
          ...c,
          messages: c.messages.filter((m) => m.id !== assistantMessage.id),
        }));
      } else {
        // Stopped early — sync whatever was streamed so far.
        updateChat(chatId, (c) => c);
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }

  if (!hydrated || !settings) {
    return (
      <div className="flex h-screen items-center justify-center bg-void-950">
        <span className="animate-pulse-soft text-3xl text-nebula-400">✦</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onOpenSettings={() => setShowSettings(true)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-void-700 px-3 py-2.5 sm:px-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-1.5 text-starlight-300 hover:bg-void-850 sm:hidden"
              aria-label="Open menu"
            >
              ☰
            </button>
            <div className="sm:hidden">
              <Logo />
            </div>
          </div>
        </header>

        <main ref={scrollRef} className="flex-1 overflow-y-auto">
          {activeChat && activeChat.messages.length > 0 ? (
            <div className="mx-auto max-w-3xl space-y-4 px-3 py-6 sm:px-4">
              {activeChat.messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  role={m.role}
                  content={m.content}
                  isStreaming={
                    isStreaming &&
                    m.role === "assistant" &&
                    m.id === activeChat.messages[activeChat.messages.length - 1].id
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState onSuggestionClick={(text) => handleSend(text)} />
          )}
        </main>

        {(error || syncError) && (
          <div className="mx-auto mb-2 w-full max-w-3xl px-3 sm:px-4">
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error || syncError}
            </div>
          </div>
        )}

        <Composer
          value={input}
          onChange={setInput}
          onSend={() => handleSend()}
          disabled={isStreaming}
          isStreaming={isStreaming}
          onStop={handleStop}
        />
      </div>

      {showSettings && (
        <SettingsModal
          settings={settings}
          onChange={setSettings}
          onClose={() => setShowSettings(false)}
          onClearAll={handleClearAll}
          models={MODELS}
        />
      )}
    </div>
  );
}
