export interface SignalResult {
  label: string;
  detail: string;
  score: number;
  error?: boolean;
}

// ---- MTA ----
export type LineStatus = "good" | "delayed" | "suspended" | "unknown";

export interface LineStatusEntry {
  line: string;
  status: LineStatus;
}

export interface MtaSignalResult extends SignalResult {
  lineStatuses: LineStatusEntry[];
  delayedLines: string[];
  chaosLevel: "normal" | "elevated" | "bad" | "unknown";
}

// ---- Weather ----
export interface HourlySnapshot {
  hour: string;    // e.g. "3pm"
  temp: number;
  pop: number;     // precipitation probability 0-1
  icon: string;    // emoji
}

export interface WeatherSignalResult extends SignalResult {
  temp: number;
  feelsLike: number;
  description: string;
  windSpeed: number;
  humidity: number;
  impact: string;
  hourly: HourlySnapshot[];
  scoreContribution: number;
}

// ---- Events ----
export interface EventItem {
  id: string;
  name: string;
  venue: string;
  neighborhood: string;
  borough: string;
  startTime: string;
  crowdSize: "Small" | "Medium" | "Packed";
  lines: string[];
  url?: string;
  address?: string;
  source: "ticketmaster" | "nyc-open-data";
}

export interface EventsSignalResult extends SignalResult {
  events: EventItem[];
  byBorough: Record<string, number>;
  totalToday: number;
}

// ---- Citi Bike ----
export interface CitiBikeRegion {
  name: string;
  availabilityPct: number;
  bikes: number;
  docks: number;
}

export interface CitiBikeSignalResult extends SignalResult {
  availabilityPct: number;
  availableBikes: number;
  totalDocks: number;
  regions: CitiBikeRegion[];
}

// ---- DSNY Streets ----
export interface DsnySignalResult extends SignalResult {
  streetLabel: string;
  missedFills: number;
}

// ---- Nightlife ----
export interface NightlifeSpot {
  name: string;
  borough: string;
  vibe: string;
  bestFor: string[];
  lines: string[];
  peakLabel: string;
  activityScore: number;   // 0-100, combined signal
  noiseCount: number;      // unused, kept for compat
  isHot: boolean;          // currently in peak window
  modifiers: string[];     // dynamic chips: "🎵 2 shows tonight", "🚇 L delayed", "☔ rain hurts"
  eventsNearby: number;
}

export interface NightlifeSignalResult extends SignalResult {
  spots: NightlifeSpot[];
  topPick: string;   // name of #1 neighborhood
}

// ---- Unified response ----
export interface BusyResponse {
  score: number;
  label: string;
  subtitle: string;
  color: string;
  signals: {
    mta: MtaSignalResult;
    weather: WeatherSignalResult;
    events: EventsSignalResult;
    noise: SignalResult;
    citibike: CitiBikeSignalResult;
    dsny: DsnySignalResult;
    timeOfDay: SignalResult;
    nightlife: NightlifeSignalResult;
  };
  historicalPercentile?: number;
  historicalScores?: number[];  // last 7 days, oldest first
  lastUpdated: string;
}

// ---- Verdict levels ----
export interface VerdictLevel {
  label: string;
  subtitle: string;
  color: string;
  bg: string;
  text: string;
  bar: string;
  border: string;
}

// 20 bands, 5 points each. Index 0 = 0-4, index 19 = 95-100.
export const VERDICTS: VerdictLevel[] = [
  // ── Blue: 0-19 (dead quiet) ──────────────────────────────────────────────
  {
    label: "Empty.",
    subtitle: "Even the pigeons stayed home.",
    color: "#3b82f6",
    bg: "from-blue-950 to-blue-900",
    text: "text-blue-400",
    bar: "bg-blue-400",
    border: "border-blue-800",
  },
  {
    label: "Hollow.",
    subtitle: "You could hear Canal Street echo.",
    color: "#3b82f6",
    bg: "from-blue-950 to-blue-900",
    text: "text-blue-400",
    bar: "bg-blue-400",
    border: "border-blue-800",
  },
  {
    label: "Quiet.",
    subtitle: "NYC is catching its breath.",
    color: "#3b82f6",
    bg: "from-blue-950 to-blue-900",
    text: "text-blue-400",
    bar: "bg-blue-400",
    border: "border-blue-800",
  },
  {
    label: "Slow.",
    subtitle: "A rare window. Take it.",
    color: "#3b82f6",
    bg: "from-blue-950 to-blue-900",
    text: "text-blue-400",
    bar: "bg-blue-400",
    border: "border-blue-800",
  },
  // ── Emerald: 20-39 (chill) ───────────────────────────────────────────────
  {
    label: "Relaxed.",
    subtitle: "The city is being polite. Suspicious.",
    color: "#22c55e",
    bg: "from-emerald-950 to-emerald-900",
    text: "text-emerald-400",
    bar: "bg-emerald-400",
    border: "border-emerald-800",
  },
  {
    label: "Mellow.",
    subtitle: "Good day to actually move around.",
    color: "#22c55e",
    bg: "from-emerald-950 to-emerald-900",
    text: "text-emerald-400",
    bar: "bg-emerald-400",
    border: "border-emerald-800",
  },
  {
    label: "Chill.",
    subtitle: "NYC is being reasonable. Enjoy it.",
    color: "#22c55e",
    bg: "from-emerald-950 to-emerald-900",
    text: "text-emerald-400",
    bar: "bg-emerald-400",
    border: "border-emerald-800",
  },
  {
    label: "Steady.",
    subtitle: "Normal. For New York, that's saying something.",
    color: "#22c55e",
    bg: "from-emerald-950 to-emerald-900",
    text: "text-emerald-400",
    bar: "bg-emerald-400",
    border: "border-emerald-800",
  },
  // ── Yellow: 40-59 (building energy) ─────────────────────────────────────
  {
    label: "Alive.",
    subtitle: "Things are starting to stir.",
    color: "#eab308",
    bg: "from-yellow-950 to-yellow-900",
    text: "text-yellow-400",
    bar: "bg-yellow-400",
    border: "border-yellow-800",
  },
  {
    label: "Movin'.",
    subtitle: "The city's finding its rhythm.",
    color: "#eab308",
    bg: "from-yellow-950 to-yellow-900",
    text: "text-yellow-400",
    bar: "bg-yellow-400",
    border: "border-yellow-800",
  },
  {
    label: "Buzzin'.",
    subtitle: "Mid-level NYC energy. Everyone's doing something.",
    color: "#eab308",
    bg: "from-yellow-950 to-yellow-900",
    text: "text-yellow-400",
    bar: "bg-yellow-400",
    border: "border-yellow-800",
  },
  {
    label: "Poppin'.",
    subtitle: "You can feel it picking up.",
    color: "#eab308",
    bg: "from-yellow-950 to-yellow-900",
    text: "text-yellow-400",
    bar: "bg-yellow-400",
    border: "border-yellow-800",
  },
  // ── Orange: 60-79 (hectic) ───────────────────────────────────────────────
  {
    label: "Busy.",
    subtitle: "Classic New York. No complaints.",
    color: "#f97316",
    bg: "from-orange-950 to-orange-900",
    text: "text-orange-400",
    bar: "bg-orange-400",
    border: "border-orange-800",
  },
  {
    label: "Packed.",
    subtitle: "Everyone had the same idea.",
    color: "#f97316",
    bg: "from-orange-950 to-orange-900",
    text: "text-orange-400",
    bar: "bg-orange-400",
    border: "border-orange-800",
  },
  {
    label: "Hectic.",
    subtitle: "This is what you signed up for.",
    color: "#f97316",
    bg: "from-orange-950 to-orange-900",
    text: "text-orange-400",
    bar: "bg-orange-400",
    border: "border-orange-800",
  },
  {
    label: "Wild.",
    subtitle: "Hold tight.",
    color: "#f97316",
    bg: "from-orange-950 to-orange-900",
    text: "text-orange-400",
    bar: "bg-orange-400",
    border: "border-orange-800",
  },
  // ── Red: 80-100 (chaos) ──────────────────────────────────────────────────
  {
    label: "Slammed.",
    subtitle: "The city is going all out tonight.",
    color: "#ef4444",
    bg: "from-red-950 to-red-900",
    text: "text-red-400",
    bar: "bg-red-400",
    border: "border-red-800",
  },
  {
    label: "Unhinged.",
    subtitle: "NYC at full volume.",
    color: "#ef4444",
    bg: "from-red-950 to-red-900",
    text: "text-red-400",
    bar: "bg-red-400",
    border: "border-red-800",
  },
  {
    label: "Pure chaos.",
    subtitle: "Best stories start like this.",
    color: "#ef4444",
    bg: "from-red-950 to-red-900",
    text: "text-red-400",
    bar: "bg-red-400",
    border: "border-red-800",
  },
  {
    label: "Unreal.",
    subtitle: "The city has completely lost the plot. Beautifully.",
    color: "#ef4444",
    bg: "from-red-950 to-red-900",
    text: "text-red-400",
    bar: "bg-red-400",
    border: "border-red-800",
  },
];

export function getVerdict(score: number): VerdictLevel {
  const idx = Math.min(19, Math.floor(score / 5));
  return VERDICTS[idx];
}
