"use client";

import { useState, useRef, useEffect } from "react";
import StatusBar from "./StatusBar";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIChatProps {
  title?: string;
  placeholder?: string;
  quickAsks?: string[];
  systemContext?: string;
}

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

    const userMessage: Message = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const prompt = systemContext
      ? `${systemContext}\n\nUser question: ${text.trim()}`
      : text.trim();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, useWebSearch: true }),
      });

      if (!res.ok) throw new Error("Failed to get response");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          assistantText += decoder.decode(value, { stream: true });
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: assistantText,
            };
            return updated;
          });
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't process your request. Please check that ANTHROPIC_API_KEY is set in .env.local.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-panel p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="icon-box w-8 h-8 text-sm">✨</div>
          <h3 className="font-semibold text-slate-900 tracking-tight">{title}</h3>
        </div>
        <StatusBar status={isLoading ? "thinking" : "idle"} />
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

      <div className="h-52 overflow-y-auto mb-4 space-y-3 rounded-xl p-4 bg-slate-50/80 border border-slate-100">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-10">
            Ask me anything — I can search the web for up-to-date info.
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-sm ${msg.role === "user" ? "text-right" : "text-left"}`}
          >
            <span
              className={`inline-block px-3.5 py-2.5 rounded-2xl max-w-[85%] leading-relaxed ${
                msg.role === "user"
                  ? "bg-white text-hub-teal shadow-sm shadow-lime-900/10 ring-1 ring-lime-200/60 rounded-br-md font-medium"
                  : "bg-white/95 border border-white text-slate-700 shadow-sm rounded-bl-md"
              }`}
            >
              {msg.content ||
                (isLoading && i === messages.length - 1 ? "..." : "")}
            </span>
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
  const [isLoading, setIsLoading] = useState(false);

  const ask = async (prompt: string) => {
    setIsLoading(true);
    setResponse("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, useWebSearch: true }),
      });

      if (!res.ok) throw new Error("Failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let text = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          text += decoder.decode(value, { stream: true });
          setResponse(text);
        }
      }
    } catch {
      setResponse("Unable to get AI response. Check your API key.");
    } finally {
      setIsLoading(false);
    }
  };

  return { response, isLoading, ask };
}
