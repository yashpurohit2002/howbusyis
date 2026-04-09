// NYC subway line colors (official MTA palette)
export const LINE_COLORS: Record<string, string> = {
  "1": "#EE352E", "2": "#EE352E", "3": "#EE352E",
  "4": "#00933C", "5": "#00933C", "6": "#00933C",
  "7": "#B933AD",
  "A": "#0039A6", "C": "#0039A6", "E": "#0039A6",
  "B": "#FF6319", "D": "#FF6319", "F": "#FF6319", "M": "#FF6319",
  "G": "#6CBE45",
  "J": "#996633", "Z": "#996633",
  "L": "#A7A9AC",
  "N": "#FCCC0A", "Q": "#FCCC0A", "R": "#FCCC0A", "W": "#FCCC0A",
  "S": "#808183",
  "SIR": "#0039A6",
};

// All active NYC subway lines in display order
export const ALL_LINES = [
  "1","2","3","4","5","6","7",
  "A","C","E","B","D","F","M","G","J","Z","L","N","Q","R","W",
  "S","SIR",
];

// Neighborhood -> primary subway lines + approximate center coords
export const NEIGHBORHOOD_LINES: Record<string, { lines: string[]; borough: string; lat: number; lon: number }> = {
  // Manhattan
  "financial district":    { lines: ["1","2","3","4","5","A","C","J","Z","R","W"], borough: "Manhattan", lat: 40.7074, lon: -74.0113 },
  "tribeca":               { lines: ["1","2","3","A","C","E"], borough: "Manhattan", lat: 40.7163, lon: -74.0086 },
  "soho":                  { lines: ["C","E","N","Q","R","W","1","6"], borough: "Manhattan", lat: 40.7233, lon: -74.0030 },
  "lower east side":       { lines: ["F","J","M","Z","B","D"], borough: "Manhattan", lat: 40.7153, lon: -73.9839 },
  "east village":          { lines: ["L","4","5","6","N","Q","R","W"], borough: "Manhattan", lat: 40.7265, lon: -73.9815 },
  "west village":          { lines: ["1","A","C","E","L"], borough: "Manhattan", lat: 40.7338, lon: -74.0059 },
  "chelsea":               { lines: ["1","C","E","F","M"], borough: "Manhattan", lat: 40.7465, lon: -74.0014 },
  "gramercy":              { lines: ["4","5","6","L","N","Q","R","W"], borough: "Manhattan", lat: 40.7375, lon: -73.9836 },
  "union square":          { lines: ["4","5","6","L","N","Q","R","W"], borough: "Manhattan", lat: 40.7359, lon: -73.9911 },
  "midtown":               { lines: ["1","2","3","4","5","6","7","A","C","E","B","D","F","M","N","Q","R","W"], borough: "Manhattan", lat: 40.7549, lon: -73.9840 },
  "hell's kitchen":        { lines: ["1","2","3","A","C","E"], borough: "Manhattan", lat: 40.7638, lon: -73.9918 },
  "times square":          { lines: ["1","2","3","7","A","C","E","N","Q","R","W","S"], borough: "Manhattan", lat: 40.7580, lon: -73.9855 },
  "upper east side":       { lines: ["4","5","6","Q"], borough: "Manhattan", lat: 40.7736, lon: -73.9566 },
  "upper west side":       { lines: ["1","2","3","B","C"], borough: "Manhattan", lat: 40.7870, lon: -73.9754 },
  "harlem":                { lines: ["2","3","4","5","6","A","B","C","D"], borough: "Manhattan", lat: 40.8116, lon: -73.9465 },
  "washington heights":    { lines: ["A","1"], borough: "Manhattan", lat: 40.8448, lon: -73.9393 },
  "inwood":                { lines: ["A","1"], borough: "Manhattan", lat: 40.8677, lon: -73.9212 },
  // Brooklyn
  "brooklyn heights":      { lines: ["2","3","4","5","R"], borough: "Brooklyn", lat: 40.6960, lon: -73.9938 },
  "dumbo":                 { lines: ["A","C","F"], borough: "Brooklyn", lat: 40.7033, lon: -73.9894 },
  "downtown brooklyn":     { lines: ["2","3","4","5","A","C","F","G","N","Q","R"], borough: "Brooklyn", lat: 40.6928, lon: -73.9903 },
  "williamsburg":          { lines: ["L","J","M","Z"], borough: "Brooklyn", lat: 40.7081, lon: -73.9571 },
  "bushwick":              { lines: ["L","J","M","Z"], borough: "Brooklyn", lat: 40.6940, lon: -73.9218 },
  "bedford-stuyvesant":    { lines: ["A","C","G","J"], borough: "Brooklyn", lat: 40.6872, lon: -73.9418 },
  "crown heights":         { lines: ["2","3","4","5"], borough: "Brooklyn", lat: 40.6694, lon: -73.9429 },
  "park slope":            { lines: ["F","G","R"], borough: "Brooklyn", lat: 40.6710, lon: -73.9814 },
  "prospect heights":      { lines: ["2","3","B","Q"], borough: "Brooklyn", lat: 40.6771, lon: -73.9696 },
  "greenpoint":            { lines: ["G"], borough: "Brooklyn", lat: 40.7298, lon: -73.9541 },
  "red hook":              { lines: ["F","G"], borough: "Brooklyn", lat: 40.6752, lon: -74.0099 },
  "flatbush":              { lines: ["B","Q","2"], borough: "Brooklyn", lat: 40.6501, lon: -73.9496 },
  "bay ridge":             { lines: ["R"], borough: "Brooklyn", lat: 40.6350, lon: -74.0271 },
  "bensonhurst":           { lines: ["D","N"], borough: "Brooklyn", lat: 40.6009, lon: -73.9981 },
  "coney island":          { lines: ["D","F","N","Q"], borough: "Brooklyn", lat: 40.5749, lon: -73.9850 },
  "borough park":          { lines: ["D","F","N"], borough: "Brooklyn", lat: 40.6355, lon: -73.9966 },
  // Queens
  "astoria":               { lines: ["N","W"], borough: "Queens", lat: 40.7721, lon: -73.9302 },
  "long island city":      { lines: ["7","E","M","N","W"], borough: "Queens", lat: 40.7448, lon: -73.9483 },
  "jackson heights":       { lines: ["7","E","F","M","R"], borough: "Queens", lat: 40.7557, lon: -73.8831 },
  "flushing":              { lines: ["7"], borough: "Queens", lat: 40.7675, lon: -73.8330 },
  "forest hills":          { lines: ["E","F","M","R"], borough: "Queens", lat: 40.7196, lon: -73.8449 },
  "rego park":             { lines: ["M","R"], borough: "Queens", lat: 40.7265, lon: -73.8637 },
  "jamaica":               { lines: ["E","J","Z"], borough: "Queens", lat: 40.7028, lon: -73.7876 },
  "ridgewood":             { lines: ["L","M"], borough: "Queens", lat: 40.7007, lon: -73.9034 },
  "sunnyside":             { lines: ["7"], borough: "Queens", lat: 40.7441, lon: -73.9195 },
  // Bronx
  "south bronx":           { lines: ["2","5","6"], borough: "Bronx", lat: 40.8098, lon: -73.9196 },
  "fordham":               { lines: ["B","D","4"], borough: "Bronx", lat: 40.8610, lon: -73.8988 },
  "pelham bay":            { lines: ["6"], borough: "Bronx", lat: 40.8527, lon: -73.8287 },
  "riverdale":             { lines: ["1"], borough: "Bronx", lat: 40.8984, lon: -73.9126 },
  "mott haven":            { lines: ["4","5","6"], borough: "Bronx", lat: 40.8077, lon: -73.9264 },
  // Staten Island
  "st george":             { lines: ["SIR"], borough: "Staten Island", lat: 40.6443, lon: -74.0735 },
  "staten island":         { lines: ["SIR"], borough: "Staten Island", lat: 40.5795, lon: -74.1502 },
};

// Major transfer hubs for trip planner routing
export const TRANSFER_HUBS: Array<{
  name: string;
  lines: string[];
}> = [
  { name: "Times Sq / 42nd St", lines: ["1","2","3","7","A","C","E","N","Q","R","W","S"] },
  { name: "Union Square / 14th St", lines: ["4","5","6","L","N","Q","R","W"] },
  { name: "Atlantic Terminal / Barclays", lines: ["2","3","4","5","B","D","N","Q","R"] },
  { name: "Jay St-MetroTech", lines: ["A","C","F","R"] },
  { name: "Broadway Junction", lines: ["A","C","J","L","Z"] },
  { name: "Fulton St", lines: ["2","3","4","5","A","C","J","Z"] },
  { name: "Queensboro Plaza", lines: ["7","N","W"] },
  { name: "Jackson Hts-Roosevelt Av", lines: ["E","F","M","R","7"] },
  { name: "Jamaica", lines: ["E","J","Z"] },
  { name: "14th St / 8th Av", lines: ["A","C","E","L"] },
  { name: "Herald Square", lines: ["B","D","F","M","N","Q","R","W"] },
  { name: "59th St Columbus Circle", lines: ["1","A","B","C","D"] },
];

// Venue name fragments to neighborhood mapping (for Ticketmaster venue parsing)
export const VENUE_NEIGHBORHOOD: Array<{ match: string; neighborhood: string; borough: string }> = [
  { match: "Madison Square Garden", neighborhood: "midtown", borough: "Manhattan" },
  { match: "MSG", neighborhood: "midtown", borough: "Manhattan" },
  { match: "Barclays", neighborhood: "downtown brooklyn", borough: "Brooklyn" },
  { match: "Yankee Stadium", neighborhood: "south bronx", borough: "Bronx" },
  { match: "Citi Field", neighborhood: "flushing", borough: "Queens" },
  { match: "UBS Arena", neighborhood: "jamaica", borough: "Queens" },
  { match: "Radio City", neighborhood: "midtown", borough: "Manhattan" },
  { match: "Carnegie Hall", neighborhood: "midtown", borough: "Manhattan" },
  { match: "Brooklyn Steel", neighborhood: "williamsburg", borough: "Brooklyn" },
  { match: "Irving Plaza", neighborhood: "union square", borough: "Manhattan" },
  { match: "Webster Hall", neighborhood: "east village", borough: "Manhattan" },
  { match: "Terminal 5", neighborhood: "hell's kitchen", borough: "Manhattan" },
  { match: "Bowery Ballroom", neighborhood: "lower east side", borough: "Manhattan" },
  { match: "Brooklyn Bowl", neighborhood: "williamsburg", borough: "Brooklyn" },
  { match: "Kings Theatre", neighborhood: "flatbush", borough: "Brooklyn" },
  { match: "Forest Hills Stadium", neighborhood: "forest hills", borough: "Queens" },
  { match: "Global Life", neighborhood: "midtown", borough: "Manhattan" },
  { match: "Hammerstein", neighborhood: "midtown", borough: "Manhattan" },
  { match: "Apollo", neighborhood: "harlem", borough: "Manhattan" },
  { match: "Town Hall", neighborhood: "midtown", borough: "Manhattan" },
  { match: "Blue Note", neighborhood: "west village", borough: "Manhattan" },
  { match: "Village Vanguard", neighborhood: "west village", borough: "Manhattan" },
  { match: "Prospect Park", neighborhood: "prospect heights", borough: "Brooklyn" },
  { match: "SummerStage", neighborhood: "upper east side", borough: "Manhattan" },
  { match: "Javits", neighborhood: "hell's kitchen", borough: "Manhattan" },
];

// Borough address keyword mapping (fallback)
export const BOROUGH_KEYWORDS: Array<{ keyword: string; borough: string }> = [
  { keyword: "Brooklyn", borough: "Brooklyn" },
  { keyword: "Bronx", borough: "Bronx" },
  { keyword: "Queens", borough: "Queens" },
  { keyword: "Staten Island", borough: "Staten Island" },
];

// Trip planner: given two sets of lines, find the best route description
export function findRoute(
  fromLines: string[],
  toLines: string[],
  fromName: string,
  toName: string
): { description: string; transferHub?: string; directLine?: string; fromLine?: string; toLine?: string } {
  // Direct: shared line
  const shared = fromLines.filter((l) => toLines.includes(l));
  if (shared.length > 0) {
    return {
      description: `Take the ${shared[0]} train directly from ${fromName} to ${toName}.`,
      directLine: shared[0],
    };
  }

  // Transfer: find a hub that connects both neighborhoods
  for (const hub of TRANSFER_HUBS) {
    const fromMatch = fromLines.filter((l) => hub.lines.includes(l));
    const toMatch = toLines.filter((l) => hub.lines.includes(l));
    if (fromMatch.length > 0 && toMatch.length > 0) {
      return {
        description: `Take the ${fromMatch[0]} from ${fromName}, transfer to the ${toMatch[0]} at ${hub.name}, then ride to ${toName}.`,
        transferHub: hub.name,
        fromLine: fromMatch[0],
        toLine: toMatch[0],
      };
    }
  }

  // Fallback
  return {
    description: `From ${fromName}, take ${fromLines.slice(0, 2).join(" or ")}. You'll likely need to transfer to reach ${toName} (${toLines.slice(0, 2).join(" or ")}).`,
  };
}

// Get all neighborhood names for autocomplete
export const ALL_NEIGHBORHOODS = Object.keys(NEIGHBORHOOD_LINES).sort();
