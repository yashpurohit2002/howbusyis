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
  const suggest = searchParams.get("suggest") === "1";

  if (!q) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  // Always anchor to NYC — always append borough/city context and restrict to US
  const hasNycContext = /new york|nyc|manhattan|brooklyn|queens|bronx|staten island/i.test(q);
  const query = hasNycContext ? q : `${q}, New York City, NY`;

  try {
    const params = new URLSearchParams({
      q: query,
      format: "jsonv2",
      limit: suggest ? "8" : "1",
      viewbox: NYC_VIEWBOX,
      bounded: "1",
      countrycodes: "us",
      addressdetails: "1",
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

    type NominatimItem = {
      lat: string; lon: string; display_name?: string; name?: string;
      address?: {
        house_number?: string; road?: string;
        neighbourhood?: string; suburb?: string;
        city_district?: string; borough?: string;
        amenity?: string; shop?: string; tourism?: string; leisure?: string;
      };
    };

    const cleanArea = (a: NominatimItem["address"]): string => {
      if (!a) return "";
      const candidates = [a.neighbourhood, a.suburb, a.city_district, a.borough];
      // Filter out useless Nominatim administrative labels
      const good = candidates.find(
        (c) => c && !/community board|borough of manhattan|borough of brooklyn|borough of queens|borough of bronx|new york city/i.test(c)
      );
      return good ?? "";
    };

    const cleanName = (item: NominatimItem): string => {
      const a = item.address;
      // For named places (bars, restaurants, landmarks), lead with the name
      const placeName = item.name ?? a?.amenity ?? a?.shop ?? a?.tourism ?? a?.leisure ?? "";
      const street = [a?.house_number, a?.road].filter(Boolean).join(" ");
      const area = cleanArea(a);

      if (placeName && street) return `${placeName} — ${street}${area ? `, ${area}` : ""}`;
      if (placeName && area)  return `${placeName}, ${area}`;
      if (placeName)          return placeName;
      if (street && area)     return `${street}, ${area}`;
      if (street)             return street;
      return item.display_name?.split(",").slice(0, 2).join(",").trim() ?? q;
    };

    if (suggest) {
      const results: GeocodeResult[] = data.map((item: NominatimItem) => ({
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        displayName: cleanName(item),
      }));
      return NextResponse.json(results, {
        headers: { "Cache-Control": "public, max-age=300" },
      });
    }

    const top = data[0] as NominatimItem;
    const result: GeocodeResult = {
      lat: parseFloat(top.lat),
      lon: parseFloat(top.lon),
      displayName: cleanName(top),
    };

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  } catch {
    return NextResponse.json({ error: "Geocoding unavailable" }, { status: 503 });
  }
}
