"use client";

import { useMemo, useState } from "react";
import {
  discoveryConfigs,
  formatGrowth,
  formatMetric,
  formatScore,
  resultUrl,
  type EntertainmentDomain,
  type MoodOption,
  type RankedItem,
} from "@/lib/data/discovery";
import { getCatalogForDomain } from "@/lib/data/discoveryCatalog";
import {
  describeQuery,
  newItems,
  runDiscovery,
  trendingItems,
  type DiscoveryQuery,
  type SortMode,
} from "@/lib/discovery/engine";
import TabSwitcher from "@/components/ui/TabSwitcher";
import AIChat, { useAIResponse } from "@/components/ui/AIChat";
import StatusBar from "@/components/ui/StatusBar";
import SourceLinks from "@/components/ui/SourceLinks";

const sortOptions: { id: SortMode; label: string }[] = [
  { id: "match", label: "Best match" },
  { id: "trending", label: "Trending now" },
  { id: "popular", label: "Most popular" },
  { id: "rating", label: "Top rated" },
  { id: "new", label: "Newest" },
];

const availabilityPill: Record<string, string> = {
  available: "bg-hub-green-light/90 text-hub-green",
  "few-left": "bg-hub-amber-light/90 text-hub-amber",
  "sold-out": "bg-hub-coral-light/90 text-hub-coral",
};

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

interface CardProps {
  item: RankedItem;
  metric: string;
  score: string;
  actionLabel: string;
  saved: boolean;
  onSave: () => void;
  onAction: () => void;
  onDetails: () => void;
  showReasons: boolean;
}

function DiscoveryCard({
  item,
  metric,
  score,
  actionLabel,
  saved,
  onSave,
  onAction,
  onDetails,
  showReasons,
}: CardProps) {
  const pill = availabilityPill[item.availability] ?? availabilityPill.available;
  return (
    <div className="glass-card p-4 group">
      <div className="flex items-start gap-3.5">
        <div className="icon-box w-11 h-11 text-lg shrink-0">{item.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 truncate tracking-tight">{item.title}</h3>
              <p className="text-sm text-slate-400 mt-0.5 truncate">
                {item.creator} · {item.platform}
              </p>
            </div>
            <span className="font-bold text-hub-blue whitespace-nowrap text-sm">{score}</span>
          </div>

          <p className="text-xs text-slate-500 mt-2 line-clamp-2">{item.synopsis}</p>

          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            <span className={`badge-pill !normal-case !tracking-normal border-transparent ${pill}`}>
              {item.genre}
            </span>
            {[metric, item.runtime, formatGrowth(item.growthPercent), item.region]
              .filter(Boolean)
              .map((m, i) => (
                <span
                  key={`${m}-${i}`}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100/90 text-slate-500 font-medium"
                >
                  {m}
                </span>
              ))}
            {item.isNew && (
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-hub-blue-light/70 text-hub-blue font-semibold">
                NEW
              </span>
            )}
          </div>

          {showReasons && item.matchReasons.length > 0 && (
            <ul className="mt-2.5 space-y-0.5">
              {item.matchReasons.map((r, i) => (
                <li key={i} className="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <span className="text-hub-green">✓</span>
                  {r}
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap gap-2 mt-3.5">
            <button onClick={onDetails} className="btn-secondary !py-1.5 !px-3 !text-xs !rounded-lg">
              Details
            </button>
            <button
              onClick={onSave}
              className={`!py-1.5 !px-3 !text-xs !rounded-lg font-medium border transition-colors ${
                saved
                  ? "bg-hub-teal text-white border-hub-teal"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              {saved ? "✓ Saved" : "+ Save"}
            </button>
            <button onClick={onAction} className="btn-primary !py-1.5 !px-3 !text-xs !rounded-lg">
              {actionLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MediaDiscoveryAgent({ domain }: { domain: EntertainmentDomain }) {
  const config = discoveryConfigs[domain];
  const catalog = useMemo(() => getCatalogForDomain(domain), [domain]);

  const [tab, setTab] = useState("discover");
  const [genres, setGenres] = useState<Set<string>>(new Set());
  const [platforms, setPlatforms] = useState<Set<string>>(new Set());
  const [region, setRegion] = useState("Global");
  const [mood, setMood] = useState<MoodOption | null>(null);
  const [text, setText] = useState("");
  const [sort, setSort] = useState<SortMode>("match");
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const { response, sources, isLoading, ask } = useAIResponse();

  const query: DiscoveryQuery = useMemo(
    () => ({ genres, platforms, region, mood, text, sort }),
    [genres, platforms, region, mood, text, sort],
  );

  const result = useMemo(() => runDiscovery(catalog, query), [catalog, query]);
  const trending = useMemo(() => trendingItems(catalog), [catalog]);
  const fresh = useMemo(() => newItems(catalog), [catalog]);
  const savedItems = useMemo(() => catalog.filter((i) => saved.has(i.id)), [catalog, saved]);

  const hasFilters =
    genres.size > 0 || platforms.size > 0 || region !== "Global" || mood !== null || text.trim() !== "";

  const resetFilters = () => {
    setGenres(new Set());
    setPlatforms(new Set());
    setRegion("Global");
    setMood(null);
    setText("");
    setSort("match");
  };

  const toggleSave = (id: string) => setSaved((prev) => toggleInSet(prev, id));

  const askAboutItem = (item: RankedItem) =>
    ask(
      `Tell me about the ${config.noun} "${item.title}" by ${item.creator} (${item.genre}, on ${item.platform}). Is it worth my time and who is it for? Keep it spoiler-free and concise.`,
    );

  const askForPicks = () => ask(describeQuery(query, config));

  const tabs = [
    { id: "discover", label: "Discover" },
    { id: "trending", label: "Trending" },
    { id: "new", label: "New" },
    { id: "watchlist", label: `${config.watchlistLabel} (${saved.size})` },
  ];

  const renderGrid = (items: RankedItem[], showReasons: boolean, emptyMsg: string) =>
    items.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => (
          <DiscoveryCard
            key={item.id}
            item={item}
            metric={formatMetric(item, config)}
            score={formatScore(item, config)}
            actionLabel={config.actionLabel}
            saved={saved.has(item.id)}
            onSave={() => toggleSave(item.id)}
            onAction={() => window.open(resultUrl(item), "_blank", "noopener,noreferrer")}
            onDetails={() => askAboutItem(item)}
            showReasons={showReasons}
          />
        ))}
      </div>
    ) : (
      <div className="empty-state md:col-span-2">{emptyMsg}</div>
    );

  return (
    <div className="space-y-6">
      <div className="rounded-xl p-3.5 text-sm text-hub-teal bg-white/90 border border-white shadow-sm">
        {config.tagline}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(
          [
            ["Catalog", catalog.length],
            ["Trending", trending.length],
            ["New", fresh.length],
            [config.watchlistLabel, saved.size],
          ] as const
        ).map(([label, val]) => (
          <div key={label} className="glass-panel p-2.5 text-center">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
            <p className="text-lg font-bold text-slate-900">{val}</p>
          </div>
        ))}
      </div>

      <TabSwitcher tabs={tabs} activeTab={tab} onChange={setTab} />

      {tab === "discover" && (
        <div className="space-y-4">
          <div className="glass-panel p-5 space-y-4">
            <div>
              <p className="section-title mb-2">What are you in the mood for?</p>
              <div className="flex flex-wrap gap-2">
                {config.moods.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMood((prev) => (prev?.id === m.id ? null : m))}
                    className={`rounded-full px-3.5 py-1.5 text-sm font-medium border transition-colors ${
                      mood?.id === m.id
                        ? "bg-hub-teal text-white border-hub-teal"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="section-title mb-2">Genre</p>
              <div className="flex flex-wrap gap-1.5">
                {config.genres.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGenres((prev) => toggleInSet(prev, g))}
                    className={`rounded-full px-3 py-1 text-xs font-medium border ${
                      genres.has(g)
                        ? "bg-hub-blue text-white border-hub-blue"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="section-title mb-2">Platform</p>
              <div className="flex flex-wrap gap-1.5">
                {config.platforms.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlatforms((prev) => toggleInSet(prev, p))}
                    className={`rounded-full px-3 py-1 text-xs font-medium border ${
                      platforms.has(p)
                        ? "bg-hub-teal text-white border-hub-teal"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select value={region} onChange={(e) => setRegion(e.target.value)} className="input-modern">
                {config.regions.map((r) => (
                  <option key={r} value={r}>
                    {r === "Global" ? "Any region" : r}
                  </option>
                ))}
              </select>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortMode)}
                className="input-modern"
              >
                {sortOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Search titles, creators, keywords..."
                className="input-modern"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={askForPicks} className="btn-primary !py-2 !text-xs">
                ✨ Ask AI for picks
              </button>
              {hasFilters && (
                <button type="button" onClick={resetFilters} className="btn-secondary !py-2 !text-xs">
                  Clear filters
                </button>
              )}
              <StatusBar
                status={isLoading ? "thinking" : "idle"}
                message={`${result.stats.matched} of ${result.stats.scanned} ${config.nounPlural} match`}
              />
            </div>
          </div>

          {renderGrid(
            result.items,
            true,
            `No ${config.nounPlural} match those filters — try clearing a few.`,
          )}
        </div>
      )}

      {tab === "trending" && renderGrid(trending, false, "Nothing trending right now.")}

      {tab === "new" && renderGrid(fresh, false, `No new ${config.nounPlural} this cycle.`)}

      {tab === "watchlist" &&
        renderGrid(
          savedItems.map((i) => ({ ...i, matchScore: 0, matchReasons: [] })),
          false,
          `Your ${config.watchlistLabel.toLowerCase()} is empty — tap "+ Save" on any ${config.noun}.`,
        )}

      {response && (
        <div className="glass-panel p-5">
          <StatusBar status={isLoading ? "thinking" : "idle"} />
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap mt-2">{response}</p>
          {sources.length > 0 && <SourceLinks sources={sources} />}
        </div>
      )}

      <AIChat
        title={config.name.replace(" Discovery Agent", " AI")}
        placeholder={`Ask about ${config.nounPlural}, recommendations, or what's worth your time...`}
        quickAsks={config.quickAsks}
        systemContext={config.systemContext}
      />
    </div>
  );
}
