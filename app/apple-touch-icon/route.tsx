import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#030712",
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 40,
        }}
      >
        <span
          style={{
            color: "#60a5fa",
            fontSize: 52,
            fontWeight: 900,
            fontFamily: "sans-serif",
            letterSpacing: "-1px",
          }}
        >
          NYC
        </span>
      </div>
    ),
    {
      width: 180,
      height: 180,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    }
  );
}
