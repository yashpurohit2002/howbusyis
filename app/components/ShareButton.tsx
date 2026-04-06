"use client";

import { useState } from "react";
import { BusyResponse } from "@/app/lib/types";

interface Props {
  score: number;
  label: string;
  data?: BusyResponse;
}

function buildOgParams(score: number, data?: BusyResponse): URLSearchParams {
  const p = new URLSearchParams({ score: String(score) });
  if (data) {
    if (data.signals.weather && !data.signals.weather.error) {
      p.set("weather", data.signals.weather.detail);
    }
    if (data.signals.mta && !data.signals.mta.error) {
      p.set("mta", data.signals.mta.detail);
    }
    if (data.signals.events) {
      p.set("events", data.signals.events.detail);
    }
  }
  return p;
}

export function ShareButton({ score, label, data }: Props) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const params = buildOgParams(score, data);
  const twitterOg = `/og?${params}`;
  const storyOg = `/og/story?${params}`;

  const handleShare = async () => {
    const text = `NYC is "${label}" right now (${score}/100).`;
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: "howbusyis.nyc", text, url });
        return;
      } catch { /* fall through */ }
    }

    await navigator.clipboard.writeText(`${text}\n${url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-medium text-white/70 hover:text-white transition-all cursor-pointer"
      >
        {copied ? "Copied!" : "Share"}
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 border border-white/10 rounded-xl overflow-hidden shadow-xl w-52 z-10">
          <button
            className="w-full text-left px-4 py-3 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            onClick={handleShare}
          >
            Copy link
          </button>
          <a
            href={twitterOg}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-4 py-3 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            onClick={() => setOpen(false)}
          >
            Twitter card (16:9)
          </a>
          <a
            href={storyOg}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-4 py-3 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            onClick={() => setOpen(false)}
          >
            Story card (9:16)
          </a>
        </div>
      )}
    </div>
  );
}
