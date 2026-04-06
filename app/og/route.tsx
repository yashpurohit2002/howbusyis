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
const BG_MAP: Record<string, [string, string]> = {
  "from-blue-950 to-blue-900":       ["#0f172a", "#1e3a5f"],
  "from-emerald-950 to-emerald-900": ["#022c22", "#064e3b"],
  "from-yellow-950 to-yellow-900":   ["#1c1002", "#422006"],
  "from-orange-950 to-orange-900":   ["#1a0a02", "#431407"],
  "from-red-950 to-red-900":         ["#1a0202", "#450a0a"],
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const score = parseInt(searchParams.get("score") ?? "50", 10);
  const weather = searchParams.get("weather") ?? "";
  const mta = searchParams.get("mta") ?? "";
  const events = searchParams.get("events") ?? "";
  const verdict = getVerdict(score);

  const accent = COLOR_MAP[verdict.text] ?? "#60a5fa";
  const [bgDark, bgLight] = BG_MAP[verdict.bg] ?? ["#0f172a", "#1e3a5f"];

  const pills = [
    weather && { icon: "☁", value: weather },
    mta     && { icon: "🚇", value: mta },
    events  && { icon: "📅", value: events },
  ].filter(Boolean) as { icon: string; value: string }[];

  const img = new ImageResponse(
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
        {/* Subtle glow behind score */}
        <div
          style={{
            position: "absolute",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: accent,
            opacity: 0.07,
            filter: "blur(80px)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* Domain */}
        <div
          style={{
            fontSize: "22px",
            color: "#6b7280",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: "28px",
          }}
        >
          howbusy.is/nyc
        </div>

        {/* Score — the hero */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "10px",
            marginBottom: "10px",
          }}
        >
          <span
            style={{
              fontSize: "200px",
              fontWeight: 900,
              color: "white",
              lineHeight: 1,
            }}
          >
            {score}
          </span>
          <span
            style={{
              fontSize: "40px",
              color: "#4b5563",
              paddingBottom: "24px",
            }}
          >
            / 100
          </span>
        </div>

        {/* Score bar */}
        <div
          style={{
            width: "520px",
            height: "8px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "9999px",
            overflow: "hidden",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              width: `${score}%`,
              height: "100%",
              background: accent,
              borderRadius: "9999px",
            }}
          />
        </div>

        {/* Verdict label */}
        <div
          style={{
            fontSize: "72px",
            fontWeight: 900,
            color: accent,
            lineHeight: 1,
            marginBottom: "10px",
            textAlign: "center",
          }}
        >
          {verdict.label}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "28px",
            color: "#9ca3af",
            marginBottom: "36px",
            textAlign: "center",
          }}
        >
          {verdict.subtitle}
        </div>

        {/* Signal pills */}
        {pills.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {pills.map((b) => (
              <div
                key={b.icon}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(255,255,255,0.08)",
                  border: `1px solid rgba(255,255,255,0.1)`,
                  borderRadius: "999px",
                  padding: "8px 20px",
                }}
              >
                <span style={{ fontSize: "22px" }}>{b.icon}</span>
                <span style={{ fontSize: "22px", color: "#d1d5db" }}>
                  {b.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 }
  );

  return new Response(img.body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=60",
    },
  });
}
