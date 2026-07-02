"use client";

import { useEffect, useMemo, useState } from "react";
import {
  discoveryConfigs,
  formatGrowth,
  formatMetric,
  formatScore,
  resultUrl,
  type DiscoveryItem,
  type EntertainmentDomain,
  type MoodOption,
  type RankedItem,
} from "@/lib/data/discovery";
import { getCatalogForDomain } from "@/lib/data/discoveryCatalog";
import {
  buildCollection,
  collectionShareText,
  collectionTitle,
  collectionTotal,
  deleteCollection,
  formatMinutes,
  getCollections,
  planLabels,
  saveCollection,
  scheduleCollection,
  type Collection,
} from "@/lib/collections";
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
import WebSearchLinks from "@/components/ui/WebSearchLinks";

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
  const [showFilters, setShowFilters] = useState(false);
  const [showWebSearch, setShowWebSearch] = useState(false);

  // "Plan" capability — build a collection (movie night / mix / binge / marathon).
  const plan = planLabels[domain];
  const [planMood, setPlanMood] = useState<MoodOption | null>(null);
  const [planSize, setPlanSize] = useState(4);
  const [built, setBuilt] = useState<DiscoveryItem[] | null>(null);
  const [builtTitle, setBuiltTitle] = useState("");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [copied, setCopied] = useState(false);
  const [scheduleDays, setScheduleDays] = useState(0); // 0 = not scheduled

  // Compare capability
  const [cmpAId, setCmpAId] = useState("");
  const [cmpBId, setCmpBId] = useState("");

  useEffect(() => setCollections(getCollections(domain)), [domain]);
  useEffect(() => {
    if (catalog.length >= 2) {
      setCmpAId(catalog[0].id);
      setCmpBId(catalog[1].id);
    }
  }, [catalog]);

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

  // --- Plan / collection actions ---
  const runBuild = () => {
    const picks = buildCollection(catalog, planMood, planSize);
    setBuilt(picks);
    setBuiltTitle(collectionTitle(planMood, domain));
    setCopied(false);
    setScheduleDays(0);
  };

  const cmpA = catalog.find((i) => i.id === cmpAId);
  const cmpB = catalog.find((i) => i.id === cmpBId);

  const saveBuilt = () => {
    if (!built) return;
    saveCollection({
      id: `col-${Date.now()}`,
      title: builtTitle,
      itemIds: built.map((i) => i.id),
      domain,
      createdAt: Date.now(),
    });
    setCollections(getCollections(domain));
  };

  const copyBuilt = async () => {
    if (!built) return;
    const text = collectionShareText(builtTitle, collectionTotal(built, domain), built);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  };

  const openAll = () => {
    built?.slice(0, 8).forEach((i) => window.open(resultUrl(i), "_blank", "noopener,noreferrer"));
  };

  const loadCollection = (c: Collection) => {
    setBuilt(c.itemIds.map((id) => catalog.find((i) => i.id === id)).filter(Boolean) as DiscoveryItem[]);
    setBuiltTitle(c.title);
    setTab("plan");
  };

  const removeCollection = (id: string) => {
    deleteCollection(domain, id);
    setCollections(getCollections(domain));
  };

  const tabs = [
    { id: "discover", label: "Discover" },
    { id: "trending", label: "Trending" },
    { id: "plan", label: `${plan.emoji} ${plan.tab}` },
    { id: "compare", label: "⚖️ Compare" },
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
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Search ${config.nounPlural}, or describe what you want…`}
              className="input-modern !py-3 text-base"
            />

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

            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={askForPicks} className="btn-primary !py-2 !text-xs">
                ✨ Ask AI for picks
              </button>
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className="btn-secondary !py-2 !text-xs"
              >
                {showFilters ? "Hide filters" : "Filters"}
                {hasFilters ? " •" : ""}
              </button>
              {hasFilters && (
                <button type="button" onClick={resetFilters} className="btn-secondary !py-2 !text-xs">
                  Clear
                </button>
              )}
              <span className="text-xs text-slate-400">
                {result.stats.matched} of {result.stats.scanned}
              </span>
            </div>

            {showFilters && (
              <div className="space-y-4 border-t border-slate-200 pt-4">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                </div>
              </div>
            )}
          </div>

          {renderGrid(
            result.items,
            true,
            `No ${config.nounPlural} match those filters — try clearing a few.`,
          )}

          <button
            type="button"
            onClick={() => setShowWebSearch((v) => !v)}
            className="text-xs font-medium text-slate-400 hover:text-hub-teal transition-colors"
          >
            🔎 {showWebSearch ? "Hide web search" : "Search the web instead"}
          </button>
          {showWebSearch && <WebSearchLinks domain={domain} noun={config.nounPlural} />}
        </div>
      )}

      {tab === "trending" && renderGrid(trending, false, "Nothing trending right now.")}

      {tab === "plan" && (
        <div className="space-y-4">
          <div className="glass-panel p-5 space-y-4">
            <div>
              <p className="section-title mb-1">{plan.action}</p>
              <p className="text-sm text-slate-400">
                Pick a vibe and I&apos;ll assemble a curated {plan.noun} — diverse picks, total
                runtime, ready to save or share.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {config.moods.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPlanMood((prev) => (prev?.id === m.id ? null : m))}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium border transition-colors ${
                    planMood?.id === m.id
                      ? "bg-hub-teal text-white border-hub-teal"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-xs text-slate-400 flex items-center gap-2">
                Size
                <select
                  value={planSize}
                  onChange={(e) => setPlanSize(parseInt(e.target.value, 10))}
                  className="input-modern !w-auto !py-1.5"
                >
                  {[3, 4, 5, 8].map((n) => (
                    <option key={n} value={n}>{n} picks</option>
                  ))}
                </select>
              </label>
              <button type="button" onClick={runBuild} className="btn-primary !py-2 !text-xs">
                {plan.emoji} {plan.action}
              </button>
            </div>
          </div>

          {built && (
            <div className="glass-panel p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 tracking-tight">{builtTitle}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{collectionTotal(built, domain)}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={saveBuilt} className="btn-secondary !py-1.5 !px-2.5 !text-xs !rounded-lg">Save</button>
                  <button onClick={copyBuilt} className="btn-secondary !py-1.5 !px-2.5 !text-xs !rounded-lg">{copied ? "Copied ✓" : "Copy"}</button>
                  <button onClick={openAll} className="btn-primary !py-1.5 !px-2.5 !text-xs !rounded-lg">Open all</button>
                </div>
              </div>
              <ol className="space-y-2">
                {built.map((i, n) => (
                  <li key={i.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-2.5">
                    <span className="text-slate-400 text-sm w-5 text-center shrink-0">{n + 1}</span>
                    <span className="icon-box w-9 h-9 text-base shrink-0">{i.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{i.title}</p>
                      <p className="text-xs text-slate-400 truncate">{i.creator} · {i.genre} · {i.runtime}</p>
                    </div>
                    <button
                      onClick={() => window.open(resultUrl(i), "_blank", "noopener,noreferrer")}
                      className="btn-secondary !py-1 !px-2.5 !text-xs !rounded-lg shrink-0"
                    >
                      {config.actionLabel}
                    </button>
                  </li>
                ))}
              </ol>

              <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                <span className="text-xs text-slate-400">📅 Spread across</span>
                {[0, 2, 3, 5, 7].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setScheduleDays(d)}
                    className={`rounded-full px-3 py-1 text-xs font-medium border ${
                      scheduleDays === d
                        ? "bg-hub-teal text-white border-hub-teal"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {d === 0 ? "Off" : `${d} days`}
                  </button>
                ))}
              </div>

              {scheduleDays > 0 && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {scheduleCollection(built, scheduleDays).map((day) => (
                    <div key={day.day} className="rounded-xl border border-slate-100 p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-sm font-semibold text-slate-900">Day {day.day}</p>
                        <span className="text-[11px] text-slate-400">~{formatMinutes(day.minutes)}</span>
                      </div>
                      <ul className="space-y-1">
                        {day.items.map((it) => (
                          <li key={it.id} className="flex items-center gap-2 text-xs text-slate-500">
                            <span>{it.emoji}</span>
                            <span className="truncate">{it.title}</span>
                            <span className="text-slate-300">· {it.runtime}</span>
                          </li>
                        ))}
                        {day.items.length === 0 && <li className="text-xs text-slate-400">— rest day —</li>}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {collections.length > 0 && (
            <div className="glass-panel p-5">
              <p className="section-title mb-3">Saved {plan.noun}s ({collections.length})</p>
              <div className="space-y-2">
                {collections.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-2.5">
                    <span className="text-lg shrink-0">{plan.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{c.title}</p>
                      <p className="text-xs text-slate-400">{c.itemIds.length} picks</p>
                    </div>
                    <button onClick={() => loadCollection(c)} className="btn-secondary !py-1 !px-2.5 !text-xs !rounded-lg shrink-0">Open</button>
                    <button onClick={() => removeCollection(c.id)} className="btn-secondary !py-1 !px-2.5 !text-xs !rounded-lg shrink-0">Delete</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "compare" && cmpA && cmpB && (() => {
        const rows: { label: string; a: string; b: string; win: "a" | "b" | null }[] = [
          {
            label: config.scoreLabel,
            a: cmpA.score.toFixed(1),
            b: cmpB.score.toFixed(1),
            win: cmpA.score === cmpB.score ? null : cmpA.score > cmpB.score ? "a" : "b",
          },
          {
            label: config.metricLabel,
            a: formatMetric(cmpA, config).replace(` ${config.metricLabel}`, ""),
            b: formatMetric(cmpB, config).replace(` ${config.metricLabel}`, ""),
            win: cmpA.popularity === cmpB.popularity ? null : cmpA.popularity > cmpB.popularity ? "a" : "b",
          },
          {
            label: "Momentum",
            a: formatGrowth(cmpA.growthPercent),
            b: formatGrowth(cmpB.growthPercent),
            win: cmpA.growthPercent === cmpB.growthPercent ? null : cmpA.growthPercent > cmpB.growthPercent ? "a" : "b",
          },
          {
            label: "Released",
            a: `${cmpA.year}`,
            b: `${cmpB.year}`,
            win: cmpA.year === cmpB.year ? null : cmpA.year > cmpB.year ? "a" : "b",
          },
          { label: "Runtime", a: cmpA.runtime, b: cmpB.runtime, win: null },
          { label: "Genre", a: cmpA.genre, b: cmpB.genre, win: null },
          { label: "On", a: cmpA.platform, b: cmpB.platform, win: null },
        ];
        const aWins = rows.filter((r) => r.win === "a").length;
        const bWins = rows.filter((r) => r.win === "b").length;
        const verdict =
          aWins === bWins ? "It's a tie — both are strong picks." : `${(aWins > bWins ? cmpA : cmpB).title} edges it, ${Math.max(aWins, bWins)}–${Math.min(aWins, bWins)}.`;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {([[cmpAId, setCmpAId], [cmpBId, setCmpBId]] as const).map(([val, set], i) => (
                <select key={i} value={val} onChange={(e) => set(e.target.value)} className="input-modern">
                  {catalog.map((it) => (
                    <option key={it.id} value={it.id}>{it.title}</option>
                  ))}
                </select>
              ))}
            </div>

            <div className="glass-panel p-5">
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[cmpA, cmpB].map((it, i) => (
                  <div key={i} className="text-center">
                    <div className="icon-box w-12 h-12 text-xl mx-auto mb-2">{it.emoji}</div>
                    <p className="text-sm font-semibold text-slate-900 leading-tight">{it.title}</p>
                    <p className="text-[11px] text-slate-400 truncate">{it.creator}</p>
                  </div>
                ))}
              </div>

              <div className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <div key={r.label} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-2 text-sm">
                    <span className={`text-right ${r.win === "a" ? "font-bold text-hub-green" : "text-slate-500"}`}>
                      {r.a}{r.win === "a" ? " ✓" : ""}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-slate-400 px-2">{r.label}</span>
                    <span className={`text-left ${r.win === "b" ? "font-bold text-hub-green" : "text-slate-500"}`}>
                      {r.win === "b" ? "✓ " : ""}{r.b}
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-center text-sm text-slate-600 border-t border-slate-100 pt-3">
                🏆 {verdict}
              </p>
            </div>
          </div>
        );
      })()}

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
