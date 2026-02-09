import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://sleads.nl";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin-dashboard/",
          "/dashboard/",
          "/*?*utm_*", // Block URLs with UTM parameters from indexing
          "/auth/*",
          "/verify-email",
          "/reset-password",
          "/forgot-password",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/admin-dashboard/", "/dashboard/", "/auth/*"],
        crawlDelay: 0,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
