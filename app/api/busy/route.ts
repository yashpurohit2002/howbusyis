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
export const revalidate = 300;

async function getHistoricalPercentile(score: number): Promise<number | undefined> {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (!kvUrl || !kvToken) return undefined;

  try {
    const { kv } = await import("@vercel/kv");
    const today = new Date().toISOString().split("T")[0];
    const key = `score:${today}`;

    // Store today's score
    await kv.set(key, score, { ex: 60 * 60 * 24 * 35 }); // 35 days TTL

    // Fetch last 30 days
    const dates: string[] = [];
    for (let i = 1; i <= 30; i++) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      dates.push(`score:${d.toISOString().split("T")[0]}`);
    }

    const values = await Promise.all(dates.map((k) => kv.get<number>(k)));
    const historicalScores = values.filter((v): v is number => v !== null);

    if (historicalScores.length === 0) return undefined;

    const below = historicalScores.filter((s) => s < score).length;
    return Math.round((below / historicalScores.length) * 100);
  } catch {
    return undefined;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cityKey = searchParams.get("city") ?? "nyc";
  const city = CITY_CONFIG[cityKey] ?? CITY_CONFIG.nyc;

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

  const historicalPercentile = await getHistoricalPercentile(score);
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

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
    },
  });
}
