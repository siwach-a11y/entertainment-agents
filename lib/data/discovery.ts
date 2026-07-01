import { Availability } from "@/lib/types";

/** The five Entertainment discovery domains. */
export type EntertainmentDomain =
  | "micro-drama"
  | "viral-video"
  | "movie"
  | "series"
  | "music";

/**
 * A single discoverable entertainment title. One unified shape covers all five
 * domains; domain-specific meaning is carried by the config (labels) and the
 * per-item fields (episodes, runtime, mood tags).
 */
export interface DiscoveryItem {
  id: string;
  domain: EntertainmentDomain;
  title: string;
  /** Studio, channel, director, or artist depending on the domain. */
  creator: string;
  platform: string;
  genre: string;
  region: string;
  language: string;
  year: number;
  /** Quality/rating on a 0–10 scale (IMDb-style, or hype score for videos). */
  score: number;
  /** Popularity metric — views / streams / box office / plays. */
  popularity: number;
  /** 1 = hottest right now. */
  trendingRank: number;
  /** Week-over-week momentum, e.g. +320. */
  growthPercent: number;
  /** Human runtime label: "2m/ep", "1h 58m", "3:24". */
  runtime: string;
  episodes?: number;
  synopsis: string;
  emoji: string;
  availability: Availability;
  url: string;
  tags: string[];
  /** Released / uploaded within the last ~30 days. */
  isNew: boolean;
  /** Vibe tags used by the mood matcher. */
  mood: string[];
}

/** A discovery item after the engine has scored it against a query. */
export interface RankedItem extends DiscoveryItem {
  matchScore: number;
  matchReasons: string[];
}

export interface MoodOption {
  id: string;
  label: string;
  /** Keywords matched against item mood/genre/tags. */
  keywords: string[];
}

export interface DomainConfig {
  domain: EntertainmentDomain;
  agentId: string;
  name: string;
  icon: string;
  tagline: string;
  /** Singular noun, e.g. "micro drama". */
  noun: string;
  nounPlural: string;
  /** Label for the popularity metric, e.g. "views", "streams". */
  metricLabel: string;
  /** Label for the score, e.g. "IMDb", "Hype". */
  scoreLabel: string;
  actionLabel: string;
  watchlistLabel: string;
  genres: string[];
  platforms: string[];
  regions: string[];
  moods: MoodOption[];
  quickAsks: string[];
  systemContext: string;
}

export const discoveryConfigs: Record<EntertainmentDomain, DomainConfig> = {
  "micro-drama": {
    domain: "micro-drama",
    agentId: "micro-drama-discovery",
    name: "Micro Drama Discovery Agent",
    icon: "🎭",
    tagline:
      "Discover binge-worthy vertical micro dramas — 60–120 second episodes across ReelShort, DramaBox, and GoodShort.",
    noun: "micro drama",
    nounPlural: "micro dramas",
    metricLabel: "plays",
    scoreLabel: "Hype",
    actionLabel: "Watch",
    watchlistLabel: "My List",
    genres: [
      "CEO Romance",
      "Revenge",
      "Werewolf",
      "Billionaire",
      "Time Travel",
      "Marriage",
      "Fantasy",
      "Thriller",
    ],
    platforms: ["ReelShort", "DramaBox", "GoodShort", "ShortMax", "FlexTV"],
    regions: ["Global", "US", "China", "Thailand", "Korea"],
    moods: [
      { id: "revenge", label: "Revenge & Redemption", keywords: ["Revenge", "Thriller"] },
      { id: "romance", label: "Swoony Romance", keywords: ["CEO Romance", "Billionaire", "Marriage"] },
      { id: "supernatural", label: "Supernatural", keywords: ["Werewolf", "Fantasy", "Time Travel"] },
      { id: "quick", label: "Quick Binge", keywords: ["Thriller", "Revenge"] },
    ],
    quickAsks: [
      "Why are vertical micro dramas so addictive?",
      "What are the top ReelShort tropes in 2026?",
      "How long is a typical micro drama series?",
      "Recommend a revenge micro drama to binge tonight",
    ],
    systemContext:
      "You are a micro drama discovery expert for AgentHub. Micro dramas are vertical, 60–120 second-per-episode serialized dramas on apps like ReelShort, DramaBox, and GoodShort, built around cliffhangers and tropes (CEO romance, revenge, werewolf, hidden-billionaire). Explain tropes, why they hook viewers, series length, and give punchy recommendations. Be concise.",
  },
  "viral-video": {
    domain: "viral-video",
    agentId: "viral-video-discovery",
    name: "Viral Video Discovery Agent",
    icon: "🔥",
    tagline:
      "Surface the fastest-rising short-form clips across TikTok, YouTube Shorts, Instagram Reels, and X.",
    noun: "clip",
    nounPlural: "clips",
    metricLabel: "views",
    scoreLabel: "Hype",
    actionLabel: "Watch",
    watchlistLabel: "Saved",
    genres: ["Comedy", "Satisfying", "Sports", "Food", "Music", "Tech", "Lifestyle", "Wholesome"],
    platforms: ["TikTok", "YouTube Shorts", "Instagram Reels", "X"],
    regions: ["Global", "US", "Thailand", "Korea", "UK", "India"],
    moods: [
      { id: "funny", label: "Make Me Laugh", keywords: ["Comedy"] },
      { id: "satisfying", label: "Oddly Satisfying", keywords: ["Satisfying", "Food"] },
      { id: "wholesome", label: "Wholesome", keywords: ["Wholesome", "Lifestyle"] },
      { id: "jawdrop", label: "Jaw-Dropping", keywords: ["Sports", "Tech"] },
    ],
    quickAsks: [
      "What's going viral on TikTok right now?",
      "How do I spot a clip about to blow up?",
      "What makes a Reel hit the For You page?",
      "Best hooks for short-form video in 2026?",
    ],
    systemContext:
      "You are a viral short-form video discovery expert for AgentHub. You track fast-rising clips on TikTok, YouTube Shorts, Instagram Reels, and X. Explain what drives virality (hook, watch-through, shareability, sound), how to read momentum (velocity vs total views), and platform-specific trends. Be concise.",
  },
  movie: {
    domain: "movie",
    agentId: "movie-discovery",
    name: "Movie Discovery Agent",
    icon: "🎬",
    tagline:
      "Find your next film — search by mood, genre, and streaming service across theatrical and streaming releases.",
    noun: "movie",
    nounPlural: "movies",
    metricLabel: "box office",
    scoreLabel: "IMDb",
    actionLabel: "Watch",
    watchlistLabel: "Watchlist",
    genres: [
      "Sci-Fi",
      "Thriller",
      "Drama",
      "Comedy",
      "Action",
      "Horror",
      "Romance",
      "Animation",
      "Documentary",
    ],
    platforms: ["Netflix", "Prime Video", "Max", "Apple TV+", "Disney+", "In Theaters"],
    regions: ["Global", "US", "UK", "Korea", "Japan", "France"],
    moods: [
      { id: "feelgood", label: "Feel-Good", keywords: ["Comedy", "Romance", "Animation"] },
      { id: "edge", label: "Edge of My Seat", keywords: ["Thriller", "Action", "Horror"] },
      { id: "mindbend", label: "Mind-Bending", keywords: ["Sci-Fi", "Thriller"] },
      { id: "cry", label: "Make Me Cry", keywords: ["Drama", "Romance"] },
    ],
    quickAsks: [
      "What should I watch tonight on Netflix?",
      "Recommend a mind-bending sci-fi film",
      "Best feel-good movies for a rainy day",
      "What's the biggest release in theaters now?",
    ],
    systemContext:
      "You are a film recommendation expert for AgentHub. You help people find movies by mood, genre, and where to stream. Give specific, spoiler-free recommendations, note the streaming service or theatrical status, and explain why a pick fits the request. Be concise.",
  },
  series: {
    domain: "series",
    agentId: "series-discovery",
    name: "Series Discovery Agent",
    icon: "📺",
    tagline:
      "Discover your next binge — TV series and limited runs by mood, genre, and platform, with season and episode counts.",
    noun: "series",
    nounPlural: "series",
    metricLabel: "viewers",
    scoreLabel: "IMDb",
    actionLabel: "Watch",
    watchlistLabel: "Watchlist",
    genres: [
      "Drama",
      "Crime",
      "Sci-Fi",
      "Comedy",
      "Fantasy",
      "Thriller",
      "K-Drama",
      "Anime",
      "Reality",
    ],
    platforms: ["Netflix", "Prime Video", "Max", "Apple TV+", "Disney+", "Hulu"],
    regions: ["Global", "US", "UK", "Korea", "Japan"],
    moods: [
      { id: "binge", label: "Binge-Worthy", keywords: ["Drama", "Crime", "Thriller"] },
      { id: "cozy", label: "Cozy & Comforting", keywords: ["Comedy", "Reality"] },
      { id: "dark", label: "Dark & Twisty", keywords: ["Crime", "Thriller", "Drama"] },
      { id: "escapist", label: "Escapist", keywords: ["Fantasy", "Sci-Fi", "Anime"] },
    ],
    quickAsks: [
      "What's a good series to binge this weekend?",
      "Recommend a dark crime drama with a twist",
      "Best K-dramas to start right now",
      "A cozy comfort show for winding down?",
    ],
    systemContext:
      "You are a TV series recommendation expert for AgentHub. You help people find their next binge by mood, genre, and platform. Give spoiler-free picks, note the platform, season/episode count, and whether a show is ongoing or complete. Be concise.",
  },
  music: {
    domain: "music",
    agentId: "music-discovery",
    name: "Music Discovery Agent",
    icon: "🎧",
    tagline:
      "Find new music — tracks and playlists by mood, genre, and moment across Spotify, Apple Music, and YouTube Music.",
    noun: "track",
    nounPlural: "tracks",
    metricLabel: "streams",
    scoreLabel: "Buzz",
    actionLabel: "Play",
    watchlistLabel: "Playlist",
    genres: [
      "Pop",
      "K-Pop",
      "Hip-Hop",
      "Electronic",
      "R&B",
      "Rock",
      "Indie",
      "Latin",
      "Lo-Fi",
    ],
    platforms: ["Spotify", "Apple Music", "YouTube Music", "SoundCloud", "Tidal"],
    regions: ["Global", "US", "Korea", "UK", "Latin America"],
    moods: [
      { id: "focus", label: "Focus", keywords: ["Lo-Fi", "Electronic"] },
      { id: "workout", label: "Workout", keywords: ["Hip-Hop", "Electronic", "Pop"] },
      { id: "chill", label: "Chill", keywords: ["R&B", "Indie", "Lo-Fi"] },
      { id: "party", label: "Party", keywords: ["Pop", "K-Pop", "Latin", "Hip-Hop"] },
    ],
    quickAsks: [
      "What's topping the charts this week?",
      "Build me a focus playlist for deep work",
      "Recommend upbeat tracks for a workout",
      "What new K-pop should I check out?",
    ],
    systemContext:
      "You are a music discovery expert for AgentHub. You help people find new tracks and playlists by mood, genre, and moment across Spotify, Apple Music, and YouTube Music. Give specific artist/track picks, note the vibe and where to listen, and tailor to the moment (focus, workout, party). Be concise.",
  },
};

export const domainOrder: EntertainmentDomain[] = [
  "micro-drama",
  "viral-video",
  "movie",
  "series",
  "music",
];

/** Format a large popularity count into a compact label ("1.2M"). */
export function formatCount(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

/** Format the popularity metric with its domain label ("1.2M streams"). */
export function formatMetric(item: DiscoveryItem, config: DomainConfig): string {
  if (item.domain === "movie" && item.popularity >= 1_000_000) {
    return `$${formatCount(item.popularity)} ${config.metricLabel}`;
  }
  return `${formatCount(item.popularity)} ${config.metricLabel}`;
}

export function formatGrowth(p: number): string {
  return p >= 0 ? `+${p}%` : `${p}%`;
}

export function formatScore(item: DiscoveryItem, config: DomainConfig): string {
  return `${item.score.toFixed(1)} ${config.scoreLabel}`;
}

export function getDomainByAgentId(agentId: string): EntertainmentDomain | undefined {
  return domainOrder.find((d) => discoveryConfigs[d].agentId === agentId);
}
