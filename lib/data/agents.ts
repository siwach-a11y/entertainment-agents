import { Agent } from "@/lib/types";

export const agents: Agent[] = [
  {
    id: "micro-drama-discovery",
    name: "Micro Drama Discovery Agent",
    author: "ShortReel AI",
    description:
      "Discover binge-worthy vertical micro dramas across ReelShort, DramaBox, and GoodShort. Find your next revenge, CEO-romance, or werewolf series by mood, trope, and platform.",
    icon: "🎭",
    category: "Entertainment",
    tags: ["micro drama", "reelshort", "dramabox", "vertical", "short-form", "discovery"],
    rating: 4.7,
    reviewCount: 634,
    userCount: 19800,
    price: "Free",
    badges: ["New", "Hot", "Free"],
    featured: true,
  },
  {
    id: "viral-video-discovery",
    name: "Viral Video Discovery Agent",
    author: "ClipPulse AI",
    description:
      "Surface the fastest-rising short-form clips across TikTok, YouTube Shorts, Instagram Reels, and X. Filter by mood and momentum to catch trends before they peak.",
    icon: "🔥",
    category: "Entertainment",
    tags: ["viral", "videos", "tiktok", "shorts", "reels", "trending", "discovery"],
    rating: 4.6,
    reviewCount: 921,
    userCount: 24300,
    price: "Free",
    badges: ["Hot", "Free"],
    featured: true,
  },
  {
    id: "movie-discovery",
    name: "Movie Discovery Agent",
    author: "ReelMind AI",
    description:
      "Find your next film by mood, genre, and streaming service. Spoiler-free AI recommendations across Netflix, Prime Video, Max, Apple TV+, and theaters.",
    icon: "🎬",
    category: "Entertainment",
    tags: ["movies", "films", "netflix", "streaming", "recommendations", "discovery"],
    rating: 4.8,
    reviewCount: 1487,
    userCount: 33600,
    price: "Free",
    badges: ["Featured", "Free"],
    featured: true,
  },
  {
    id: "series-discovery",
    name: "Series Discovery Agent",
    author: "ReelMind AI",
    description:
      "Discover your next binge — TV series and limited runs by mood, genre, and platform, with season and episode counts and where to stream.",
    icon: "📺",
    category: "Entertainment",
    tags: ["series", "tv", "shows", "binge", "kdrama", "anime", "discovery"],
    rating: 4.7,
    reviewCount: 1102,
    userCount: 28900,
    price: "Free",
    badges: ["Hot", "Free"],
    featured: true,
  },
  {
    id: "music-discovery",
    name: "Music Discovery Agent",
    author: "SoundWave Labs",
    description:
      "Find new music by mood, genre, and moment across Spotify, Apple Music, and YouTube Music. Build focus, workout, and party playlists with AI picks.",
    icon: "🎧",
    category: "Entertainment",
    tags: ["music", "songs", "spotify", "playlists", "kpop", "discovery"],
    rating: 4.7,
    reviewCount: 856,
    userCount: 26400,
    price: "Free",
    badges: ["New", "Free"],
    featured: false,
  },
];

export const categories = ["All", "Entertainment"] as const;

export function getAgentById(id: string): Agent | undefined {
  return agents.find((a) => a.id === id);
}

export function getFeaturedAgents(): Agent[] {
  return agents.filter((a) => a.featured).slice(0, 4);
}

export function getMarketplaceStats() {
  const uniqueCategories = new Set(agents.map((a) => a.category));
  const totalUsers = agents.reduce((sum, a) => sum + a.userCount, 0);
  const avgRating =
    agents.reduce((sum, a) => sum + a.rating, 0) / agents.length;
  return {
    totalAgents: agents.length,
    categories: uniqueCategories.size,
    monthlyUsers: Math.round(totalUsers * 0.12),
    avgRating: Math.round(avgRating * 10) / 10,
  };
}
