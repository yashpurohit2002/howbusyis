import { NextResponse } from "next/server";
import { MTA_FEED_BASE } from "@/app/lib/nyc-stations";

export const runtime = "nodejs";

// Cache decoded feeds for 30s to avoid hammering MTA
const feedCache = new Map<string, { buf: ArrayBuffer; ts: number }>();
const FEED_TTL = 30_000;

async function getFeed(feedName: string): Promise<ArrayBuffer> {
  const cached = feedCache.get(feedName);
  if (cached && Date.now() - cached.ts < FEED_TTL) return cached.buf;

  const res = await fetch(`${MTA_FEED_BASE}${feedName}`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`MTA feed ${feedName} returned ${res.status}`);
  const buf = await res.arrayBuffer();
  feedCache.set(feedName, { buf, ts: Date.now() });
  return buf;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gtfsId = searchParams.get("gtfsId");
  const feed = searchParams.get("feed");
  const dir = searchParams.get("dir") as "N" | "S" | null;

  if (!gtfsId || !feed || !dir) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const stopId = `${gtfsId}${dir}`;

  try {
    const { transit_realtime } = await import("gtfs-realtime-bindings");
    const buf = await getFeed(feed);
    const feedMsg = transit_realtime.FeedMessage.decode(new Uint8Array(buf));

    const now = Math.floor(Date.now() / 1000);
    const arrivals: number[] = [];

    for (const entity of feedMsg.entity) {
      if (!entity.tripUpdate) continue;
      for (const stu of entity.tripUpdate.stopTimeUpdate ?? []) {
        if (stu.stopId !== stopId) continue;
        const t = stu.arrival?.time ?? stu.departure?.time;
        if (!t) continue;
        const minsAway = Math.round((Number(t) - now) / 60);
        if (minsAway >= 0 && minsAway <= 60) arrivals.push(minsAway);
      }
    }

    arrivals.sort((a, b) => a - b);
    const next = arrivals.slice(0, 3);

    return NextResponse.json({ arrivals: next, stopId }, {
      headers: { "Cache-Control": "public, max-age=20, s-maxage=20" },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 503 });
  }
}
