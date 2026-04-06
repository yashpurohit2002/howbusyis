"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { BusyResponse, getVerdict } from "@/app/lib/types";
import { computeGoOutVerdict } from "@/app/lib/verdict";
import { ScoreBar } from "./ScoreBar";
import { ShareButton } from "./ShareButton";
import { MtaGrid } from "./MtaGrid";
import { TripPlanner } from "./TripPlanner";
import { WeatherCard } from "./WeatherCard";
import { EventFeed } from "./EventFeed";
import { BoroughMap } from "./BoroughMap";
import { CitiBikeCard } from "./CitiBikeCard";
import { StreetCard } from "./StreetCard";
import { GoOutMode } from "./GoOutMode";
import { HistoricalContext } from "./HistoricalContext";
import { SignalCard } from "./SignalCard";
import { NightlifeSection } from "./NightlifeSection";

const REFRESH_MS = 5 * 60 * 1000;

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    hour12: true,
  });
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-white/30 uppercase tracking-widest font-medium">{children}</p>
  );
}

function useOddsOnLine(data: BusyResponse | null): string | null {
  if (!data) return null;
  const delays = data.signals.mta.delayedLines?.length ?? 0;
  if (delays >= 5) return `Odds the MTA recovers before 8pm?`;
  const nextHours = data.signals.weather.hourly.slice(0, 3);
  const maxRain = Math.max(0, ...nextHours.map((h) => h.pop));
  if (maxRain >= 0.3) return `Call it: will it actually rain today?`;
  if (data.score > 80) return `Think NYC stays this chaotic all night?`;
  if (data.score < 25) return `Rare quiet day. How long does it last?`;
  return null;
}

export function BusyDashboard() {
  const [data, setData] = useState<BusyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [goOutMode, setGoOutMode] = useState(false);
  const [highlightLines, setHighlightLines] = useState<string[]>([]);
  const [scoreClicked, setScoreClicked] = useState(false);
  const prevScoreRef = useRef<number | null>(null);

  // Seed trend from localStorage so it shows on first load
  useEffect(() => {
    const saved = localStorage.getItem("hbi_lastScore");
    if (saved) prevScoreRef.current = parseInt(saved, 10);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/busy?city=nyc", {
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) throw new Error("fetch failed");
      const json: BusyResponse = await res.json();
      setData((prev) => {
        prevScoreRef.current = prev?.score ?? prevScoreRef.current;
        return json;
      });
      localStorage.setItem("hbi_lastScore", String(json.score));
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white/40 text-xl animate-pulse">Checking the vibe...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-white text-2xl font-bold">Something broke.</div>
          <div className="text-white/50">NYC is probably fine. Probably.</div>
          <button
            onClick={fetchData}
            className="px-4 py-2 rounded-lg bg-white/10 text-white/70 text-sm hover:bg-white/20 transition cursor-pointer"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const verdict = getVerdict(data.score);
  const goOutVerdict = computeGoOutVerdict(data);
  const oddsOnLine = useOddsOnLine(data);

  const handleScoreClick = () => {
    setScoreClicked(true);
    setTimeout(() => setScoreClicked(false), 4000);
  };

  const scoreDelta = prevScoreRef.current !== null ? data.score - prevScoreRef.current : 0;
  const trendIcon = scoreDelta >= 5 ? "↑" : scoreDelta <= -5 ? "↓" : null;
  const trendColor = scoreDelta >= 5 ? "text-red-400" : "text-emerald-400";

  return (
    <div
      className={`min-h-screen bg-gradient-to-b ${verdict.bg} transition-colors duration-700`}
    >
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <p className="text-white/40 text-sm tracking-widest uppercase">New York City, right now</p>
        </div>

        {/* ── Score ── */}
        <div className="text-center space-y-3">
          <div>
            <h1 className={`text-7xl sm:text-8xl font-black tracking-tight ${verdict.text} leading-none`}>
              {data.label}
            </h1>
            <p className="text-white/60 text-xl mt-2">{data.subtitle}</p>
            {oddsOnLine && (
              <p className="text-xs text-white/30 mt-1">
                {oddsOnLine}{" "}
                <a href="https://oddson.app" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white/50 transition-colors">
                  oddson.app
                </a>
              </p>
            )}
          </div>
          <div className="flex items-end justify-center gap-2">
            <span
              className="text-7xl font-black text-white tabular-nums leading-none cursor-default select-none"
              onClick={handleScoreClick}
            >
              {data.score}
            </span>
            <div className="flex flex-col items-start mb-2 gap-0.5">
              <span className="text-white/30 text-2xl">/100</span>
              {trendIcon && (
                <span className={`text-sm font-bold ${trendColor}`} title={`${scoreDelta > 0 ? "+" : ""}${scoreDelta} from last check`}>
                  {trendIcon} {Math.abs(scoreDelta)}
                </span>
              )}
            </div>
          </div>
          {scoreClicked && (
            <p className="text-xs text-white/30 animate-pulse">
              Think you can predict tomorrow&apos;s score?{" "}
              <a href="https://oddson.app" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white/50 transition-colors">
                oddson.app
              </a>
            </p>
          )}
          <div className="flex justify-center">
            <ScoreBar score={data.score} barClass={verdict.bar} />
          </div>
          <HistoricalContext percentile={data.historicalPercentile} score={data.score} historicalScores={data.historicalScores} />
        </div>

        {/* ── Should I go out — always visible, tap to expand ── */}
        <div className="space-y-0">
          <button
            onClick={() => setGoOutMode((v) => !v)}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all cursor-pointer ${
              goOutVerdict.mood === "positive"
                ? "border-emerald-800/50 bg-emerald-950/40 hover:bg-emerald-950/60"
                : goOutVerdict.mood === "cautious"
                ? "border-yellow-800/50 bg-yellow-950/40 hover:bg-yellow-950/60"
                : "border-red-800/50 bg-red-950/40 hover:bg-red-950/60"
            }`}
          >
            <span className="text-sm text-white/50">Should I go out?</span>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${goOutVerdict.color}`}>{goOutVerdict.verdict}</span>
              <span className="text-white/25 text-xs">{goOutMode ? "▲" : "▼"}</span>
            </div>
          </button>
          {goOutMode && (
            <div className="pt-2">
              <GoOutMode verdict={goOutVerdict} />
            </div>
          )}
        </div>

        {/* ── MTA ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionLabel>Subway status</SectionLabel>
            <span className={`text-xs font-semibold ${data.signals.mta.error ? "text-white/30" : verdict.text}`}>
              {data.signals.mta.detail}
            </span>
          </div>
          <MtaGrid mta={data.signals.mta} highlightLines={highlightLines} />
          <div className="pt-1">
            <p className="text-xs text-white/30 mb-3">Trip planner</p>
            <TripPlanner mta={data.signals.mta} onHighlight={setHighlightLines} />
          </div>
        </section>

        <div className="border-t border-white/5" />

        {/* ── Weather ── */}
        <section className="space-y-3">
          <SectionLabel>Weather</SectionLabel>
          <WeatherCard weather={data.signals.weather} textClass={verdict.text} />
        </section>

        <div className="border-t border-white/5" />

        {/* ── Events ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionLabel>What&apos;s happening</SectionLabel>
            <span className={`text-xs font-semibold ${verdict.text}`}>
              {data.signals.events.detail}
            </span>
          </div>
          <div className="space-y-3">
            <EventFeed events={data.signals.events.events} textClass={verdict.text} />
            <BoroughMap byBorough={data.signals.events.byBorough} textClass={verdict.text} />
          </div>
        </section>

        <div className="border-t border-white/5" />

        {/* ── Extra signals ── */}
        <section className="space-y-3">
          <SectionLabel>More signals</SectionLabel>
          <div className="space-y-3">
            <CitiBikeCard citibike={data.signals.citibike} textClass={verdict.text} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StreetCard dsny={data.signals.dsny} textClass={verdict.text} />
              <SignalCard signal={data.signals.noise} textClass={verdict.text} />
              <SignalCard signal={data.signals.timeOfDay} textClass={verdict.text} />
            </div>
          </div>
        </section>

        <div className="border-t border-white/5" />

        {/* ── Nightlife ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionLabel>Where to go tonight</SectionLabel>
            <span className={`text-xs font-semibold ${verdict.text}`}>
              {data.signals.nightlife.topPick}
            </span>
          </div>
          <NightlifeSection nightlife={data.signals.nightlife} textClass={verdict.text} />
        </section>

        {/* ── Share ── */}
        <div className="flex justify-center pt-2">
          <ShareButton score={data.score} label={data.label} data={data} />
        </div>

        {/* ── Footer ── */}
        <footer className="text-center text-white/25 text-xs space-y-2 pb-4">
          <p>Updated at {formatTime(data.lastUpdated)} EST &middot; refreshes every 5 min</p>
          <p>
            Built by{" "}
            <a
              href="https://www.yashpurohit.me"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/50 underline underline-offset-2 transition-colors"
            >
              Yash Purohit
            </a>
            {" "}&middot; Making predictions more fun at{" "}
            <a
              href="https://oddson.app"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/50 underline underline-offset-2 transition-colors"
            >
              oddson.app
            </a>
          </p>
          <div className="flex items-center justify-center gap-4 pt-1">
            <a
              href="https://www.yashpurohit.me"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/50 transition-colors"
              title="Website"
            >
              yashpurohit.me
            </a>
            <span className="opacity-30">&middot;</span>
            <a
              href="https://twitter.com/yash__purohit"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/50 transition-colors"
              title="Twitter / X"
            >
              @yash__purohit
            </a>
            <span className="opacity-30">&middot;</span>
            <a
              href="https://instagram.com/yash_purohit_"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/50 transition-colors"
              title="Instagram"
            >
              @yash_purohit_
            </a>
            <span className="opacity-30">&middot;</span>
            <a
              href="https://linkedin.com/in/yashpurohit"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/50 transition-colors"
              title="LinkedIn"
            >
              LinkedIn
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
