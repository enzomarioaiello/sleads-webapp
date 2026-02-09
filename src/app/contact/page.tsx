import React from "react";
import { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact Us | Sleads",
  description:
    "Get in touch with Sleads. We are ready to help you craft premium digital experiences and scalable SaaS solutions.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
