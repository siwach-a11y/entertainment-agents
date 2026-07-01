import {
  DiscoveryItem,
  DomainConfig,
  formatGrowth,
  MoodOption,
  RankedItem,
} from "@/lib/data/discovery";

export type SortMode = "match" | "trending" | "popular" | "rating" | "new";

export interface DiscoveryQuery {
  genres: Set<string>;
  platforms: Set<string>;
  region: string;
  mood: MoodOption | null;
  text: string;
  sort: SortMode;
}

export interface DiscoveryResult {
  items: RankedItem[];
  stats: {
    scanned: number;
    matched: number;
    topScore: number;
  };
}

function textMatches(item: DiscoveryItem, q: string): boolean {
  const hay = [item.title, item.creator, item.genre, item.synopsis, ...item.tags]
    .join(" ")
    .toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => hay.includes(token));
}

/**
 * Score an item against the active query and collect human-readable reasons.
 * Higher is a better match. Pure and deterministic so it runs offline in the
 * static demo build.
 */
function scoreItem(
  item: DiscoveryItem,
  query: DiscoveryQuery,
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Base signal: quality + a nudge from trending rank.
  score += item.score;
  score += Math.max(0, 20 - item.trendingRank) * 0.15;

  if (query.mood) {
    const hit =
      query.mood.keywords.includes(item.genre) ||
      item.mood.includes(query.mood.id) ||
      item.tags.some((t) => query.mood!.keywords.some((k) => t.toLowerCase().includes(k.toLowerCase())));
    if (hit) {
      score += 4;
      reasons.push(`Matches your "${query.mood.label}" mood`);
    }
  }

  if (query.genres.size > 0 && query.genres.has(item.genre)) {
    score += 3;
    reasons.push(`${item.genre} pick`);
  }

  if (query.platforms.size > 0 && query.platforms.has(item.platform)) {
    score += 2;
    reasons.push(`On ${item.platform}`);
  }

  if (query.text && textMatches(item, query.text)) {
    score += 3;
    reasons.push(`Matches "${query.text}"`);
  }

  if (item.growthPercent >= 300) {
    score += 2;
    reasons.push(`🔥 ${formatGrowth(item.growthPercent)} this week`);
  } else if (item.growthPercent >= 150) {
    score += 1;
    reasons.push(`Rising fast (${formatGrowth(item.growthPercent)})`);
  }

  if (item.isNew) {
    score += 0.5;
    reasons.push("New release");
  }

  if (item.score >= 8.5) reasons.push(`Highly rated (${item.score.toFixed(1)})`);

  return { score, reasons };
}

export function runDiscovery(
  catalog: DiscoveryItem[],
  query: DiscoveryQuery,
): DiscoveryResult {
  const scanned = catalog.length;

  const filtered = catalog.filter((item) => {
    if (query.region !== "Global" && item.region !== query.region && item.region !== "Global") {
      return false;
    }
    // Hard filters only exclude when the item cannot possibly satisfy a
    // narrowed genre/platform selection; text is a hard filter too.
    if (query.genres.size > 0 && !query.genres.has(item.genre)) return false;
    if (query.platforms.size > 0 && !query.platforms.has(item.platform)) return false;
    if (query.text && !textMatches(item, query.text)) return false;
    return true;
  });

  const ranked: RankedItem[] = filtered.map((item) => {
    const { score, reasons } = scoreItem(item, query);
    return { ...item, matchScore: score, matchReasons: reasons.slice(0, 3) };
  });

  ranked.sort((a, b) => {
    switch (query.sort) {
      case "trending":
        return a.trendingRank - b.trendingRank;
      case "popular":
        return b.popularity - a.popularity;
      case "rating":
        return b.score - a.score;
      case "new":
        return Number(b.isNew) - Number(a.isNew) || b.year - a.year || a.trendingRank - b.trendingRank;
      case "match":
      default:
        return b.matchScore - a.matchScore || a.trendingRank - b.trendingRank;
    }
  });

  return {
    items: ranked,
    stats: {
      scanned,
      matched: ranked.length,
      topScore: ranked.length ? Math.round(ranked[0]!.matchScore * 10) / 10 : 0,
    },
  };
}

const emptyQuery = (): DiscoveryQuery => ({
  genres: new Set(),
  platforms: new Set(),
  region: "Global",
  mood: null,
  text: "",
  sort: "trending",
});

/** Trending list for the browse tab — top items by rank. */
export function trendingItems(catalog: DiscoveryItem[]): RankedItem[] {
  return runDiscovery(catalog, { ...emptyQuery(), sort: "trending" }).items;
}

/** New-release list for the browse tab. */
export function newItems(catalog: DiscoveryItem[]): RankedItem[] {
  return runDiscovery(catalog, { ...emptyQuery(), sort: "new" }).items.filter((i) => i.isNew);
}

/** Build a natural-language prompt describing the current query for the AI. */
export function describeQuery(query: DiscoveryQuery, config: DomainConfig): string {
  const parts: string[] = [];
  if (query.mood) parts.push(`mood: ${query.mood.label}`);
  if (query.genres.size) parts.push(`genres: ${Array.from(query.genres).join(", ")}`);
  if (query.platforms.size) parts.push(`platforms: ${Array.from(query.platforms).join(", ")}`);
  if (query.region !== "Global") parts.push(`region: ${query.region}`);
  if (query.text) parts.push(`keywords: "${query.text}"`);
  const filters = parts.length ? parts.join("; ") : "no specific filters";
  return `Recommend three ${config.nounPlural} for someone with these preferences — ${filters}. For each, give the title and one sentence on why it fits. Keep it punchy.`;
}
