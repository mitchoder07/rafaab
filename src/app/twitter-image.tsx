import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Rafaab - Shop Smarter, Live Better";
export const size = { width: 1200, height: 600 };
export const contentType = "image/png";

export default async function TwitterImage() {
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
        }}
      >
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <span style={{ fontSize: 40, fontWeight: 900, color: "#0A6E6F" }}>R</span>
        </div>
        <div style={{ fontSize: 64, fontWeight: 900, color: "#FFFFFF", marginBottom: 8 }}>
          Rafaab
        </div>
        <div style={{ fontSize: 28, color: "#F4C430", fontWeight: 600 }}>
          Shop Smarter, Live Better
        </div>
      </div>
    ),
    { ...size }
  );
}
