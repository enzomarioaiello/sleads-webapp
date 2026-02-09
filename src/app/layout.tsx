import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

import { LayoutContent } from "./LayoutContent";
import { AppProvider } from "./contexts/AppContext";
import { ToastProvider } from "./components/ui/Toast";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sleads.nl"),
  title: {
    default: "Sleads | Digital Experiences, Crafted",
    template: "%s | Sleads",
  },
  description:
    "Sleads specializes in crafting premium digital experiences, high-performance websites, and scalable SaaS solutions. Elevate your online presence with our expert design and development services.",
  keywords: [
    "Digital Agency",
    "Web Development",
    "SaaS Development",
    "UI/UX Design",
    "React",
    "Next.js",
    "High Performance Websites",
    "Sleads",
    "Zutphen",
    "Software",
    "Website Development",
    "Website ontwikkeling",
    "Website laten maken",
    "App laten maken",
  ],
  authors: [{ name: "Sleads Team" }],
  creator: "Sleads",
  publisher: "Sleads",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    url: "https://sleads.nl/",
    title: "Sleads | Digital Experiences, Crafted",
    description:
      "Sleads specializes in crafting premium digital experiences, high-performance websites, and scalable SaaS solutions.",
    siteName: "Sleads",
    images: [
      {
        url: "/images/logo.png",
        width: 1200,
        height: 630,
        alt: "Sleads - Digital Experiences, Crafted",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sleads | Digital Experiences, Crafted",
    description:
      "Sleads specializes in crafting premium digital experiences, high-performance websites, and scalable SaaS solutions.",
    images: ["/images/logo.png"],
    creator: "@sleads", // Placeholder, user should update
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Sleads",
    url: "https://sleads.nl",
    logo: "https://sleads.nl/images/logo.png",
    sameAs: [
      "https://twitter.com/sleads",
      "https://linkedin.com/company/sleads",
      "https://github.com/sleads",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+31 6 20222833",
      contactType: "customer service",
    },
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="google-site-verification"
          content="bEHUC-n5_nIU9GRsDBrX6RgGNFDCddkZEcmqDsPy5uo"
        />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="96x96"
          href="/favicon-96x96.png"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,300,400&f[]=general-sans@500,300,600,400,700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} antialiased bg-slate-50 text-slate-900 dark:bg-sleads-midnight dark:text-sleads-white transition-colors duration-300`}
      >
        <AppProvider>
          <Analytics />
          <ToastProvider>
            <LayoutContent>{children}</LayoutContent>
          </ToastProvider>
        </AppProvider>
      </body>
    </html>
  );
}
