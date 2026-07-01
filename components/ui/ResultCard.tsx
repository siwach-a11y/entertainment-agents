"use client";

import { Availability } from "@/lib/types";

interface ResultCardProps {
  icon: string;
  title: string;
  subtitle?: string;
  price: string;
  meta?: string[];
  availability: Availability;
  onDetails?: () => void;
  onAlternatives?: () => void;
  actionLabel?: string;
  onAction?: () => void;
  allowActionWhenSoldOut?: boolean;
}

const availabilityStyles: Record<
  Availability,
  { bg: string; text: string; label: string }
> = {
  available: {
    bg: "bg-hub-green-light/90",
    text: "text-hub-green",
    label: "Available",
  },
  "few-left": {
    bg: "bg-hub-amber-light/90",
    text: "text-hub-amber",
    label: "Few left",
  },
  "sold-out": {
    bg: "bg-hub-coral-light/90",
    text: "text-hub-coral",
    label: "Sold out",
  },
};

export default function ResultCard({
  icon,
  title,
  subtitle,
  price,
  meta = [],
  availability,
  onDetails,
  onAlternatives,
  actionLabel = "Book",
  onAction,
  allowActionWhenSoldOut = false,
}: ResultCardProps) {
  const pill = availabilityStyles[availability];

  return (
    <div className="glass-card p-4 group">
      <div className="flex items-start gap-3.5">
        <div className="icon-box w-11 h-11 text-lg shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900 truncate tracking-tight">
                {title}
              </h3>
              {subtitle && (
                <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>
              )}
            </div>
            <span className="font-bold text-hub-blue whitespace-nowrap text-sm">
              {price}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            <span
              className={`badge-pill !normal-case !tracking-normal ${pill.bg} ${pill.text} border-transparent`}
            >
              {pill.label}
            </span>
            {meta.map((m, i) => (
              <span
                key={`${m}-${i}`}
                className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100/90 text-slate-500 font-medium"
              >
                {m}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-3.5">
            {onDetails && (
              <button onClick={onDetails} className="btn-secondary !py-1.5 !px-3 !text-xs !rounded-lg">
                Details
              </button>
            )}
            {onAlternatives && (
              <button onClick={onAlternatives} className="btn-secondary !py-1.5 !px-3 !text-xs !rounded-lg">
                Alternatives
              </button>
            )}
            {onAction && (availability !== "sold-out" || allowActionWhenSoldOut) && (
              <button onClick={onAction} className="btn-primary !py-1.5 !px-3 !text-xs !rounded-lg">
                {actionLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
