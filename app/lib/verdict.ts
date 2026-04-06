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

  // ── STAY HOME ──────────────────────────────────────────────────────────────
  // Only for genuinely bad conditions -- not just "some lines delayed"
  if (weatherScore >= 7) {
    return {
      verdict: "STAY HOME",
      reason: "The weather is actually bad today. Not Manhattan-light-drizzle bad. Actually bad.",
      color: "text-red-400",
    };
  }
  // MTA "bad" + rush hour is the one MTA case that warrants caution
  if (mtaChaos === "bad" && isRushHour) {
    return {
      verdict: "STAY HOME",
      reason: "Multiple lines are down during rush hour. This is one of those days. Work from home if you can.",
      color: "text-red-400",
    };
  }
  if (score >= 85) {
    return {
      verdict: "STAY HOME",
      reason: "Everything is firing at once. Pure chaos out there. Go tomorrow.",
      color: "text-red-400",
    };
  }

  // ── MAYBE ──────────────────────────────────────────────────────────────────
  // MTA "bad" outside rush hour -- still worth flagging but not a dealbreaker
  if (mtaChaos === "bad") {
    return {
      verdict: "MAYBE",
      reason: "Several lines are having a rough day. Check your specific route -- it might be fine.",
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
      reason: "The city is unusually calm right now. Enjoy it -- it won't last.",
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
