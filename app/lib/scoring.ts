import {
  SignalResult,
  MtaSignalResult,
  WeatherSignalResult,
  EventsSignalResult,
  CitiBikeSignalResult,
  DsnySignalResult,
  NightlifeSignalResult,
  LineStatusEntry,
  HourlySnapshot,
  EventItem,
} from "./types";
import {
  NIGHTLIFE_NEIGHBORHOODS,
  peakLabel,
  isActive,
} from "./nightlife-data";
import { CityConfig } from "./cityConfig";
import {
  ALL_LINES,
  VENUE_NEIGHBORHOOD,
  BOROUGH_KEYWORDS,
  NEIGHBORHOOD_LINES,
} from "./nyc-data";

// ---- MTA ----
// Parses GTFS-RT binary buffer for affected subway route IDs.
// Uses occurrence counting to filter false positives: 0x12 is common in binary,
// so we only flag a route ID as affected if it appears 3+ times (each real alert
// references the route_id in multiple sub-messages: header, informed_entity, etc.)
function parseAffectedRoutes(buffer: ArrayBuffer): string[] {
  const bytes = new Uint8Array(buffer);
  const known = new Set(ALL_LINES);
  const counts = new Map<string, number>();

  for (let i = 0; i < bytes.length - 3; i++) {
    // EntitySelector.route_id = field 2, wire type 2 -> tag 0x12
    if (bytes[i] === 0x12) {
      const len = bytes[i + 1];
      if (len >= 1 && len <= 3 && i + 2 + len <= bytes.length) {
        // All bytes must be printable ASCII (route IDs are letters/digits only)
        const chars = bytes.slice(i + 2, i + 2 + len);
        if ([...chars].every((c) => (c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122))) {
          const str = String.fromCharCode(...chars);
          if (known.has(str)) {
            counts.set(str, (counts.get(str) ?? 0) + 1);
          }
        }
      }
    }
  }

  // Threshold of 3: each genuine alert embeds the route_id multiple times.
  // Single occurrences are almost certainly coincidental byte sequences.
  return Array.from(counts.entries())
    .filter(([, n]) => n >= 3)
    .map(([route]) => route);
}

// NYC baseline: the GTFS-RT alerts feed includes planned service changes posted weeks
// in advance, so 15-20 lines "affected" is the daily norm. Only lines above 15 are
// genuinely unusual; only above 19 is actually bad.
function mtaChaosLevel(count: number): MtaSignalResult["chaosLevel"] {
  if (count <= 15) return "normal";
  if (count <= 19) return "elevated";
  return "bad";
}

function mtaChaosLabel(level: MtaSignalResult["chaosLevel"], count: number): string {
  if (count === 0) return "All lines running smooth";
  const base = `${count} line${count === 1 ? "" : "s"} with issues`;
  if (level === "normal") return `${base}, par for the course`;
  if (level === "elevated") return `${base}, busier than usual`;
  return `${base}, actually bad today`;
}

export async function getMtaScore(_city: CityConfig): Promise<MtaSignalResult> {
  const makeLineStatuses = (affected: string[]): LineStatusEntry[] =>
    ALL_LINES.map((line) => ({
      line,
      status: affected.includes(line) ? "delayed" : "good",
    }));

  const makeUnknown = (): LineStatusEntry[] =>
    ALL_LINES.map((line) => ({ line, status: "unknown" as const }));

  try {
    // MTA feeds are free, no key required as of 2024
    const res = await fetch(
      "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fall-alerts",
      {
        next: { revalidate: 0 },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) throw new Error(`MTA status ${res.status}`);

    const buffer = await res.arrayBuffer();
    const affected = parseAffectedRoutes(buffer);
    const lineStatuses = makeLineStatuses(affected);
    const chaosLevel = mtaChaosLevel(affected.length);
    // Baseline is 13 — the GTFS-RT feed almost always shows 13-15 lines with
    // some kind of alert (planned work counts). Only lines above 13 are real noise.
    const significant = Math.max(0, affected.length - 13);
    const score =
      significant === 0 ? 0 :
      significant <= 4  ? Math.round((significant / 4) * 3) :
      significant <= 8  ? 3 + Math.round(((significant - 4) / 4) * 3) :
      /* 9+ */ 6 + Math.min(4, significant - 8);

    return {
      label: "MTA",
      detail: mtaChaosLabel(chaosLevel, affected.length),
      score,
      lineStatuses,
      delayedLines: affected,
      chaosLevel,
    };
  } catch {
    return mtaTimeFallback(makeUnknown());
  }
}

function mtaTimeFallback(lineStatuses: LineStatusEntry[]): MtaSignalResult {
  const hour = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
  ).getHours();
  const isRushHour = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19);
  return {
    label: "MTA",
    detail: "MTA didn't respond. Honestly, same.",
    score: isRushHour ? 5 : 2,
    error: true,
    lineStatuses,
    delayedLines: [],
    chaosLevel: "unknown",
  };
}

// ---- Weather ----
function weatherIcon(id: number, pop: number): string {
  if (pop > 0.6) return "🌧";
  if (id >= 200 && id < 300) return "⛈";
  if (id >= 300 && id < 600) return "🌧";
  if (id >= 600 && id < 700) return "❄";
  if (id >= 700 && id < 800) return "🌫";
  if (id === 800) return "☀";
  if (id <= 803) return "⛅";
  return "☁";
}

function fmtHour(dt: number, tz: string): string {
  return new Date(dt * 1000).toLocaleString("en-US", {
    timeZone: tz,
    hour: "numeric",
    hour12: true,
  });
}

export async function getWeatherScore(
  city: CityConfig
): Promise<WeatherSignalResult> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const fallback: WeatherSignalResult = {
    label: "Weather",
    detail: "No weather key configured",
    score: 0,
    error: true,
    temp: 0,
    feelsLike: 0,
    description: "",
    windSpeed: 0,
    humidity: 0,
    impact: "Weather data unavailable",
    hourly: [],
    scoreContribution: 0,
  };

  if (!apiKey) return fallback;

  try {
    const base = `https://api.openweathermap.org/data/2.5`;
    const q = encodeURIComponent(city.weatherQuery);
    const [currentRes, forecastRes] = await Promise.all([
      fetch(`${base}/weather?q=${q}&appid=${apiKey}&units=imperial`, {
        next: { revalidate: 0 },
        signal: AbortSignal.timeout(8000),
      }),
      fetch(`${base}/forecast?q=${q}&appid=${apiKey}&units=imperial&cnt=5`, {
        next: { revalidate: 0 },
        signal: AbortSignal.timeout(8000),
      }),
    ]);

    if (!currentRes.ok) throw new Error(`Weather ${currentRes.status}`);
    const cur = await currentRes.json();
    const forecast = forecastRes.ok ? await forecastRes.json() : null;

    const id: number = cur.weather?.[0]?.id ?? 800;
    const temp: number = Math.round(cur.main?.temp ?? 70);
    const feelsLike: number = Math.round(cur.main?.feels_like ?? 70);
    const desc: string = cur.weather?.[0]?.description ?? "clear";
    const windSpeed: number = Math.round(cur.wind?.speed ?? 0);
    const humidity: number = cur.main?.humidity ?? 50;

    // Compute score
    let score = 0;
    let impact = "";
    const parts: string[] = [];

    if (id >= 200 && id < 300) { score += 4; parts.push("Thunderstorms. Stay inside if you can."); }
    else if (id >= 502 && id < 510) { score += 3; parts.push("Heavy rain. You will get wet."); }
    else if (id >= 300 && id < 510) { score += 2; parts.push("Light rain. Sidewalks will be gross, bring an umbrella."); }
    else if (id >= 600 && id < 700) { score += 4; parts.push("Snow. Budget extra commute time."); }
    else if (id >= 700 && id < 800) { score += 1; parts.push("Foggy. Visibility is low."); }

    if (windSpeed > 25) { score += 2; parts.push("Very windy. Your umbrella will betray you."); }
    else if (windSpeed > 20) { score += 1; parts.push(`Windy at ${windSpeed} mph`); }

    if (temp > 95) { score += 3; parts.push(`${temp}F, brutal heat. Stay hydrated.`); }
    else if (temp < 15) { score += 3; parts.push(`${temp}F, dangerously cold.`); }

    const isSummer = [5, 6, 7, 8].includes(new Date().getMonth());
    if (humidity > 80 && isSummer) { score += 1; parts.push("Swamp air. You will sweat immediately upon exiting."); }

    if (id === 800 && temp >= 60 && temp <= 78) { score = Math.max(0, score - 1); }

    if (parts.length === 0) {
      impact = temp >= 60 && temp <= 78 ? "Perfect weather. No excuses." : `${temp}F, ${desc}`;
    } else {
      impact = parts[0];
    }

    score = Math.max(0, Math.min(10, score));

    // Hourly forecast from /forecast (3h intervals)
    const hourly: HourlySnapshot[] = (forecast?.list ?? [])
      .slice(0, 5)
      .map((item: {dt: number; main: {temp: number}; weather: Array<{id: number}>; pop: number}) => ({
        hour: fmtHour(item.dt, city.timezoneTZ),
        temp: Math.round(item.main.temp),
        pop: item.pop ?? 0,
        icon: weatherIcon(item.weather?.[0]?.id ?? 800, item.pop ?? 0),
      }));

    return {
      label: "Weather",
      detail: `${temp}F, ${desc.charAt(0).toUpperCase() + desc.slice(1)}`,
      score,
      temp,
      feelsLike,
      description: desc,
      windSpeed,
      humidity,
      impact,
      hourly,
      scoreContribution: score,
    };
  } catch {
    return { ...fallback, detail: "Weather API went dark", error: true };
  }
}

// ---- Ticketmaster Events ----
function inferBorough(venueName: string, venueCity: string): string {
  for (const v of VENUE_NEIGHBORHOOD) {
    if (venueName.toLowerCase().includes(v.match.toLowerCase())) {
      return v.borough;
    }
  }
  for (const b of BOROUGH_KEYWORDS) {
    if (venueCity.includes(b.keyword)) return b.borough;
  }
  return "Manhattan";
}

function inferNeighborhood(venueName: string, venueCity: string): string {
  for (const v of VENUE_NEIGHBORHOOD) {
    if (venueName.toLowerCase().includes(v.match.toLowerCase())) {
      return v.neighborhood;
    }
  }
  return inferBorough(venueName, venueCity).toLowerCase();
}

function crowdBucket(capacity?: number): "Small" | "Medium" | "Packed" {
  if (!capacity || capacity < 500) return "Small";
  if (capacity < 5000) return "Medium";
  return "Packed";
}

export async function getEventsScore(
  city: CityConfig
): Promise<EventsSignalResult> {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  const fallback: EventsSignalResult = {
    label: "Events",
    detail: "No events key configured",
    score: 0,
    error: true,
    events: [],
    byBorough: {},
    totalToday: 0,
  };

  if (!apiKey) return fallback;

  try {
    const now = new Date();
    const startWindow = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const endWindow = new Date(now.getTime() + 4 * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, "Z");

    const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&dmaId=${city.ticketmasterDMA}&startDateTime=${fmt(startWindow)}&endDateTime=${fmt(endWindow)}&size=50&sort=date,asc`;
    const res = await fetch(url, {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Ticketmaster ${res.status}`);
    const data = await res.json();

    const YOUTH_KEYWORDS = /\b(youth|junior|u\d{1,2}|under \d+|\d+ and under|little league|kids|children|peewee|pee.?wee|age \d|u-\d)\b/i;

    const rawEvents = (data._embedded?.events ?? []).filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (e: any) => !YOUTH_KEYWORDS.test(e.name ?? "")
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tmEvents: EventItem[] = rawEvents.slice(0, 20).map((e: any) => {
      const venueName: string = e._embedded?.venues?.[0]?.name ?? "";
      const venueCity: string = e._embedded?.venues?.[0]?.city?.name ?? "New York";
      const venueAddress: string = [
        e._embedded?.venues?.[0]?.address?.line1,
        venueCity,
        "NY",
      ].filter(Boolean).join(", ");
      const borough = inferBorough(venueName, venueCity);
      const neighborhood = inferNeighborhood(venueName, venueCity);
      const nhoodData = NEIGHBORHOOD_LINES[neighborhood] ?? NEIGHBORHOOD_LINES["midtown"];
      const capacity: number | undefined = e._embedded?.venues?.[0]?.capacity;
      // Prefer localDate+localTime (already in venue timezone) over dateTime (UTC)
      const localTime: string = e.dates?.start?.localTime ?? "";
      let startTime = "TBD";
      if (localTime) {
        const [h, m] = localTime.split(":").map(Number);
        const hour12 = h % 12 || 12;
        const ampm = h < 12 ? "AM" : "PM";
        startTime = `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
      } else if (e.dates?.start?.dateTime) {
        startTime = new Date(e.dates.start.dateTime).toLocaleTimeString("en-US", {
          hour: "numeric", minute: "2-digit", hour12: true, timeZone: city.timezoneTZ,
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
    });

    const events = tmEvents
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .slice(0, 25);

    const byBorough: Record<string, number> = {};
    for (const ev of events) {
      byBorough[ev.borough] = (byBorough[ev.borough] ?? 0) + 1;
    }

    // Normalize against NYC baseline (~20 events is a normal evening for NYC).
    // 0 events = 0, 20 events = 5, 40+ events = 10.
    const score = Math.min(10, Math.round(events.length / 4));

    return {
      label: "Events",
      detail:
        events.length === 0
          ? "No major events right now"
          : `${events.length} event${events.length === 1 ? "" : "s"} happening now`,
      score,
      events,
      byBorough,
      totalToday: rawEvents.length,
    };
  } catch {
    return { ...fallback, detail: "Ticketmaster went quiet", error: true };
  }
}

// ---- NYC 311 Noise ----
export async function getNoiseScore(city: CityConfig): Promise<SignalResult> {
  try {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const isoStr = twelveHoursAgo.toISOString().split(".")[0];

    const params = new URLSearchParams({
      $where: `complaint_type like '%Noise%' AND created_date > '${isoStr}'`,
      $select: "count(*) as cnt",
      $limit: "1",
    });

    const res = await fetch(`${city.openDataEndpoint}?${params}`, {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`311 ${res.status}`);
    const data = await res.json();
    const count = parseInt(data?.[0]?.cnt ?? "0", 10);

    // ~50 complaints/12h = quiet, ~150 = loud, 250+ = chaos
    const score = Math.min(10, Math.round((count / 250) * 10));
    return {
      label: "311 Noise",
      detail:
        count === 0
          ? "Eerily quiet"
          : `${count} noise complaint${count === 1 ? "" : "s"} (last 12h)`,
      score,
    };
  } catch {
    return { label: "311 Noise", detail: "311 is also overwhelmed", score: 2, error: true };
  }
}

// ---- Citi Bike ----
// Approximate region bounding boxes [minLat, maxLat, minLon, maxLon]
const CITIBIKE_REGIONS: Array<{ name: string; bounds: [number, number, number, number] }> = [
  { name: "Lower Manhattan",  bounds: [40.700, 40.740, -74.020, -73.970] },
  { name: "Midtown",          bounds: [40.740, 40.770, -74.010, -73.965] },
  { name: "Upper Manhattan",  bounds: [40.770, 40.820, -74.005, -73.930] },
  { name: "Williamsburg",     bounds: [40.700, 40.730, -73.975, -73.940] },
  { name: "Downtown BK",      bounds: [40.670, 40.700, -74.010, -73.960] },
  { name: "LIC / Astoria",    bounds: [40.730, 40.780, -73.960, -73.910] },
  { name: "Jersey City",      bounds: [40.710, 40.750, -74.080, -74.030] },
];

function regionForStation(lat: number, lon: number): string | null {
  for (const r of CITIBIKE_REGIONS) {
    const [minLat, maxLat, minLon, maxLon] = r.bounds;
    if (lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon) return r.name;
  }
  return null;
}

export async function getCitiBikeScore(): Promise<CitiBikeSignalResult> {
  const fallback: CitiBikeSignalResult = {
    label: "Citi Bike",
    detail: "Citi Bike feed unavailable",
    score: 2,
    error: true,
    availabilityPct: 50,
    availableBikes: 0,
    totalDocks: 0,
    regions: [],
  };

  try {
    const [statusRes, infoRes] = await Promise.all([
      fetch("https://gbfs.citibikenyc.com/gbfs/en/station_status.json", {
        next: { revalidate: 0 }, signal: AbortSignal.timeout(8000),
      }),
      fetch("https://gbfs.citibikenyc.com/gbfs/en/station_information.json", {
        next: { revalidate: 0 }, signal: AbortSignal.timeout(8000),
      }),
    ]);
    if (!statusRes.ok || !infoRes.ok) throw new Error("CitiBike fetch failed");

    const [statusData, infoData] = await Promise.all([statusRes.json(), infoRes.json()]);

    // Build lat/lon lookup from station_information
    const infoMap = new Map<string, { lat: number; lon: number }>();
    for (const s of infoData.data?.stations ?? []) {
      infoMap.set(s.station_id, { lat: s.lat, lon: s.lon });
    }

    // Aggregate globally and by region
    const regionTotals = new Map<string, { bikes: number; docks: number }>();
    let totalBikes = 0;
    let totalDocks = 0;

    for (const s of statusData.data?.stations ?? []) {
      const bikes: number = s.num_bikes_available ?? 0;
      const capacity: number = bikes + (s.num_docks_available ?? 0);
      totalBikes += bikes;
      totalDocks += capacity;

      const info = infoMap.get(s.station_id);
      if (!info) continue;
      const region = regionForStation(info.lat, info.lon);
      if (!region) continue;
      const cur = regionTotals.get(region) ?? { bikes: 0, docks: 0 };
      regionTotals.set(region, { bikes: cur.bikes + bikes, docks: cur.docks + capacity });
    }

    const availabilityPct = totalDocks > 0 ? Math.round((totalBikes / totalDocks) * 100) : 50;
    // 50% availability = normal (score 5). 90%+ = nobody riding (score 1). 10% = city is moving (score 9).
    const mobilityScore = Math.max(0, Math.min(10, Math.round((100 - availabilityPct) / 10)));

    const regions: CitiBikeSignalResult["regions"] = CITIBIKE_REGIONS
      .filter((r) => regionTotals.has(r.name))
      .map((r) => {
        const t = regionTotals.get(r.name)!;
        return {
          name: r.name,
          availabilityPct: t.docks > 0 ? Math.round((t.bikes / t.docks) * 100) : 0,
          bikes: t.bikes,
          docks: t.docks,
        };
      });

    let detail: string;
    if (availabilityPct < 30) detail = `${availabilityPct}% bikes left. City is out and moving.`;
    else if (availabilityPct > 70) detail = `${availabilityPct}% available. People are staying in.`;
    else detail = `${availabilityPct}% availability. Normal flow.`;

    return { label: "Citi Bike", detail, score: mobilityScore, availabilityPct, availableBikes: totalBikes, totalDocks, regions };
  } catch {
    return fallback;
  }
}

// ---- DSNY Street Conditions ----
export async function getDsnyScore(city: CityConfig): Promise<DsnySignalResult> {
  try {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const isoStr = fortyEightHoursAgo.toISOString().split(".")[0];

    const params = new URLSearchParams({
      $where: `(complaint_type like '%Dirty%' OR complaint_type like '%Missed%' OR complaint_type like '%Litter%') AND agency='DSNY' AND created_date > '${isoStr}'`,
      $select: "count(*) as cnt",
      $limit: "1",
    });

    const res = await fetch(`${city.openDataEndpoint}?${params}`, {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`DSNY ${res.status}`);
    const data = await res.json();
    const count = parseInt(data?.[0]?.cnt ?? "0", 10);

    // Normalize: 0-50 = acceptable, 50-200 = chaotic, 200+ = do not look down
    let streetLabel: string;
    let score: number;
    if (count < 50) {
      streetLabel = "Acceptable";
      score = Math.round((count / 50) * 3);
    } else if (count < 200) {
      streetLabel = "Chaotic";
      score = 3 + Math.round(((count - 50) / 150) * 4);
    } else {
      streetLabel = "Do not look down.";
      score = 7 + Math.min(3, Math.round(((count - 200) / 200) * 3));
    }

    return {
      label: "Streets",
      detail: `${streetLabel}, ${count} DSNY complaint${count === 1 ? "" : "s"} (last 48h)`,
      score: Math.min(10, score),
      streetLabel,
      missedFills: count,
    };
  } catch {
    return {
      label: "Streets",
      detail: "Street data unavailable",
      score: 2,
      error: true,
      streetLabel: "Unknown",
      missedFills: 0,
    };
  }
}

// ---- Time of Day ----
export function getTimeOfDayScore(tz: string): SignalResult {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: tz }));
  const hour = now.getHours();
  const day = now.getDay(); // 0=Sun, 5=Fri, 6=Sat

  // Base of 3 (neutral midday weekday). This is the anchor.
  let score = 3;
  const reasons: string[] = [];

  const isWeekday = day >= 1 && day <= 5;
  const isRushHour = isWeekday && ((hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 19));
  const isFridayNight = day === 5 && hour >= 20;
  const isSaturdayNight = day === 6 && hour >= 21;
  const isWeekendAfternoon = (day === 6 || day === 0) && hour >= 12 && hour <= 18;
  const isSundayMorning = day === 0 && hour >= 7 && hour < 11;
  const isDeepNight = hour >= 2 && hour < 6;
  const isEarlyMorning = hour >= 6 && hour < 8;

  if (isFridayNight)        { score += 5; reasons.push("Friday night"); }
  else if (isSaturdayNight) { score += 4; reasons.push("Saturday night"); }
  else if (isRushHour)      { score += 3; reasons.push("Rush hour"); }
  else if (isWeekendAfternoon) { score += 1; reasons.push("Weekend afternoon"); }

  if (isDeepNight)          { score -= 3; reasons.push("Middle of the night"); }
  else if (isSundayMorning) { score -= 2; reasons.push("Sunday morning"); }
  else if (isEarlyMorning)  { score -= 1; reasons.push("Early morning"); }

  score = Math.max(0, Math.min(10, score));
  const detail =
    reasons.length === 0
      ? "Normal hours"
      : reasons.join(", ");

  return { label: "Time of Day", detail, score };
}

// ---- Nightlife ----
// Scoring weights: bar density 40% · time-of-day 35% · events 20% · weekend 5%
// Dynamic modifiers: MTA delays, weather, post-peak decay
export function getNightlifeScore(
  city: CityConfig,
  events: EventItem[] = [],
  mtaDelayedLines: string[] = [],
  weatherDesc: string = "",
  weatherTemp: number = 65,
  rainPop: number = 0,
): NightlifeSignalResult {
  const nycNow = new Date(new Date().toLocaleString("en-US", { timeZone: city.timezoneTZ }));
  const currentHour = nycNow.getHours();
  const dayOfWeek = nycNow.getDay();
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;
  const isNightTime = currentHour >= 20 || currentHour < 4;

  const isRaining = rainPop > 0.5 || /rain|drizzle|shower/i.test(weatherDesc);
  const isCold = weatherTemp < 32;
  const isNicePlus = !isRaining && weatherTemp >= 55 && weatherTemp <= 82;

  // Only concerts/shows from Ticketmaster — not street permits
  const entertainmentEvents = events.filter((e) => e.source === "ticketmaster");

  const spots = NIGHTLIFE_NEIGHBORHOODS.map((n) => {
    const modifiers: string[] = [];

    // ── Bar density (0-40 pts) ────────────────────────────────────────────────
    const barScore = Math.round((n.barDensity / 100) * 40);

    // ── Time-of-day (0-35 pts) ────────────────────────────────────────────────
    const hoursToPeak = (n.peakHour - currentHour + 24) % 24;
    const hoursAfterPeak = (currentHour - n.peakHour + 24) % 24;
    const timeFactor =
      hoursToPeak === 0 ? 1.0 :
      hoursToPeak <= 1 ? 0.92 :
      hoursToPeak <= 2 ? 0.78 :
      hoursToPeak <= 3 ? 0.58 :
      hoursAfterPeak <= 1 ? 0.70 : // just past peak — still going
      hoursAfterPeak <= 2 ? 0.50 : // winding down
      hoursAfterPeak <= 3 ? 0.30 : // mostly done
      isNightTime ? 0.20 : 0.04;   // daytime or well past peak
    const timeScore = Math.round(timeFactor * 35);

    // ── Events nearby (0-20 pts) ──────────────────────────────────────────────
    // Match by neighborhood name OR by shared subway lines — much more accurate
    const nearbyEvents = entertainmentEvents.filter((e) => {
      const nHood = (e.neighborhood ?? "").toLowerCase();
      const spotName = n.name.toLowerCase();
      const nameMatch = nHood.includes(spotName) || spotName.split(" ").some((w) => w.length > 3 && nHood.includes(w));
      const lineMatch = e.lines.some((l) => n.lines.includes(l));
      return nameMatch || lineMatch;
    });
    const eventsRaw = nearbyEvents.reduce((sum, e) =>
      sum + (e.crowdSize === "Packed" ? 20 : e.crowdSize === "Medium" ? 10 : 4), 0);
    const eventsScore = Math.min(20, eventsRaw);
    if (nearbyEvents.length > 0) {
      const packed = nearbyEvents.filter((e) => e.crowdSize === "Packed").length;
      modifiers.push(`🎵 ${nearbyEvents.length} show${nearbyEvents.length > 1 ? "s" : ""} nearby${packed > 0 ? " (sold out)" : ""}`);
    }

    // ── Weekend bonus (0-5 pts) ───────────────────────────────────────────────
    const weekendBonus = isWeekend ? 5 : 0;

    // ── MTA modifier ─────────────────────────────────────────────────────────
    // Penalize spots whose primary lines are delayed — harder to get there
    const spotDelayedLines = n.lines.filter((l) => mtaDelayedLines.includes(l));
    const primaryDelayed = spotDelayedLines.length > 0 && n.lines.slice(0, 2).some((l) => mtaDelayedLines.includes(l));
    const mtaPenalty = primaryDelayed ? -12 : spotDelayedLines.length > 0 ? -5 : 0;
    if (primaryDelayed) modifiers.push(`🚇 ${spotDelayedLines.slice(0, 2).join("/")} delayed`);

    // ── Weather modifier ──────────────────────────────────────────────────────
    // Rain hurts outdoor-leaning spots; nice weather gives them a boost
    let weatherPenalty = 0;
    if (n.outdoor && isRaining) {
      weatherPenalty = -10;
      modifiers.push("☔ Rain hurts outdoor spots");
    } else if (n.outdoor && isNicePlus) {
      weatherPenalty = +5;
      modifiers.push("🌤 Great night for it");
    }
    if (isCold && n.outdoor) {
      weatherPenalty -= 5;
    }

    const activityScore = Math.min(100, Math.max(0,
      barScore + timeScore + eventsScore + weekendBonus + mtaPenalty + weatherPenalty
    ));
    const hot = isActive(n.peakHour, currentHour) && activityScore >= 45;

    return {
      name: n.name,
      borough: n.borough,
      vibe: n.vibe,
      bestFor: n.bestFor,
      lines: n.lines,
      peakLabel: peakLabel(n.peakHour),
      activityScore,
      noiseCount: 0,
      isHot: hot,
      modifiers,
      eventsNearby: nearbyEvents.length,
    };
  });

  spots.sort((a, b) => b.activityScore - a.activityScore);

  const topPick = spots[0]?.name ?? "";
  const hotCount = spots.filter((s) => s.isHot).length;

  return {
    label: "Nightlife",
    detail: hotCount > 0 ? `${hotCount} neighborhood${hotCount === 1 ? "" : "s"} heating up tonight` : "Quiet night across the city",
    score: Math.min(10, Math.round(spots.slice(0, 3).reduce((s, n) => s + n.activityScore, 0) / 30)),
    spots,
    topPick,
  };
}

// ---- Total score ----
// Weights: MTA 15, Weather 15, Events 20, Noise 10, CitiBike 5, DSNY 5, TimeOfDay 30
// TimeOfDay is the most reliable, unambiguous signal of actual street activity.
// Events normalized against baseline so exceptional days push the score up.
// MTA and CitiBike reduced — baseline noise subtracted at source now.
const WEIGHTS = [15, 15, 20, 10, 5, 5, 30];

export function computeTotal(scores: number[]): number {
  const total = scores.reduce((sum, s, i) => sum + s * (WEIGHTS[i] ?? 10), 0);
  const maxPossible = WEIGHTS.reduce((sum, w) => sum + w * 10, 0);
  return Math.round((total / maxPossible) * 100);
}
