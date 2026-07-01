/**
 * AI client with two transports:
 *   1. Server route `/api/chat` — used when a backend exists (local dev, Vercel).
 *   2. Browser-direct to the Anthropic API — used on static hosting (GitHub Pages),
 *      with a key the visitor supplies. The key lives only in this browser
 *      (localStorage); it is sent directly to api.anthropic.com and never to us.
 *
 * The browser-direct path uses the documented `anthropic-dangerous-direct-browser-access`
 * mechanism, appropriate for a personal/demo build where each user brings their
 * own key. It enables the web_search tool and returns both the answer text and
 * the cited source links, so answers can render with clickable sources.
 */

const KEY_STORAGE = "entertainment_agents_anthropic_key";
export const MODEL = "claude-opus-4-8";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2023-06-01";

const SEARCH_SYSTEM =
  "You are a helpful entertainment discovery assistant. Answer concisely in a friendly, expert tone, using short paragraphs or compact lists. " +
  "You have a web_search tool. Whenever the answer depends on current information — what's trending now, new releases, charts, box office, streaming availability, prices, or reviews — " +
  "search the web first and base your answer on what you find. Cite the specific sources you used, preferring recent, reputable ones.";

export interface Source {
  url: string;
  title: string;
}

export interface AssistantResult {
  text: string;
  sources: Source[];
}

export class MissingKeyError extends Error {
  constructor() {
    super("No Anthropic API key set.");
    this.name = "MissingKeyError";
  }
}

export function getApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(KEY_STORAGE);
}

export function setApiKey(key: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_STORAGE, key.trim());
}

export function clearApiKey(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY_STORAGE);
}

export function hasApiKey(): boolean {
  return !!getApiKey();
}

export function maskKey(key: string): string {
  if (key.length <= 12) return "••••";
  return `${key.slice(0, 7)}…${key.slice(-4)}`;
}

interface AskOpts {
  useWebSearch?: boolean;
  signal?: AbortSignal;
}

/**
 * Ask the assistant and return the answer text plus any cited source links.
 * Tries the server route first; falls back to a browser-direct call with the
 * visitor's stored key. Throws MissingKeyError when neither path is available.
 */
export async function askAssistant(prompt: string, opts: AskOpts = {}): Promise<AssistantResult> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, useWebSearch: opts.useWebSearch ?? true }),
      signal: opts.signal,
    });
    if (res.ok && res.body) {
      const text = await readAllText(res.body);
      return { text: text.trim() || "(No response.)", sources: [] };
    }
  } catch {
    // No backend reachable — fall through to browser-direct.
  }

  const key = getApiKey();
  if (!key) throw new MissingKeyError();
  return completeDirect(prompt, key, opts);
}

async function readAllText(body: ReadableStream<Uint8Array>): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let out = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    out += decoder.decode(value, { stream: true });
  }
  return out;
}

/** Call the Anthropic Messages API directly with web search; return text + sources. */
async function completeDirect(
  prompt: string,
  apiKey: string,
  opts: AskOpts,
): Promise<AssistantResult> {
  const useWebSearch = opts.useWebSearch ?? true;
  const messages: { role: string; content: unknown }[] = [{ role: "user", content: prompt }];
  const MAX_ROUNDS = 4;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": API_VERSION,
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
        system: SEARCH_SYSTEM,
        messages,
        tools: useWebSearch ? [{ type: "web_search_20260209", name: "web_search" }] : undefined,
      }),
      signal: opts.signal,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(describeError(res.status, data));
    if (data.stop_reason === "refusal") {
      throw new Error("The request was declined by the model's safety system. Try rephrasing.");
    }

    messages.push({ role: "assistant", content: data.content });

    // Server-side tool loop hit its iteration cap — resume the same turn.
    if (data.stop_reason === "pause_turn" && round < MAX_ROUNDS - 1) continue;
    break;
  }

  return collectResult(messages);
}

/** Gather answer text and de-duplicated cited sources from all assistant turns. */
function collectResult(messages: { role: string; content: unknown }[]): AssistantResult {
  let text = "";
  const sources: Source[] = [];
  const seen = new Set<string>();

  const addSource = (url?: string, title?: string) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    sources.push({ url, title: title || url });
  };

  for (const message of messages) {
    if (message.role !== "assistant" || !Array.isArray(message.content)) continue;
    for (const block of message.content as Array<Record<string, unknown>>) {
      if (block.type === "text") {
        text += block.text as string;
        for (const c of (block.citations as Array<Record<string, string>>) ?? []) {
          addSource(c.url, c.title);
        }
      } else if (block.type === "web_search_tool_result") {
        // Fallback when the model didn't attach inline citations.
        const results = Array.isArray(block.content) ? (block.content as Array<Record<string, string>>) : [];
        for (const r of results) {
          if (r && r.type === "web_search_result") addSource(r.url, r.title);
        }
      }
    }
  }

  return { text: text.trim() || "(No text response.)", sources };
}

function describeError(status: number, data: unknown): string {
  if (status === 401) return "That API key was rejected (401). Use “Forget key” and re-enter it.";
  if (status === 403) return "This key isn't permitted to use this model.";
  if (status === 429) return "Rate limited by Anthropic — wait a moment and try again.";
  if (status >= 500) return "Anthropic is temporarily unavailable. Try again shortly.";
  const message = (data as { error?: { message?: string } })?.error?.message;
  if (message) return `Anthropic error: ${message}`;
  return `Request failed (HTTP ${status}).`;
}
