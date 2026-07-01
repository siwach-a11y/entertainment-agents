/**
 * AI client with two transports:
 *   1. Server route `/api/chat` — used when a backend exists (local dev, Vercel).
 *   2. Browser-direct to the Anthropic API — used on static hosting (GitHub Pages),
 *      with a key the visitor supplies. The key lives only in this browser
 *      (localStorage); it is sent directly to api.anthropic.com and never to us.
 *
 * The browser-direct path uses the documented `anthropic-dangerous-direct-browser-access`
 * mechanism, which is appropriate for a personal/demo build where each user brings
 * their own key — not for a shared production key.
 */

const KEY_STORAGE = "entertainment_agents_anthropic_key";
const MODEL = "claude-opus-4-8";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

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

interface StreamOpts {
  onText: (delta: string) => void;
  useWebSearch?: boolean;
  signal?: AbortSignal;
}

/**
 * Stream an assistant response. Tries the server route first; if there's no
 * backend (static hosting), falls back to a browser-direct call with the
 * visitor's stored key. Throws MissingKeyError when neither path is available.
 */
export async function streamAssistant(prompt: string, opts: StreamOpts): Promise<void> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, useWebSearch: opts.useWebSearch ?? false }),
      signal: opts.signal,
    });
    if (res.ok && res.body) {
      await pumpPlainText(res.body, opts.onText);
      return;
    }
  } catch {
    // No backend reachable — fall through to browser-direct.
  }

  const key = getApiKey();
  if (!key) throw new MissingKeyError();
  await streamDirect(prompt, key, opts);
}

/** Read the server route's plain-text stream. */
async function pumpPlainText(
  body: ReadableStream<Uint8Array>,
  onText: (delta: string) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    onText(decoder.decode(value, { stream: true }));
  }
}

/** Call the Anthropic Messages API directly from the browser and stream text. */
async function streamDirect(prompt: string, apiKey: string, opts: StreamOpts): Promise<void> {
  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      stream: true,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new Error(describeError(res.status, detail));
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const evt = JSON.parse(data);
        if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
          opts.onText(evt.delta.text as string);
        }
      } catch {
        // Ignore partial/keepalive frames.
      }
    }
  }
}

function describeError(status: number, detail: string): string {
  if (status === 401) return "Invalid API key. Check the key and re-enter it.";
  if (status === 403) return "This key isn't permitted to use this model.";
  if (status === 429) return "Rate limited by Anthropic — wait a moment and try again.";
  if (status >= 500) return "Anthropic is temporarily unavailable. Try again shortly.";
  try {
    const parsed = JSON.parse(detail);
    if (parsed?.error?.message) return `Anthropic error: ${parsed.error.message}`;
  } catch {
    // fall through
  }
  return `Request failed (HTTP ${status}).`;
}
