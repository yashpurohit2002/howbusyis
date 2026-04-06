import { NextResponse } from "next/server";
import { CITY_CONFIG } from "@/app/lib/cityConfig";
import {
  getMtaScore,
  getWeatherScore,
  getEventsScore,
  getNoiseScore,
  getCitiBikeScore,
  getDsnyScore,
  getTimeOfDayScore,
  computeTotal,
} from "@/app/lib/scoring";
import { getVerdict, BusyResponse } from "@/app/lib/types";

export const runtime = "nodejs";

const CACHE_TTL = 300; // 5 minutes

// ── KV helpers ──────────────────────────────────────────────────────────────

function isKvConfigured() {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function kvGet<T>(key: string): Promise<T | null> {
  try {
    const { kv } = await import("@vercel/kv");
    return await kv.get<T>(key);
  } catch {
    return null;
  }
}

async function kvSet(key: string, value: unknown, ttl: number): Promise<void> {
  try {
    const { kv } = await import("@vercel/kv");
    await kv.set(key, value, { ex: ttl });
  } catch {
    // non-fatal
  }
}

// ── Historical percentile ────────────────────────────────────────────────────

async function recordAndGetPercentile(score: number): Promise<number | undefined> {
  if (!isKvConfigured()) return undefined;
  try {
    const today = new Date().toISOString().split("T")[0];
    await kvSet(`score:${today}`, score, 60 * 60 * 24 * 35);

    const keys = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000);
      return `score:${d.toISOString().split("T")[0]}`;
    });

    const values = await Promise.all(keys.map((k) => kvGet<number>(k)));
    const historical = values.filter((v): v is number => v !== null);
    if (historical.length === 0) return undefined;

    const below = historical.filter((s) => s < score).length;
    return Math.round((below / historical.length) * 100);
  } catch {
    return undefined;
  }
}

// ── Main route ───────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cityKey = searchParams.get("city") ?? "nyc";
  const bust = searchParams.get("bust") === "1"; // ?bust=1 forces a refresh
  const city = CITY_CONFIG[cityKey] ?? CITY_CONFIG.nyc;
  const cacheKey = `busy:${cityKey}`;

  // ── Cache read ──
  if (isKvConfigured() && !bust) {
    const cached = await kvGet<BusyResponse>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
          "X-Cache": "HIT",
        },
      });
    }
  }

  // ── Cache miss: fan out to all APIs ──
  const [mta, weather, events, noise, citibike, dsny] = await Promise.all([
    getMtaScore(city),
    getWeatherScore(city),
    getEventsScore(city),
    getNoiseScore(city),
    getCitiBikeScore(),
    getDsnyScore(city),
  ]);

  const timeOfDay = getTimeOfDayScore(city.timezoneTZ);

  const score = computeTotal([
    mta.score,
    weather.score,
    events.score,
    noise.score,
    citibike.score,
    dsny.score,
    timeOfDay.score,
  ]);

  const historicalPercentile = await recordAndGetPercentile(score);
  const verdict = getVerdict(score);

  const response: BusyResponse = {
    score,
    label: verdict.label,
    subtitle: verdict.subtitle,
    color: verdict.color,
    signals: { mta, weather, events, noise, citibike, dsny, timeOfDay },
    historicalPercentile,
    lastUpdated: new Date().toISOString(),
  };

  // ── Cache write ──
  if (isKvConfigured()) {
    await kvSet(cacheKey, response, CACHE_TTL);
  }

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      "X-Cache": "MISS",
    },
  });
}
