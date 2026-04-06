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
      isBlizzard ? "Blizzard conditions. Seriously, stay inside." :
      isHurricane ? "Severe storm. This is not a normal rainy day." :
      "Dangerously cold. Frostbite risk is real. Stay in.";
    return { verdict: "STAY HOME", reason, color: "text-red-400" };
  }

  // ── MAYBE ──────────────────────────────────────────────────────────────────
  if (weatherScore >= 7) {
    return {
      verdict: "MAYBE",
      reason: "Rough weather out there. Go if you have to, but don't make unnecessary trips.",
      color: "text-orange-400",
    };
  }
  if (score >= 68) {
    return {
      verdict: "MAYBE",
      reason: "Busy out there, but NYC is always busy. Fine if you have somewhere to be.",
      color: "text-orange-400",
    };
  }
  if (eventsScore >= 8) {
    return {
      verdict: "MAYBE",
      reason: "Half of NYC had the same plan today. Expect crowds near major venues.",
      color: "text-yellow-400",
    };
  }
  if (weatherScore >= 4) {
    return {
      verdict: "MAYBE",
      reason: "Not great weather, not terrible. Bring a layer and decide when you get outside.",
      color: "text-yellow-400",
    };
  }

  // ── YES ────────────────────────────────────────────────────────────────────
  // Normal MTA delays ("elevated" or "normal") are never a reason to stay in.
  // Some lines are always delayed. That's just NYC.
  if (isDeepNight) {
    return {
      verdict: "YES",
      reason: "It's late but it's NYC. City's calm. Go do something weird.",
      color: "text-emerald-400",
    };
  }
  if (score <= 25) {
    return {
      verdict: "YES",
      reason: "The city is unusually calm right now. Enjoy it. It won't last.",
      color: "text-emerald-400",
    };
  }
  if (mtaChaos === "elevated") {
    return {
      verdict: "YES",
      reason: "A few lines are slow but that's just Tuesday. Check your route and go.",
      color: "text-emerald-400",
    };
  }
  if (isRushHour) {
    return {
      verdict: "YES",
      reason: "Rush hour, but the city is manageable. Leave a little buffer and you're fine.",
      color: "text-emerald-400",
    };
  }
  return {
    verdict: "YES",
    reason: "Good time to be out. Weather's fine, trains are moving. Go.",
    color: "text-emerald-400",
  };
}
