"use client";

import { useState } from "react";
import { BusyResponse } from "@/app/lib/types";

interface Props {
  score: number;
  label: string;
  data?: BusyResponse;
}

export function ShareButton({ score, label }: Props) {
  const [state, setState] = useState<"idle" | "copied" | "nudge">("idle");

  const handleShare = async () => {
    const text = `NYC is "${label}" right now. ${score}/100`;
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: "howbusy.is/nyc", text, url });
        setState("nudge");
        setTimeout(() => setState("idle"), 3000);
        return;
      } catch {
        // user cancelled or not supported — fall through to copy
      }
    }

    await navigator.clipboard.writeText(url);
    setState("nudge");
    setTimeout(() => setState("idle"), 3000);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleShare}
        className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-medium text-white/70 hover:text-white transition-all cursor-pointer"
      >
        {state === "nudge" ? "Link copied!" : "Share"}
      </button>
      <p
        className={`text-xs text-white/30 transition-opacity duration-500 ${state === "nudge" ? "opacity-100" : "opacity-0"}`}
      >
        Turn this into a group prediction{" "}
        <a href="https://oddson.app" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white/50 transition-colors">
          oddson.app
        </a>
      </p>
    </div>
  );
}
