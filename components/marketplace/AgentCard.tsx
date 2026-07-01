"use client";

import Link from "next/link";
import { Agent, Badge } from "@/lib/types";

const badgeStyles: Record<Badge, string> = {
  Featured: "bg-hub-blue-light/80 text-hub-blue border-hub-blue/20",
  New: "bg-hub-teal-light/80 text-hub-teal border-hub-teal/20",
  Hot: "bg-hub-coral-light/80 text-hub-coral border-hub-coral/20",
  Free: "bg-hub-green-light/80 text-hub-green border-hub-green/20",
};

interface AgentCardProps {
  agent: Agent;
  featured?: boolean;
}

export default function AgentCard({ agent, featured }: AgentCardProps) {
  return (
    <Link href={`/agents/${agent.id}`} className="group block h-full">
      <article
        className={`glass-card p-5 h-full flex flex-col ${
          featured ? "ring-1 ring-hub-blue/15" : ""
        }`}
      >
        <div className="flex items-start gap-3.5 mb-4">
          <div className="icon-box w-12 h-12 text-2xl shrink-0 group-hover:scale-105 transition-transform duration-300">
            {agent.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate tracking-tight group-hover:text-hub-blue transition-colors">
              {agent.name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">by {agent.author}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {agent.badges.map((badge) => (
            <span
              key={badge}
              className={`badge-pill ${badgeStyles[badge]}`}
            >
              {badge}
            </span>
          ))}
        </div>

        <p className="text-sm text-slate-500 leading-relaxed mb-4 flex-1 line-clamp-2">
          {agent.description}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {agent.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100/80 text-slate-500 font-medium"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 mb-4 pt-3 border-t border-slate-100">
          <span className="flex items-center gap-1 font-medium text-slate-600">
            <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {agent.rating}
            <span className="text-slate-300 font-normal">
              ({agent.reviewCount.toLocaleString()})
            </span>
          </span>
          <span className="text-slate-300">·</span>
          <span>{agent.userCount.toLocaleString()} users</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-hub-teal">{agent.price}</span>
          <span className="btn-primary !py-2 !px-4 !text-xs !rounded-lg">
            Launch
            <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </span>
        </div>
      </article>
    </Link>
  );
}
