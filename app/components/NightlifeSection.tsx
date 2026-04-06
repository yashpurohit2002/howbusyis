"use client";

import { NightlifeSignalResult, NightlifeSpot } from "@/app/lib/types";
import { LINE_COLORS } from "@/app/lib/nyc-data";

interface Props {
  nightlife: NightlifeSignalResult;
  textClass: string;
}

function LineBadge({ line }: { line: string }) {
  const color = LINE_COLORS[line] ?? "#808183";
  const isDark = ["N", "Q", "R", "W"].includes(line);
  return (
    <span
      className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-black shrink-0"
      style={{ backgroundColor: color, color: isDark ? "#000" : "#fff" }}
    >
      {line}
    </span>
  );
}

function ActivityBar({ score }: { score: number }) {
  const pct = Math.min(100, score);
  const color =
    pct >= 70 ? "#f97316" :
    pct >= 45 ? "#eab308" :
    "#22c55e";
  return (
    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

function SpotCard({ spot, isTop }: { spot: NightlifeSpot; isTop: boolean }) {
  return (
    <div
      className={`relative rounded-2xl p-4 space-y-3 border transition-colors ${
        isTop
          ? "bg-white/10 border-white/20"
          : "bg-white/5 border-white/10"
      }`}
    >
      {/* Hot badge */}
      {spot.isHot && (
        <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
          Active now
        </span>
      )}

      {/* Name + borough */}
      <div className="pr-16">
        <p className="text-sm font-bold text-white leading-tight">{spot.name}</p>
        <p className="text-xs text-white/40">{spot.borough} &middot; {spot.peakLabel}</p>
      </div>

      {/* Activity bar */}
      <ActivityBar score={spot.activityScore} />

      {/* Vibe */}
      <p className="text-xs text-white/60 leading-relaxed">{spot.vibe}</p>

      {/* Dynamic modifier chips */}
      {spot.modifiers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {spot.modifiers.map((m) => (
            <span key={m} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/8 border border-white/10 text-white/50">
              {m}
            </span>
          ))}
        </div>
      )}

      {/* Best for tags */}
      <div className="flex flex-wrap gap-1">
        {spot.bestFor.map((tag) => (
          <span
            key={tag}
            className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/50"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Subway lines */}
      {spot.lines.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[10px] text-white/25">Take:</span>
          {spot.lines.slice(0, 8).map((l) => (
            <LineBadge key={l} line={l} />
          ))}
        </div>
      )}
    </div>
  );
}

export function NightlifeSection({ nightlife, textClass }: Props) {
  if (nightlife.error || nightlife.spots.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
        <p className="text-white/40 text-sm">Nightlife data unavailable.</p>
      </div>
    );
  }

  const [top, ...rest] = nightlife.spots;
  // Show top pick + next 5
  const secondary = rest.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Top pick */}
      <div>
        <p className="text-[10px] text-white/25 uppercase tracking-widest mb-2">Top pick tonight</p>
        <SpotCard spot={top} isTop />
      </div>

      {/* Rest of neighborhoods */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {secondary.map((spot) => (
          <SpotCard key={spot.name} spot={spot} isTop={false} />
        ))}
      </div>

      {/* Summary line */}
      <p className={`text-xs text-center ${textClass} opacity-70`}>
        {nightlife.detail}
      </p>
    </div>
  );
}
