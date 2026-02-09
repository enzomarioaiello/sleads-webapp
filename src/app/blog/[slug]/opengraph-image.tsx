import { ImageResponse } from "next/og";
import { api } from "../../../../convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

export const runtime = "edge";
export const alt = "Sleads Blog Post";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default async function OGImage({
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
  const author = post?.author || "Sleads Team";
  const readTime = post?.readTime || "5 min read";

  // Truncate title if too long
  const displayTitle =
    title.length > 70 ? title.substring(0, 67) + "..." : title;

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
          padding: "60px",
        }}
      >
        {/* Top Section: Category & Meta */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            marginBottom: "auto",
          }}
        >
          {/* Category Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 24px",
              borderRadius: "9999px",
              backgroundColor: "rgba(59, 130, 246, 0.15)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
            }}
          >
            <span
              style={{
                fontSize: "18px",
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              style={{
                fontSize: "18px",
                color: "#64748b",
              }}
            >
              {readTime}
            </span>
          </div>
        </div>

        {/* Middle Section: Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flex: 1,
          }}
        >
          <h1
            style={{
              fontSize: displayTitle.length > 50 ? "48px" : "56px",
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

        {/* Bottom Section: Author & Branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            marginTop: "auto",
          }}
        >
          {/* Author */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            {/* Author Avatar Placeholder */}
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "9999px",
                backgroundColor: "#1e293b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid #334155",
              }}
            >
              <span
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#94a3b8",
                }}
              >
                {author.charAt(0)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
              }}
            >
              <span
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  color: "#ffffff",
                }}
              >
                {author}
              </span>
              <span
                style={{
                  fontSize: "16px",
                  color: "#64748b",
                }}
              >
                Sleads Blog
              </span>
            </div>
          </div>

          {/* Sleads Logo/Branding */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                backgroundColor: "#3b82f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: "28px",
                  fontWeight: 800,
                  color: "#ffffff",
                }}
              >
                S
              </span>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <span
                style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#ffffff",
                }}
              >
                Sleads
              </span>
              <span
                style={{
                  fontSize: "14px",
                  color: "#64748b",
                }}
              >
                sleads.nl
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}




