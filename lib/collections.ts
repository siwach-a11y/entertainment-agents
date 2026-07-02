import { DiscoveryItem, EntertainmentDomain, MoodOption } from "@/lib/data/discovery";

/**
 * "Do something" beyond search: assemble a curated collection for a mood —
 * a movie night, a music mix, a binge plan, a micro-drama marathon — with a
 * total runtime and a shareable summary. Deterministic (no API key needed).
 */

export interface Collection {
  id: string;
  title: string;
  itemIds: string[];
  domain: EntertainmentDomain;
  createdAt: number;
}

export const planLabels: Record<
  EntertainmentDomain,
  { tab: string; noun: string; emoji: string; action: string }
> = {
  "micro-drama": { tab: "Marathon", noun: "marathon", emoji: "🎭", action: "Plan a marathon" },
  "viral-video": { tab: "Reel", noun: "reel", emoji: "🔥", action: "Build a reel" },
  movie: { tab: "Movie Night", noun: "movie night", emoji: "🎬", action: "Build a movie night" },
  series: { tab: "Binge Plan", noun: "binge plan", emoji: "📺", action: "Plan a binge" },
  music: { tab: "Mix", noun: "mix", emoji: "🎧", action: "Make a mix" },
};

/** Pick a mood-matched, genre-diverse, top-rated set of `size` items. */
export function buildCollection(
  items: DiscoveryItem[],
  mood: MoodOption | null,
  size: number,
): DiscoveryItem[] {
  const matches = (i: DiscoveryItem) =>
    !mood ||
    i.mood.includes(mood.id) ||
    mood.keywords.includes(i.genre) ||
    i.tags.some((t) => mood.keywords.some((k) => t.toLowerCase().includes(k.toLowerCase())));

  const preferred = items.filter(matches);
  const rest = items.filter((i) => !preferred.includes(i));
  const ranked = [...preferred, ...rest].sort((a, b) => b.score - a.score);

  const picks: DiscoveryItem[] = [];
  const seenGenres = new Set<string>();
  // First pass: one per genre for variety.
  for (const it of ranked) {
    if (picks.length >= size) break;
    if (seenGenres.has(it.genre)) continue;
    picks.push(it);
    seenGenres.add(it.genre);
  }
  // Fill remaining slots with the next best regardless of genre.
  for (const it of ranked) {
    if (picks.length >= size) break;
    if (!picks.includes(it)) picks.push(it);
  }
  return picks.slice(0, size);
}

/** Auto-title from mood + domain, e.g. "Feel-Good Movie Night". */
export function collectionTitle(mood: MoodOption | null, domain: EntertainmentDomain): string {
  const base = planLabels[domain];
  const noun = base.noun.replace(/\b\w/g, (c) => c.toUpperCase());
  return mood ? `${mood.label} ${noun}` : `Your ${noun}`;
}

export function formatMinutes(mins: number): string {
  const m = Math.round(mins);
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
  return `${m}m`;
}

/** A load estimate for scheduling — real runtime, else episode-based, else a default. */
export function loadMinutes(item: DiscoveryItem): number {
  const rt = parseRuntimeMinutes(item);
  if (rt > 0) return rt;
  if (item.episodes) return item.episodes * 45; // series estimate
  return 45;
}

export interface ScheduleDay {
  day: number;
  items: DiscoveryItem[];
  minutes: number;
}

/** Spread items across `days`, balancing runtime per day (least-loaded first). */
export function scheduleCollection(items: DiscoveryItem[], days: number): ScheduleDay[] {
  const buckets: ScheduleDay[] = Array.from({ length: Math.max(1, days) }, (_, i) => ({
    day: i + 1,
    items: [],
    minutes: 0,
  }));
  const sorted = [...items].sort((a, b) => loadMinutes(b) - loadMinutes(a));
  for (const it of sorted) {
    const target = buckets.reduce((min, b) => (b.minutes < min.minutes ? b : min), buckets[0]);
    target.items.push(it);
    target.minutes += loadMinutes(it);
  }
  return buckets;
}

function parseRuntimeMinutes(item: DiscoveryItem): number {
  const r = item.runtime;
  // "1h 58m"
  const hm = r.match(/(?:(\d+)h)?\s*(?:(\d+)m)?/);
  if (r.includes("h") || r.includes("m")) {
    const h = hm?.[1] ? parseInt(hm[1], 10) : 0;
    const m = hm?.[2] ? parseInt(hm[2], 10) : 0;
    if (h || m) return h * 60 + m;
  }
  // "3:12" (music)
  if (/^\d+:\d+$/.test(r)) {
    const [m, s] = r.split(":").map(Number);
    return m + s / 60;
  }
  // "90s/ep" micro-drama
  const perEp = r.match(/(\d+)\s*s\s*\/?\s*ep/i);
  if (perEp && item.episodes) return (parseInt(perEp[1], 10) * item.episodes) / 60;
  return 0;
}

/** A human total for the collection, tuned per domain. */
export function collectionTotal(items: DiscoveryItem[], domain: EntertainmentDomain): string {
  if (domain === "series") {
    const eps = items.reduce((s, i) => s + (i.episodes ?? 0), 0);
    return `${items.length} shows · ${eps} episodes`;
  }
  const mins = Math.round(items.reduce((s, i) => s + parseRuntimeMinutes(i), 0));
  if (domain === "music") return `${items.length} tracks · ${mins} min`;
  if (mins >= 60) return `${items.length} picks · ${Math.floor(mins / 60)}h ${mins % 60}m`;
  return `${items.length} picks · ${mins} min`;
}

/** Plain-text summary for copy/share. */
export function collectionShareText(
  title: string,
  total: string,
  items: DiscoveryItem[],
): string {
  const lines = items.map((i, n) => `${n + 1}. ${i.title} — ${i.creator}`);
  return `${title} (${total})\n\n${lines.join("\n")}\n\nMade with Entertainment Agents`;
}

// ---- localStorage: My Collections ----

const key = (domain: EntertainmentDomain) => `entertainment_agents_collections_${domain}`;

export function getCollections(domain: EntertainmentDomain): Collection[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(key(domain)) || "[]");
  } catch {
    return [];
  }
}

export function saveCollection(c: Collection): void {
  if (typeof window === "undefined") return;
  const all = getCollections(c.domain);
  window.localStorage.setItem(key(c.domain), JSON.stringify([c, ...all].slice(0, 20)));
}

export function deleteCollection(domain: EntertainmentDomain, id: string): void {
  if (typeof window === "undefined") return;
  const all = getCollections(domain).filter((c) => c.id !== id);
  window.localStorage.setItem(key(domain), JSON.stringify(all));
}
