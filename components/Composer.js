"use client";

import { useEffect, useRef } from "react";

export default function Composer({ value, onChange, onSend, disabled, isStreaming, onStop }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  };

  return (
    <div className="border-t border-void-700 bg-void-950/95 px-3 pb-3 pt-2 backdrop-blur sm:px-4 sm:pb-4">
      <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-void-600 bg-void-850 px-3 py-2 shadow-glow focus-within:border-nebula-500/60">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Nexora AI…"
          rows={1}
          disabled={disabled}
          className="max-h-[200px] flex-1 resize-none bg-transparent text-[15px] text-starlight-100 placeholder:text-starlight-500 focus:outline-none disabled:opacity-50"
        />
        {isStreaming ? (
          <button
            onClick={onStop}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-void-700 text-starlight-100 transition-colors hover:bg-void-600"
            aria-label="Stop generating"
          >
            <span className="h-2.5 w-2.5 rounded-sm bg-starlight-100" />
          </button>
        ) : (
          <button
            onClick={onSend}
            disabled={disabled || !value.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nebula-500 text-white transition-colors hover:bg-nebula-400 disabled:cursor-not-allowed disabled:bg-void-700 disabled:text-starlight-500"
            aria-label="Send message"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 13V3M8 3L3.5 7.5M8 3l4.5 4.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>
      <p className="mx-auto mt-1.5 max-w-3xl text-center text-[11px] text-starlight-500">
        Nexora AI can make mistakes. Check important info.
      </p>
    </div>
  );
}
