import { EntertainmentDomain } from "@/lib/data/discovery";

/**
 * Keyless "search the web" for static hosting: turn a query into live search
 * URLs on the platforms relevant to each domain. No API key or backend needed —
 * clicking a link runs the search on the real site.
 */
export interface SearchTarget {
  name: string;
  build: (query: string) => string;
}

const enc = (s: string) => encodeURIComponent(s.trim());

const google = (q: string) => `https://www.google.com/search?q=${enc(q)}`;
const youtube = (q: string) => `https://www.youtube.com/results?search_query=${enc(q)}`;

export const searchTargets: Record<EntertainmentDomain, SearchTarget[]> = {
  "viral-video": [
    { name: "YouTube", build: youtube },
    { name: "YouTube Shorts", build: (q) => youtube(`${q} #shorts`) },
    { name: "TikTok", build: (q) => `https://www.tiktok.com/search?q=${enc(q)}` },
    { name: "X", build: (q) => `https://x.com/search?q=${enc(q)}&f=video` },
    { name: "Google", build: google },
  ],
  "micro-drama": [
    { name: "ReelShort", build: (q) => google(`${q} ReelShort`) },
    { name: "DramaBox", build: (q) => google(`${q} DramaBox`) },
    { name: "YouTube", build: youtube },
    { name: "Google", build: google },
  ],
  movie: [
    { name: "JustWatch", build: (q) => `https://www.justwatch.com/us/search?q=${enc(q)}` },
    { name: "Netflix", build: (q) => `https://www.netflix.com/search?q=${enc(q)}` },
    { name: "Trailers (YouTube)", build: (q) => youtube(`${q} trailer`) },
    { name: "Google", build: google },
  ],
  series: [
    { name: "JustWatch", build: (q) => `https://www.justwatch.com/us/search?q=${enc(q)}` },
    { name: "Netflix", build: (q) => `https://www.netflix.com/search?q=${enc(q)}` },
    { name: "Trailers (YouTube)", build: (q) => youtube(`${q} trailer`) },
    { name: "Google", build: google },
  ],
  music: [
    { name: "Spotify", build: (q) => `https://open.spotify.com/search/${enc(q)}` },
    { name: "YouTube Music", build: (q) => `https://music.youtube.com/search?q=${enc(q)}` },
    { name: "Apple Music", build: (q) => `https://music.apple.com/us/search?term=${enc(q)}` },
    { name: "Google", build: google },
  ],
};

/** A sensible default query so the panel is useful before the user types. */
export const defaultQuery: Record<EntertainmentDomain, string> = {
  "viral-video": "trending viral videos this week",
  "micro-drama": "trending micro dramas this week",
  movie: "movies trending now",
  series: "series everyone is watching now",
  music: "top charting songs this week",
};
