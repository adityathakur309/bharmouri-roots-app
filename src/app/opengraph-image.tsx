import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo/config";

export const runtime = "edge";
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
          background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 55%, #40916c 100%)",
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.9, letterSpacing: 4, textTransform: "uppercase" }}>
          From Bharmour, Himachal
        </div>
        <div style={{ fontSize: 78, fontWeight: 700, marginTop: 16, lineHeight: 1.05 }}>
          {SITE_NAME}
        </div>
        <div style={{ fontSize: 34, marginTop: 20, opacity: 0.95, maxWidth: 900 }}>
          {SITE_TAGLINE}
        </div>
        <div style={{ marginTop: 40, fontSize: 24, opacity: 0.85 }}>
          Organic • Handcrafted • Mountain Sourced
        </div>
      </div>
    ),
    { ...size }
  );
}
