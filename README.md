# Entertainment Agents

An AI-powered entertainment **discovery marketplace** built with Next.js. Five agents help you find your next watch or listen by mood, genre, and platform — with spoiler-free AI recommendations.

**Live demo:** https://siwach-a11y.github.io/entertainment-agents/

> Browsing, filtering, ranking, and watchlists work everywhere with no setup. The **AI features** (chat, per-item "Details", agent recommender) connect to Anthropic one of two ways:
> - **On the live Pages demo:** paste your own Anthropic API key in the "Connect AI" panel. It's stored only in your browser (localStorage) and sent directly to Anthropic via the `anthropic-dangerous-direct-browser-access` mechanism — never uploaded here. Suited to a personal/dev demo, since the key is used client-side.
> - **Local dev / a server deploy (e.g. Vercel):** set `ANTHROPIC_API_KEY` server-side and the app routes AI through `/api/chat` — the key stays on the server. This path takes over automatically when a backend is present.
>
> AI uses the `claude-opus-4-5` model.

| Agent | Finds |
|-------|-------|
| 🎭 Micro Drama Discovery Agent | Vertical micro dramas (ReelShort, DramaBox, GoodShort) |
| 🔥 Viral Video Discovery Agent | Fastest-rising short-form clips (TikTok, Shorts, Reels, X) |
| 🎬 Movie Discovery Agent | Films by mood, genre, and streaming service |
| 📺 Series Discovery Agent | TV series & limited runs with season/episode counts |
| 🎧 Music Discovery Agent | Tracks & playlists by mood and moment |

## Features

- **Mood-first discovery** — pick a vibe (e.g. "Feel-Good", "Edge of My Seat", "Focus") and get ranked results with the reasons each pick matched.
- **Deterministic ranking engine** — filter by genre, platform, and region; sort by best match, trending, popularity, rating, or newest. Runs entirely client-side, so it works in a static export.
- **Save to a watchlist / playlist** — build a personal list per agent.
- **AI assistant** — per-item "is it worth my time?" details and a chat that answers questions and recommends titles (powered by the Claude API).

## Architecture

All five agents are driven by one config-driven component, so adding a new domain is mostly data:

```
lib/data/discovery.ts          # unified DiscoveryItem type + per-domain configs
lib/data/discoveryCatalog.ts   # seed catalog (~8 titles per domain)
lib/discovery/engine.ts        # filter + ranking engine with match reasons
components/agents/MediaDiscoveryAgent.tsx  # one generic agent UI, parameterized by domain
```

The marketplace home (`app/page.tsx`) lists the agents; each routes to `app/agents/[id]` and renders `<MediaDiscoveryAgent domain=… />`.

> The catalog is illustrative sample content for the demo, not a live data feed.

## Local development

```bash
npm install
cp .env.local.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The `ANTHROPIC_API_KEY` powers the AI chat and per-item recommendations. Browsing, filtering, ranking, and the watchlist all work without it.

## Static export

```bash
BUILD_HTML=1 npm run build
```

Outputs a static site to `out/` (the AI chat requires the API route, so it is inactive in a purely static export).

## Tech stack

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · Anthropic Claude API
