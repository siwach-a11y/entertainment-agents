"use client";

import { useState, useRef, useEffect } from "react";
import StatusBar from "./StatusBar";
import ApiKeyManager from "./ApiKeyManager";
import SourceLinks from "./SourceLinks";
import { askAssistant, MissingKeyError, MODEL, type Source } from "@/lib/aiClient";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

interface AIChatProps {
  title?: string;
  placeholder?: string;
  quickAsks?: string[];
  systemContext?: string;
}

const MISSING_KEY_MESSAGE =
  "Add your Anthropic API key above to enable AI on this demo — it stays in your browser.";

export default function AIChat({
  title = "AI Assistant",
  placeholder = "Ask anything...",
  quickAsks = [],
  systemContext = "",
}: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: text.trim() },
      { role: "assistant", content: "" },
    ]);
    setInput("");
    setIsLoading(true);

    const prompt = systemContext
      ? `${systemContext}\n\nUser question: ${text.trim()}`
      : text.trim();

    const setLast = (msg: Message) =>
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = msg;
        return updated;
      });

    try {
      const result = await askAssistant(prompt, { useWebSearch: true });
      setLast({ role: "assistant", content: result.text, sources: result.sources });
    } catch (error) {
      setLast({
        role: "assistant",
        content:
          error instanceof MissingKeyError
            ? MISSING_KEY_MESSAGE
            : error instanceof Error
              ? error.message
              : "Sorry, I couldn't process your request.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="icon-box w-8 h-8 text-sm">✨</div>
          <div>
            <h3 className="font-semibold text-slate-900 tracking-tight leading-tight">{title}</h3>
            <p className="text-[11px] text-slate-400">Powered by Claude · {MODEL}</p>
          </div>
        </div>
        <StatusBar status={isLoading ? "thinking" : "idle"} />
      </div>

      <div className="mb-4">
        <ApiKeyManager />
      </div>

      {quickAsks.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {quickAsks.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              disabled={isLoading}
              className="text-xs px-3 py-1.5 rounded-full bg-hub-blue-light/60 text-hub-blue font-medium border border-hub-blue/10 hover:bg-hub-blue-light transition-colors disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="max-h-72 min-h-52 overflow-y-auto mb-4 space-y-3 rounded-xl p-4 bg-slate-50/80 border border-slate-100">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-10">
            Ask me anything about {title.replace(/ AI$/, "").toLowerCase()} — recommendations,
            trends, or what&apos;s worth your time. I can search the web and cite sources.
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-sm ${msg.role === "user" ? "text-right" : "text-left"}`}
          >
            <div
              className={`inline-block px-3.5 py-2.5 rounded-2xl max-w-[90%] text-left leading-relaxed ${
                msg.role === "user"
                  ? "bg-white text-hub-teal shadow-sm shadow-lime-900/10 ring-1 ring-lime-200/60 rounded-br-md font-medium"
                  : "bg-white/95 border border-white text-slate-700 shadow-sm rounded-bl-md w-full max-w-full"
              }`}
            >
              <span className="whitespace-pre-wrap">
                {msg.content || (isLoading && i === messages.length - 1 ? "Searching…" : "")}
              </span>
              {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                <SourceLinks sources={msg.sources} />
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          className="input-modern flex-1"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="btn-primary shrink-0"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export function useAIResponse() {
  const [response, setResponse] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const ask = async (prompt: string) => {
    setIsLoading(true);
    setResponse("");
    setSources([]);

    try {
      const result = await askAssistant(prompt, { useWebSearch: true });
      setResponse(result.text);
      setSources(result.sources);
    } catch (error) {
      setResponse(
        error instanceof MissingKeyError
          ? MISSING_KEY_MESSAGE
          : error instanceof Error
            ? error.message
            : "Unable to get AI response.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return { response, sources, isLoading, ask };
}
