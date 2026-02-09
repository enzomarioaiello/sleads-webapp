import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Sleads Blog - Web Development & Digital Strategy Insights";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0e1a",
          backgroundImage:
            "radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)",
        }}
      >
        {/* Main Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 60px",
            maxWidth: "90%",
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 20px",
              borderRadius: "9999px",
              backgroundColor: "rgba(59, 130, 246, 0.15)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              marginBottom: "32px",
            }}
          >
            <span
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#3b82f6",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Blog & Insights
            </span>
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: "72px",
              fontWeight: 800,
              color: "#ffffff",
              textAlign: "center",
              lineHeight: 1.1,
              margin: "0 0 24px 0",
              letterSpacing: "-0.02em",
            }}
          >
            Web Development &
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Digital Strategy
            </span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "24px",
              color: "#94a3b8",
              textAlign: "center",
              margin: "0",
              maxWidth: "700px",
            }}
          >
            Expert insights on building modern web applications, SEO, UX/CRO, AI
            automation, and business strategy.
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          {/* Logo placeholder */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "8px",
                backgroundColor: "#3b82f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: "24px",
                  fontWeight: 800,
                  color: "#ffffff",
                }}
              >
                S
              </span>
            </div>
            <span
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "#ffffff",
              }}
            >
              Sleads
            </span>
          </div>
          <span
            style={{
              fontSize: "20px",
              color: "#64748b",
            }}
          >
            •
          </span>
          <span
            style={{
              fontSize: "20px",
              color: "#64748b",
            }}
          >
            sleads.nl
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}




