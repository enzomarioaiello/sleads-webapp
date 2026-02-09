import React from "react";
import { Metadata } from "next";
import BookMeetingClient from "./BookMeetingClient";

export const metadata: Metadata = {
  title: "Book a Meeting | Sleads",
  description:
    "Schedule a free discovery call to discuss your project and explore how we can bring your vision to life.",
  alternates: {
    canonical: "/book-meeting",
  },
};

export default function BookMeetingPage() {
  return <BookMeetingClient />;
}
