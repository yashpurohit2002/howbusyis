"use client";

import { MtaSignalResult } from "@/app/lib/types";
import { LINE_COLORS, ALL_LINES } from "@/app/lib/nyc-data";

const CHAOS_BADGE: Record<string, { label: string; cls: string }> = {
  normal:   { label: "Normal for NYC",   cls: "bg-emerald-900/60 text-emerald-400 border-emerald-800" },
  elevated: { label: "More than usual",  cls: "bg-yellow-900/60 text-yellow-400 border-yellow-800" },
  bad:      { label: "Rough out there",  cls: "bg-red-900/60 text-red-400 border-red-800" },
  unknown:  { label: "Status unknown",   cls: "bg-white/5 text-white/30 border-white/10" },
};

interface Props {
  mta: MtaSignalResult;
  highlightLines?: string[];
}

function LineDot({
  line,
  delayed,
  highlight,
  size = "md",
}: {
  line: string;
  delayed: boolean;
  highlight: boolean;
  size?: "md" | "sm";
}) {
  const color = LINE_COLORS[line] ?? "#808183";
  const isDark = ["N", "Q", "R", "W"].includes(line);
  const dim = !delayed && !highlight;

  const sizeClass = size === "sm"
    ? "w-7 h-7 text-xs"
    : "w-9 h-9 text-sm";

  return (
    <div
      className={`relative flex flex-col items-center gap-1 transition-all duration-200`}
      title={line}
    >
      <div
        className={`${sizeClass} rounded-full flex items-center justify-center font-black transition-all duration-200 ${
          dim ? "opacity-25" : highlight ? "ring-2 ring-white ring-offset-2 ring-offset-black scale-110" : ""
        }`}
        style={{ backgroundColor: color, color: isDark ? "#000" : "#fff" }}
      >
        {line}
      </div>
      {delayed && (
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-yellow-400 border-2 border-black" />
      )}
    </div>
  );
}

export function MtaGrid({ mta, highlightLines = [] }: Props) {
  const delayedSet = new Set(mta.delayedLines ?? []);
  const badge = CHAOS_BADGE[mta.chaosLevel ?? "unknown"];
  const hasData = !mta.error && mta.chaosLevel !== "unknown";

  const delayedLines = ALL_LINES.filter((l) => delayedSet.has(l));
  const goodLines = ALL_LINES.filter((l) => !delayedSet.has(l));

  return (
    <div className="space-y-4">
      {/* Chaos level badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full border font-medium ${badge.cls}`}>
          {badge.label}
        </span>
        {mta.error && (
          <span className="text-xs text-white/30 italic">{mta.detail}</span>
        )}
      </div>

      {/* Delayed lines -- front and center */}
      {hasData && delayedLines.length > 0 && (
        <div>
          <p className="text-xs text-yellow-500/70 mb-2 font-medium">
            Delays ({delayedLines.length})
          </p>
          <div className="flex flex-wrap gap-3">
            {delayedLines.map((line) => (
              <LineDot
                key={line}
                line={line}
                delayed
                highlight={highlightLines.includes(line)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Good lines -- dimmed */}
      {hasData && (
        <div>
          {delayedLines.length > 0 && (
            <p className="text-xs text-white/25 mb-2">
              Good service ({goodLines.length})
            </p>
          )}
          <div className="flex flex-wrap gap-2.5">
            {(delayedLines.length === 0 ? ALL_LINES : goodLines).map((line) => (
              <LineDot
                key={line}
                line={line}
                delayed={false}
                highlight={highlightLines.includes(line)}
                size="sm"
              />
            ))}
          </div>
        </div>
      )}

      {/* No data state */}
      {!hasData && (
        <div className="flex flex-wrap gap-2.5">
          {ALL_LINES.map((line) => (
            <LineDot key={line} line={line} delayed={false} highlight={false} size="sm" />
          ))}
        </div>
      )}
    </div>
  );
}
