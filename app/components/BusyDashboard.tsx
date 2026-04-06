"use client";

import { useEffect, useState, useCallback } from "react";
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

export function BusyDashboard() {
  const [data, setData] = useState<BusyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [goOutMode, setGoOutMode] = useState(false);
  const [highlightLines, setHighlightLines] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/busy?city=nyc");
      if (!res.ok) throw new Error("fetch failed");
      const json: BusyResponse = await res.json();
      setData(json);
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

  return (
    <div
      className={`min-h-screen bg-gradient-to-b ${verdict.bg} transition-colors duration-700`}
    >
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <p className="text-white/40 text-sm tracking-widest uppercase">New York City, right now</p>
          <button
            onClick={() => setGoOutMode((v) => !v)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
              goOutMode
                ? "bg-white/15 border-white/20 text-white"
                : "bg-transparent border-white/15 text-white/50 hover:text-white/70"
            }`}
          >
            {goOutMode ? "Full view" : "Should I go out?"}
          </button>
        </div>

        {/* ── Go out mode ── */}
        {goOutMode && <GoOutMode verdict={goOutVerdict} />}

        {/* ── Score ── */}
        <div className="text-center space-y-3">
          <div>
            <h1 className={`text-7xl sm:text-8xl font-black tracking-tight ${verdict.text} leading-none`}>
              {data.label}
            </h1>
            <p className="text-white/60 text-xl mt-2">{data.subtitle}</p>
          </div>
          <div className="flex items-end justify-center gap-2">
            <span className="text-7xl font-black text-white tabular-nums leading-none">{data.score}</span>
            <span className="text-white/30 text-2xl mb-2">/100</span>
          </div>
          <div className="flex justify-center">
            <ScoreBar score={data.score} barClass={verdict.bar} />
          </div>
          <HistoricalContext percentile={data.historicalPercentile} score={data.score} />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <EventFeed events={data.signals.events.events} textClass={verdict.text} />
            <BoroughMap byBorough={data.signals.events.byBorough} textClass={verdict.text} />
          </div>
        </section>

        <div className="border-t border-white/5" />

        {/* ── Extra signals ── */}
        <section className="space-y-3">
          <SectionLabel>More signals</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <CitiBikeCard citibike={data.signals.citibike} textClass={verdict.text} />
            <div className="grid grid-cols-2 gap-3 col-span-2">
              <StreetCard dsny={data.signals.dsny} textClass={verdict.text} />
              <SignalCard signal={data.signals.noise} textClass={verdict.text} />
              <SignalCard signal={data.signals.timeOfDay} textClass={verdict.text} />
            </div>
          </div>
        </section>

        {/* ── Share ── */}
        <div className="flex justify-center pt-2">
          <ShareButton score={data.score} label={data.label} data={data} />
        </div>

        {/* ── Footer ── */}
        <footer className="text-center text-white/25 text-xs space-y-1 pb-4">
          <p>Updated at {formatTime(data.lastUpdated)} ET &middot; refreshes every 5 min</p>
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
          </p>
        </footer>
      </div>
    </div>
  );
}
