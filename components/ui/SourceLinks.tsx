"use client";

import type { Source } from "@/lib/aiClient";

/** Clickable list of web-search sources cited by the assistant. */
export default function SourceLinks({ sources }: { sources: Source[] }) {
  if (!sources.length) return null;
  return (
    <div className="mt-3 pt-3 border-t border-slate-200/70">
      <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-1.5">Sources</p>
      <div className="space-y-1">
        {sources.map((s) => (
          <a
            key={s.url}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-1.5 text-xs text-hub-teal hover:text-hub-green hover:underline break-words"
          >
            <svg
              className="w-3 h-3 mt-0.5 shrink-0"
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
            <span>{s.title}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
