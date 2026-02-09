import React from "react";
import { Metadata } from "next";
import WorkPageClient from "./WorkPageClient";

export const metadata: Metadata = {
  title: "Our Work | Sleads",
  description:
    "Explore our portfolio of premium digital experiences, high-performance websites, and scalable SaaS solutions. See how we've helped businesses transform their digital presence.",
  keywords: [
    "Sleads Portfolio",
    "Web Development Projects",
    "SaaS Solutions",
    "Mobile App Development",
    "Digital Projects",
  ],
  alternates: {
    canonical: "/work",
  },
  openGraph: {
    title: "Our Work | Sleads",
    description:
      "Explore our portfolio of premium digital experiences and scalable SaaS solutions.",
    url: "/work",
    type: "website",
  },
};

export default function WorkPage() {
  return <WorkPageClient />;
}
