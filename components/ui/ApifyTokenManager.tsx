"use client";

import { useEffect, useState } from "react";
import { clearApifyToken, getApifyToken, maskToken, setApifyToken } from "@/lib/apify";

/** Bring-your-own Apify token, stored only in the browser (localStorage). */
export default function ApifyTokenManager() {
  const [saved, setSaved] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const existing = getApifyToken();
    setSaved(existing);
    setEditing(!existing);
  }, []);

  const save = () => {
    const value = draft.trim();
    if (!value) return;
    setApifyToken(value);
    setSaved(value);
    setDraft("");
    setEditing(false);
  };

  const remove = () => {
    clearApifyToken();
    setSaved(null);
    setEditing(true);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">🔗</span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-700">
              {saved ? "Apify connected" : "Connect Apify (live discovery)"}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {saved
                ? `Token ${maskToken(saved)} · stored in this browser only`
                : "Paste your Apify API token to pull real clips"}
            </p>
          </div>
        </div>
        {saved && !editing && (
          <div className="flex gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="btn-secondary !py-1 !px-2.5 !text-xs !rounded-lg"
            >
              Change
            </button>
            <button
              type="button"
              onClick={remove}
              className="btn-secondary !py-1 !px-2.5 !text-xs !rounded-lg"
            >
              Forget token
            </button>
          </div>
        )}
      </div>

      {editing && (
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            <input
              type="password"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") save();
              }}
              placeholder="apify_api_..."
              autoComplete="off"
              spellCheck={false}
              className="input-modern flex-1 !text-xs"
            />
            <button
              type="button"
              onClick={save}
              disabled={!draft.trim()}
              className="btn-primary !py-2 !px-4 !text-xs shrink-0"
            >
              Save
            </button>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Get a token at{" "}
            <a
              href="https://console.apify.com/account/integrations"
              target="_blank"
              rel="noreferrer"
              className="underline text-hub-teal"
            >
              console.apify.com
            </a>
            . Stored only in your browser and sent directly to Apify — never uploaded here.
          </p>
        </div>
      )}
    </div>
  );
}
