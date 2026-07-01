import { Availability } from "@/lib/types";

export type VideoPlatform = "youtube" | "tiktok" | "instagram" | "facebook" | "x";

export type VideoCategory =
  | "Music"
  | "Gaming"
  | "Comedy"
  | "Education"
  | "News"
  | "Sports"
  | "Tech"
  | "Lifestyle"
  | "Food"
  | "Travel";

/** Fando-inspired pipeline statuses */
export type VideoPipelineStatus =
  | "discovered"
  | "pending_review"
  | "approved"
  | "processing"
  | "ready"
  | "published"
  | "rejected"
  | "failed";

export type DiscoverySourceMode = "whitelist" | "internet" | "specific";

export interface OfficialSource {
  id: string;
  name: string;
  category: VideoCategory;
  youtube?: string;
  instagram?: string;
  tiktok?: string;
}

export interface TrendingVideo {
  id: string;
  title: string;
  creator: string;
  platform: VideoPlatform;
  category: VideoCategory;
  region: string;
  views: number;
  likes: number;
  comments: number;
  growthPercent: number;
  duration: string;
  publishedAt: string;
  trendingRank: number;
  availability: Availability;
  videoUrl: string;
  urlNormalized: string;
  thumbnailEmoji: string;
  status: VideoPipelineStatus;
  isOfficial: boolean;
  caption?: string;
  processingError?: string;
}

export interface DiscoveryRunStats {
  scanned: number;
  inserted: number;
  duplicatesSkipped: number;
  rejectedUnofficial: number;
  rejectedDuration: number;
  mode: DiscoverySourceMode;
  platforms: VideoPlatform[];
  durationMs: number;
}

export const videoPlatforms: { id: VideoPlatform; label: string; icon: string }[] = [
  { id: "youtube", label: "YouTube", icon: "▶️" },
  { id: "tiktok", label: "TikTok", icon: "🎵" },
  { id: "instagram", label: "Instagram", icon: "📸" },
  { id: "facebook", label: "Facebook", icon: "👥" },
  { id: "x", label: "X / Twitter", icon: "𝕏" },
];

export const videoCategories = [
  "All",
  "Music",
  "Gaming",
  "Comedy",
  "Education",
  "News",
  "Sports",
  "Tech",
  "Lifestyle",
  "Food",
  "Travel",
] as const;

export const videoRegions = [
  "Global",
  "Thailand",
  "US",
  "Japan",
  "Korea",
  "UK",
  "India",
] as const;

export const discoverySourceModes: {
  id: DiscoverySourceMode;
  label: string;
  description: string;
}[] = [
  {
    id: "whitelist",
    label: "Our List (recommended)",
    description: "Official creator registry — lowest API spend, highest trust.",
  },
  {
    id: "internet",
    label: "Internet search",
    description: "YouTube / Instagram adapters with capped pages and early stop.",
  },
  {
    id: "specific",
    label: "Specific source",
    description: "One YouTube channel or Instagram profile per run.",
  },
];

/** Official sources registry (Fando-style CSV whitelist) */
export const officialSources: OfficialSource[] = [
  { id: "s1", name: "K-Vibe Daily", category: "Music", youtube: "@kvibedaily", tiktok: "@kvibedaily" },
  { id: "s2", name: "Bangkok Bites", category: "Food", tiktok: "@bangkokbites", instagram: "@bangkokbites" },
  { id: "s3", name: "TechLab", category: "Tech", youtube: "@techlab" },
  { id: "s4", name: "FootyClips", category: "Sports", instagram: "@footyclips", youtube: "@footyclips" },
  { id: "s5", name: "Remote Life Asia", category: "Travel", youtube: "@remotelifeasia" },
  { id: "s6", name: "NewsDesk Live", category: "News", youtube: "@newsdesklive" },
];

export const PIPELINE_STATUS_LABEL: Record<VideoPipelineStatus, string> = {
  discovered: "Discovered",
  pending_review: "Pending Review",
  approved: "Approved",
  processing: "Processing",
  ready: "Ready to Publish",
  published: "Published",
  rejected: "Rejected",
  failed: "Failed",
};

export function normalizeVideoUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    u.search = "";
    return u.href.replace(/\/$/, "").toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

/** Match creator display names to @handles (e.g. "K-Vibe Daily" ↔ "@kvibedaily"). */
export function normalizeHandle(value: string): string {
  return value.toLowerCase().replace(/^@/, "").replace(/[\s\-_.]/g, "");
}

export function creatorMatchesHandle(creator: string, handle: string): boolean {
  const c = normalizeHandle(creator);
  const h = normalizeHandle(handle);
  if (!c || !h) return false;
  return c.includes(h) || h.includes(c);
}

export function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K views`;
  return `${n} views`;
}

export function formatGrowth(p: number): string {
  return p >= 0 ? `+${p}%` : `${p}%`;
}

export function getPlatformLabel(platform: VideoPlatform): string {
  const map: Record<VideoPlatform, string> = {
    youtube: "YouTube",
    tiktok: "TikTok",
    instagram: "Instagram",
    facebook: "Facebook",
    x: "X",
  };
  return map[platform];
}

export function hoursSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

function seedVideo(
  partial: Omit<TrendingVideo, "urlNormalized" | "status" | "isOfficial"> &
    Partial<Pick<TrendingVideo, "status" | "isOfficial" | "caption">>,
): TrendingVideo {
  return {
    status: "pending_review",
    isOfficial: true,
    urlNormalized: normalizeVideoUrl(partial.videoUrl),
    ...partial,
  };
}

export const seedTrendingVideos: TrendingVideo[] = [
  seedVideo({
    id: "v1",
    title: "BLACKPINK — 'Jump' M/V Reaction & Breakdown",
    creator: "K-Vibe Daily",
    platform: "youtube",
    category: "Music",
    region: "Global",
    views: 12_400_000,
    likes: 890_000,
    comments: 42_100,
    growthPercent: 312,
    duration: "0:28",
    publishedAt: "2026-06-15T08:00:00Z",
    trendingRank: 1,
    availability: "available",
    videoUrl: "https://youtube.com/shorts/blackpink-jump",
    thumbnailEmoji: "🎤",
    status: "ready",
    caption: "The energy in this drop is unreal — perfect short-form recap for K-pop fans.",
  }),
  seedVideo({
    id: "v2",
    title: "POV: Bangkok street food at 2am hits different",
    creator: "@bangkokbites",
    platform: "tiktok",
    category: "Food",
    region: "Thailand",
    views: 8_200_000,
    likes: 1_100_000,
    comments: 18_400,
    growthPercent: 540,
    duration: "0:19",
    publishedAt: "2026-06-16T14:30:00Z",
    trendingRank: 2,
    availability: "available",
    videoUrl: "https://tiktok.com/@bangkokbites/food-2am",
    thumbnailEmoji: "🍜",
    status: "pending_review",
  }),
  seedVideo({
    id: "v3",
    title: "iOS 19 hidden features you missed",
    creator: "TechLab",
    platform: "youtube",
    category: "Tech",
    region: "US",
    views: 3_100_000,
    likes: 210_000,
    comments: 9_800,
    growthPercent: 189,
    duration: "0:25",
    publishedAt: "2026-06-16T10:00:00Z",
    trendingRank: 3,
    availability: "available",
    videoUrl: "https://youtube.com/shorts/ios19-tips",
    thumbnailEmoji: "📱",
    status: "approved",
  }),
  seedVideo({
    id: "v4",
    title: "Messi last-minute free kick — fan cams",
    creator: "FootyClips",
    platform: "instagram",
    category: "Sports",
    region: "Global",
    views: 5_600_000,
    likes: 720_000,
    comments: 31_200,
    growthPercent: 275,
    duration: "0:29",
    publishedAt: "2026-06-15T22:00:00Z",
    trendingRank: 4,
    availability: "available",
    videoUrl: "https://instagram.com/reel/messi-fk",
    thumbnailEmoji: "⚽",
    status: "published",
    caption: "Pure goosebumps — the stadium reaction says it all.",
  }),
  seedVideo({
    id: "v5",
    title: "AI agents explained in 60 seconds",
    creator: "@agenthub",
    platform: "tiktok",
    category: "Tech",
    region: "Global",
    views: 2_800_000,
    likes: 380_000,
    comments: 8_900,
    growthPercent: 890,
    duration: "0:26",
    publishedAt: "2026-06-16T17:00:00Z",
    trendingRank: 5,
    availability: "available",
    videoUrl: "https://tiktok.com/@agenthub/ai-agents",
    thumbnailEmoji: "🤖",
    status: "discovered",
    isOfficial: true,
  }),
  seedVideo({
    id: "v6",
    title: "Unofficial fan cam — leaked backstage",
    creator: "randomclips99",
    platform: "youtube",
    category: "Music",
    region: "Global",
    views: 120_000,
    likes: 4_000,
    comments: 890,
    growthPercent: 45,
    duration: "1:30",
    publishedAt: "2026-06-16T12:00:00Z",
    trendingRank: 99,
    availability: "sold-out",
    videoUrl: "https://youtube.com/watch/unofficial-leak",
    thumbnailEmoji: "⛔",
    status: "rejected",
    isOfficial: false,
  }),
];

/** Backward compat for browse-only views */
export const trendingVideos = seedTrendingVideos;

export function getQueueHealth(videos: TrendingVideo[]) {
  const count = (s: VideoPipelineStatus) => videos.filter((v) => v.status === s).length;
  return {
    discovered: count("discovered"),
    pendingReview: count("pending_review"),
    approved: count("approved"),
    processing: count("processing"),
    ready: count("ready"),
    published: count("published"),
    rejected: count("rejected"),
    failed: count("failed"),
    total: videos.length,
  };
}
