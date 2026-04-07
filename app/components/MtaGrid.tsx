"use client";

import { useState } from "react";
import { MtaSignalResult } from "@/app/lib/types";
import { LINE_COLORS, ALL_LINES } from "@/app/lib/nyc-data";

const CHAOS_BADGE: Record<string, { label: string; cls: string }> = {
  normal:   { label: "Normal for NYC",  cls: "bg-emerald-900/60 text-emerald-400 border-emerald-800" },
  elevated: { label: "More than usual", cls: "bg-yellow-900/60 text-yellow-400 border-yellow-800" },
  bad:      { label: "Rough out there", cls: "bg-red-900/60 text-red-400 border-red-800" },
  unknown:  { label: "Status unknown",  cls: "bg-white/5 text-white/30 border-white/10" },
};

// Lines that share infrastructure — useful context when one is delayed
const LINE_GROUPS: Record<string, string> = {
  "1": "1, 2, 3 share the 7th Ave line",
  "2": "1, 2, 3 share the 7th Ave line",
  "3": "1, 2, 3 share the 7th Ave line",
  "4": "4, 5, 6 share the Lexington Ave line",
  "5": "4, 5, 6 share the Lexington Ave line",
  "6": "4, 5, 6 share the Lexington Ave line",
  "7": "7 runs the Flushing line to Queens",
  "A": "A, C, E share the 8th Ave line",
  "C": "A, C, E share the 8th Ave line",
  "E": "A, C, E share the 8th Ave line",
  "B": "B, D, F, M share the 6th Ave line",
  "D": "B, D, F, M share the 6th Ave line",
  "F": "B, D, F, M share the 6th Ave line",
  "M": "B, D, F, M share the 6th Ave line",
  "N": "N, Q, R, W share the Broadway line",
  "Q": "N, Q, R, W share the Broadway line",
  "R": "N, Q, R, W share the Broadway line",
  "W": "N, Q, R, W share the Broadway line",
  "G": "G runs independently through Brooklyn and Queens",
  "J": "J and Z share the Jamaica line",
  "Z": "J and Z share the Jamaica line",
  "L": "L runs the 14th St crosstown to Canarsie",
  "S": "S shuttles between Times Sq and Grand Central",
};

const EFFECT_COPY: Record<string, string> = {
  normal:   "Alerts are in range for NYC. Could be planned work or minor slowdowns.",
  elevated: "More issues than usual. Worth checking before you head out.",
  bad:      "Genuinely rough. Check your specific line before committing.",
  unknown:  "MTA feed didn't respond. Assume delays, especially if it's rush hour.",
};

interface Props {
  mta: MtaSignalResult;
  highlightLines?: string[];
}

function LineDot({
  line,
  delayed,
  highlight,
  selected,
  size = "md",
  onClick,
}: {
  line: string;
  delayed: boolean;
  highlight: boolean;
  selected: boolean;
  size?: "md" | "sm";
  onClick?: () => void;
}) {
  const color = LINE_COLORS[line] ?? "#808183";
  const isDark = ["N", "Q", "R", "W"].includes(line);
  const dim = !delayed && !highlight;
  const sizeClass = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";

  return (
    <div
      className={`relative flex flex-col items-center gap-1 transition-all duration-200 ${delayed ? "cursor-pointer" : ""}`}
      title={line}
      onClick={onClick}
    >
      <div
        className={`${sizeClass} rounded-full flex items-center justify-center font-black transition-all duration-200 ${
          dim ? "opacity-25" : ""
        } ${highlight ? "ring-2 ring-white ring-offset-2 ring-offset-black scale-110" : ""}
        ${selected ? "ring-2 ring-white/60 ring-offset-1 ring-offset-black scale-105" : ""}
        ${delayed && !selected ? "hover:scale-105 hover:opacity-90" : ""}`}
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
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const delayedSet = new Set(mta.delayedLines ?? []);
  const badge = CHAOS_BADGE[mta.chaosLevel ?? "unknown"];
  const hasData = !mta.error && mta.chaosLevel !== "unknown";

  const delayedLines = ALL_LINES.filter((l) => delayedSet.has(l));
  const goodLines = ALL_LINES.filter((l) => !delayedSet.has(l));

  const handleLineClick = (line: string) => {
    setSelectedLine((prev) => (prev === line ? null : line));
  };

  const selectedColor = selectedLine ? (LINE_COLORS[selectedLine] ?? "#808183") : null;
  const isDarkLine = selectedLine ? ["N", "Q", "R", "W"].includes(selectedLine) : false;

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

      {/* Delayed lines */}
      {hasData && delayedLines.length > 0 && (
        <div>
          <p className="text-xs text-yellow-500/70 mb-2 font-medium">
            Delays ({delayedLines.length}) — tap a line for details
          </p>
          <div className="flex flex-wrap gap-3">
            {delayedLines.map((line) => (
              <LineDot
                key={line}
                line={line}
                delayed
                highlight={highlightLines.includes(line)}
                selected={selectedLine === line}
                onClick={() => handleLineClick(line)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inline detail panel for selected line */}
      {selectedLine && delayedSet.has(selectedLine) && (
        <div
          className="rounded-2xl p-4 space-y-2 border border-white/10"
          style={{ backgroundColor: `${selectedColor}18` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                style={{ backgroundColor: selectedColor!, color: isDarkLine ? "#000" : "#fff" }}
              >
                {selectedLine}
              </div>
              <span className="text-sm font-semibold text-white">
                Active service alerts
              </span>
            </div>
            <button
              onClick={() => setSelectedLine(null)}
              className="text-white/30 hover:text-white/60 text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>

          {LINE_GROUPS[selectedLine] && (
            <p className="text-xs text-white/50 leading-relaxed">
              {LINE_GROUPS[selectedLine]}. Delays on one can ripple across the group.
            </p>
          )}

          <p className="text-xs text-white/40 leading-relaxed">
            {EFFECT_COPY[mta.chaosLevel ?? "unknown"]}
          </p>

          <a
            href="https://new.mta.info/alerts"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors underline underline-offset-2"
          >
            Live alerts on mta.info ↗
          </a>
        </div>
      )}

      {/* Good lines */}
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
                selected={false}
                size="sm"
              />
            ))}
          </div>
        </div>
      )}

      {!hasData && (
        <div className="flex flex-wrap gap-2.5">
          {ALL_LINES.map((line) => (
            <LineDot key={line} line={line} delayed={false} highlight={false} selected={false} size="sm" />
          ))}
        </div>
      )}
    </div>
  );
}
