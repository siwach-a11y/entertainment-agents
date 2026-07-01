import {
  creatorMatchesHandle,
  DiscoveryRunStats,
  DiscoverySourceMode,
  normalizeVideoUrl,
  officialSources,
  type TrendingVideo,
  type VideoCategory,
  type VideoPlatform,
} from "@/lib/data/videos";

export interface DiscoveryRunInput {
  mode: DiscoverySourceMode;
  platforms: VideoPlatform[];
  category: string;
  region: string;
  limitPerCategory: number;
  youtubeSource?: string;
  instagramSource?: string;
  officialOnly: boolean;
}

type DiscoveryCandidate = Omit<TrendingVideo, "id" | "urlNormalized" | "status">;

const DISCOVERY_POOL: DiscoveryCandidate[] = [
  {
    title: "Chiang Mai digital nomad guide 2026",
    creator: "Remote Life Asia",
    platform: "youtube",
    category: "Travel",
    region: "Thailand",
    views: 420_000,
    likes: 38_000,
    comments: 1_900,
    growthPercent: 156,
    duration: "0:28",
    publishedAt: new Date().toISOString(),
    trendingRank: 7,
    availability: "available",
    videoUrl: "https://youtube.com/shorts/chiangmai-nomad",
    thumbnailEmoji: "✈️",
    isOfficial: true,
  },
  {
    title: "NewJeans — 'Supernatural' dance cover",
    creator: "K-Vibe Daily",
    platform: "youtube",
    category: "Music",
    region: "Global",
    views: 2_100_000,
    likes: 180_000,
    comments: 9_400,
    growthPercent: 288,
    duration: "0:22",
    publishedAt: new Date().toISOString(),
    trendingRank: 8,
    availability: "available",
    videoUrl: "https://youtube.com/shorts/newjeans-supernatural",
    thumbnailEmoji: "🎤",
    isOfficial: true,
  },
  {
    title: "Best pad thai under 50 baht",
    creator: "@bangkokbites",
    platform: "tiktok",
    category: "Food",
    region: "Thailand",
    views: 1_900_000,
    likes: 240_000,
    comments: 6_800,
    growthPercent: 310,
    duration: "0:19",
    publishedAt: new Date().toISOString(),
    trendingRank: 9,
    availability: "available",
    videoUrl: "https://tiktok.com/@bangkokbites/pad-thai-50",
    thumbnailEmoji: "🍜",
    isOfficial: true,
  },
  {
    title: "MacBook M4 vs M3 — 30 second verdict",
    creator: "TechLab",
    platform: "youtube",
    category: "Tech",
    region: "US",
    views: 890_000,
    likes: 72_000,
    comments: 3_200,
    growthPercent: 142,
    duration: "0:25",
    publishedAt: new Date().toISOString(),
    trendingRank: 11,
    availability: "available",
    videoUrl: "https://youtube.com/shorts/m4-vs-m3",
    thumbnailEmoji: "💻",
    isOfficial: true,
  },
  {
    title: "Haaland bicycle kick — slow-mo replay",
    creator: "FootyClips",
    platform: "instagram",
    category: "Sports",
    region: "Global",
    views: 3_400_000,
    likes: 410_000,
    comments: 18_900,
    growthPercent: 365,
    duration: "0:29",
    publishedAt: new Date().toISOString(),
    trendingRank: 12,
    availability: "available",
    videoUrl: "https://instagram.com/reel/haaland-bike",
    thumbnailEmoji: "⚽",
    isOfficial: true,
  },
  {
    title: "Breaking: ASEAN summit highlights in 20s",
    creator: "NewsDesk Live",
    platform: "youtube",
    category: "News",
    region: "Global",
    views: 520_000,
    likes: 41_000,
    comments: 2_800,
    growthPercent: 98,
    duration: "0:20",
    publishedAt: new Date().toISOString(),
    trendingRank: 13,
    availability: "available",
    videoUrl: "https://youtube.com/shorts/asean-summit",
    thumbnailEmoji: "📰",
    isOfficial: true,
  },
  {
    title: "Office prank gone wrong",
    creator: "@workhumor",
    platform: "tiktok",
    category: "Comedy",
    region: "US",
    views: 6_800_000,
    likes: 950_000,
    comments: 44_000,
    growthPercent: 420,
    duration: "0:24",
    publishedAt: new Date().toISOString(),
    trendingRank: 6,
    availability: "available",
    videoUrl: "https://tiktok.com/@workhumor/prank",
    thumbnailEmoji: "😂",
    isOfficial: false,
  },
  {
    title: "GRWM: summer festival in Seoul",
    creator: "@seoulstyle",
    platform: "instagram",
    category: "Lifestyle",
    region: "Korea",
    views: 1_100_000,
    likes: 156_000,
    comments: 4_200,
    growthPercent: 201,
    duration: "0:27",
    publishedAt: new Date().toISOString(),
    trendingRank: 10,
    availability: "available",
    videoUrl: "https://instagram.com/reel/seoul-grwm",
    thumbnailEmoji: "💄",
    isOfficial: false,
  },
];

const INTERNET_TEMPLATES: DiscoveryCandidate[] = [
  {
    title: "Viral airport hack every traveler needs",
    creator: "@travelhacks",
    platform: "tiktok",
    category: "Travel",
    region: "Global",
    views: 940_000,
    likes: 88_000,
    comments: 2_100,
    growthPercent: 512,
    duration: "0:18",
    publishedAt: new Date().toISOString(),
    trendingRank: 20,
    availability: "available",
    videoUrl: "https://tiktok.com/@travelhacks/airport",
    thumbnailEmoji: "🧳",
    isOfficial: false,
  },
  {
    title: "Street food ranking: Bangkok vs Tokyo",
    creator: "@foodwars",
    platform: "youtube",
    category: "Food",
    region: "Global",
    views: 1_250_000,
    likes: 102_000,
    comments: 5_600,
    growthPercent: 267,
    duration: "0:29",
    publishedAt: new Date().toISOString(),
    trendingRank: 21,
    availability: "available",
    videoUrl: "https://youtube.com/shorts/bkk-vs-tokyo-food",
    thumbnailEmoji: "🍱",
    isOfficial: false,
  },
  {
    title: "GPU prices finally dropping — quick take",
    creator: "@pcwatch",
    platform: "youtube",
    category: "Tech",
    region: "US",
    views: 780_000,
    likes: 64_000,
    comments: 4_400,
    growthPercent: 178,
    duration: "0:21",
    publishedAt: new Date().toISOString(),
    trendingRank: 22,
    availability: "available",
    videoUrl: "https://youtube.com/shorts/gpu-prices",
    thumbnailEmoji: "🖥️",
    isOfficial: false,
  },
];

function parseDurationSec(d: string): number {
  if (d === "Live") return 0;
  const parts = d.split(":").map(Number);
  if (parts.length === 2) return parts[0]! * 60 + parts[1]!;
  if (parts.length === 3) return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!;
  return 0;
}

function matchesWhitelist(item: { creator: string; platform: VideoPlatform }): boolean {
  return officialSources.some((source) => {
    const handles = [source.youtube, source.instagram, source.tiktok].filter(Boolean) as string[];
    return handles.some((handle) => creatorMatchesHandle(item.creator, handle));
  });
}

function matchesSource(
  item: { creator: string; platform: VideoPlatform },
  input: DiscoveryRunInput,
): boolean {
  if (input.mode === "specific") {
    const yt = input.youtubeSource?.trim() ?? "";
    const ig = input.instagramSource?.trim() ?? "";
    if (!yt && !ig) return false;
    if (item.platform === "youtube" && yt) return creatorMatchesHandle(item.creator, yt);
    if (item.platform === "instagram" && ig) return creatorMatchesHandle(item.creator, ig);
    if (item.platform === "tiktok" && (yt || ig)) {
      return creatorMatchesHandle(item.creator, yt || ig);
    }
    return false;
  }
  if (input.mode === "whitelist") return matchesWhitelist(item);
  return true;
}

function buildCandidates(input: DiscoveryRunInput, runId: number): TrendingVideo[] {
  const pool = input.mode === "internet" ? [...DISCOVERY_POOL, ...INTERNET_TEMPLATES] : DISCOVERY_POOL;

  return pool.map((item, index) => {
    const suffix = input.mode === "internet" ? `/run-${runId}` : "";
    const videoUrl = `${item.videoUrl}${suffix}`;
    return {
      ...item,
      id: `pool-${runId}-${index}`,
      videoUrl,
      urlNormalized: normalizeVideoUrl(videoUrl),
      status: "discovered" as const,
      publishedAt: new Date().toISOString(),
    };
  });
}

export function runDiscovery(
  existing: TrendingVideo[],
  input: DiscoveryRunInput,
): { videos: TrendingVideo[]; stats: DiscoveryRunStats } {
  const start = Date.now();
  const runId = Date.now();
  const knownUrls = new Set(existing.map((v) => v.urlNormalized));
  let scanned = 0;
  let duplicatesSkipped = 0;
  let rejectedUnofficial = 0;
  let rejectedDuration = 0;
  const inserted: TrendingVideo[] = [];

  const candidates = buildCandidates(input, runId);

  for (const c of candidates) {
    scanned++;
    if (!input.platforms.includes(c.platform)) continue;
    if (input.category !== "All" && c.category !== (input.category as VideoCategory)) continue;
    if (input.region !== "Global" && c.region !== input.region && c.region !== "Global") continue;
    if (!matchesSource(c, input)) continue;

    if (input.officialOnly && !c.isOfficial) {
      rejectedUnofficial++;
      continue;
    }

    const sec = parseDurationSec(c.duration);
    if (sec > 29 && sec > 0) {
      rejectedDuration++;
      continue;
    }

    if (knownUrls.has(c.urlNormalized)) {
      duplicatesSkipped++;
      continue;
    }

    if (inserted.filter((v) => v.category === c.category).length >= input.limitPerCategory) continue;

    const video: TrendingVideo = {
      ...c,
      id: `disc-${runId}-${inserted.length}`,
      status: "discovered",
    };
    inserted.push(video);
    knownUrls.add(c.urlNormalized);
  }

  return {
    videos: [...inserted, ...existing],
    stats: {
      scanned,
      inserted: inserted.length,
      duplicatesSkipped,
      rejectedUnofficial,
      rejectedDuration,
      mode: input.mode,
      platforms: input.platforms,
      durationMs: Date.now() - start,
    },
  };
}

export function approveVideo(videos: TrendingVideo[], id: string): TrendingVideo[] {
  return videos.map((v) =>
    v.id === id && (v.status === "discovered" || v.status === "pending_review")
      ? { ...v, status: "approved" as const }
      : v,
  );
}

export function rejectVideo(videos: TrendingVideo[], id: string): TrendingVideo[] {
  return videos.map((v) => (v.id === id ? { ...v, status: "rejected" as const } : v));
}

export function processApproved(videos: TrendingVideo[]): TrendingVideo[] {
  return videos.map((v) => {
    if (v.status !== "approved") return v;
    const caption =
      v.caption ??
      `${v.title.slice(0, 80)} — trending on ${v.platform}. Watch the full clip now.`.slice(0, 120);
    return { ...v, status: "ready" as const, caption };
  });
}

export function publishReady(videos: TrendingVideo[]): TrendingVideo[] {
  return videos.map((v) => (v.status === "ready" ? { ...v, status: "published" as const } : v));
}
