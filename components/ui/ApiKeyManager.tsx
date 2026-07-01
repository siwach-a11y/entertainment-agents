"use client";

import { useEffect, useState } from "react";
import { clearApiKey, getApiKey, maskKey, setApiKey } from "@/lib/aiClient";

interface ApiKeyManagerProps {
  /** Render a tighter layout for embedding in small docks. */
  compact?: boolean;
  /** Notified whenever the stored key changes (set or cleared). */
  onChange?: (hasKey: boolean) => void;
}

export default function ApiKeyManager({ compact = false, onChange }: ApiKeyManagerProps) {
  const [saved, setSaved] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const existing = getApiKey();
    setSaved(existing);
    setEditing(!existing);
  }, []);

  const save = () => {
    const value = draft.trim();
    if (!value) return;
    setApiKey(value);
    setSaved(value);
    setDraft("");
    setEditing(false);
    onChange?.(true);
  };

  const remove = () => {
    clearApiKey();
    setSaved(null);
    setEditing(true);
    onChange?.(false);
  };

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-slate-50/80 ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base">🔑</span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-700">
              {saved ? "AI connected" : "Connect AI"}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {saved
                ? `Anthropic key ${maskKey(saved)} · stored in this browser only`
                : "Paste your Anthropic API key to enable AI on this demo"}
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
              Disconnect
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
              placeholder="sk-ant-..."
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
            Get a key at{" "}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noreferrer"
              className="underline text-hub-teal"
            >
              console.anthropic.com
            </a>
            . It&apos;s kept in your browser&apos;s local storage and sent directly to
            Anthropic — never uploaded to this site or stored on a server.
          </p>
        </div>
      )}
    </div>
  );
}
