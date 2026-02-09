"use client";

import React from "react";
import { useParams } from "next/navigation";
import { DocumentPreview } from "@/components/QuoteInvoiceBuilder/DocumentPreview";
import { Id } from "../../../../../convex/_generated/dataModel";

export default function DocPreviewPage() {
  const params = useParams();
  const type = params.type as "quote" | "invoice";
  const id = params.id as string;

  if (!type || !id) return null;

  return (
    <div className="min-h-screen bg-white">
      <DocumentPreview
        type={type}
        quoteId={type === "quote" ? (id as Id<"quotes"> | null) : undefined}
        invoiceId={
          type === "invoice" ? (id as Id<"invoices"> | null) : undefined
        }
      />
    </div>
  );
}
