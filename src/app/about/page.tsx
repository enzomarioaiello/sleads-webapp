import React from "react";
import { Metadata } from "next";
import AboutPageClient from "./AboutPageClient";

export const metadata: Metadata = {
  title: "About Us | Sleads",
  description:
    "Learn about Sleads - a digital agency founded in 2020, specializing in crafting premium digital experiences, high-performance websites, and scalable SaaS solutions across Europe.",
  keywords: [
    "About Sleads",
    "Digital Agency Team",
    "Web Development Company",
    "SaaS Development Team",
    "European Digital Agency",
  ],
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Us | Sleads",
    description:
      "Learn about Sleads - a digital agency founded in 2020, specializing in crafting premium digital experiences across Europe.",
    url: "/about",
    type: "website",
  },
};

export default function AboutPage() {
  return <AboutPageClient />;
}
