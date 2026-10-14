import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Rafaab - Shop Smarter, Live Better";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A6E6F",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Gold accent bar at top */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 8, background: "#F4C430" }} />

        {/* Logo circle */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
          }}
        >
          <span style={{ fontSize: 48, fontWeight: 900, color: "#0A6E6F" }}>R</span>
        </div>

        {/* Brand name */}
        <div style={{ fontSize: 72, fontWeight: 900, color: "#FFFFFF", marginBottom: 12, letterSpacing: -2 }}>
          Rafaab
        </div>

        {/* Tagline */}
        <div style={{ fontSize: 32, color: "#F4C430", fontWeight: 600, marginBottom: 40 }}>
          Shop Smarter, Live Better
        </div>

        {/* Description */}
        <div style={{ fontSize: 22, color: "#FFFFFF", opacity: 0.8, maxWidth: 700, textAlign: "center", lineHeight: 1.4 }}>
          Nigeria's premium marketplace - electronics, fashion, home, beauty and more.
        </div>

        {/* Features row */}
        <div style={{ display: "flex", gap: 24, marginTop: 40 }}>
          {["Flash Sales", "AI Assistant", "Fast Delivery", "Secure Payments"].map((feature) => (
            <div
              key={feature}
              style={{
                padding: "8px 20px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.15)",
                color: "#FFFFFF",
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              {feature}
            </div>
          ))}
        </div>

        {/* Bottom URL */}
        <div style={{ position: "absolute", bottom: 24, fontSize: 18, color: "rgba(255,255,255,0.5)" }}>
          rafaab.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}
