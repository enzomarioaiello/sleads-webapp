import React from "react";
import { Metadata } from "next";
import { PrivacyPolicyClient } from "./PrivacyPolicyClient";

export const metadata: Metadata = {
  title: "Privacy Policy | Sleads",
  description: "Privacy Policy and data protection information for Sleads.",
  alternates: {
    canonical: "/privacy-policy",
  },
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyClient />;
}
