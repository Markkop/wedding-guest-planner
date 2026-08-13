import { ImageResponse } from "next/og";

export const alt = "Guest Planner — wedding guest list and RSVP organizer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "linear-gradient(135deg, #eef2ff 0%, #ffffff 50%, #f5f3ff 100%)",
        color: "#111827",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        padding: "72px",
        width: "100%",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", maxWidth: "960px", textAlign: "center", alignItems: "center" }}>
        <div style={{ color: "#4f46e5", display: "flex", fontSize: 30, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Guest Planner
        </div>
        <div style={{ display: "flex", fontSize: 72, fontWeight: 800, lineHeight: 1.08, marginTop: 28 }}>
          Wedding guest management made simple
        </div>
        <div style={{ color: "#4b5563", display: "flex", fontSize: 30, lineHeight: 1.4, marginTop: 30 }}>
          Guest lists, RSVPs, dietary preferences, and planning updates in one collaborative workspace.
        </div>
      </div>
    </div>,
    size,
  );
}
