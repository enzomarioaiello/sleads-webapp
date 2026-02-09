import React from "react";
import { Metadata } from "next";
import ContactUsClient from "./ContactUsClient";

export const metadata: Metadata = {
  title: "Contact Us | Sleads",
  description:
    "Have a question or inquiry? Get in touch with the Sleads team.",
  alternates: {
    canonical: "/contact-us",
  },
};

export default function ContactUsPage() {
  return <ContactUsClient />;
}

