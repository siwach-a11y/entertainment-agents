interface StatsRowProps {
  totalAgents: number;
  categories: number;
  monthlyUsers: number;
  avgRating: number;
}

export default function StatsRow({
  totalAgents,
  categories,
  monthlyUsers,
  avgRating,
}: StatsRowProps) {
  const stats = [
    {
      label: "Total Agents",
      value: totalAgents,
      accent: "from-hub-blue to-hub-teal",
      text: "text-hub-blue",
    },
    {
      label: "Categories",
      value: categories,
      accent: "from-hub-teal to-hub-green",
      text: "text-hub-teal",
    },
    {
      label: "Monthly Users",
      value: monthlyUsers.toLocaleString(),
      accent: "from-hub-purple to-hub-amber",
      text: "text-hub-amber",
    },
    {
      label: "Avg Rating",
      value: avgRating,
      accent: "from-hub-amber to-hub-coral",
      text: "text-hub-coral",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="stat-card group">
          <div
            className={`w-8 h-1 rounded-full bg-gradient-to-r ${stat.accent} mx-auto mb-3 opacity-80 group-hover:opacity-100 transition-opacity`}
          />
          <div className={`text-3xl font-bold tracking-tight ${stat.text}`}>
            {stat.value}
          </div>
          <div className="text-xs font-medium uppercase tracking-wider text-slate-400 mt-1.5">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
