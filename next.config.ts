import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],
  reactCompiler: true,
  images: {
    domains: [
      "picsum.photos",
      "lh3.googleusercontent.com",
      "github.com",
      "avatars.githubusercontent.com",
      "adorable-dinosaur-392.convex.cloud",
      "elegant-cheetah-861.convex.cloud",
    ],
  },
};

export default nextConfig;
