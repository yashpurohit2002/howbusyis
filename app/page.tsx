import { BusyDashboard } from "./components/BusyDashboard";
import { Metadata } from "next";
import { BusyResponse } from "@/app/lib/types";

function buildDescription(data: BusyResponse | null, score: number): string {
  if (!data) return "How busy is NYC right now? Real data, no fluff.";

  const events = data.signals.events.totalToday;
  const weather = data.signals.weather.description;
  const mta = data.signals.mta;

  if (score <= 20) {
    return `NYC is a ghost town right now (${score}/100). ${events ? `Only ${events} events happening.` : "Go anywhere — you'll have the city to yourself."}`;
  }
  if (score <= 40) {
    return `NYC is surprisingly chill right now — ${score}/100. ${weather ? `${weather.charAt(0).toUpperCase() + weather.slice(1)}.` : ""} A rare window.`;
  }
  if (score <= 60) {
    const eventStr = events ? ` ${events} things happening across the city.` : "";
    return `NYC is buzzing at ${score}/100.${eventStr} ${mta.delayedLines?.length ? `Watch out — ${mta.delayedLines.slice(0, 3).join(", ")} showing delays.` : "Subway's cooperating."}`;
  }
  if (score <= 80) {
    return `Things are getting hectic in NYC — ${score}/100. ${events ? `${events} events packing the city.` : ""} Leave extra time for everything.`;
  }
  return `Pure chaos. NYC is at ${score}/100 right now. ${events ? `${events} events, packed streets.` : ""} Good luck out there.`;
}

async function fetchBusyData(): Promise<BusyResponse | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ?? "https://howbusyisnyc.yashpurohit.me";
    const res = await fetch(`${baseUrl}/api/busy`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const data = await fetchBusyData();
  const score = data?.score ?? 50;
  const weather = data?.signals.weather.description ?? data?.signals.weather.label ?? "";
  const mtaDelays = data?.signals.mta.delayedLines?.length ?? 0;
  const mta = mtaDelays > 0 ? `${mtaDelays} delay${mtaDelays > 1 ? "s" : ""}` : "Subway clear";
  const events = data?.signals.events.totalToday
    ? `${data.signals.events.totalToday} events`
    : "";

  const params = new URLSearchParams({
    score: String(score),
    ...(weather && { weather }),
    ...(mta && { mta }),
    ...(events && { events }),
  });
  const ogUrl = `/og?${params}`;

  const label = data?.label ?? "How busy?";
  const description = buildDescription(data, score);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://howbusyisnyc.yashpurohit.me";
  const absoluteOgUrl = `${baseUrl}${ogUrl}`;

  return {
    title: "howbusy.is/nyc",
    description,
    openGraph: {
      title: `howbusy.is/nyc — ${label}`,
      description,
      url: baseUrl,
      images: [{ url: absoluteOgUrl, width: 1200, height: 630, alt: `NYC busyness score: ${score}/100 — ${label}` }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `howbusy.is/nyc — ${label}`,
      description,
      images: [absoluteOgUrl],
    },
  };
}

export default function Home() {
  return <BusyDashboard />;
}
