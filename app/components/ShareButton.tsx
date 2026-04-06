"use client";

import { useState } from "react";
import { BusyResponse } from "@/app/lib/types";

interface Props {
  score: number;
  label: string;
  data?: BusyResponse;
}

export function ShareButton({ score, label }: Props) {
  const [state, setState] = useState<"idle" | "copied">("idle");

  const handleShare = async () => {
    const text = `NYC is "${label}" right now — ${score}/100`;
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: "howbusy.is/nyc", text, url });
        return;
      } catch {
        // user cancelled or not supported — fall through to copy
      }
    }

    await navigator.clipboard.writeText(url);
    setState("copied");
    setTimeout(() => setState("idle"), 2000);
  };

  return (
    <button
      onClick={handleShare}
      className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-medium text-white/70 hover:text-white transition-all cursor-pointer"
    >
      {state === "copied" ? "Link copied!" : "Share"}
    </button>
  );
}
