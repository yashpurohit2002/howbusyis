// NYC subway station database with verified MTA GTFS-RT stop IDs
// Direction suffix: N = uptown/toward Manhattan terminal, S = downtown/toward Brooklyn terminal
// For L/7: N = toward Manhattan, S = toward outer borough

export interface StopPlatform {
  lines: string[];
  gtfsId: string; // base stop ID, append N or S for direction
  feed: string;   // GTFS-RT feed name
}

export interface SubwayStation {
  name: string;
  lat: number;
  lon: number;
  platforms: StopPlatform[];
}

export const MTA_FEED_BASE = "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2F";

export const FEED_FOR_LINE: Record<string, string> = {
  "1": "gtfs", "2": "gtfs", "3": "gtfs",
  "4": "gtfs", "5": "gtfs", "6": "gtfs",
  "7": "gtfs-7",
  "A": "gtfs-ace", "C": "gtfs-ace", "E": "gtfs-ace",
  "B": "gtfs-bdfm", "D": "gtfs-bdfm", "F": "gtfs-bdfm", "M": "gtfs-bdfm",
  "G": "gtfs-g",
  "J": "gtfs-jz", "Z": "gtfs-jz",
  "L": "gtfs-l",
  "N": "gtfs-nqrw", "Q": "gtfs-nqrw", "R": "gtfs-nqrw", "W": "gtfs-nqrw",
  "S": "gtfs",
  "SIR": "gtfs-si",
};

// For L and 7 trains: direction is E-W, not N-S
// N suffix = toward Manhattan (west), S suffix = toward outer borough (east)
export const EW_LINES = new Set(["L", "7"]);

// Human-readable direction labels
export function getDirectionLabel(line: string, dir: "N" | "S"): string {
  if (line === "L") return dir === "N" ? "towards 8 Av" : "towards Canarsie";
  if (line === "7") return dir === "N" ? "towards Hudson Yards" : "towards Flushing-Main St";
  if (line === "G") return dir === "N" ? "towards Court Sq" : "towards Church Av";
  return dir === "N" ? "uptown" : "downtown";
}

// Which GTFS direction (N/S) to use based on origin/destination coords
export function getGtfsDir(
  line: string,
  originLat: number, originLon: number,
  destLat: number, destLon: number
): "N" | "S" {
  if (EW_LINES.has(line)) {
    // N = towards Manhattan (more negative lon in NYC = further west)
    return destLon < originLon ? "N" : "S";
  }
  return destLat > originLat ? "N" : "S";
}

// Find the best platform for a given line at this station
export function getPlatformForLine(
  station: SubwayStation,
  line: string
): StopPlatform | undefined {
  return station.platforms.find((p) => p.lines.includes(line));
}

// Haversine distance in meters
export function stationDistM(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

// Find nearest station to a point that serves at least one of the given lines
export function nearestStation(
  lat: number, lon: number, lines: string[]
): { station: SubwayStation; distM: number } | null {
  let best: { station: SubwayStation; distM: number } | null = null;
  for (const station of SUBWAY_STATIONS) {
    const servesLine = lines.length === 0 || lines.some((l) =>
      station.platforms.some((p) => p.lines.includes(l))
    );
    if (!servesLine) continue;
    const d = stationDistM(lat, lon, station.lat, station.lon);
    if (!best || d < best.distM) best = { station, distM: d };
  }
  return best;
}

export const SUBWAY_STATIONS: SubwayStation[] = [
  // ── Uptown Manhattan ──────────────────────────────────────────────────────
  {
    name: "125 St",
    lat: 40.8142, lon: -73.9496,
    platforms: [
      { lines: ["A","B","C","D"], gtfsId: "A06", feed: "gtfs-ace" },
    ],
  },
  {
    name: "116 St-Columbia",
    lat: 40.8077, lon: -73.9642,
    platforms: [
      { lines: ["1"], gtfsId: "114", feed: "gtfs" },
    ],
  },
  {
    name: "96 St",
    lat: 40.7943, lon: -73.9723,
    platforms: [
      { lines: ["1","2","3"], gtfsId: "117", feed: "gtfs" },
      { lines: ["4","5","6"], gtfsId: "619", feed: "gtfs" },
    ],
  },
  {
    name: "86 St",
    lat: 40.7782, lon: -73.9546,
    platforms: [
      { lines: ["4","5","6"], gtfsId: "621", feed: "gtfs" },
      { lines: ["Q"], gtfsId: "Q05", feed: "gtfs-nqrw" },
    ],
  },
  {
    name: "81 St-Museum of Natural History",
    lat: 40.7815, lon: -73.9721,
    platforms: [
      { lines: ["B","C"], gtfsId: "A42", feed: "gtfs-ace" },
    ],
  },
  {
    name: "79 St",
    lat: 40.7835, lon: -73.9789,
    platforms: [
      { lines: ["1"], gtfsId: "119", feed: "gtfs" },
    ],
  },
  {
    name: "72 St",
    lat: 40.7760, lon: -73.9818,
    platforms: [
      { lines: ["1","2","3"], gtfsId: "120", feed: "gtfs" },
      { lines: ["B","C"], gtfsId: "A41", feed: "gtfs-ace" },
    ],
  },
  {
    name: "68 St-Hunter College",
    lat: 40.7680, lon: -73.9641,
    platforms: [
      { lines: ["6"], gtfsId: "623", feed: "gtfs" },
    ],
  },
  {
    name: "66 St-Lincoln Center",
    lat: 40.7745, lon: -73.9831,
    platforms: [
      { lines: ["1"], gtfsId: "121", feed: "gtfs" },
    ],
  },
  {
    name: "59 St-Columbus Circle",
    lat: 40.7685, lon: -73.9819,
    platforms: [
      { lines: ["1"], gtfsId: "122", feed: "gtfs" },
      { lines: ["A","B","C","D"], gtfsId: "A26", feed: "gtfs-ace" },
    ],
  },
  {
    name: "59 St (Lex)",
    lat: 40.7625, lon: -73.9677,
    platforms: [
      { lines: ["4","5","6"], gtfsId: "624", feed: "gtfs" },
      { lines: ["N","Q","R","W"], gtfsId: "B08", feed: "gtfs-nqrw" },
    ],
  },
  // ── Midtown ───────────────────────────────────────────────────────────────
  {
    name: "Times Sq-42 St",
    lat: 40.7556, lon: -73.9872,
    platforms: [
      { lines: ["1","2","3"], gtfsId: "127", feed: "gtfs" },
      { lines: ["N","Q","R","W"], gtfsId: "R16", feed: "gtfs-nqrw" },
      { lines: ["A","C","E"], gtfsId: "A27", feed: "gtfs-ace" },
    ],
  },
  {
    name: "Grand Central-42 St",
    lat: 40.7527, lon: -73.9772,
    platforms: [
      { lines: ["4","5","6"], gtfsId: "631", feed: "gtfs" },
    ],
  },
  {
    name: "Bryant Park-42 St",
    lat: 40.7540, lon: -73.9840,
    platforms: [
      { lines: ["B","D","F","M"], gtfsId: "D16", feed: "gtfs-bdfm" },
    ],
  },
  {
    name: "34 St-Penn Station",
    lat: 40.7502, lon: -73.9913,
    platforms: [
      { lines: ["1","2","3"], gtfsId: "128", feed: "gtfs" },
      { lines: ["A","C","E"], gtfsId: "A28", feed: "gtfs-ace" },
    ],
  },
  {
    name: "34 St-Herald Sq",
    lat: 40.7497, lon: -73.9877,
    platforms: [
      { lines: ["B","D","F","M"], gtfsId: "D17", feed: "gtfs-bdfm" },
      { lines: ["N","Q","R","W"], gtfsId: "R17", feed: "gtfs-nqrw" },
    ],
  },
  {
    name: "23 St",
    lat: 40.7429, lon: -73.9925,
    platforms: [
      { lines: ["1"], gtfsId: "130", feed: "gtfs" },
      { lines: ["F","M"], gtfsId: "D18", feed: "gtfs-bdfm" },
      { lines: ["N","Q","R","W"], gtfsId: "R19", feed: "gtfs-nqrw" },
    ],
  },
  // ── Union Square / Village ────────────────────────────────────────────────
  {
    name: "14 St-Union Sq",
    lat: 40.7359, lon: -73.9906,
    platforms: [
      { lines: ["4","5","6"], gtfsId: "635", feed: "gtfs" },
      { lines: ["L"], gtfsId: "L03", feed: "gtfs-l" },
      { lines: ["N","Q","R","W"], gtfsId: "R20", feed: "gtfs-nqrw" },
    ],
  },
  {
    name: "8 Av (L)",
    lat: 40.7396, lon: -74.0019,
    platforms: [
      { lines: ["L"], gtfsId: "L01", feed: "gtfs-l" },
    ],
  },
  {
    name: "6 Av (L)",
    lat: 40.7378, lon: -73.9962,
    platforms: [
      { lines: ["L"], gtfsId: "L02", feed: "gtfs-l" },
    ],
  },
  {
    name: "3 Av (L)",
    lat: 40.7325, lon: -73.9863,
    platforms: [
      { lines: ["L"], gtfsId: "L05", feed: "gtfs-l" },
    ],
  },
  {
    name: "1 Av (L)",
    lat: 40.7314, lon: -73.9759,
    platforms: [
      { lines: ["L"], gtfsId: "L06", feed: "gtfs-l" },
    ],
  },
  {
    name: "Astor Place",
    lat: 40.7302, lon: -73.9916,
    platforms: [
      { lines: ["6"], gtfsId: "636", feed: "gtfs" },
    ],
  },
  {
    name: "West 4 St",
    lat: 40.7324, lon: -74.0001,
    platforms: [
      { lines: ["A","C","E"], gtfsId: "A31", feed: "gtfs-ace" },
      { lines: ["B","D","F","M"], gtfsId: "D20", feed: "gtfs-bdfm" },
    ],
  },
  {
    name: "Bleecker St",
    lat: 40.7256, lon: -73.9987,
    platforms: [
      { lines: ["6"], gtfsId: "637", feed: "gtfs" },
    ],
  },
  {
    name: "Broadway-Lafayette",
    lat: 40.7256, lon: -73.9961,
    platforms: [
      { lines: ["B","D","F","M"], gtfsId: "D21", feed: "gtfs-bdfm" },
    ],
  },
  // ── SoHo / Tribeca / Downtown ─────────────────────────────────────────────
  {
    name: "Spring St",
    lat: 40.7225, lon: -74.0030,
    platforms: [
      { lines: ["6"], gtfsId: "638", feed: "gtfs" },
      { lines: ["C","E"], gtfsId: "A32", feed: "gtfs-ace" },
    ],
  },
  {
    name: "Houston St",
    lat: 40.7282, lon: -74.0051,
    platforms: [
      { lines: ["1"], gtfsId: "133", feed: "gtfs" },
    ],
  },
  {
    name: "Canal St",
    lat: 40.7190, lon: -74.0001,
    platforms: [
      { lines: ["1"], gtfsId: "134", feed: "gtfs" },
      { lines: ["6"], gtfsId: "639", feed: "gtfs" },
      { lines: ["A","C","E"], gtfsId: "A33", feed: "gtfs-ace" },
      { lines: ["N","Q","R","W"], gtfsId: "R23", feed: "gtfs-nqrw" },
      { lines: ["J","Z"], gtfsId: "J28", feed: "gtfs-jz" },
    ],
  },
  {
    name: "Chambers St",
    lat: 40.7135, lon: -74.0084,
    platforms: [
      { lines: ["1","2","3"], gtfsId: "135", feed: "gtfs" },
    ],
  },
  {
    name: "Fulton St",
    lat: 40.7092, lon: -74.0076,
    platforms: [
      { lines: ["2","3"], gtfsId: "229", feed: "gtfs" },
      { lines: ["4","5"], gtfsId: "418", feed: "gtfs" },
      { lines: ["A","C"], gtfsId: "A36", feed: "gtfs-ace" },
      { lines: ["J","Z"], gtfsId: "J27", feed: "gtfs-jz" },
    ],
  },
  {
    name: "Delancey St-Essex St",
    lat: 40.7182, lon: -73.9873,
    platforms: [
      { lines: ["F"], gtfsId: "F15", feed: "gtfs-bdfm" },
      { lines: ["J","M","Z"], gtfsId: "M18", feed: "gtfs-jz" },
    ],
  },
  {
    name: "2 Av (F)",
    lat: 40.7237, lon: -73.9897,
    platforms: [
      { lines: ["F"], gtfsId: "F12", feed: "gtfs-bdfm" },
    ],
  },
  // ── Brooklyn ──────────────────────────────────────────────────────────────
  {
    name: "Atlantic Av-Barclays Ctr",
    lat: 40.6840, lon: -73.9775,
    platforms: [
      { lines: ["2","3"], gtfsId: "235", feed: "gtfs" },
      { lines: ["4","5"], gtfsId: "D26", feed: "gtfs-bdfm" }, // shares with B/D/Q at Barclays
      { lines: ["B","Q"], gtfsId: "D26", feed: "gtfs-bdfm" },
      { lines: ["N","R"], gtfsId: "R31", feed: "gtfs-nqrw" },
    ],
  },
  {
    name: "Bedford Av (L)",
    lat: 40.7170, lon: -73.9563,
    platforms: [
      { lines: ["L"], gtfsId: "L08", feed: "gtfs-l" },
    ],
  },
  {
    name: "Broadway Junction",
    lat: 40.6786, lon: -73.9049,
    platforms: [
      { lines: ["A","C"], gtfsId: "A48", feed: "gtfs-ace" },
      { lines: ["J","Z"], gtfsId: "J22", feed: "gtfs-jz" },
      { lines: ["L"], gtfsId: "L20", feed: "gtfs-l" },
    ],
  },
  {
    name: "Jay St-MetroTech",
    lat: 40.6922, lon: -73.9877,
    platforms: [
      { lines: ["A","C","F"], gtfsId: "A41", feed: "gtfs-ace" },
      { lines: ["R"], gtfsId: "R29", feed: "gtfs-nqrw" },
    ],
  },
  {
    name: "Dekalb Av",
    lat: 40.6917, lon: -73.9817,
    platforms: [
      { lines: ["B","Q","R"], gtfsId: "D24", feed: "gtfs-bdfm" },
      { lines: ["N"], gtfsId: "R30", feed: "gtfs-nqrw" },
    ],
  },
  // ── Queens ────────────────────────────────────────────────────────────────
  {
    name: "Court Sq",
    lat: 40.7472, lon: -73.9452,
    platforms: [
      { lines: ["G"], gtfsId: "G22", feed: "gtfs-g" },
      { lines: ["7"], gtfsId: "719", feed: "gtfs-7" },
      { lines: ["E","M"], gtfsId: "F09", feed: "gtfs-bdfm" },
    ],
  },
  {
    name: "Jackson Hts-Roosevelt Av",
    lat: 40.7557, lon: -73.8831,
    platforms: [
      { lines: ["7"], gtfsId: "713", feed: "gtfs-7" },
      { lines: ["E","F","M","R"], gtfsId: "F11", feed: "gtfs-bdfm" },
    ],
  },
  {
    name: "Queensboro Plaza",
    lat: 40.7502, lon: -73.9402,
    platforms: [
      { lines: ["N","W"], gtfsId: "B13", feed: "gtfs-nqrw" },
      { lines: ["7"], gtfsId: "707", feed: "gtfs-7" },
    ],
  },
];
