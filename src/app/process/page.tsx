import React from "react";
import { Metadata } from "next";
import ProcessPageClient from "./ProcessPageClient";

export const metadata: Metadata = {
  title: "Our Process | Sleads",
  description:
    "Discover our proven 5-step development process: Discovery, Design, Development, Testing, and Launch. Learn how we deliver high-quality digital solutions with transparency and efficiency.",
  keywords: [
    "Development Process",
    "Web Development Workflow",
    "SaaS Development Process",
    "Project Management",
    "Agile Development",
  ],
  alternates: {
    canonical: "/process",
  },
  openGraph: {
    title: "Our Process | Sleads",
    description:
      "Discover our proven 5-step development process for delivering high-quality digital solutions.",
    url: "/process",
    type: "website",
  },
};

export default function ProcessPage() {
  return <ProcessPageClient />;
}
