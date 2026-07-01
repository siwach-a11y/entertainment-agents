"use client";

import { useCallback, useMemo, useState } from "react";
import {
  discoverySourceModes,
  formatGrowth,
  formatViews,
  getPlatformLabel,
  getQueueHealth,
  hoursSince,
  PIPELINE_STATUS_LABEL,
  seedTrendingVideos,
  type DiscoverySourceMode,
  type DiscoveryRunStats,
  type TrendingVideo,
  type VideoCategory,
  type VideoPlatform,
  type VideoPipelineStatus,
  videoCategories,
  videoPlatforms,
  videoRegions,
  officialSources,
} from "@/lib/data/videos";
import {
  approveVideo,
  processApproved,
  publishReady,
  rejectVideo,
  runDiscovery,
} from "@/lib/video-discovery/engine";
import {
  fetchInstagramReels,
  hasApifyToken,
  type LiveCandidate,
} from "@/lib/apify";
import ApifyTokenManager from "@/components/ui/ApifyTokenManager";
import VideoModal from "@/components/ui/VideoModal";
import { getEmbed } from "@/lib/videoEmbed";
import TabSwitcher from "@/components/ui/TabSwitcher";
import ResultCard from "@/components/ui/ResultCard";
import AIChat, { useAIResponse } from "@/components/ui/AIChat";
import StatusBar from "@/components/ui/StatusBar";
import WebSearchLinks from "@/components/ui/WebSearchLinks";

const mainTabs = [
  { id: "discover", label: "Discovery" },
  { id: "queue", label: "Video Queue" },
  { id: "trending", label: "Trending" },
  { id: "published", label: "Published" },
];

const browseTabs = [
  { id: "all", label: "All Trending" },
  { id: "rising", label: "Rising Fast" },
  { id: "viral", label: "Viral Today" },
];

function statusPill(status: VideoPipelineStatus): string {
  const map: Record<VideoPipelineStatus, string> = {
    discovered: "bg-sky-100 text-sky-800",
    pending_review: "bg-amber-100 text-amber-800",
    approved: "bg-blue-100 text-blue-800",
    processing: "bg-purple-100 text-purple-800",
    ready: "bg-emerald-100 text-emerald-800",
    published: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-700",
    failed: "bg-red-100 text-red-700",
  };
  return map[status];
}

export default function ViralPipelineAgent() {
  const [mainTab, setMainTab] = useState("discover");
  const [browseTab, setBrowseTab] = useState("all");
  const [videos, setVideos] = useState<TrendingVideo[]>(() => [...seedTrendingVideos]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [sourceMode, setSourceMode] = useState<DiscoverySourceMode>("whitelist");
  const [platforms, setPlatforms] = useState<Set<VideoPlatform>>(
    () => new Set<VideoPlatform>(["youtube", "tiktok", "instagram"]),
  );
  const [category, setCategory] = useState("All");
  const [region, setRegion] = useState("Global");
  const [limitPerCategory, setLimitPerCategory] = useState("3");
  const [youtubeSource, setYoutubeSource] = useState("");
  const [instagramSource, setInstagramSource] = useState("");
  const [officialOnly, setOfficialOnly] = useState(true);
  const [runBusy, setRunBusy] = useState(false);
  const [lastRun, setLastRun] = useState<DiscoveryRunStats | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<TrendingVideo | null>(null);

  const [platformFilter, setPlatformFilter] = useState("all");
  const [query, setQuery] = useState("");
  const { response, isLoading, ask } = useAIResponse();

  const health = useMemo(() => getQueueHealth(videos), [videos]);

  const queueVideos = useMemo(
    () =>
      videos.filter((v) =>
        ["discovered", "pending_review", "approved", "processing", "ready", "failed"].includes(
          v.status,
        ),
      ),
    [videos],
  );

  const publishedVideos = useMemo(
    () => videos.filter((v) => v.status === "published"),
    [videos],
  );

  const browseList = useMemo(() => {
    let list = videos.filter((v) => v.status !== "rejected");

    if (browseTab === "rising") {
      list = list.filter((v) => v.growthPercent >= 200).sort((a, b) => b.growthPercent - a.growthPercent);
    } else if (browseTab === "viral") {
      list = list.filter((v) => hoursSince(v.publishedAt) <= 24).sort((a, b) => b.views - a.views);
    } else {
      list = [...list].sort((a, b) => a.trendingRank - b.trendingRank);
    }

    return list.filter((v) => {
      if (platformFilter !== "all" && v.platform !== platformFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          v.title.toLowerCase().includes(q) ||
          v.creator.toLowerCase().includes(q) ||
          v.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [videos, browseTab, platformFilter, query]);

  const togglePlatform = (p: VideoPlatform) => {
    setPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  };

  const handleDiscoveryRun = useCallback(async () => {
    setRunBusy(true);
    setLiveError(null);

    // Internet mode with an Apify token → pull real Instagram reels live.
    let liveCandidates: LiveCandidate[] = [];
    if (sourceMode === "internet" && hasApifyToken()) {
      const handles = [
        ...(officialSources.map((s) => s.instagram).filter(Boolean) as string[]),
        ...(instagramSource.trim() ? [instagramSource.trim()] : []),
      ];
      try {
        liveCandidates = await fetchInstagramReels({
          handles,
          limitPerProfile: parseInt(limitPerCategory, 10) || 3,
          category: (category === "All" ? "Lifestyle" : category) as VideoCategory,
          region,
        });
      } catch (err) {
        setLiveError(err instanceof Error ? err.message : "Apify fetch failed.");
      }
    } else {
      await new Promise((r) => setTimeout(r, 600));
    }

    let stats: DiscoveryRunStats | null = null;
    setVideos((prev) => {
      const result = runDiscovery(prev, {
        mode: sourceMode,
        platforms: Array.from(platforms),
        category,
        region,
        limitPerCategory: parseInt(limitPerCategory, 10) || 3,
        youtubeSource: youtubeSource || undefined,
        instagramSource: instagramSource || undefined,
        officialOnly,
        liveCandidates,
      });
      stats = result.stats;
      return result.videos.map((v) =>
        v.status === "discovered" ? { ...v, status: "pending_review" as const } : v,
      );
    });
    if (stats) setLastRun(stats);
    setRunBusy(false);
    setMainTab("queue");
  }, [
    sourceMode,
    platforms,
    category,
    region,
    limitPerCategory,
    youtubeSource,
    instagramSource,
    officialOnly,
  ]);

  const bulkApprove = () => {
    setVideos((prev) => {
      let next = [...prev];
      for (const id of Array.from(selected)) next = approveVideo(next, id);
      return next;
    });
    setSelected(new Set());
  };

  const bulkReject = () => {
    setVideos((prev) => {
      let next = [...prev];
      for (const id of Array.from(selected)) next = rejectVideo(next, id);
      return next;
    });
    setSelected(new Set());
  };

  const runProcess = () => {
    setVideos((prev) => processApproved(prev));
  };

  const runPublish = () => {
    setVideos((prev) => publishReady(prev));
    setMainTab("published");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl p-3.5 text-sm text-hub-teal bg-white/90 border border-white shadow-sm">
        Inspired by{" "}
        <a
          href="https://github.com/The-Binary-Holdings/AI-Automation/tree/main/fando-ai-agent"
          target="_blank"
          rel="noreferrer"
          className="underline font-medium"
        >
          Fando AI
        </a>
        : Discovery → Queue → Approve → Process → Publish. Short-form clips only (≤29s), official
        sources, URL dedupe.
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {(
          [
            ["Discovered", health.discovered + health.pendingReview],
            ["Approved", health.approved],
            ["Processing", health.processing],
            ["Ready", health.ready],
            ["Published", health.published],
            ["Rejected", health.rejected],
            ["Failed", health.failed],
            ["Total", health.total],
          ] as const
        ).map(([label, val]) => (
          <div key={label} className="glass-panel p-2 text-center">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
            <p className="text-lg font-bold text-slate-900">{val}</p>
          </div>
        ))}
      </div>

      <TabSwitcher tabs={mainTabs} activeTab={mainTab} onChange={setMainTab} />

      {mainTab === "discover" && (
        <div className="space-y-4">
          <div className="glass-panel p-5 space-y-4">
            <p className="section-title">Discovery mode</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {discoverySourceModes.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSourceMode(m.id)}
                  className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                    sourceMode === m.id
                      ? "border-hub-blue bg-hub-blue/5 ring-1 ring-hub-blue/30"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <p className="font-semibold text-slate-900">{m.label}</p>
                  <p className="text-xs text-slate-500 mt-1">{m.description}</p>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {videoPlatforms.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePlatform(p.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border ${
                    platforms.has(p.id)
                      ? "bg-hub-teal text-white border-hub-teal"
                      : "bg-white text-slate-600 border-slate-200"
                  }`}
                >
                  {p.icon} {p.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-modern">
                {videoCategories.map((c) => (
                  <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>
                ))}
              </select>
              <select value={region} onChange={(e) => setRegion(e.target.value)} className="input-modern">
                {videoRegions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                max={10}
                value={limitPerCategory}
                onChange={(e) => setLimitPerCategory(e.target.value)}
                placeholder="Limit per category"
                className="input-modern"
              />
              <label className="flex items-center gap-2 text-sm px-2">
                <input
                  type="checkbox"
                  checked={officialOnly}
                  onChange={(e) => setOfficialOnly(e.target.checked)}
                />
                Official sources only
              </label>
            </div>

            {sourceMode === "specific" && (
              <div className="grid sm:grid-cols-2 gap-3">
                <input
                  value={youtubeSource}
                  onChange={(e) => setYoutubeSource(e.target.value)}
                  placeholder="YouTube @handle or channel URL"
                  className="input-modern"
                />
                <input
                  value={instagramSource}
                  onChange={(e) => setInstagramSource(e.target.value)}
                  placeholder="Instagram @profile"
                  className="input-modern"
                />
              </div>
            )}

            {sourceMode === "internet" && (
              <div className="space-y-2">
                <ApifyTokenManager />
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  With an Apify token, this pulls <strong>real Instagram reels</strong> from the
                  official profiles via the <code>apify/instagram-scraper</code> actor (uses your
                  Apify credits). Without a token, it runs on sample data. Add a specific
                  Instagram <em>@profile</em> above to include it.
                </p>
                {liveError && (
                  <p className="text-xs text-hub-coral bg-hub-coral-light/60 rounded-lg px-3 py-2">
                    {liveError}
                  </p>
                )}
              </div>
            )}

            {sourceMode === "whitelist" && (
              <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
                <p className="text-xs font-semibold text-slate-600 mb-2">
                  Official registry ({officialSources.length} sources)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {officialSources.map((s) => (
                    <span key={s.id} className="text-[11px] px-2 py-0.5 rounded-md bg-white border text-slate-600">
                      {s.name} · {s.category}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleDiscoveryRun}
              disabled={runBusy || platforms.size === 0}
              className="btn-primary w-full sm:w-auto"
            >
              {runBusy ? "Running discovery…" : "Run Discovery"}
            </button>

            <StatusBar
              status={runBusy ? "thinking" : "idle"}
              message={
                lastRun
                  ? `Last run: ${lastRun.inserted} inserted · ${lastRun.duplicatesSkipped} dupes skipped · ${lastRun.rejectedUnofficial} unofficial · ${lastRun.durationMs}ms`
                  : "Ready to discover short-form trending clips"
              }
            />
          </div>

          <WebSearchLinks domain="viral-video" noun="viral clips" />
        </div>
      )}

      {mainTab === "queue" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={bulkApprove} disabled={selected.size === 0} className="btn-primary !py-2 !text-xs">
              Approve selected ({selected.size})
            </button>
            <button type="button" onClick={bulkReject} disabled={selected.size === 0} className="btn-secondary !py-2 !text-xs">
              Reject selected
            </button>
            <button type="button" onClick={runProcess} className="btn-secondary !py-2 !text-xs">
              Process approved → caption + ready
            </button>
            <button type="button" onClick={runPublish} className="btn-primary !py-2 !text-xs">
              Publish ready clips
            </button>
          </div>

          <div className="glass-panel overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-500 uppercase">
                  <th className="p-3 w-8" />
                  <th className="p-3">Title</th>
                  <th className="p-3">Platform</th>
                  <th className="p-3">Views</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {queueVideos.map((v) => (
                  <tr key={v.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selected.has(v.id)}
                        onChange={() => {
                          setSelected((prev) => {
                            const next = new Set(prev);
                            if (next.has(v.id)) next.delete(v.id);
                            else next.add(v.id);
                            return next;
                          });
                        }}
                      />
                    </td>
                    <td className="p-3">
                      <p className="font-medium text-slate-900 line-clamp-1">{v.title}</p>
                      <p className="text-xs text-slate-400">{v.creator}{v.isOfficial ? " · ✓ official" : ""}</p>
                      {v.caption && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">Caption: {v.caption}</p>
                      )}
                    </td>
                    <td className="p-3">{getPlatformLabel(v.platform)}</td>
                    <td className="p-3">{formatViews(v.views)}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusPill(v.status)}`}>
                        {PIPELINE_STATUS_LABEL[v.status]}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        {(v.status === "discovered" || v.status === "pending_review") && (
                          <button type="button" className="btn-secondary !py-1 !px-2 !text-xs" onClick={() => setVideos(approveVideo(videos, v.id))}>
                            Approve
                          </button>
                        )}
                        <button type="button" className="btn-secondary !py-1 !px-2 !text-xs" onClick={() => setPlaying(v)}>
                          ▶ Watch
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {queueVideos.length === 0 && (
              <p className="p-8 text-center text-slate-500 text-sm">Queue empty — run Discovery first.</p>
            )}
          </div>
        </div>
      )}

      {mainTab === "trending" && (
        <div className="space-y-4">
          <TabSwitcher tabs={browseTabs} activeTab={browseTab} onChange={setBrowseTab} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)} className="input-modern">
              <option value="all">All Platforms</option>
              {videoPlatforms.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="input-modern sm:col-span-2"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {browseList.map((v) => (
              <ResultCard
                key={v.id}
                icon={v.thumbnailEmoji}
                imageUrl={getEmbed(v.videoUrl).thumbnail}
                title={v.title}
                subtitle={`${v.creator} · ${getPlatformLabel(v.platform)} · ${PIPELINE_STATUS_LABEL[v.status]}`}
                price={formatViews(v.views)}
                meta={[v.category, v.region, formatGrowth(v.growthPercent), v.duration]}
                availability={v.availability}
                actionLabel="▶ Watch"
                onAction={() => setPlaying(v)}
                allowActionWhenSoldOut
                onDetails={() =>
                  ask(`Why is "${v.title}" trending? ${formatViews(v.views)}, ${formatGrowth(v.growthPercent)}`)
                }
              />
            ))}
          </div>
        </div>
      )}

      {mainTab === "published" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {publishedVideos.map((v) => (
            <ResultCard
              key={v.id}
              icon={v.thumbnailEmoji}
              imageUrl={getEmbed(v.videoUrl).thumbnail}
              title={v.title}
              subtitle={`${v.creator} · Published`}
              price={formatViews(v.views)}
              meta={v.caption ? [v.caption.slice(0, 60) + "…"] : []}
              availability="available"
              actionLabel="▶ Watch"
              onAction={() => setPlaying(v)}
              allowActionWhenSoldOut
            />
          ))}
          {publishedVideos.length === 0 && (
            <div className="empty-state md:col-span-2">No published clips yet.</div>
          )}
        </div>
      )}

      {response && (
        <div className="glass-panel p-5">
          <StatusBar status={isLoading ? "thinking" : "idle"} />
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap mt-2">{response}</p>
        </div>
      )}

      <AIChat
        title="Trending Video AI"
        placeholder="Ask about viral trends, discovery strategy, or content ideas..."
        quickAsks={[
          "What discovery mode should I use to save API credits?",
          "What's trending on TikTok in Thailand today?",
          "How does Fando-style caption processing work?",
          "Best short-form hooks for travel content?",
        ]}
        systemContext="You are a viral video discovery expert for AgentHub, inspired by Fando AI's sports content pipeline. Explain discovery modes (whitelist, internet, specific source), queue workflow (discover → approve → process caption → publish), short-form rules (≤29s, official sources, URL dedupe), and platform-specific trends. Be concise."
      />

      {playing && (
        <VideoModal
          title={playing.title}
          url={playing.videoUrl}
          subtitle={`${playing.creator} · ${getPlatformLabel(playing.platform)}`}
          onClose={() => setPlaying(null)}
        />
      )}
    </div>
  );
}
