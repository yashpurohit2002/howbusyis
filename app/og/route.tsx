import { ImageResponse } from "next/og";
import { getVerdict, BusyResponse } from "@/app/lib/types";

export const runtime = "edge";

const COLOR_MAP: Record<string, string> = {
  "text-blue-400":    "#60a5fa",
  "text-emerald-400": "#34d399",
  "text-yellow-400":  "#facc15",
  "text-orange-400":  "#fb923c",
  "text-red-400":     "#f87171",
};
const BG_MAP: Record<string, [string, string]> = {
  "from-blue-950 to-blue-900":       ["#0f172a", "#1e3a5f"],
  "from-emerald-950 to-emerald-900": ["#022c22", "#064e3b"],
  "from-yellow-950 to-yellow-900":   ["#1c1002", "#422006"],
  "from-orange-950 to-orange-900":   ["#1a0a02", "#431407"],
  "from-red-950 to-red-900":         ["#1a0202", "#450a0a"],
};

async function getDataFast(origin: string): Promise<BusyResponse | null> {
  // Try KV directly first — avoids the full API fanout and is ~10x faster
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (kvUrl && kvToken) {
    try {
      const res = await fetch(`${kvUrl}/get/busy:nyc`, {
        headers: { Authorization: `Bearer ${kvToken}` },
        signal: AbortSignal.timeout(1500),
      });
      if (res.ok) {
        const json = await res.json();
        const value = json.result;
        if (value) {
          const parsed: BusyResponse = typeof value === "string" ? JSON.parse(value) : value;
          return parsed;
        }
      }
    } catch {
      // fall through to HTTP fetch
    }
  }

  // Fallback: HTTP fetch with short timeout
  try {
    const res = await fetch(`${origin}/api/busy?city=nyc`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) return res.json();
  } catch {
    // fall through to defaults
  }

  return null;
}

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  let score = 50;
  let weather = "";
  let mta = "";
  let events = "";

  const data = await getDataFast(origin);
  if (data) {
    score = data.score;
    weather = data.signals.weather.description ?? "";
    const delays = data.signals.mta.delayedLines?.length ?? 0;
    mta = delays > 0 ? `${delays} delay${delays > 1 ? "s" : ""}` : "Subway clear";
    events = data.signals.events.totalToday
      ? `${data.signals.events.totalToday} events`
      : "";
  }

  const verdict = getVerdict(score);
  const accent = COLOR_MAP[verdict.text] ?? "#60a5fa";
  const [bgDark, bgLight] = BG_MAP[verdict.bg] ?? ["#0f172a", "#1e3a5f"];

  const pills = [
    weather && { icon: "☁", value: weather },
    mta     && { icon: "🚇", value: mta },
    events  && { icon: "📅", value: events },
  ].filter(Boolean) as { icon: string; value: string }[];

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: `linear-gradient(135deg, ${bgDark} 0%, ${bgLight} 100%)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          padding: "56px 80px",
        }}
      >
        {/* Domain */}
        <div style={{ fontSize: "22px", color: "#6b7280", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "28px" }}>
          howbusy.is/nyc
        </div>

        {/* Score */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", marginBottom: "10px" }}>
          <span style={{ fontSize: "200px", fontWeight: 900, color: "white", lineHeight: 1 }}>
            {score}
          </span>
          <span style={{ fontSize: "40px", color: "#4b5563", paddingBottom: "24px" }}>
            / 100
          </span>
        </div>

        {/* Score bar */}
        <div style={{ width: "520px", height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "9999px", overflow: "hidden", marginBottom: "28px" }}>
          <div style={{ width: `${score}%`, height: "100%", background: accent, borderRadius: "9999px" }} />
        </div>

        {/* Verdict */}
        <div style={{ fontSize: "72px", fontWeight: 900, color: accent, lineHeight: 1, marginBottom: "10px", textAlign: "center" }}>
          {verdict.label}
        </div>

        {/* Subtitle */}
        <div style={{ fontSize: "28px", color: "#9ca3af", marginBottom: "36px", textAlign: "center" }}>
          {verdict.subtitle}
        </div>

        {/* Pills */}
        {pills.length > 0 && (
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
            {pills.map((b) => (
              <div key={b.icon} style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "999px", padding: "8px 20px" }}>
                <span style={{ fontSize: "22px" }}>{b.icon}</span>
                <span style={{ fontSize: "22px", color: "#d1d5db" }}>{b.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=60",
      },
    }
  );
}
