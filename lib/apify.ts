/**
 * Apify integration for live discovery on the static site.
 *
 * Like the Anthropic key, the Apify token is bring-your-own: stored only in the
 * visitor's browser (localStorage) and sent directly to api.apify.com — never
 * committed or proxied through us. Apify's API is CORS-enabled, so the browser
 * can call it directly.
 *
 * We use the synchronous `run-sync-get-dataset-items` endpoint with the
 * `apify/instagram-scraper` actor (the same actor + directUrls/resultsLimit
 * input the Fando AI Agent uses), so one request runs the actor and returns
 * dataset items — no polling needed. Actor runs consume Apify credits.
 */

import type { TrendingVideo, VideoCategory } from "@/lib/data/videos";

const TOKEN_STORAGE = "entertainment_agents_apify_token";
const ACTOR = "apify~instagram-scraper";
const RUN_SYNC_URL = `https://api.apify.com/v2/acts/${ACTOR}/run-sync-get-dataset-items?timeout=120`;

/** A discovery candidate: TrendingVideo without the engine-assigned fields. */
export type LiveCandidate = Omit<TrendingVideo, "id" | "urlNormalized" | "status">;

export class MissingApifyTokenError extends Error {
  constructor() {
    super("No Apify token set.");
    this.name = "MissingApifyTokenError";
  }
}

export function getApifyToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_STORAGE);
}
export function setApifyToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_STORAGE, token.trim());
}
export function clearApifyToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_STORAGE);
}
export function hasApifyToken(): boolean {
  return !!getApifyToken();
}
export function maskToken(token: string): string {
  if (token.length <= 14) return "••••";
  return `${token.slice(0, 10)}…${token.slice(-4)}`;
}

interface FetchOpts {
  handles: string[];
  limitPerProfile: number;
  category: VideoCategory;
  region: string;
  signal?: AbortSignal;
}

/** Run the Instagram scraper for the given profile handles; return video candidates. */
export async function fetchInstagramReels(opts: FetchOpts): Promise<LiveCandidate[]> {
  const token = getApifyToken();
  if (!token) throw new MissingApifyTokenError();

  const directUrls = opts.handles
    .map((h) => h.trim().replace(/^@/, ""))
    .filter(Boolean)
    .map((h) => `https://www.instagram.com/${h}/`);

  if (!directUrls.length) throw new Error("No Instagram profiles to search.");

  const res = await fetch(RUN_SYNC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      directUrls,
      resultsType: "posts",
      resultsLimit: Math.max(1, opts.limitPerProfile),
    }),
    signal: opts.signal,
  });

  if (!res.ok) throw new Error(describeError(res.status, await res.text().catch(() => "")));

  const items = (await res.json()) as Array<Record<string, unknown>>;
  return items
    .filter(isVideoItem)
    .map((item) => mapItem(item, opts.category, opts.region))
    .filter((c): c is LiveCandidate => c !== null);
}

function isVideoItem(item: Record<string, unknown>): boolean {
  const type = String(item.type ?? item.productType ?? "").toLowerCase();
  const isVideoFlag = item.isVideo === true || typeof item.videoUrl === "string";
  return type.includes("video") || type.includes("reel") || type.includes("clips") || isVideoFlag;
}

function mapItem(
  item: Record<string, unknown>,
  category: VideoCategory,
  region: string,
): LiveCandidate | null {
  const url = String(item.url ?? item.postUrl ?? item.inputUrl ?? "");
  if (!url) return null;

  const owner = String(item.ownerUsername ?? item.ownerFullName ?? "instagram");
  const caption = String(item.caption ?? "");
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  const views = num(item.videoViewCount) || num(item.videoPlayCount) || num(item.likesCount);
  const durationSec = num(item.videoDuration);

  return {
    title: (caption.split("\n")[0] || `Reel by @${owner}`).slice(0, 80),
    creator: `@${owner}`,
    platform: "instagram",
    category,
    region,
    views,
    likes: num(item.likesCount),
    comments: num(item.commentsCount),
    growthPercent: 0,
    duration: formatDuration(durationSec),
    publishedAt: String(item.timestamp ?? new Date().toISOString()),
    trendingRank: 50,
    availability: "available",
    videoUrl: url,
    thumbnailEmoji: "📸",
    isOfficial: true,
    caption: caption ? caption.slice(0, 120) : undefined,
  };
}

function formatDuration(sec: number): string {
  if (!sec || sec <= 0) return "0:20";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function describeError(status: number, detail: string): string {
  if (status === 401) return "Invalid Apify token. Re-enter it and try again.";
  if (status === 402) return "Apify: insufficient credit / plan limit reached.";
  if (status === 403) return "Apify token isn't permitted to run this actor.";
  if (status === 408 || status === 504) return "Apify run timed out — try fewer results per profile.";
  if (status >= 500) return "Apify is temporarily unavailable. Try again shortly.";
  try {
    const parsed = JSON.parse(detail);
    const msg = parsed?.error?.message;
    if (msg) return `Apify error: ${msg}`;
  } catch {
    // fall through
  }
  return `Apify request failed (HTTP ${status}).`;
}
