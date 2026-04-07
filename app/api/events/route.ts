import { NextResponse } from "next/server";
import { EventItem } from "@/app/lib/types";
import {
  VENUE_NEIGHBORHOOD,
  BOROUGH_KEYWORDS,
  NEIGHBORHOOD_LINES,
} from "@/app/lib/nyc-data";

export const runtime = "nodejs";

const YOUTH_KEYWORDS =
  /\b(youth|junior|u\d{1,2}|under \d+|\d+ and under|little league|kids|children|peewee|pee.?wee|age \d|u-\d)\b/i;

function inferBorough(venueName: string, venueCity: string): string {
  for (const v of VENUE_NEIGHBORHOOD) {
    if (venueName.toLowerCase().includes(v.match.toLowerCase())) return v.borough;
  }
  for (const b of BOROUGH_KEYWORDS) {
    if (venueCity.includes(b.keyword)) return b.borough;
  }
  return "Manhattan";
}

function inferNeighborhood(venueName: string, venueCity: string): string {
  for (const v of VENUE_NEIGHBORHOOD) {
    if (venueName.toLowerCase().includes(v.match.toLowerCase())) return v.neighborhood;
  }
  return inferBorough(venueName, venueCity).toLowerCase();
}

function crowdBucket(capacity?: number): "Small" | "Medium" | "Packed" {
  if (!capacity || capacity < 500) return "Small";
  if (capacity < 5000) return "Medium";
  return "Packed";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEvent(e: any, tz: string): EventItem {
  const venueName: string = e._embedded?.venues?.[0]?.name ?? "";
  const venueCity: string = e._embedded?.venues?.[0]?.city?.name ?? "New York";
  const venueAddress: string = [
    e._embedded?.venues?.[0]?.address?.line1,
    venueCity,
    "NY",
  ]
    .filter(Boolean)
    .join(", ");
  const borough = inferBorough(venueName, venueCity);
  const neighborhood = inferNeighborhood(venueName, venueCity);
  const nhoodData = NEIGHBORHOOD_LINES[neighborhood] ?? NEIGHBORHOOD_LINES["midtown"];
  const capacity: number | undefined = e._embedded?.venues?.[0]?.capacity;
  const localTime: string = e.dates?.start?.localTime ?? "";
  let startTime = "TBD";
  if (localTime) {
    const [h, m] = localTime.split(":").map(Number);
    const hour12 = h % 12 || 12;
    const ampm = h < 12 ? "AM" : "PM";
    startTime = `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
  } else if (e.dates?.start?.dateTime) {
    startTime = new Date(e.dates.start.dateTime).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: tz,
    });
  }
  return {
    id: e.id,
    name: e.name,
    venue: venueName || "NYC Venue",
    neighborhood,
    borough,
    startTime,
    crowdSize: crowdBucket(capacity),
    lines: nhoodData?.lines ?? [],
    url: e.url ?? undefined,
    address: venueAddress,
    source: "ticketmaster" as const,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date"); // YYYY-MM-DD

  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) return NextResponse.json({ events: [], error: "No API key" }, { status: 500 });

  // Build UTC window for the full day in NYC time (America/New_York)
  const tz = "America/New_York";
  let startUtc: Date;
  let endUtc: Date;

  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    // Midnight NYC -> midnight+1day NYC, convert to UTC
    startUtc = new Date(`${dateParam}T00:00:00`);
    // The above parses as local server time — safer to use a known offset approach
    // Use Intl to find the UTC offset for this date in NYC
    const nycMidnight = new Date(
      new Date(`${dateParam}T00:00:00`).toLocaleString("en-US", { timeZone: tz })
    );
    // Compute offset: difference between UTC now and NYC now
    const nowUtc = Date.now();
    const nowNyc = new Date(new Date().toLocaleString("en-US", { timeZone: tz })).getTime();
    const offsetMs = nowUtc - nowNyc; // positive = NYC behind UTC
    startUtc = new Date(nycMidnight.getTime() + offsetMs);
    endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000 - 1000);
  } else {
    // Default: next 24h
    startUtc = new Date();
    endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);
  }

  const fmt = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, "Z");
  const DMA_NYC = "345";

  try {
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&dmaId=${DMA_NYC}&startDateTime=${fmt(startUtc)}&endDateTime=${fmt(endUtc)}&size=50&sort=date,asc`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`TM ${res.status}`);
    const data = await res.json();

    const events: EventItem[] = (data._embedded?.events ?? [])
      .filter((e: { name?: string }) => !YOUTH_KEYWORDS.test(e.name ?? ""))
      .slice(0, 30)
      .map((e: unknown) => mapEvent(e, tz));

    return NextResponse.json(
      { events, date: dateParam },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" } }
    );
  } catch {
    return NextResponse.json({ events: [], error: "Ticketmaster unavailable" }, { status: 500 });
  }
}
