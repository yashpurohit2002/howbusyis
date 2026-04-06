"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MtaSignalResult, LineStatusEntry } from "@/app/lib/types";
import { NEIGHBORHOOD_LINES, findRoute, LINE_COLORS } from "@/app/lib/nyc-data";
import {
  SUBWAY_STATIONS,
  nearestStation,
  getGtfsDir,
  getDirectionLabel,
  getPlatformForLine,
  stationDistM,
} from "@/app/lib/nyc-stations";

interface Props {
  mta: MtaSignalResult;
  onHighlight: (lines: string[]) => void;
}

function distM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDist(meters: number): string {
  const mi = meters / 1609.34;
  return mi < 0.1 ? `${Math.round(meters)} ft` : `${mi.toFixed(1)} mi`;
}

function walkMin(meters: number): number {
  return Math.round(meters / 80); // ~80m per min walking
}

function mapsUrl(from: string, to: string): string {
  return `https://www.google.com/maps/dir/${encodeURIComponent(from)}/${encodeURIComponent(to)}/?travelmode=transit`;
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

// ── Autocomplete input ────────────────────────────────────────────────────────

interface Suggestion { displayName: string; lat: number; lon: number }

function shortName(displayName: string): string {
  return displayName.split(",").slice(0, 2).join(",").trim();
}

interface PlaceInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}

function PlaceInput({ label, value, onChange, placeholder }: PlaceInputProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setSuggestions([]); setOpen(false); return; }
    try {
      const res = await fetch(`/api/geocode?suggest=1&q=${encodeURIComponent(q)}`);
      if (!res.ok) { setSuggestions([]); return; }
      const data: Suggestion[] = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
      setOpen(Array.isArray(data) && data.length > 0);
      setActiveIdx(-1);
    } catch { setSuggestions([]); }
  }, []);

  const handleChange = (v: string) => {
    onChange(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 300);
  };

  const select = (s: Suggestion) => {
    onChange(shortName(s.displayName));
    setSuggestions([]);
    setOpen(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="flex-1 min-w-0 relative" ref={containerRef}>
      <label className="text-xs text-white/40 block mb-1">{label}</label>
      <input
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 focus:bg-white/8"
        placeholder={placeholder}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
          else if (e.key === "Enter" && activeIdx >= 0) { e.preventDefault(); select(suggestions[activeIdx]); }
          else if (e.key === "Escape") setOpen(false);
        }}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 top-full mt-1 w-full bg-zinc-900 border border-white/10 rounded-xl shadow-xl overflow-hidden">
          {suggestions.map((s, i) => (
            <li
              key={i}
              className={`px-3 py-2.5 text-sm cursor-pointer transition-colors ${i === activeIdx ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/8 hover:text-white"}`}
              onMouseDown={(e) => { e.preventDefault(); select(s); }}
            >
              {shortName(s.displayName)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Arrivals badge ─────────────────────────────────────────────────────────────

function ArrivalsBadge({ gtfsId, feed, dir }: { gtfsId: string; feed: string; dir: "N" | "S" }) {
  const [arrivals, setArrivals] = useState<number[] | null>(null);

  useEffect(() => {
    fetch(`/api/arrivals?gtfsId=${gtfsId}&feed=${encodeURIComponent(feed)}&dir=${dir}`)
      .then((r) => r.json())
      .then((d) => setArrivals(d.arrivals ?? null))
      .catch(() => setArrivals(null));
  }, [gtfsId, feed, dir]);

  if (!arrivals) return null;
  if (arrivals.length === 0) return <span className="text-white/30 text-xs">No arrivals data</span>;

  return (
    <span className="text-white/50 text-xs">
      Next: {arrivals.map((m, i) => (
        <span key={i}>
          <span className={m <= 2 ? "text-emerald-400 font-semibold" : "text-white/70"}>
            {m === 0 ? "now" : `${m} min`}
          </span>
          {i < arrivals.length - 1 && <span className="text-white/30"> · </span>}
        </span>
      ))}
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface GeoResult { lat: number; lon: number; displayName: string }

interface RouteResult {
  fromDisplay: string;
  toDisplay: string;
  walkable: boolean;
  totalDistM: number;
  steps: StepInfo[];
  allLines: string[];
  delayedLines: string[];
  totalEstMin: number;
}

interface StepInfo {
  type: "walk" | "train" | "transfer" | "delay";
  text: string;
  distM?: number;
  line?: string;
  direction?: string;
  dirCode?: "N" | "S";
  stationName?: string;
  gtfsId?: string;
  feed?: string;
}

export function TripPlanner({ mta, onHighlight }: Props) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RouteResult | null>(null);

  const statusMap = Object.fromEntries((mta.lineStatuses ?? []).map((e) => [e.line, e]));

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

      if (!fromRes.ok) { setError((await fromRes.json()).error ?? `Could not find "${from}"`); return; }
      if (!toRes.ok)   { setError((await toRes.json()).error ?? `Could not find "${to}"`);   return; }

      const fromGeo: GeoResult = await fromRes.json();
      const toGeo: GeoResult = await toRes.json();

      const totalDistM = distM(fromGeo.lat, fromGeo.lon, toGeo.lat, toGeo.lon);
      const walkable = totalDistM < 800;

      const steps: StepInfo[] = [];

      if (walkable) {
        const wm = walkMin(totalDistM);
        steps.push({
          type: "walk",
          text: `Walk ${fmtDist(totalDistM)} (≈${wm} min) — close enough to skip the subway.`,
          distM: totalDistM,
        });
        setResult({
          fromDisplay: shortName(fromGeo.displayName),
          toDisplay: shortName(toGeo.displayName),
          walkable: true,
          totalDistM,
          steps,
          allLines: [],
          delayedLines: [],
          totalEstMin: wm,
        });
        return;
      }

      // Find nearest neighborhoods for line lookup
      let fromNeighborhood: { name: string; dist: number } | null = null;
      let toNeighborhood: { name: string; dist: number } | null = null;

      for (const [name, data] of Object.entries(NEIGHBORHOOD_LINES)) {
        const d = distM(fromGeo.lat, fromGeo.lon, data.lat, data.lon);
        if (!fromNeighborhood || d < fromNeighborhood.dist) fromNeighborhood = { name, dist: d };
        const d2 = distM(toGeo.lat, toGeo.lon, data.lat, data.lon);
        if (!toNeighborhood || d2 < toNeighborhood.dist) toNeighborhood = { name, dist: d2 };
      }

      if (!fromNeighborhood || !toNeighborhood) {
        setError("Could not match locations to NYC neighborhoods.");
        return;
      }

      const fromData = NEIGHBORHOOD_LINES[fromNeighborhood.name];
      const toData = NEIGHBORHOOD_LINES[toNeighborhood.name];
      const route = findRoute(fromData.lines, toData.lines, fromNeighborhood.name, toNeighborhood.name);

      const allLines = Array.from(new Set([...fromData.lines, ...toData.lines]));
      const delayedLines = allLines.filter(
        (l) => statusMap[l]?.status === "delayed" || statusMap[l]?.status === "suspended"
      );

      // Determine which line to take
      const primaryLine = route.directLine ?? fromData.lines[0];

      // Find nearest STATION (not just neighborhood) to origin
      const fromStation = nearestStation(fromGeo.lat, fromGeo.lon, fromData.lines);
      const toStation = nearestStation(toGeo.lat, toGeo.lon, toData.lines);

      const dir = getGtfsDir(primaryLine, fromGeo.lat, fromGeo.lon, toGeo.lat, toGeo.lon);
      const dirLabel = getDirectionLabel(primaryLine, dir);

      // ── Build steps ──────────────────────────────────────────────────────

      let totalEst = 0;

      // Step 1: Walk to station
      const walkToStation = fromStation
        ? stationDistM(fromGeo.lat, fromGeo.lon, fromStation.station.lat, fromStation.station.lon)
        : fromNeighborhood.dist;
      const walkToMin = walkMin(walkToStation);
      const stationName = fromStation?.station.name ?? `nearest ${fromNeighborhood.name} station`;

      if (walkToStation > 80) {
        steps.push({
          type: "walk",
          text: `Walk ${fmtDist(walkToStation)} (≈${walkToMin} min) to ${stationName}`,
          distM: walkToStation,
          stationName,
        });
        totalEst += walkToMin;
      }

      // Step 2: Wait + train
      const subwayDistM = distM(fromGeo.lat, fromGeo.lon, toGeo.lat, toGeo.lon);
      // Avg subway speed ~27 kph with stops, factor 1.4 for routing
      const subwayMin = Math.max(3, Math.round((subwayDistM / 1000 / 27) * 60 * 1.4));
      const waitMin = 5; // avg wait
      totalEst += waitMin + subwayMin;

      // Get platform info for arrivals
      const platform = fromStation
        ? getPlatformForLine(fromStation.station, primaryLine)
        : null;

      if (route.directLine) {
        steps.push({
          type: "train",
          text: `Take the ${route.directLine} train ${dirLabel}`,
          line: route.directLine,
          direction: dirLabel,
          dirCode: dir,
          stationName: fromStation?.station.name,
          gtfsId: platform?.gtfsId,
          feed: platform?.feed,
        });
      } else if (route.transferHub) {
        // Two-leg trip
        const leg1Line = fromData.lines.find((l) => !toData.lines.includes(l)) ?? fromData.lines[0];
        const leg1Dir = getGtfsDir(leg1Line, fromGeo.lat, fromGeo.lon, toGeo.lat, toGeo.lon);
        const leg1Platform = fromStation ? getPlatformForLine(fromStation.station, leg1Line) : null;
        steps.push({
          type: "train",
          text: `Take the ${leg1Line} train ${getDirectionLabel(leg1Line, leg1Dir)} to ${route.transferHub}`,
          line: leg1Line,
          direction: getDirectionLabel(leg1Line, leg1Dir),
          dirCode: leg1Dir,
          stationName: fromStation?.station.name,
          gtfsId: leg1Platform?.gtfsId,
          feed: leg1Platform?.feed,
        });
        const leg2Line = toData.lines.find((l) => !fromData.lines.includes(l)) ?? toData.lines[0];
        const leg2Dir = getGtfsDir(leg2Line, fromGeo.lat, fromGeo.lon, toGeo.lat, toGeo.lon);
        steps.push({
          type: "transfer",
          text: `Transfer to the ${leg2Line} train ${getDirectionLabel(leg2Line, leg2Dir)} towards ${fromNeighborhood.name !== toNeighborhood.name ? toNeighborhood.name : "your destination"}`,
          line: leg2Line,
          direction: getDirectionLabel(leg2Line, leg2Dir),
          dirCode: leg2Dir,
        });
      } else {
        steps.push({
          type: "train",
          text: `Take ${fromData.lines.slice(0, 2).join(" or ")} towards ${toNeighborhood.name}`,
          line: fromData.lines[0],
          direction: dirLabel,
          dirCode: dir,
          stationName: fromStation?.station.name,
          gtfsId: platform?.gtfsId,
          feed: platform?.feed,
        });
      }

      // Step 3: Walk to destination
      const walkFromStation = toStation
        ? stationDistM(toGeo.lat, toGeo.lon, toStation.station.lat, toStation.station.lon)
        : toNeighborhood.dist;
      const walkFromMin = walkMin(walkFromStation);

      if (walkFromStation > 80) {
        steps.push({
          type: "walk",
          text: `Walk ${fmtDist(walkFromStation)} (≈${walkFromMin} min) to your destination`,
          distM: walkFromStation,
        });
        totalEst += walkFromMin;
      }

      // Delay warning
      if (delayedLines.length > 0) {
        steps.push({
          type: "delay",
          text: `${delayedLines.join(", ")} ${delayedLines.length === 1 ? "is" : "are"} showing delays — leave extra time or check your route.`,
        });
        totalEst += 10;
      }

      onHighlight(allLines);
      setResult({
        fromDisplay: shortName(fromGeo.displayName),
        toDisplay: shortName(toGeo.displayName),
        walkable: false,
        totalDistM,
        steps,
        allLines,
        delayedLines,
        totalEstMin: totalEst,
      });
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-end flex-wrap sm:flex-nowrap">
        <PlaceInput label="From" value={from} onChange={setFrom} placeholder="Address, restaurant, landmark..." />
        <PlaceInput label="To" value={to} onChange={setTo} placeholder="Bar, museum, friend's place..." />
        <button
          onClick={handlePlan}
          disabled={loading || !from.trim() || !to.trim()}
          className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm text-white/80 hover:text-white transition-all whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Routing..." : "Plan trip"}
        </button>
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-800/40 rounded-xl px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-4">
          {/* From / To */}
          <div className="text-xs text-white/30 space-y-0.5">
            <p><span className="text-white/50">From:</span> {result.fromDisplay}</p>
            <p><span className="text-white/50">To:</span> {result.toDisplay}</p>
          </div>

          {/* Steps */}
          <ol className="space-y-4">
            {result.steps.map((step, i) => {
              const isDelay = step.type === "delay";
              const isTrain = step.type === "train";
              const isTransfer = step.type === "transfer";
              const isWalk = step.type === "walk";
              const lineColor = step.line ? (LINE_COLORS[step.line] ?? "#808183") : null;

              return (
                <li key={i} className="flex gap-3 items-start">
                  {/* Icon / step number */}
                  <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    isDelay ? "bg-yellow-900 text-yellow-400" :
                    isTrain || isTransfer ? "text-black" :
                    "bg-white/10 text-white/50"
                  }`}
                    style={isTrain || isTransfer ? { backgroundColor: lineColor ?? "#808183" } : {}}
                  >
                    {isTrain || isTransfer ? step.line : i + 1}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <p className={`text-sm leading-relaxed ${
                      isDelay ? "text-yellow-400" :
                      isWalk ? "text-white/60" :
                      "text-white/85"
                    }`}>
                      {step.text}
                    </p>

                    {/* Live arrivals for train steps */}
                    {(isTrain || isTransfer) && step.gtfsId && step.feed && step.dirCode && (
                      <ArrivalsBadge gtfsId={step.gtfsId} feed={step.feed} dir={step.dirCode} />
                    )}

                    {/* Status badge for delayed lines */}
                    {(isTrain || isTransfer) && step.line && statusMap[step.line]?.status === "delayed" && (
                      <span className="text-xs text-yellow-400">⚠ Delays reported on this line</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          {/* Estimated time */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <span className="text-xs text-white/40">
              Est. trip: <span className="text-white/70 font-medium">≈{result.totalEstMin} min</span>
            </span>
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
              Full directions in Maps
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
