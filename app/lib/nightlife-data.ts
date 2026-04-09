export interface NightlifeNeighborhood {
  name: string;
  borough: string;
  vibe: string;
  bestFor: string[];
  peakHour: number;       // hour (24h) when it typically peaks
  barDensity: number;     // 0-100: relative concentration of bars/clubs (East Village = 95)
  outdoor: boolean;       // true if the scene is significantly weather-dependent (rooftops, outdoor lines)
  lines: string[];
  bounds: [number, number, number, number]; // [minLat, maxLat, minLon, maxLon]
}

// Major NYC nightlife neighborhoods with honest personality descriptions
export const NIGHTLIFE_NEIGHBORHOODS: NightlifeNeighborhood[] = [
  {
    name: "East Village",
    borough: "Manhattan",
    vibe: "Cheap drinks, no dress code, zero attitude. The most consistently fun neighborhood in the city.",
    bestFor: ["Dive bars", "Cheap drinks", "All crowds"],
    peakHour: 23,
    barDensity: 95,
    outdoor: false,
    lines: ["L", "4", "5", "6"],
    bounds: [40.723, 40.733, -73.995, -73.975],
  },
  {
    name: "Williamsburg",
    borough: "Brooklyn",
    vibe: "Brooklyn's main stage. Rooftop bars, live music, and every type of bar in a 4-block radius.",
    bestFor: ["Live music", "Rooftop bars", "Late nights"],
    peakHour: 23,
    barDensity: 88,
    outdoor: true,
    lines: ["L", "J", "M", "Z"],
    bounds: [40.706, 40.722, -73.972, -73.940],
  },
  {
    name: "West Village",
    borough: "Manhattan",
    vibe: "Craft cocktails and wine bars. More cash, more chill, better conversation.",
    bestFor: ["Cocktail bars", "Wine bars", "Date night"],
    peakHour: 22,
    barDensity: 82,
    outdoor: false,
    lines: ["1", "A", "C", "E", "L"],
    bounds: [40.731, 40.741, -74.010, -73.999],
  },
  {
    name: "Lower East Side",
    borough: "Manhattan",
    vibe: "Underground bars and packed clubs. Does not get going until after midnight. Save your energy.",
    bestFor: ["Clubs", "Dive bars", "Late late nights"],
    peakHour: 1,
    barDensity: 80,
    outdoor: false,
    lines: ["F", "J", "M", "Z"],
    bounds: [40.713, 40.724, -73.993, -73.975],
  },
  {
    name: "Hell's Kitchen",
    borough: "Manhattan",
    vibe: "Theater crowd meets neighborhood regulars. Tons of options, never feels overwhelming.",
    bestFor: ["Bar hopping", "After theater", "Mixed crowds"],
    peakHour: 23,
    barDensity: 75,
    outdoor: false,
    lines: ["1", "2", "3", "A", "C", "E"],
    bounds: [40.755, 40.768, -74.003, -73.985],
  },
  {
    name: "Bushwick",
    borough: "Brooklyn",
    vibe: "Warehouse parties, cheap beer, no dress code. NYC's most creative and least pretentious nightlife.",
    bestFor: ["Warehouse parties", "Art events", "Late nights"],
    peakHour: 1,
    barDensity: 65,
    outdoor: true,
    lines: ["L", "J", "M", "Z"],
    bounds: [40.693, 40.710, -73.932, -73.905],
  },
  {
    name: "Chelsea",
    borough: "Manhattan",
    vibe: "Gallery openings, rooftop bars, and a mix of everything. Less of a scene, more of a vibe.",
    bestFor: ["Rooftops", "Mixed crowd", "Gallery nights"],
    peakHour: 22,
    barDensity: 62,
    outdoor: true,
    lines: ["C", "E", "1", "F", "M"],
    bounds: [40.742, 40.754, -74.005, -73.993],
  },
  {
    name: "SoHo",
    borough: "Manhattan",
    vibe: "Cocktail bars tucked between boutiques. More low-key than Meatpacking, more polished than EV. Good for a night that starts at dinner.",
    bestFor: ["Cocktail bars", "Date night", "Dinner into drinks"],
    peakHour: 22,
    barDensity: 55,
    outdoor: false,
    lines: ["C", "E", "N", "Q", "R", "W", "1"],
    bounds: [40.720, 40.728, -74.005, -73.993],
  },
  {
    name: "Meatpacking",
    borough: "Manhattan",
    vibe: "High-end clubs and model bars. Bring your card and your patience for the door.",
    bestFor: ["Clubs", "Bottle service", "High-end bars"],
    peakHour: 1,
    barDensity: 52,
    outdoor: true,
    lines: ["A", "C", "E", "L", "1", "2", "3"],
    bounds: [40.739, 40.746, -74.012, -73.999],
  },
  {
    name: "Harlem",
    borough: "Manhattan",
    vibe: "Jazz bars, soul food spots, and a vibe that does not exist anywhere else in the city.",
    bestFor: ["Jazz", "Soul food", "Authentic NYC"],
    peakHour: 23,
    barDensity: 48,
    outdoor: false,
    lines: ["2", "3", "A", "B", "C", "D"],
    bounds: [40.808, 40.820, -73.960, -73.935],
  },
  {
    name: "Crown Heights",
    borough: "Brooklyn",
    vibe: "Caribbean vibes and Brooklyn underground energy. Gets going late, stays going later.",
    bestFor: ["Late nights", "Caribbean bars", "Local scene"],
    peakHour: 0,
    barDensity: 42,
    outdoor: false,
    lines: ["2", "3", "4", "5"],
    bounds: [40.660, 40.675, -73.960, -73.940],
  },
];

// Simple time-of-day label for when a neighborhood peaks
export function peakLabel(peakHour: number): string {
  if (peakHour === 3 || peakHour === 4 || peakHour === 5) return "peaks 3am+";
  if (peakHour === 2) return "peaks around 2am";
  if (peakHour === 1) return "peaks around 1am";
  if (peakHour === 0) return "peaks around midnight";
  if (peakHour <= 19) return "starts around 7-8pm";
  if (peakHour === 20) return "peaks around 8-9pm";
  if (peakHour === 21) return "peaks around 9-10pm";
  if (peakHour === 22) return "peaks around 10-11pm";
  return "peaks around 11pm-midnight";
}

// Whether a neighborhood is "in season" for the current time
export function isActive(peakHour: number, currentHour: number): boolean {
  const diff = (peakHour - currentHour + 24) % 24;
  return diff <= 3 || diff >= 21; // within 3h of peak, or just past it
}
