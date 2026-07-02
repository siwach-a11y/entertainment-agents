"use client";

type IconName = "home" | "grid" | "layers" | "star" | "trending" | "sparkle" | "info";

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, string> = {
    home: "M2.25 12l8.954-8.955a1.5 1.5 0 012.122 0L22.28 12M4.5 9.75v10.5a.75.75 0 00.75.75H9.75v-6h4.5v6h4.5a.75.75 0 00.75-.75V9.75",
    grid: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 8.25V6zM13.5 6A2.25 2.25 0 0115.75 3.75H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 018.25 20.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z",
    layers: "M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122",
    star: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z",
    trending: "M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941",
    sparkle: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z",
    info: "M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z",
  };
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
      <path strokeLinecap="round" strokeLinejoin="round" d={paths[name]} />
    </svg>
  );
}

const NAV: { label: string; icon: IconName; target: string; active?: boolean }[] = [
  { label: "Home", icon: "home", target: "#top", active: true },
  { label: "All Agents", icon: "grid", target: "#all-agents" },
  { label: "Categories", icon: "layers", target: "#categories" },
  { label: "Featured", icon: "star", target: "#featured" },
  { label: "Trending", icon: "trending", target: "#featured" },
  { label: "New Agents", icon: "sparkle", target: "#all-agents" },
  { label: "About", icon: "info", target: "#top" },
];

export default function Sidebar() {
  const go = (target: string) => {
    if (target === "#top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col gap-6 p-5 border-r border-white/10 sticky top-0 h-screen">
      <div className="flex items-center gap-2.5">
        <div className="icon-box w-10 h-10 text-lg">🍿</div>
        <div>
          <p className="font-bold tracking-tight gradient-text leading-none">ENTERTAINMENT</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400 mt-1">
            AI Discovery
          </p>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV.map((n) => (
          <button
            key={n.label}
            type="button"
            onClick={() => go(n.target)}
            className={`nav-item text-left w-full ${n.active ? "nav-item-active" : ""}`}
          >
            <Icon name={n.icon} />
            {n.label}
          </button>
        ))}
      </nav>

      <div
        className="mt-auto rounded-2xl p-4 border border-white/10"
        style={{ background: "linear-gradient(160deg, rgba(139,92,246,0.18), rgba(217,70,239,0.1))" }}
      >
        <p className="font-semibold text-sm text-slate-900">Become a Creator</p>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Build your own AI agent and publish it to the marketplace.
        </p>
        <button className="btn-primary !py-2 !px-3 !text-xs mt-3 w-full">Learn More</button>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span className="flex items-center gap-2">🌙 Dark Mode</span>
        <span className="relative inline-flex h-5 w-9 items-center rounded-full bg-hub-blue/70">
          <span className="inline-block h-4 w-4 translate-x-4 rounded-full bg-white transition-transform" />
        </span>
      </div>
    </aside>
  );
}
