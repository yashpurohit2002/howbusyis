"use client";

import { useState, useRef } from "react";
import { MtaSignalResult, LineStatusEntry } from "@/app/lib/types";
import { NEIGHBORHOOD_LINES, findRoute, LINE_COLORS } from "@/app/lib/nyc-data";

interface Props {
  mta: MtaSignalResult;
  onHighlight: (lines: string[]) => void;
}

// Haversine distance in meters (client-side, no import needed)
function distM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestNeighborhood(lat: number, lon: number): { name: string; dist: number } | null {
  let best: { name: string; dist: number } | null = null;
  for (const [name, data] of Object.entries(NEIGHBORHOOD_LINES)) {
    const d = distM(lat, lon, data.lat, data.lon);
    if (!best || d < best.dist) best = { name, dist: d };
  }
  return best;
}

function fmtDist(meters: number): string {
  const ft = Math.round(meters * 3.28084);
  return ft < 1000 ? `${ft} ft` : `${(ft / 5280).toFixed(1)} mi`;
}

function mapsUrl(from: string, to: string): string {
  const base = "https://www.google.com/maps/dir/";
  return `${base}${encodeURIComponent(from)}/${encodeURIComponent(to)}/?travelmode=transit`;
}

function LinePill({ line, status }: { line: string; status?: LineStatusEntry }) {
  const color = LINE_COLORS[line] ?? "#808183";
  const isDark = ["N", "Q", "R", "W"].includes(line);
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

interface PlaceInput {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}

function PlaceInput({ label, value, onChange, placeholder }: PlaceInput) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex-1 min-w-0">
      <label className="text-xs text-white/40 block mb-1">{label}</label>
      <input
        ref={ref}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 focus:bg-white/8"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") ref.current?.blur();
        }}
      />
    </div>
  );
}

interface RouteResult {
  fromDisplay: string;
  toDisplay: string;
  fromNeighborhood: string;
  toNeighborhood: string;
  fromDist: number;
  toDist: number;
  fromLines: string[];
  toLines: string[];
  delayedLines: string[];
  steps: string[];
  directLine?: string;
  transferHub?: string;
  walkable: boolean;
  totalDistM: number;
}

export function TripPlanner({ mta, onHighlight }: Props) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RouteResult | null>(null);

  const statusMap = Object.fromEntries(
    (mta.lineStatuses ?? []).map((e) => [e.line, e])
  );

  const handlePlan = async () => {
    if (!from.trim() || !to.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    onHighlight([]);

    try {
      const [fromRes, toRes] = await Promise.all([
        fetch(`/api/geocode?q=${encodeURIComponent(from)}`),
        fetch(`/api/geocode?q=${encodeURIComponent(to)}`),
      ]);

      if (!fromRes.ok) {
        const j = await fromRes.json();
        setError(j.error ?? `Could not find "${from}"`);
        return;
      }
      if (!toRes.ok) {
        const j = await toRes.json();
        setError(j.error ?? `Could not find "${to}"`);
        return;
      }

      const fromGeo = await fromRes.json();
      const toGeo = await toRes.json();

      const fromNearest = nearestNeighborhood(fromGeo.lat, fromGeo.lon);
      const toNearest = nearestNeighborhood(toGeo.lat, toGeo.lon);

      if (!fromNearest || !toNearest) {
        setError("Could not match locations to NYC neighborhoods.");
        return;
      }

      const fromData = NEIGHBORHOOD_LINES[fromNearest.name];
      const toData = NEIGHBORHOOD_LINES[toNearest.name];

      const totalDistM = distM(fromGeo.lat, fromGeo.lon, toGeo.lat, toGeo.lon);
      const walkable = totalDistM < 800; // under ~10 min walk

      const allInvolvedLines = Array.from(new Set([...fromData.lines, ...toData.lines]));
      const delayedLines = allInvolvedLines.filter(
        (l) => statusMap[l]?.status === "delayed" || statusMap[l]?.status === "suspended"
      );

      const route = findRoute(fromData.lines, toData.lines, fromNearest.name, toNearest.name);

      // Build step-by-step steps
      const steps: string[] = [];

      if (walkable) {
        steps.push(`Walk ${fmtDist(totalDistM)} directly — it's close enough.`);
      } else {
        if (fromNearest.dist > 150) {
          steps.push(`Walk ${fmtDist(fromNearest.dist)} to the nearest ${fromNearest.name.replace(/\b\w/g, c => c.toUpperCase())} subway entrance.`);
        }

        if (route.directLine) {
          steps.push(`Take the ${route.directLine} train.`);
        } else if (route.transferHub) {
          const fromMatch = fromData.lines.find(l =>
            NEIGHBORHOOD_LINES[toNearest.name]?.lines.includes(l) === false
          ) ?? fromData.lines[0];
          steps.push(`Take the ${fromMatch} train to ${route.transferHub}.`);
          steps.push(`Transfer and continue to ${toNearest.name.replace(/\b\w/g, c => c.toUpperCase())}.`);
        } else {
          steps.push(route.description);
        }

        if (toNearest.dist > 150) {
          steps.push(`Walk ${fmtDist(toNearest.dist)} to your destination.`);
        }

        if (delayedLines.length > 0) {
          const dl = delayedLines.join(", ");
          steps.push(`${dl} ${delayedLines.length === 1 ? "is" : "are"} showing delays right now. Leave extra time or check your route.`);
        }
      }

      // Shorten display names
      const shorten = (s: string) => s.split(",")[0].trim();

      setResult({
        fromDisplay: shorten(fromGeo.displayName),
        toDisplay: shorten(toGeo.displayName),
        fromNeighborhood: fromNearest.name,
        toNeighborhood: toNearest.name,
        fromDist: fromNearest.dist,
        toDist: toNearest.dist,
        fromLines: fromData.lines,
        toLines: toData.lines,
        delayedLines,
        steps,
        directLine: route.directLine,
        transferHub: route.transferHub,
        walkable,
        totalDistM,
      });

      onHighlight(allInvolvedLines);
    } catch {
      setError("Geocoding unavailable. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-end flex-wrap sm:flex-nowrap">
        <PlaceInput
          label="From"
          value={from}
          onChange={setFrom}
          placeholder="Home, restaurant, address..."
        />
        <PlaceInput
          label="To"
          value={to}
          onChange={setTo}
          placeholder="Bar, museum, friend's place..."
        />
        <button
          onClick={handlePlan}
          disabled={loading || !from.trim() || !to.trim()}
          className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm text-white/80 hover:text-white transition-all whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Looking..." : "Plan trip"}
        </button>
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-800/40 rounded-xl px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
          {/* From / To */}
          <div className="text-xs text-white/30 space-y-0.5">
            <p><span className="text-white/50">From:</span> {result.fromDisplay}</p>
            <p><span className="text-white/50">To:</span> {result.toDisplay}</p>
          </div>

          {/* Steps */}
          <ol className="space-y-2">
            {result.steps.map((step, i) => {
              const isDelay = step.includes("delay") || step.includes("Transfer");
              return (
                <li key={i} className="flex gap-2.5 items-start">
                  <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    isDelay ? "bg-yellow-900 text-yellow-400" : "bg-white/10 text-white/50"
                  }`}>
                    {i + 1}
                  </span>
                  <p className={`text-sm leading-relaxed ${isDelay ? "text-yellow-400" : "text-white/75"}`}>
                    {step}
                  </p>
                </li>
              );
            })}
          </ol>

          {/* Live line status */}
          {!result.walkable && (result.fromLines.length > 0 || result.toLines.length > 0) && (
            <div className="flex gap-4 flex-wrap text-xs text-white/40 pt-1 border-t border-white/5">
              {result.fromLines.length > 0 && (
                <span className="flex items-center gap-1">
                  Near origin:
                  <span className="flex gap-1 ml-1">
                    {result.fromLines.slice(0, 6).map((l) => (
                      <LinePill key={l} line={l} status={statusMap[l]} />
                    ))}
                  </span>
                </span>
              )}
              {result.toLines.length > 0 && (
                <span className="flex items-center gap-1">
                  Near dest:
                  <span className="flex gap-1 ml-1">
                    {result.toLines.slice(0, 6).map((l) => (
                      <LinePill key={l} line={l} status={statusMap[l]} />
                    ))}
                  </span>
                </span>
              )}
            </div>
          )}

          {/* Google Maps fallback */}
          <a
            href={mapsUrl(from, to)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Full directions in Google Maps
          </a>
        </div>
      )}
    </div>
  );
}
