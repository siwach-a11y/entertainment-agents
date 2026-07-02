"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { agents, getFeaturedAgents, getMarketplaceStats } from "@/lib/data/agents";
import AgentCard from "@/components/marketplace/AgentCard";
import MarketplaceChat from "@/components/marketplace/MarketplaceChat";
import Sidebar from "@/components/marketplace/Sidebar";

const CATEGORY_ACCENTS: Record<string, string> = {
  "micro-drama-discovery": "linear-gradient(145deg,#FB7185,#E11D48)",
  "viral-video-discovery": "linear-gradient(145deg,#FB923C,#EF4444)",
  "movie-discovery": "linear-gradient(145deg,#F5C662,#E0A82E)",
  "series-discovery": "linear-gradient(145deg,#818CF8,#6366F1)",
  "music-discovery": "linear-gradient(145deg,#E879F9,#A855F7)",
};
const CATEGORY_LABEL: Record<string, string> = {
  "micro-drama-discovery": "Micro Drama",
  "viral-video-discovery": "Viral Video",
  "movie-discovery": "Movies",
  "series-discovery": "Series",
  "music-discovery": "Music",
};

export default function Home() {
  const [search, setSearch] = useState("");
  const stats = getMarketplaceStats();
  const featured = getFeaturedAgents();

  const filtered = useMemo(() => {
    if (!search) return agents;
    const q = search.toLowerCase();
    return agents.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q)) ||
        a.author.toLowerCase().includes(q),
    );
  }, [search]);

  const statStrip = [
    { icon: "🤖", value: `${stats.totalAgents}`, label: "AI Agents" },
    { icon: "👥", value: `${stats.monthlyUsers.toLocaleString()}+`, label: "Users / mo" },
    { icon: "📈", value: "100K+", label: "Queries Processed" },
    { icon: "⚡", value: "24/7", label: "AI Assistance" },
  ];

  return (
    <div className="page-bg min-h-screen">
      <div className="flex">
        <Sidebar />

        <div className="flex-1 min-w-0" id="top">
          {/* Top bar */}
          <header className="glass-nav">
            <div className="px-4 sm:px-6 py-3.5 flex items-center gap-4">
              <div className="flex-1 max-w-lg relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search agents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-modern pl-10 rounded-full"
                />
              </div>
              <span className="relative grid place-items-center w-10 h-10 rounded-full border border-white/10 bg-white/5 text-slate-300">
                🔔
                <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-hub-coral" />
              </span>
            </div>
          </header>

          <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-12 pb-32">
            {/* Hero */}
            <section className="hero-glow animate-slide-up relative overflow-hidden rounded-3xl border border-white/10 p-8 sm:p-12 grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <p className="section-title mb-4 inline-flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-hub-blue animate-pulse" />
                  AI-powered entertainment discovery
                </p>
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.05] text-balance">
                  <span className="gradient-text">Discover AI Agents</span>
                  <br />
                  Built for Entertainment
                </h1>
                <p className="mt-4 text-slate-400 text-base max-w-md leading-relaxed">
                  Find agents that surface micro dramas, viral clips, movies, series, and music —
                  by mood, and watch it right here.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => document.querySelector("#all-agents")?.scrollIntoView({ behavior: "smooth" })}
                    className="btn-primary"
                  >
                    Explore Agents
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                  <button
                    onClick={() => document.querySelector("#featured")?.scrollIntoView({ behavior: "smooth" })}
                    className="btn-secondary"
                  >
                    View Featured
                  </button>
                </div>
              </div>

              {/* Hero visual */}
              <div className="hidden lg:block relative h-64">
                <div className="absolute inset-0 rounded-3xl border border-white/10 overflow-hidden"
                  style={{ background: "radial-gradient(circle at 50% 40%, rgba(139,92,246,0.35), rgba(16,13,30,0.6) 70%)" }}>
                  <div className="absolute inset-0 grid place-items-center text-[7rem] opacity-90">🎬</div>
                  {["🎭", "🔥", "📺", "🎧"].map((e, i) => (
                    <span
                      key={e}
                      className="absolute text-2xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur px-3 py-2 animate-fade-in"
                      style={{
                        top: `${[12, 20, 62, 70][i]}%`,
                        left: `${[10, 74, 12, 72][i]}%`,
                        animationDelay: `${i * 0.12}s`,
                      }}
                    >
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* Stats */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {statStrip.map((s) => (
                <div key={s.label} className="glass-panel p-4 flex items-center gap-3">
                  <span className="text-2xl">{s.icon}</span>
                  <div>
                    <p className="text-lg font-bold text-slate-900 leading-none">{s.value}</p>
                    <p className="text-xs text-slate-400 mt-1">{s.label}</p>
                  </div>
                </div>
              ))}
            </section>

            {/* Categories */}
            <section id="categories">
              <p className="section-title mb-4">Browse by category</p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {agents.map((a) => (
                  <Link
                    key={a.id}
                    href={`/agents/${a.id}`}
                    className="glass-card p-4 flex flex-col items-center gap-2 text-center group"
                  >
                    <span
                      className="w-12 h-12 rounded-2xl grid place-items-center text-xl group-hover:scale-105 transition-transform"
                      style={{ backgroundImage: CATEGORY_ACCENTS[a.id] }}
                    >
                      {a.icon}
                    </span>
                    <span className="text-xs font-medium text-slate-600">{CATEGORY_LABEL[a.id]}</span>
                  </Link>
                ))}
              </div>
            </section>

            {/* Featured */}
            {!search && (
              <section id="featured">
                <div className="flex items-end justify-between mb-5">
                  <div>
                    <p className="section-title mb-1">Curated picks</p>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">Featured Agents</h2>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {featured.map((agent) => (
                    <AgentCard key={agent.id} agent={agent} featured />
                  ))}
                </div>
              </section>
            )}

            {/* All agents */}
            <section id="all-agents">
              <div className="flex items-end justify-between mb-5">
                <div>
                  <p className="section-title mb-1">Full catalog</p>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">
                    {search ? "Search Results" : "All Agents"}
                    <span className="ml-2 text-base font-normal text-slate-400">{filtered.length}</span>
                  </h2>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} />
                ))}
              </div>
              {filtered.length === 0 && (
                <div className="empty-state">No agents match your search.</div>
              )}
            </section>
          </main>
        </div>
      </div>

      <MarketplaceChat />
    </div>
  );
}
