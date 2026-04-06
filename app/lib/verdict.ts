import { BusyResponse } from "./types";

export interface GoOutVerdict {
  verdict: "YES" | "STAY HOME";
  mood: "positive" | "cautious" | "warning";
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
  const isBlizzard = weatherDesc.includes("blizzard") || weatherDesc.includes("heavy snow");
  const isHurricane = weatherScore >= 9 && (weatherDesc.includes("thunder") || weatherDesc.includes("storm"));
  const isDangerousCold = weatherTemp < -22;

  if (isBlizzard || isHurricane || isDangerousCold) {
    const reason =
      isBlizzard ? "Actual blizzard out there. Nature wins today." :
      isHurricane ? "Severe storm rolling through. This one's real." :
      "Dangerously cold, like record-breaking cold. The city will be there tomorrow.";
    return { verdict: "STAY HOME", mood: "warning", reason, color: "text-red-400" };
  }

  const isMtaBad = mtaChaos === "bad";
  const isMtaElevated = mtaChaos === "elevated";
  const isWeatherBad = weatherScore >= 7;
  const isWeatherRough = weatherScore >= 4;
  const isHighChaos = score >= 80;

  // ── CAUTIOUS YES — multiple stacked bad signals ────────────────────────────
  if (isHighChaos && isWeatherBad) {
    return {
      verdict: "YES",
      mood: "cautious",
      reason: `City is absolutely slammed and conditions are rough. Still worth it, but budget extra time, check your route, and dress for the weather.`,
      color: "text-yellow-400",
    };
  }

  if (isWeatherBad && isMtaBad) {
    return {
      verdict: "YES",
      mood: "cautious",
      reason: "Rough weather AND subway problems right now. Go if you need to. Just check your specific line before heading out.",
      color: "text-yellow-400",
    };
  }

  if (isRushHour && isMtaBad) {
    return {
      verdict: "YES",
      mood: "cautious",
      reason: "Rush hour with bad subway service — a rough combo. Build in 20+ extra minutes or consider walking part of it.",
      color: "text-yellow-400",
    };
  }

  if (isRushHour && isMtaElevated) {
    return {
      verdict: "YES",
      mood: "cautious",
      reason: "Rush hour + some subway delays. Leave early, check the MTA app for your line.",
      color: "text-yellow-400",
    };
  }

  // ── YES — rough weather but manageable ────────────────────────────────────
  if (isWeatherBad) {
    return {
      verdict: "YES",
      mood: "cautious",
      reason: "Weather's genuinely rough right now. Layer up, grab an umbrella, and you'll be fine.",
      color: "text-yellow-400",
    };
  }

  // ── YES — late night, city's yours ────────────────────────────────────────
  if (isDeepNight) {
    return {
      verdict: "YES",
      mood: "positive",
      reason: "Late night NYC hits different. Streets are quiet, the vibe is yours.",
      color: "text-emerald-400",
    };
  }

  // ── YES — rare quiet moment ───────────────────────────────────────────────
  if (score <= 25) {
    return {
      verdict: "YES",
      mood: "positive",
      reason: "Unusually chill out there. Rare NYC window. Go catch it before it's gone.",
      color: "text-emerald-400",
    };
  }

  // ── YES — hectic but that's the point ────────────────────────────────────
  if (score >= 68) {
    const extra = isMtaElevated ? " Check your route first." : "";
    return {
      verdict: "YES",
      mood: "positive",
      reason: `City's firing on all cylinders.${extra} That's kind of the whole point.`,
      color: "text-emerald-400",
    };
  }

  // ── YES — packed with events ──────────────────────────────────────────────
  if (eventsScore >= 8) {
    return {
      verdict: "YES",
      mood: "positive",
      reason: "Tons going on tonight. Good luck picking one.",
      color: "text-emerald-400",
    };
  }

  // ── YES — noticeable weather but not bad ──────────────────────────────────
  if (isWeatherRough) {
    return {
      verdict: "YES",
      mood: "cautious",
      reason: "A little rough out. Throw on a jacket. Still a good time to be out.",
      color: "text-yellow-400",
    };
  }

  // ── YES — MTA is having a moment ──────────────────────────────────────────
  if (isMtaElevated || isMtaBad) {
    return {
      verdict: "YES",
      mood: "cautious",
      reason: "Subway's being annoying. Pull up the MTA app before you head out.",
      color: "text-yellow-400",
    };
  }

  // ── YES — rush hour ───────────────────────────────────────────────────────
  if (isRushHour) {
    return {
      verdict: "YES",
      mood: "cautious",
      reason: "Rush hour. Give yourself a buffer and you're fine.",
      color: "text-yellow-400",
    };
  }

  return {
    verdict: "YES",
    mood: "positive",
    reason: "Solid time to be out. Go touch some city.",
    color: "text-emerald-400",
  };
}
