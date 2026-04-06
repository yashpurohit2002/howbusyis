export interface NightlifeNeighborhood {
  name: string;
  borough: string;
  vibe: string;
  bestFor: string[];
  peakHour: number;       // hour (24h) when it typically peaks
  lines: string[];
  bounds: [number, number, number, number]; // [minLat, maxLat, minLon, maxLon]
}

// Major NYC nightlife neighborhoods with honest personality descriptions
export const NIGHTLIFE_NEIGHBORHOODS: NightlifeNeighborhood[] = [
  {
    name: "Williamsburg",
    borough: "Brooklyn",
    vibe: "Brooklyn's main stage. Rooftop bars, live music, and every type of bar in a 4-block radius.",
    bestFor: ["Live music", "Rooftop bars", "Late nights"],
    peakHour: 22,
    lines: ["L", "J", "M", "Z"],
    bounds: [40.706, 40.722, -73.972, -73.940],
  },
  {
    name: "Lower East Side",
    borough: "Manhattan",
    vibe: "Underground bars and packed clubs. Does not get going until after midnight. Save your energy.",
    bestFor: ["Clubs", "Dive bars", "Late late nights"],
    peakHour: 1,
    lines: ["F", "J", "M", "Z"],
    bounds: [40.713, 40.724, -73.993, -73.975],
  },
  {
    name: "East Village",
    borough: "Manhattan",
    vibe: "Cheap drinks, no dress code, zero attitude. The most consistently fun neighborhood in the city.",
    bestFor: ["Dive bars", "Cheap drinks", "All crowds"],
    peakHour: 22,
    lines: ["L", "4", "5", "6"],
    bounds: [40.723, 40.733, -73.995, -73.975],
  },
  {
    name: "West Village",
    borough: "Manhattan",
    vibe: "Craft cocktails and wine bars. More cash, more chill, better conversation.",
    bestFor: ["Cocktail bars", "Wine bars", "Date night"],
    peakHour: 21,
    lines: ["1", "A", "C", "E", "L"],
    bounds: [40.731, 40.741, -74.010, -73.999],
  },
  {
    name: "Hell's Kitchen",
    borough: "Manhattan",
    vibe: "Theater crowd meets neighborhood regulars. Tons of options, never feels overwhelming.",
    bestFor: ["Bar hopping", "After theater", "Mixed crowds"],
    peakHour: 22,
    lines: ["1", "2", "3", "A", "C", "E"],
    bounds: [40.755, 40.768, -74.003, -73.985],
  },
  {
    name: "Murray Hill",
    borough: "Manhattan",
    vibe: "Loud bars and beer pong. College energy, rowdy on weekends, dead on weeknights.",
    bestFor: ["Weekend nights", "Groups", "Beer bars"],
    peakHour: 23,
    lines: ["4", "5", "6"],
    bounds: [40.744, 40.754, -73.985, -73.970],
  },
  {
    name: "Bushwick",
    borough: "Brooklyn",
    vibe: "Arts crowd, warehouse parties, cheap beer. NYC's most creative and least pretentious nightlife.",
    bestFor: ["Warehouse parties", "Art events", "Late nights"],
    peakHour: 0,
    lines: ["L", "J", "M", "Z"],
    bounds: [40.693, 40.710, -73.932, -73.905],
  },
  {
    name: "Astoria",
    borough: "Queens",
    vibe: "Neighborhood bars with a local feel. Half the price of Manhattan, twice as chill.",
    bestFor: ["Local bars", "Greek food", "Chill nights"],
    peakHour: 21,
    lines: ["N", "W"],
    bounds: [40.765, 40.780, -73.940, -73.915],
  },
  {
    name: "Crown Heights",
    borough: "Brooklyn",
    vibe: "Caribbean vibes and Brooklyn underground energy. Gets going late, stays going later.",
    bestFor: ["Late nights", "Caribbean bars", "Local scene"],
    peakHour: 23,
    lines: ["2", "3", "4", "5"],
    bounds: [40.660, 40.675, -73.960, -73.940],
  },
  {
    name: "Harlem",
    borough: "Manhattan",
    vibe: "Jazz bars, soul food spots, and a vibe that does not exist anywhere else in the city.",
    bestFor: ["Jazz", "Soul food", "Authentic NYC"],
    peakHour: 22,
    lines: ["2", "3", "A", "B", "C", "D"],
    bounds: [40.808, 40.820, -73.960, -73.935],
  },
  {
    name: "Meatpacking",
    borough: "Manhattan",
    vibe: "High-end clubs and model bars. Bring your card and your patience for the door.",
    bestFor: ["Clubs", "Bottle service", "High-end bars"],
    peakHour: 23,
    lines: ["A", "C", "E", "L", "1", "2", "3"],
    bounds: [40.739, 40.746, -74.012, -73.999],
  },
  {
    name: "Long Island City",
    borough: "Queens",
    vibe: "Rooftop bars with Manhattan views at half the price. Up-and-coming, underrated.",
    bestFor: ["Rooftops", "Views", "Pre-drinks"],
    peakHour: 21,
    lines: ["7", "E", "M", "N", "W"],
    bounds: [40.741, 40.752, -73.952, -73.933],
  },
];

// Simple time-of-day label for when a neighborhood peaks
export function peakLabel(peakHour: number): string {
  if (peakHour >= 0 && peakHour < 6) return "peaks after midnight";
  if (peakHour < 20) return "starts early";
  if (peakHour < 22) return "peaks around 9-10pm";
  if (peakHour < 23) return "peaks around 10-11pm";
  return "peaks around 11pm+";
}

// Whether a neighborhood is "in season" for the current time
export function isActive(peakHour: number, currentHour: number): boolean {
  const diff = (peakHour - currentHour + 24) % 24;
  return diff <= 3 || diff >= 21; // within 3h of peak, or just past it
}
