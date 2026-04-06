import { NextResponse } from "next/server";

export const runtime = "nodejs";

// NYC bounding box for Nominatim
const NYC_VIEWBOX = "-74.259090,40.477399,-73.700272,40.917577";

export interface GeocodeResult {
  lat: number;
  lon: number;
  displayName: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (!q) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  // Append NYC context if not already present
  const query = /new york|nyc|manhattan|brooklyn|queens|bronx|staten island/i.test(q)
    ? q
    : `${q}, New York City`;

  try {
    const params = new URLSearchParams({
      q: query,
      format: "jsonv2",
      limit: "1",
      viewbox: NYC_VIEWBOX,
      bounded: "1",
      addressdetails: "0",
    });

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          "User-Agent": "howbusyis.nyc/1.0 (contact@howbusyis.nyc)",
          "Accept-Language": "en",
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!res.ok) throw new Error(`Nominatim ${res.status}`);

    const data = await res.json();
    if (!data.length) {
      return NextResponse.json(
        { error: `Could not find "${q}" in NYC. Try a more specific address.` },
        { status: 404 }
      );
    }

    const top = data[0];
    const result: GeocodeResult = {
      lat: parseFloat(top.lat),
      lon: parseFloat(top.lon),
      displayName: top.display_name ?? q,
    };

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  } catch {
    return NextResponse.json({ error: "Geocoding unavailable" }, { status: 503 });
  }
}
