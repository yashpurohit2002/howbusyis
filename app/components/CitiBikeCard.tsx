"use client";

import { useState, useMemo } from "react";
import { CitiBikeSignalResult } from "@/app/lib/types";
import { CitiBikeSearchResponse } from "@/app/api/citibike/route";
import { ALL_NEIGHBORHOODS } from "@/app/lib/nyc-data";

interface Props {
  citibike: CitiBikeSignalResult;
  textClass: string;
}

function pct2color(pct: number) {
  if (pct < 20) return "text-red-400";
  if (pct < 40) return "text-yellow-400";
  return "text-emerald-400";
}
function pct2bar(pct: number) {
  if (pct < 20) return "bg-red-400";
  if (pct < 40) return "bg-yellow-400";
  return "bg-emerald-400";
}

function Bar({ pct }: { pct: number }) {
  return (
    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${pct2bar(pct)}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function SearchResults({ result }: { result: CitiBikeSearchResponse }) {
  return (
    <div className="space-y-3 pt-1">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/40 capitalize">{result.neighborhood}, within {result.radiusFt} ft</p>
        <span className={`text-sm font-bold ${pct2color(result.overallPct)}`}>
          {result.overallPct}% available
        </span>
      </div>
      <div className="flex gap-4 text-xs text-white/50">
        <span>{result.totalBikes} bikes</span>
        {result.totalEbikes > 0 && <span>{result.totalEbikes} e-bikes</span>}
        <span>{result.totalDocks} open docks</span>
        <span>{result.totalStations} stations</span>
      </div>
      <Bar pct={result.overallPct} />

      {/* Per-station list */}
      {result.stations.length === 0 ? (
        <p className="text-xs text-white/30 italic">No Citi Bike stations within {result.radiusFt} ft. Try a nearby neighborhood.</p>
      ) : (
        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
          {result.stations.map((s) => (
            <div key={s.name} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/70 truncate">{s.name}</p>
                <p className="text-[10px] text-white/30">{s.distMeters} ft away</p>
              </div>
              <div className="text-right shrink-0">
                <span className={`text-xs font-semibold tabular-nums ${pct2color(s.availabilityPct)}`}>
                  {s.bikes} bike{s.bikes !== 1 ? "s" : ""}
                </span>
                <p className="text-[10px] text-white/25">{s.docks} docks free</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CitiBikeCard({ citibike, textClass }: Props) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<CitiBikeSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const suggestions = useMemo(
    () =>
      query.length > 0
        ? ALL_NEIGHBORHOODS.filter((n) => n.includes(query.toLowerCase())).slice(0, 5)
        : [],
    [query]
  );

  const searchByCoords = async (lat: number, lon: number) => {
    setGeoLoading(false);
    setLoading(true);
    setError(null);
    setResult(null);
    setShowSuggestions(false);
    try {
      const res = await fetch(`/api/citibike?lat=${lat}&lon=${lon}`);
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Something went wrong");
      else setResult(data);
    } catch {
      setError("Couldn't reach the Citi Bike feed");
    } finally {
      setLoading(false);
    }
  };

  const searchNearMe = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported on this device");
      return;
    }
    setGeoLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => searchByCoords(pos.coords.latitude, pos.coords.longitude),
      () => { setGeoLoading(false); setError("Location access denied"); },
      { timeout: 8000 }
    );
  };

  const search = async (neighborhood: string) => {
    if (!neighborhood.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setShowSuggestions(false);
    try {
      const res = await fetch(`/api/citibike?q=${encodeURIComponent(neighborhood)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
      } else {
        setResult(data);
      }
    } catch {
      setError("Couldn't reach the Citi Bike feed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 col-span-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white/60">🚲 Citi Bike</span>
        <span className={`text-xs font-bold ${citibike.error ? "text-white/30" : textClass}`}>
          {citibike.availabilityPct}% bikes available citywide
        </span>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="flex gap-2">
          <input
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/25"
            placeholder="Search neighborhood..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={(e) => e.key === "Enter" && search(query)}
          />
          <button
            onClick={searchNearMe}
            disabled={loading || geoLoading}
            title="Find bikes near my location"
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-sm text-white/70 hover:text-white transition-all cursor-pointer disabled:opacity-40"
          >
            {geoLoading ? "..." : "📍"}
          </button>
          <button
            onClick={() => search(query)}
            disabled={loading || geoLoading}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-sm text-white/70 hover:text-white transition-all cursor-pointer disabled:opacity-40"
          >
            {loading ? "..." : "Go"}
          </button>
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-10 top-full mt-1 left-0 right-0 bg-gray-900 border border-white/10 rounded-xl overflow-hidden shadow-xl">
            {suggestions.map((s) => (
              <li key={s}>
                <button
                  className="w-full text-left px-3 py-2 text-sm text-white/60 hover:bg-white/10 hover:text-white capitalize"
                  onMouseDown={() => { setQuery(s); search(s); }}
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Error */}
      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* Results */}
      {result && <SearchResults result={result} />}

      {/* Regional overview (shown when no search active) */}
      {!result && !loading && citibike.regions.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <p className="text-xs text-white/30">By area</p>
          {citibike.regions.map((r) => (
            <div key={r.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <button
                  className="text-white/50 hover:text-white/80 transition-colors text-left cursor-pointer"
                  onClick={() => { setQuery(r.name.toLowerCase()); search(r.name.toLowerCase()); }}
                >
                  {r.name}
                </button>
                <span className={`font-medium tabular-nums ${pct2color(r.availabilityPct)}`}>
                  {r.availabilityPct}%
                  <span className="text-white/25 font-normal ml-1">({r.bikes} bikes)</span>
                </span>
              </div>
              <Bar pct={r.availabilityPct} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
