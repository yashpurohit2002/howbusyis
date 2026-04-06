import { BusyResponse } from "./types";

export interface GoOutVerdict {
  verdict: "YES" | "STAY HOME";
  reason: string;
  color: string;
}

export function computeGoOutVerdict(data: BusyResponse): GoOutVerdict {
  const { score, signals } = data;

  const weatherScore = signals.weather.score;
  const eventsScore = signals.events.score;
  const mtaChaos = signals.mta.chaosLevel;

  const hourNY = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
  ).getHours();

  const isDeepNight = hourNY >= 1 && hourNY < 6;
  const isRushHour = (hourNY >= 8 && hourNY <= 10) || (hourNY >= 17 && hourNY <= 19);

  const weatherTemp = signals.weather.temp;
  const weatherDesc = signals.weather.description.toLowerCase();

  // ── STAY HOME ──────────────────────────────────────────────────────────────
  // Truly extreme conditions only
  const isBlizzard = weatherDesc.includes("blizzard") || weatherDesc.includes("heavy snow");
  const isHurricane = weatherScore >= 9 && (weatherDesc.includes("thunder") || weatherDesc.includes("storm"));
  const isDangerousCold = weatherTemp < -22;

  if (isBlizzard || isHurricane || isDangerousCold) {
    const reason =
      isBlizzard ? "Actual blizzard out there. Nature wins today." :
      isHurricane ? "Severe storm rolling through. This one's real." :
      "Dangerously cold, like record-breaking cold. The city will be there tomorrow.";
    return { verdict: "STAY HOME", reason, color: "text-red-400" };
  }

  // ── YES — rough weather, dress for it ──────────────────────────────────────
  if (weatherScore >= 7) {
    return {
      verdict: "YES",
      reason: "Weather's rough today — but NYC doesn't stop and neither should you. Bring an umbrella and roll with it.",
      color: "text-emerald-400",
    };
  }

  // ── YES — deep night ───────────────────────────────────────────────────────
  if (isDeepNight) {
    return {
      verdict: "YES",
      reason: "Late night in NYC hits different. The city's yours right now.",
      color: "text-emerald-400",
    };
  }

  // ── YES — city very quiet ──────────────────────────────────────────────────
  if (score <= 25) {
    return {
      verdict: "YES",
      reason: "Unusually chill out there. Rare NYC moment — go catch it before it's gone.",
      color: "text-emerald-400",
    };
  }

  // ── YES — hectic city ─────────────────────────────────────────────────────
  if (score >= 68) {
    return {
      verdict: "YES",
      reason: "City's firing on all cylinders tonight. That's the whole point — get out there.",
      color: "text-emerald-400",
    };
  }

  // ── YES — tons of events ──────────────────────────────────────────────────
  if (eventsScore >= 8) {
    return {
      verdict: "YES",
      reason: "Packed city, tons of events. That's kind of the whole point of NYC.",
      color: "text-emerald-400",
    };
  }

  // ── YES — slightly rough weather ──────────────────────────────────────────
  if (weatherScore >= 4) {
    return {
      verdict: "YES",
      reason: "Decent enough out. Grab a layer, get outside, see how you feel.",
      color: "text-emerald-400",
    };
  }

  // ── YES — MTA chaos ───────────────────────────────────────────────────────
  if (mtaChaos === "elevated" || mtaChaos === "bad") {
    return {
      verdict: "YES",
      reason: "Trains are doing their thing. Check your route and go — it's always worth it.",
      color: "text-emerald-400",
    };
  }

  // ── YES — rush hour ───────────────────────────────────────────────────────
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
