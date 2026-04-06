import { ImageResponse } from "next/og";
import { getVerdict } from "@/app/lib/types";

export const runtime = "edge";

const COLOR_MAP: Record<string, string> = {
  "text-blue-400":    "#60a5fa",
  "text-emerald-400": "#34d399",
  "text-yellow-400":  "#facc15",
  "text-orange-400":  "#fb923c",
  "text-red-400":     "#f87171",
};
const BG_MAP: Record<string, string> = {
  "from-blue-950 to-blue-900":    "#172554",
  "from-emerald-950 to-emerald-900": "#022c22",
  "from-yellow-950 to-yellow-900":   "#422006",
  "from-orange-950 to-orange-900":   "#431407",
  "from-red-950 to-red-900":         "#450a0a",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const score = parseInt(searchParams.get("score") ?? "50", 10);
  const weather = searchParams.get("weather") ?? "";
  const mta = searchParams.get("mta") ?? "";
  const events = searchParams.get("events") ?? "";
  const verdict = getVerdict(score);

  const accent = COLOR_MAP[verdict.text] ?? "#60a5fa";
  const bg = BG_MAP[verdict.bg] ?? "#172554";

  const bullets = [
    weather && { icon: "Weather", value: weather },
    mta && { icon: "MTA", value: mta },
    events && { icon: "Events", value: events },
  ].filter(Boolean) as { icon: string; value: string }[];

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px", height: "630px",
          background: bg,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          fontFamily: "sans-serif", padding: "60px",
          gap: "0px",
        }}
      >
        <div style={{ fontSize: "26px", color: "#6b7280", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "20px" }}>
          howbusyis.nyc
        </div>

        <div style={{ fontSize: "100px", fontWeight: 900, color: accent, lineHeight: 1, marginBottom: "12px" }}>
          {verdict.label}
        </div>

        <div style={{ fontSize: "32px", color: "#d1d5db", marginBottom: "36px" }}>
          {verdict.subtitle}
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", marginBottom: "28px" }}>
          <div style={{ fontSize: "80px", fontWeight: 900, color: "white", lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: "28px", color: "#4b5563", paddingBottom: "12px" }}>/100</div>
        </div>

        {/* Score bar */}
        <div style={{ width: "500px", height: "10px", background: "#1f2937", borderRadius: "9999px", overflow: "hidden", marginBottom: "32px" }}>
          <div style={{ width: `${score}%`, height: "100%", background: accent, borderRadius: "9999px" }} />
        </div>

        {/* Signal bullets */}
        {bullets.length > 0 && (
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", justifyContent: "center" }}>
            {bullets.map((b) => (
              <div key={b.icon} style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.07)", borderRadius: "999px", padding: "8px 18px" }}>
                <span style={{ fontSize: "20px", color: "#9ca3af" }}>{b.icon}:</span>
                <span style={{ fontSize: "20px", color: "#e5e7eb" }}>{b.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
