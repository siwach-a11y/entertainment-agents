"use client";

import type { Source } from "@/lib/aiClient";

/** "https://www.coinmarketcap.com/currencies/axie/…" → "coinmarketcap.com" */
function siteName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Trim the scheme and trailing slash for a compact, readable URL. */
function prettyUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

/** Clickable list of web-search sources cited by the assistant, with URLs shown. */
export default function SourceLinks({ sources }: { sources: Source[] }) {
  if (!sources.length) return null;
  return (
    <div className="mt-3 pt-3 border-t border-slate-200/70">
      <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-1.5">
        Sources ({sources.length})
      </p>
      <div className="space-y-2">
        {sources.map((s) => (
          <a
            key={s.url}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-1.5 break-words"
          >
            <svg
              className="w-3 h-3 mt-1 shrink-0 text-hub-teal"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
              />
            </svg>
            <span className="min-w-0">
              <span className="block text-xs font-medium text-hub-teal group-hover:text-hub-green group-hover:underline">
                {s.title}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <span className="font-medium text-slate-500">{siteName(s.url)}</span>
                <span className="truncate">· {prettyUrl(s.url)}</span>
              </span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
