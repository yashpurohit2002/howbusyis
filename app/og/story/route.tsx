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

// 9:16 Instagram story format
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
    weather && { icon: "🌤", label: "Weather", value: weather },
    mta && { icon: "🚇", label: "MTA", value: mta },
    events && { icon: "🎟", label: "Events", value: events },
  ].filter(Boolean) as { icon: string; label: string; value: string }[];

  return new ImageResponse(
    (
      <div
        style={{
          width: "1080px", height: "1920px",
          background: bg,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          fontFamily: "sans-serif", padding: "80px",
          gap: "0px",
        }}
      >
        {/* Top label */}
        <div style={{ fontSize: "32px", color: "#6b7280", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "60px" }}>
          howbusyis.nyc
        </div>

        {/* Main verdict */}
        <div style={{ fontSize: "130px", fontWeight: 900, color: accent, lineHeight: 1, textAlign: "center", marginBottom: "24px" }}>
          {verdict.label}
        </div>

        <div style={{ fontSize: "42px", color: "#d1d5db", marginBottom: "60px", textAlign: "center" }}>
          {verdict.subtitle}
        </div>

        {/* Score */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "16px", marginBottom: "40px" }}>
          <div style={{ fontSize: "120px", fontWeight: 900, color: "white", lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: "44px", color: "#4b5563", paddingBottom: "18px" }}>/100</div>
        </div>

        {/* Score bar */}
        <div style={{ width: "600px", height: "14px", background: "#1f2937", borderRadius: "9999px", overflow: "hidden", marginBottom: "60px" }}>
          <div style={{ width: `${score}%`, height: "100%", background: accent, borderRadius: "9999px" }} />
        </div>

        {/* Signal bullets */}
        {bullets.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
            {bullets.map((b) => (
              <div key={b.label} style={{ display: "flex", alignItems: "center", gap: "20px", background: "rgba(255,255,255,0.07)", borderRadius: "20px", padding: "20px 28px" }}>
                <span style={{ fontSize: "36px" }}>{b.icon}</span>
                <span style={{ fontSize: "28px", color: "#9ca3af", minWidth: "100px" }}>{b.label}</span>
                <span style={{ fontSize: "28px", color: "#e5e7eb" }}>{b.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Bottom time */}
        <div style={{ position: "absolute", bottom: "60px", fontSize: "24px", color: "#374151" }}>
          {new Date().toLocaleString("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit", hour12: true, month: "short", day: "numeric" })}
        </div>
      </div>
    ),
    { width: 1080, height: 1920 }
  );
}
