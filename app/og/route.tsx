import { ImageResponse } from "next/og";
import { getVerdict, BusyResponse } from "@/app/lib/types";

export const runtime = "nodejs";

const COLOR_MAP: Record<string, string> = {
  "text-slate-400":   "#94a3b8",
  "text-blue-400":    "#60a5fa",
  "text-teal-400":    "#2dd4bf",
  "text-emerald-400": "#34d399",
  "text-lime-400":    "#a3e635",
  "text-yellow-400":  "#facc15",
  "text-amber-400":   "#fbbf24",
  "text-orange-400":  "#fb923c",
  "text-red-400":     "#f87171",
};
const BG_MAP: Record<string, [string, string]> = {
  "from-slate-950 to-gray-900":    ["#020617", "#111827"],
  "from-slate-950 to-blue-950":    ["#020617", "#172554"],
  "from-blue-950 to-blue-900":     ["#172554", "#1e3a8a"],
  "from-blue-950 to-indigo-900":   ["#172554", "#312e81"],
  "from-indigo-950 to-teal-950":   ["#1e1b4b", "#042f2e"],
  "from-teal-950 to-emerald-950":  ["#042f2e", "#022c22"],
  "from-emerald-950 to-emerald-900": ["#022c22", "#064e3b"],
  "from-emerald-950 to-green-900": ["#022c22", "#14532d"],
  "from-green-950 to-lime-950":    ["#052e16", "#1a2e05"],
  "from-lime-950 to-yellow-950":   ["#1a2e05", "#1c1702"],
  "from-yellow-950 to-yellow-900": ["#1c1702", "#422006"],
  "from-yellow-950 to-amber-900":  ["#1c1702", "#431407"],
  "from-amber-950 to-amber-900":   ["#1c0a02", "#431407"],
  "from-amber-950 to-orange-900":  ["#1c0a02", "#431407"],
  "from-orange-950 to-orange-900": ["#1a0a02", "#431407"],
  "from-orange-950 to-rose-950":   ["#1a0a02", "#4c0519"],
  "from-rose-950 to-red-900":      ["#4c0519", "#450a0a"],
  "from-red-950 to-red-900":       ["#450a0a", "#7f1d1d"],
  "from-red-950 to-rose-900":      ["#450a0a", "#881337"],
  "from-rose-950 to-red-950":      ["#4c0519", "#450a0a"],
};

async function getDataFast(origin: string): Promise<BusyResponse | null> {
  // Try KV directly first
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  if (kvUrl && kvToken) {
    try {
      const key = encodeURIComponent("busy:nyc");
      const res = await fetch(`${kvUrl}/get/${key}`, {
        headers: { Authorization: `Bearer ${kvToken}` },
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) {
        const json = await res.json();
        const value = json.result;
        if (value) {
          return typeof value === "string" ? JSON.parse(value) : value as BusyResponse;
        }
      }
    } catch {
      // fall through
    }
  }
  // Fallback: HTTP fetch
  try {
    const res = await fetch(`${origin}/api/busy?city=nyc`, {
      signal: AbortSignal.timeout(4000),
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

  try {
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
  } catch {
    // use defaults
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
          position: "relative",
        }}
      >
        <div style={{ display: "flex", fontSize: "22px", color: "#6b7280", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "28px" }}>
          howbusy.is/nyc
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", marginBottom: "10px" }}>
          <span style={{ fontSize: "200px", fontWeight: 900, color: "white", lineHeight: 1 }}>
            {score}
          </span>
          <span style={{ fontSize: "40px", color: "#4b5563", paddingBottom: "24px" }}>
            / 100
          </span>
        </div>
        <div style={{ display: "flex", width: "520px", height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "9999px", overflow: "hidden", marginBottom: "28px" }}>
          <div style={{ width: `${score}%`, height: "100%", background: accent, borderRadius: "9999px" }} />
        </div>
        <div style={{ display: "flex", fontSize: "72px", fontWeight: 900, color: accent, lineHeight: 1, marginBottom: "10px", textAlign: "center" }}>
          {verdict.label}
        </div>
        <div style={{ display: "flex", fontSize: "28px", color: "#9ca3af", marginBottom: "36px", textAlign: "center" }}>
          {verdict.subtitle}
        </div>
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
        {/* Watermark */}
        <div style={{ display: "flex", position: "absolute", bottom: "32px", right: "48px", fontSize: "16px", color: "rgba(255,255,255,0.2)", letterSpacing: "0.05em" }}>
          yashpurohit.me
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
