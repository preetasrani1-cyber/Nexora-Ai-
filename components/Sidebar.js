"use client";

import { useState } from "react";
import Logo from "./Logo";
import AuthButton from "./AuthButton";

export default function Sidebar({
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  onOpenSettings,
  isOpen,
  onClose,
  user,
  onSignIn,
  onSignOut,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const startRename = (chat) => {
    setEditingId(chat.id);
    setEditValue(chat.title);
  };

  const commitRename = (id) => {
    if (editValue.trim()) onRenameChat(id, editValue.trim());
    setEditingId(null);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 sm:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed z-30 flex h-full w-72 shrink-0 flex-col border-r border-void-700 bg-void-900 transition-transform sm:static sm:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <Logo />
        </div>

        <div className="px-3">
          <button
            onClick={onNewChat}
            className="flex w-full items-center gap-2 rounded-xl border border-void-600 bg-void-850 px-3 py-2.5 text-sm font-medium text-starlight-100 transition-colors hover:border-nebula-500/50 hover:bg-void-800"
          >
            <span className="text-nebula-400">+</span>
            New chat
          </button>
        </div>

        <nav className="mt-3 flex-1 overflow-y-auto px-2 pb-2">
          {chats.length === 0 && (
            <p className="px-2 py-4 text-center text-xs text-starlight-500">
              No conversations yet
            </p>
          )}
          <ul className="space-y-0.5">
            {chats.map((chat) => (
              <li key={chat.id} className="group relative">
                {editingId === chat.id ? (
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => commitRename(chat.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename(chat.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="w-full rounded-lg bg-void-800 px-2.5 py-2 text-sm text-starlight-100 outline-none ring-1 ring-nebula-500"
                  />
                ) : (
                  <button
                    onClick={() => onSelectChat(chat.id)}
                    className={`flex w-full items-center rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                      chat.id === activeChatId
                        ? "bg-void-800 text-starlight-50"
                        : "text-starlight-300 hover:bg-void-850"
                    }`}
                  >
                    <span className="flex-1 truncate">{chat.title}</span>
                  </button>
                )}

                {editingId !== chat.id && (
                  <div className="absolute right-1.5 top-1.5 hidden items-center gap-0.5 group-hover:flex">
                    <button
                      onClick={() => startRename(chat)}
                      className="rounded p-1 text-starlight-500 hover:bg-void-700 hover:text-starlight-100"
                      aria-label="Rename chat"
                      title="Rename"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => onDeleteChat(chat.id)}
                      className="rounded p-1 text-starlight-500 hover:bg-void-700 hover:text-red-400"
                      aria-label="Delete chat"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-void-700 p-2">
          <div className="mb-1">
            <AuthButton user={user} onSignIn={onSignIn} onSignOut={onSignOut} />
          </div>
          {!user && (
            <p className="px-2 pb-1.5 text-center text-[11px] text-starlight-500">
              Sign in to sync chat history across devices
            </p>
          )}
          <button
            onClick={onOpenSettings}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-starlight-300 transition-colors hover:bg-void-850 hover:text-starlight-100"
          >
            ⚙ Settings
          </button>
        </div>
      </aside>
    </>
  );
}
