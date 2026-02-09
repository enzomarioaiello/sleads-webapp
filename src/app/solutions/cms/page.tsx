import React from "react";
import { Metadata } from "next";
import CMSClient from "./CMSClient";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.sleads.nl";

export const metadata: Metadata = {
  title: "CMS - Content Management System | Sleads",
  description:
    "Manage your website content across multiple languages and variants with ease. Our powerful CMS lets you update content, manage translations, and test variants—all without touching code.",
  keywords: [
    "Content Management System",
    "CMS",
    "Multi-language CMS",
    "A/B Testing CMS",
    "Content Management",
    "Website Content Editor",
    "Translation Management",
    "Content Variants",
    "Headless CMS",
  ],
  alternates: {
    canonical: `${BASE_URL}/solutions/cms`,
  },
  openGraph: {
    title: "CMS - Content Management System | Sleads",
    description:
      "Manage your website content across multiple languages and variants with ease. Update content, manage translations, and test variants—all without touching code.",
    url: `${BASE_URL}/solutions/cms`,
    siteName: "Sleads",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CMS - Content Management System | Sleads",
    description:
      "Manage your website content across multiple languages and variants with ease.",
    creator: "@sleads_nl",
  },
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
};

// JSON-LD structured data
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Sleads CMS",
  applicationCategory: "ContentManagementSystem",
  description:
    "Content Management System for managing website content across multiple languages and variants",
  url: `${BASE_URL}/solutions/cms`,
  provider: {
    "@type": "Organization",
    name: "Sleads",
    url: BASE_URL,
  },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
  },
  featureList: [
    "Multi-language content management",
    "A/B testing variants",
    "Real-time content editing",
    "Search and find content",
    "Translation management",
  ],
};

export default function CMSPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CMSClient />
    </>
  );
}
