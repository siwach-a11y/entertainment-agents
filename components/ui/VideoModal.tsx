"use client";

import { useEffect } from "react";
import { getEmbed } from "@/lib/videoEmbed";

interface VideoModalProps {
  title: string;
  url: string;
  subtitle?: string;
  onClose: () => void;
}

/** In-page video player. Embeds YouTube/Instagram/TikTok; else offers a link. */
export default function VideoModal({ title, url, subtitle, onClose }: VideoModalProps) {
  const embed = getEmbed(url);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-panel w-full max-w-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-4">
          <div className="min-w-0">
            <h3 className="font-semibold text-slate-900 truncate">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 truncate">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="btn-secondary !py-1 !px-2.5 !text-sm !rounded-lg shrink-0"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {embed.embedUrl ? (
          <div className="relative w-full bg-black" style={{ aspectRatio: "16 / 9" }}>
            <iframe
              src={embed.kind === "youtube" ? `${embed.embedUrl}?autoplay=1&rel=0` : embed.embedUrl}
              title={title}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50/80">
            <p className="text-sm text-slate-500 mb-4">
              This clip can&apos;t be embedded here — open it on its platform.
            </p>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 p-4">
          <span className="text-[11px] text-slate-400 truncate">{url.replace(/^https?:\/\//, "")}</span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary !py-1.5 !px-3 !text-xs !rounded-lg shrink-0"
          >
            Open original ↗
          </a>
        </div>
      </div>
    </div>
  );
}
