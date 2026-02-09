import React from "react";
import { Metadata } from "next";
import SmartObjectsClient from "./SmartObjectsClient";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.sleads.nl";

export const metadata: Metadata = {
  title: "Smart Objects - Dynamic Data Structures | Sleads",
  description:
    "Manage your data efficiently in a structured manner. Create, filter, and manage database tables with powerful search capabilities, rich text editing, and intuitive data management.",
  keywords: [
    "Smart Objects",
    "Database Management",
    "Data Structures",
    "Dynamic Data",
    "Database Tables",
    "Data Management System",
    "Structured Data",
    "Data Filtering",
    "Rich Text Editor",
    "Database Schema",
  ],
  alternates: {
    canonical: `${BASE_URL}/solutions/smart-objects`,
  },
  openGraph: {
    title: "Smart Objects - Dynamic Data Structures | Sleads",
    description:
      "Manage your data efficiently in a structured manner. Create, filter, and manage database tables with powerful search capabilities.",
    url: `${BASE_URL}/solutions/smart-objects`,
    siteName: "Sleads",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart Objects - Dynamic Data Structures | Sleads",
    description:
      "Manage your data efficiently in a structured manner. Create, filter, and manage database tables with ease.",
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
  name: "Sleads Smart Objects",
  applicationCategory: "DataManagementSystem",
  description:
    "Smart Objects for managing structured data and database tables with powerful filtering and rich text editing",
  url: `${BASE_URL}/solutions/smart-objects`,
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
    "Database table management",
    "Data filtering and search",
    "Rich text editing",
    "Schema visualization",
    "Create, edit, and delete records",
  ],
};

export default function SmartObjectsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SmartObjectsClient />
    </>
  );
}
