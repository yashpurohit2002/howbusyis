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
// Backgrounds shift across a continuous spectrum: slate -> blue -> teal -> green -> yellow -> amber -> orange -> rose -> red
export const VERDICTS: VerdictLevel[] = [
  // 0-4
  {
    label: "Empty.",
    subtitle: "Even the pigeons stayed home.",
    color: "#64748b",
    bg: "from-slate-950 to-gray-900",
    text: "text-slate-400",
    bar: "bg-slate-400",
    border: "border-slate-800",
  },
  // 5-9
  {
    label: "Hollow.",
    subtitle: "You could hear Canal Street echo.",
    color: "#3b82f6",
    bg: "from-slate-950 to-blue-950",
    text: "text-blue-400",
    bar: "bg-blue-400",
    border: "border-blue-900",
  },
  // 10-14
  {
    label: "Quiet.",
    subtitle: "NYC is catching its breath.",
    color: "#3b82f6",
    bg: "from-blue-950 to-blue-900",
    text: "text-blue-400",
    bar: "bg-blue-400",
    border: "border-blue-800",
  },
  // 15-19
  {
    label: "Slow.",
    subtitle: "A rare window. Take it.",
    color: "#3b82f6",
    bg: "from-blue-950 to-indigo-900",
    text: "text-blue-400",
    bar: "bg-blue-400",
    border: "border-blue-800",
  },
  // 20-24
  {
    label: "Relaxed.",
    subtitle: "The city is being polite. Suspicious.",
    color: "#2dd4bf",
    bg: "from-indigo-950 to-teal-950",
    text: "text-teal-400",
    bar: "bg-teal-400",
    border: "border-teal-800",
  },
  // 25-29
  {
    label: "Mellow.",
    subtitle: "Good day to actually move around.",
    color: "#22c55e",
    bg: "from-teal-950 to-emerald-950",
    text: "text-emerald-400",
    bar: "bg-emerald-400",
    border: "border-emerald-800",
  },
  // 30-34
  {
    label: "Chill.",
    subtitle: "NYC is being reasonable. Enjoy it.",
    color: "#22c55e",
    bg: "from-emerald-950 to-emerald-900",
    text: "text-emerald-400",
    bar: "bg-emerald-400",
    border: "border-emerald-800",
  },
  // 35-39
  {
    label: "Steady.",
    subtitle: "Normal. For New York, that's saying something.",
    color: "#22c55e",
    bg: "from-emerald-950 to-green-900",
    text: "text-emerald-400",
    bar: "bg-emerald-400",
    border: "border-emerald-800",
  },
  // 40-44
  {
    label: "Alive.",
    subtitle: "Things are starting to stir.",
    color: "#a3e635",
    bg: "from-green-950 to-lime-950",
    text: "text-lime-400",
    bar: "bg-lime-400",
    border: "border-lime-800",
  },
  // 45-49
  {
    label: "Movin'.",
    subtitle: "The city's finding its rhythm.",
    color: "#eab308",
    bg: "from-lime-950 to-yellow-950",
    text: "text-yellow-400",
    bar: "bg-yellow-400",
    border: "border-yellow-800",
  },
  // 50-54
  {
    label: "Buzzin'.",
    subtitle: "Mid-level NYC energy. Everyone's doing something.",
    color: "#eab308",
    bg: "from-yellow-950 to-yellow-900",
    text: "text-yellow-400",
    bar: "bg-yellow-400",
    border: "border-yellow-800",
  },
  // 55-59
  {
    label: "Poppin'.",
    subtitle: "You can feel it picking up.",
    color: "#f59e0b",
    bg: "from-yellow-950 to-amber-900",
    text: "text-amber-400",
    bar: "bg-amber-400",
    border: "border-amber-800",
  },
  // 60-64
  {
    label: "Busy.",
    subtitle: "Classic New York. No complaints.",
    color: "#f59e0b",
    bg: "from-amber-950 to-amber-900",
    text: "text-amber-400",
    bar: "bg-amber-400",
    border: "border-amber-800",
  },
  // 65-69
  {
    label: "Packed.",
    subtitle: "Everyone had the same idea.",
    color: "#f97316",
    bg: "from-amber-950 to-orange-900",
    text: "text-orange-400",
    bar: "bg-orange-400",
    border: "border-orange-800",
  },
  // 70-74
  {
    label: "Hectic.",
    subtitle: "This is what you signed up for.",
    color: "#f97316",
    bg: "from-orange-950 to-orange-900",
    text: "text-orange-400",
    bar: "bg-orange-400",
    border: "border-orange-800",
  },
  // 75-79
  {
    label: "Wild.",
    subtitle: "Hold tight.",
    color: "#f97316",
    bg: "from-orange-950 to-rose-950",
    text: "text-orange-400",
    bar: "bg-orange-400",
    border: "border-orange-800",
  },
  // 80-84
  {
    label: "Slammed.",
    subtitle: "The city is going all out tonight.",
    color: "#ef4444",
    bg: "from-rose-950 to-red-900",
    text: "text-red-400",
    bar: "bg-red-400",
    border: "border-red-800",
  },
  // 85-89
  {
    label: "Unhinged.",
    subtitle: "NYC at full volume.",
    color: "#ef4444",
    bg: "from-red-950 to-red-900",
    text: "text-red-400",
    bar: "bg-red-400",
    border: "border-red-800",
  },
  // 90-94
  {
    label: "Pure chaos.",
    subtitle: "Best stories start like this.",
    color: "#ef4444",
    bg: "from-red-950 to-rose-900",
    text: "text-red-400",
    bar: "bg-red-400",
    border: "border-red-800",
  },
  // 95-100
  {
    label: "Unreal.",
    subtitle: "The city has completely lost the plot. Beautifully.",
    color: "#ef4444",
    bg: "from-rose-950 to-red-950",
    text: "text-red-400",
    bar: "bg-red-400",
    border: "border-red-800",
  },
];

export function getVerdict(score: number): VerdictLevel {
  const idx = Math.min(19, Math.floor(score / 5));
  return VERDICTS[idx];
}
