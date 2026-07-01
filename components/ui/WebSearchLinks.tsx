"use client";

import { useMemo, useState } from "react";
import type { EntertainmentDomain } from "@/lib/data/discovery";
import { defaultQuery, searchTargets } from "@/lib/webSearchLinks";
import SourceLinks from "@/components/ui/SourceLinks";

/**
 * Keyless web search: type a query, get live search links to the real
 * platforms for this domain. Works on static hosting — no API key needed.
 */
export default function WebSearchLinks({
  domain,
  noun,
}: {
  domain: EntertainmentDomain;
  noun: string;
}) {
  const [query, setQuery] = useState("");
  const targets = searchTargets[domain];
  const effective = query.trim() || defaultQuery[domain];

  const sources = useMemo(
    () =>
      targets.map((t) => ({
        title: `Search ${t.name} for "${effective}"`,
        url: t.build(effective),
      })),
    [targets, effective],
  );

  return (
    <div className="glass-panel p-5 space-y-3">
      <div>
        <p className="section-title mb-1">🔎 Search the web</p>
        <p className="text-xs text-slate-500">
          Find real, up-to-date {noun} on the platforms below — no API key needed.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={defaultQuery[domain]}
          className="input-modern flex-1 min-w-[12rem]"
        />
        {targets.map((t) => (
          <button
            key={t.name}
            type="button"
            onClick={() => window.open(t.build(effective), "_blank", "noopener,noreferrer")}
            className="btn-secondary !py-2 !px-3 !text-xs !rounded-lg"
          >
            {t.name}
          </button>
        ))}
      </div>

      <SourceLinks sources={sources} />
    </div>
  );
}
