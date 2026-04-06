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
  noiseCount: number;      // raw 311 noise complaints nearby (last 6h)
  isHot: boolean;          // currently in peak window
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

export const VERDICTS: VerdictLevel[] = [
  {
    label: "Ghost town.",
    subtitle: "Your move, explorer.",
    color: "#3b82f6",
    bg: "from-blue-950 to-blue-900",
    text: "text-blue-400",
    bar: "bg-blue-400",
    border: "border-blue-800",
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
    label: "Buzzing.",
    subtitle: "The city's got a pulse tonight.",
    color: "#eab308",
    bg: "from-yellow-950 to-yellow-900",
    text: "text-yellow-400",
    bar: "bg-yellow-400",
    border: "border-yellow-800",
  },
  {
    label: "Hectic.",
    subtitle: "This is what you came for.",
    color: "#f97316",
    bg: "from-orange-950 to-orange-900",
    text: "text-orange-400",
    bar: "bg-orange-400",
    border: "border-orange-800",
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
];

export function getVerdict(score: number): VerdictLevel {
  if (score <= 20) return VERDICTS[0];
  if (score <= 40) return VERDICTS[1];
  if (score <= 60) return VERDICTS[2];
  if (score <= 80) return VERDICTS[3];
  return VERDICTS[4];
}
