import { NextResponse } from "next/server";
import { NEIGHBORHOOD_LINES, ALL_NEIGHBORHOODS } from "@/app/lib/nyc-data";

export const runtime = "nodejs";

// Haversine distance in meters
function distMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

function fuzzyMatch(query: string): string | null {
  const q = query.toLowerCase().trim();
  // Exact match
  if (NEIGHBORHOOD_LINES[q]) return q;
  // Starts-with
  const sw = ALL_NEIGHBORHOODS.find((n) => n.startsWith(q));
  if (sw) return sw;
  // Contains
  const contains = ALL_NEIGHBORHOODS.find((n) => n.includes(q));
  if (contains) return contains;
  return null;
}

export interface StationResult {
  name: string;
  distMeters: number;
  bikes: number;
  ebikes: number;
  docks: number;
  capacity: number;
  availabilityPct: number;
}

export interface CitiBikeSearchResponse {
  neighborhood: string;
  lat: number;
  lon: number;
  radiusFt: number;
  totalStations: number;
  totalBikes: number;
  totalEbikes: number;
  totalDocks: number;
  overallPct: number;
  stations: StationResult[];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  const matched = fuzzyMatch(q);
  if (!matched) {
    return NextResponse.json(
      { error: `No neighborhood found for "${q}". Try "williamsburg" or "midtown".` },
      { status: 404 }
    );
  }

  const nhoodData = NEIGHBORHOOD_LINES[matched];
  const { lat, lon } = nhoodData;
  const RADIUS = 600; // meters -- roughly a 7-8 min walk

  try {
    const [statusRes, infoRes] = await Promise.all([
      fetch("https://gbfs.citibikenyc.com/gbfs/en/station_status.json", {
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(8000),
      }),
      fetch("https://gbfs.citibikenyc.com/gbfs/en/station_information.json", {
        next: { revalidate: 3600 }, // station locations rarely change
        signal: AbortSignal.timeout(8000),
      }),
    ]);

    if (!statusRes.ok || !infoRes.ok) throw new Error("GBFS fetch failed");

    const [statusData, infoData] = await Promise.all([
      statusRes.json(),
      infoRes.json(),
    ]);

    // Build status lookup
    const statusMap = new Map<
      string,
      { bikes: number; ebikes: number; docks: number }
    >();
    for (const s of statusData.data?.stations ?? []) {
      statusMap.set(s.station_id, {
        bikes: s.num_bikes_available ?? 0,
        ebikes: s.num_ebikes_available ?? 0,
        docks: s.num_docks_available ?? 0,
      });
    }

    // Find stations within radius
    const nearby: StationResult[] = [];
    for (const info of infoData.data?.stations ?? []) {
      const d = distMeters(lat, lon, info.lat, info.lon);
      if (d > RADIUS) continue; // RADIUS still in meters for the distance check

      const status = statusMap.get(info.station_id);
      if (!status) continue;

      const capacity = status.bikes + status.docks;
      nearby.push({
        name: info.name,
        distMeters: Math.round(d * 3.28084), // stored as feet
        bikes: status.bikes,
        ebikes: status.ebikes,
        docks: status.docks,
        capacity,
        availabilityPct: capacity > 0 ? Math.round((status.bikes / capacity) * 100) : 0,
      });
    }

    nearby.sort((a, b) => a.distMeters - b.distMeters);

    const totalBikes = nearby.reduce((s, x) => s + x.bikes, 0);
    const totalEbikes = nearby.reduce((s, x) => s + x.ebikes, 0);
    const totalDocks = nearby.reduce((s, x) => s + x.docks, 0);
    const totalCap = totalBikes + totalDocks;

    const response: CitiBikeSearchResponse = {
      neighborhood: matched,
      lat,
      lon,
      radiusFt: Math.round(RADIUS * 3.28084),
      totalStations: nearby.length,
      totalBikes,
      totalEbikes,
      totalDocks,
      overallPct: totalCap > 0 ? Math.round((totalBikes / totalCap) * 100) : 0,
      stations: nearby.slice(0, 8), // top 8 closest
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "Citi Bike feed unavailable" }, { status: 503 });
  }
}
