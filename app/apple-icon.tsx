import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#E89441",
          borderRadius: 40,
          fontSize: 120,
          fontWeight: 800,
          color: "white",
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "-0.05em",
          paddingBottom: 10,
        }}
      >
        n
      </div>
    ),
    { ...size }
  );
}
