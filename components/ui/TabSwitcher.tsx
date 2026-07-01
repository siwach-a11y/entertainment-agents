"use client";

interface Tab {
  id: string;
  label: string;
}

interface TabSwitcherProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
}

export default function TabSwitcher({
  tabs,
  activeTab,
  onChange,
}: TabSwitcherProps) {
  return (
    <div className="inline-flex flex-wrap gap-1 p-1 rounded-xl bg-slate-100/80 border border-slate-200/60">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === tab.id
              ? "bg-white text-hub-blue shadow-sm shadow-slate-900/5"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
