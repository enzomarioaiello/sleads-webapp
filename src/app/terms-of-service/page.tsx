import React from "react";
import { Metadata } from "next";
import { TermsOfServiceClient } from "./TermsOfServiceClient";

export const metadata: Metadata = {
  title: "Terms of Service | Sleads",
  description: "Terms of Service and legal agreements for Sleads.",
  alternates: {
    canonical: "/terms-of-service",
  },
};

export default function TermsOfServicePage() {
  return <TermsOfServiceClient />;
}
