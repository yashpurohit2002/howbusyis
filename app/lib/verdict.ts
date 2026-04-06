import { BusyResponse } from "./types";

export interface GoOutVerdict {
  verdict: "YES" | "MAYBE" | "STAY HOME";
  reason: string;
  color: string;
}

export function computeGoOutVerdict(data: BusyResponse): GoOutVerdict {
  const { score, signals } = data;

  const weatherScore = signals.weather.score;
  const eventsScore = signals.events.score;
  const mtaChaos = signals.mta.chaosLevel; // "normal" | "elevated" | "bad" | "unknown"

  const hourNY = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
  ).getHours();

  const isDeepNight = hourNY >= 1 && hourNY < 6;
  const isRushHour = (hourNY >= 8 && hourNY <= 10) || (hourNY >= 17 && hourNY <= 19);

  const weatherTemp = signals.weather.temp; // Fahrenheit
  const weatherDesc = signals.weather.description.toLowerCase();

  // ── STAY HOME ──────────────────────────────────────────────────────────────
  // Truly extreme conditions only: hurricane-force storms, blizzards, dangerous cold
  const isBlizzard = weatherDesc.includes("blizzard") || weatherDesc.includes("heavy snow");
  const isHurricane = weatherScore >= 9 && (weatherDesc.includes("thunder") || weatherDesc.includes("storm"));
  const isDangerousCold = weatherTemp < -22; // -30°C

  if (isBlizzard || isHurricane || isDangerousCold) {
    const reason =
      isBlizzard ? "Actual blizzard out there. Nature wins today." :
      isHurricane ? "Severe storm rolling through. This one's real." :
      "Dangerously cold, like record-breaking cold. The city will be there tomorrow.";
    return { verdict: "STAY HOME", reason, color: "text-red-400" };
  }

  // ── MAYBE ──────────────────────────────────────────────────────────────────
  if (weatherScore >= 7) {
    return {
      verdict: "MAYBE",
      reason: "Weather's rough today. Still doable, just bring an umbrella and accept you'll get a little wet.",
      color: "text-orange-400",
    };
  }
  if (score >= 68) {
    return {
      verdict: "MAYBE",
      reason: "City's fired up right now. If you're down for the energy, go. If not, great night to order in.",
      color: "text-orange-400",
    };
  }
  if (eventsScore >= 8) {
    return {
      verdict: "MAYBE",
      reason: "Tons of events tonight. The city's packed but that's kind of the point.",
      color: "text-yellow-400",
    };
  }
  if (weatherScore >= 4) {
    return {
      verdict: "MAYBE",
      reason: "Decent enough out. Grab a layer, get outside, see how you feel.",
      color: "text-yellow-400",
    };
  }

  // ── YES ────────────────────────────────────────────────────────────────────
  if (isDeepNight) {
    return {
      verdict: "YES",
      reason: "Late night in NYC hits different. City's yours right now.",
      color: "text-emerald-400",
    };
  }
  if (score <= 25) {
    return {
      verdict: "YES",
      reason: "Unusually chill out there. Rare NYC moment. Catch it.",
      color: "text-emerald-400",
    };
  }
  if (mtaChaos === "elevated" || mtaChaos === "bad") {
    return {
      verdict: "YES",
      reason: "Trains are doing their thing. Check your route and go. It's always worth it.",
      color: "text-emerald-400",
    };
  }
  if (isRushHour) {
    return {
      verdict: "YES",
      reason: "Rush hour energy. Leave a little buffer and you're golden.",
      color: "text-emerald-400",
    };
  }
  return {
    verdict: "YES",
    reason: "Solid time to be out. Go touch some city.",
    color: "text-emerald-400",
  };
}
