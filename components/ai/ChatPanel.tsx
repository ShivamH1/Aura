"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatMessage, WeatherData } from "@/lib/types";

interface ChatPanelProps {
  data: WeatherData;
}

const SUGGESTIONS = [
  "Do I need an umbrella tonight?",
  "What should I wear?",
  "Is it good for a run?",
];

export default function ChatPanel({ data }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Cleanup any in-flight stream on unmount.
  useEffect(() => () => abortRef.current?.abort(), []);

  // Auto-scroll to bottom as content grows.
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const userMsg: ChatMessage = { role: "user", content: trimmed };
    const history = [...messages, userMsg];

    // Append user message + an empty assistant placeholder to fill live.
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weather: data, messages: history }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) throw new Error("chat failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.role === "assistant") {
            next[next.length - 1] = {
              role: "assistant",
              content: last.content + chunk,
            };
          }
          return next;
        });
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.role === "assistant" && last.content === "") {
          next[next.length - 1] = {
            role: "assistant",
            content: "Sorry — I couldn't answer that just now. Please try again.",
          };
        } else {
          next.push({
            role: "assistant",
            content: "Sorry — I couldn't answer that just now. Please try again.",
          });
        }
        return next;
      });
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void send(input);
  }

  const empty = messages.length === 0;

  return (
    <section className="glass flex flex-col p-6" style={{ color: "var(--fg)" }}>
      <header className="mb-4">
        <span className="text-xs uppercase tracking-wider opacity-60">
          Ask Aura
        </span>
      </header>

      <div
        ref={listRef}
        className="scroll-x flex max-h-72 flex-col gap-3 overflow-y-auto pr-1"
      >
        {empty ? (
          <div className="flex flex-col gap-3 py-2">
            <p className="text-sm opacity-70">
              Ask anything about today&apos;s weather.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  className="rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs transition-colors hover:bg-white/15"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => {
            const isUser = m.role === "user";
            const isLast = i === messages.length - 1;
            const showTyping =
              streaming && isLast && m.role === "assistant" && m.content === "";
            return (
              <div
                key={i}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    isUser
                      ? "rounded-br-md"
                      : "rounded-bl-md border border-white/12 bg-white/8"
                  }`}
                  style={
                    isUser
                      ? {
                          background:
                            "color-mix(in srgb, var(--accent) 28%, transparent)",
                        }
                      : undefined
                  }
                >
                  {showTyping ? (
                    <span className="inline-flex items-center gap-1" aria-label="Aura is typing">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-60 [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-60 [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-60" />
                    </span>
                  ) : (
                    <span className="whitespace-pre-wrap">{m.content}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={onSubmit} className="mt-4 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={streaming}
          placeholder="Ask about the weather…"
          aria-label="Ask Aura a question"
          autoComplete="off"
          className="flex-1 rounded-full border border-white/15 bg-white/8 px-4 py-2.5 text-sm outline-none placeholder:opacity-50 focus:border-white/30 disabled:opacity-50"
          style={{ color: "var(--fg)" }}
        />
        <button
          type="submit"
          disabled={streaming || input.trim().length === 0}
          aria-label="Send"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 transition-colors disabled:opacity-40"
          style={{
            background: "color-mix(in srgb, var(--accent) 32%, transparent)",
          }}
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 2 11 13" />
            <path d="M22 2 15 22l-4-9-9-4Z" />
          </svg>
        </button>
      </form>
    </section>
  );
}
