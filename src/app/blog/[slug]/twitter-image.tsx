import { ImageResponse } from "next/og";
import { api } from "../../../../convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

export const runtime = "edge";
export const alt = "Sleads Blog Post";
export const size = {
  width: 1200,
  height: 600,
};
export const contentType = "image/png";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default async function TwitterImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let post;
  try {
    post = await convex.query(api.blog.getBlogPostBySlug, { slug });
  } catch {
    post = null;
  }

  const title = post?.title || "Blog Post";
  const category = post?.category || "Article";
  const readTime = post?.readTime || "5 min read";

  // Truncate title if too long
  const displayTitle =
    title.length > 60 ? title.substring(0, 57) + "..." : title;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0a0e1a",
          backgroundImage:
            "radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)",
          padding: "50px",
        }}
      >
        {/* Top Section */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          {/* Category Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 20px",
              borderRadius: "9999px",
              backgroundColor: "rgba(59, 130, 246, 0.15)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
            }}
          >
            <span
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "#3b82f6",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {category}
            </span>
          </div>

          {/* Read Time */}
          <span style={{ fontSize: "16px", color: "#64748b" }}>{readTime}</span>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
            paddingTop: "30px",
            paddingBottom: "30px",
          }}
        >
          <h1
            style={{
              fontSize: displayTitle.length > 45 ? "44px" : "52px",
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.2,
              margin: "0",
              letterSpacing: "-0.02em",
              maxWidth: "95%",
            }}
          >
            {displayTitle}
          </h1>
        </div>

        {/* Bottom Section */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          {/* Sleads Branding */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                backgroundColor: "#3b82f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{ fontSize: "26px", fontWeight: 800, color: "#ffffff" }}
              >
                S
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{ fontSize: "22px", fontWeight: 700, color: "#ffffff" }}
              >
                Sleads
              </span>
              <span style={{ fontSize: "14px", color: "#64748b" }}>
                sleads.nl/blog
              </span>
            </div>
          </div>

          {/* CTA Hint */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#94a3b8",
              fontSize: "16px",
            }}
          >
            <span>Read full article →</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}




