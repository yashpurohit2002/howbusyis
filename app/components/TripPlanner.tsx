"use client";

import { useState, useMemo } from "react";
import { MtaSignalResult, LineStatusEntry } from "@/app/lib/types";
import { NEIGHBORHOOD_LINES, ALL_NEIGHBORHOODS, findRoute, LINE_COLORS } from "@/app/lib/nyc-data";

interface Props {
  mta: MtaSignalResult;
  onHighlight: (lines: string[]) => void;
}

function NeighborhoodInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const filtered = useMemo(
    () =>
      value.length > 0
        ? ALL_NEIGHBORHOODS.filter((n) =>
            n.toLowerCase().includes(value.toLowerCase())
          ).slice(0, 6)
        : [],
    [value]
  );

  return (
    <div className="relative flex-1 min-w-0">
      <label className="text-xs text-white/40 block mb-1">{label}</label>
      <input
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 focus:bg-white/8"
        placeholder="e.g. williamsburg"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-10 top-full mt-1 left-0 right-0 bg-gray-900 border border-white/10 rounded-xl overflow-hidden shadow-xl">
          {filtered.map((n) => (
            <li key={n}>
              <button
                className="w-full text-left px-3 py-2 text-sm text-white/70 hover:bg-white/10 capitalize"
                onMouseDown={() => {
                  onChange(n);
                  setOpen(false);
                }}
              >
                {n}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LinePill({ line, status }: { line: string; status?: LineStatusEntry }) {
  const color = LINE_COLORS[line] ?? "#808183";
  const isDark = ["N","Q","R","W"].includes(line);
  const delayed = status?.status === "delayed";
  const suspended = status?.status === "suspended";

  return (
    <span className="relative inline-flex items-center">
      <span
        className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black"
        style={{ backgroundColor: color, color: isDark ? "#000" : "#fff" }}
      >
        {line}
      </span>
      {delayed && (
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-yellow-400 border border-black" />
      )}
      {suspended && (
        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 border border-black" />
      )}
    </span>
  );
}

export function TripPlanner({ mta, onHighlight }: Props) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [result, setResult] = useState<{
    description: string;
    fromLines: string[];
    toLines: string[];
    delayedLines: string[];
    directLine?: string;
    transferHub?: string;
  } | null>(null);

  const statusMap = Object.fromEntries(
    (mta.lineStatuses ?? []).map((e) => [e.line, e])
  );

  const handleSubmit = () => {
    const fromData = NEIGHBORHOOD_LINES[from.toLowerCase().trim()];
    const toData = NEIGHBORHOOD_LINES[to.toLowerCase().trim()];

    if (!fromData || !toData) {
      setResult({
        description: `Couldn't find "${!fromData ? from : to}". Try a different neighborhood name.`,
        fromLines: [],
        toLines: [],
        delayedLines: [],
      });
      onHighlight([]);
      return;
    }

    const route = findRoute(fromData.lines, toData.lines, from, to);
    const allInvolvedLines = Array.from(new Set([...fromData.lines, ...toData.lines]));
    const delayedLines = allInvolvedLines.filter(
      (l) => statusMap[l]?.status === "delayed" || statusMap[l]?.status === "suspended"
    );

    let description = route.description;
    if (delayedLines.length > 0) {
      const delayedStr = delayedLines.join(", ");
      description += ` The ${delayedStr} ${delayedLines.length === 1 ? "is" : "are"} showing delays right now. Leave extra time.`;
    } else if (mta.error) {
      description += " MTA status is unavailable right now. Check the app before leaving.";
    } else {
      description += " All relevant lines are running well.";
    }

    setResult({
      description,
      fromLines: fromData.lines,
      toLines: toData.lines,
      delayedLines,
      directLine: route.directLine,
      transferHub: route.transferHub,
    });

    onHighlight(allInvolvedLines);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-end flex-wrap sm:flex-nowrap">
        <NeighborhoodInput label="From" value={from} onChange={setFrom} />
        <NeighborhoodInput label="To" value={to} onChange={setTo} />
        <button
          onClick={handleSubmit}
          className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm text-white/80 hover:text-white transition-all whitespace-nowrap cursor-pointer"
        >
          Plan trip
        </button>
      </div>

      {result && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
          <p className="text-sm text-white/80 leading-relaxed">{result.description}</p>
          {(result.fromLines.length > 0 || result.toLines.length > 0) && (
            <div className="flex gap-4 flex-wrap text-xs text-white/40">
              {result.fromLines.length > 0 && (
                <span className="flex items-center gap-1">
                  From:
                  <span className="flex gap-1 ml-1">
                    {result.fromLines.slice(0, 5).map((l) => (
                      <LinePill key={l} line={l} status={statusMap[l]} />
                    ))}
                  </span>
                </span>
              )}
              {result.toLines.length > 0 && (
                <span className="flex items-center gap-1">
                  To:
                  <span className="flex gap-1 ml-1">
                    {result.toLines.slice(0, 5).map((l) => (
                      <LinePill key={l} line={l} status={statusMap[l]} />
                    ))}
                  </span>
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
