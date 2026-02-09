"use client";

import { ContactTable } from "../components/ContactTable";

export default function ContactPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          Contact Submissions
        </h1>
      </div>
      <ContactTable />
    </div>
  );
}
