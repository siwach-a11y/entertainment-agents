"use client";

import { useState } from "react";
import { agents } from "@/lib/data/agents";

export default function MarketplaceChat() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const agentList = agents
    .map(
      (a) =>
        `- ${a.name} (${a.id}): ${a.description} [${a.category}] Tags: ${a.tags.join(", ")}`
    )
    .join("\n");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setResponse("");
    setExpanded(true);

    const prompt = `You are the Entertainment Agents marketplace assistant. Based on the user's needs, recommend the best entertainment discovery agent(s) from our catalog.

Available agents:
${agentList}

User query: ${input.trim()}

Recommend 1-3 agents that best match their needs. Explain why each is a good fit. Be concise and helpful.`;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, useWebSearch: false }),
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
      setResponse("Unable to get recommendations. Please check your API key.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none">
      <div className="max-w-3xl mx-auto pointer-events-auto">
        <div className="glass-dock rounded-2xl overflow-hidden">
          {expanded && response && (
            <div className="px-5 pt-4 pb-2 max-h-36 overflow-y-auto border-b border-slate-100">
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {response}
                {isLoading && (
                  <span className="inline-block w-1.5 h-4 ml-0.5 bg-hub-blue animate-pulse-soft align-middle rounded-sm" />
                )}
              </p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex items-center gap-3 p-3">
            <div className="icon-box w-9 h-9 text-base shrink-0 ml-1">✨</div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setExpanded(true)}
              placeholder="Ask AI to recommend an agent..."
              disabled={isLoading}
              className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="btn-primary !rounded-xl !py-2.5 !px-5 shrink-0"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </span>
              ) : (
                "Ask"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
