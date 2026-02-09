"use client";
import React from "react";
import { FileText, Receipt } from "lucide-react";
import Link from "next/link";
import { Doc } from "../../../../../../../../convex/_generated/dataModel";
import { extraCostsTranslations } from "../extra-costs-translations";

type Invoice = Doc<"invoices">;

interface InvoiceContextCardProps {
  invoice: Invoice;
  organizationId: string;
  projectId: string;
  t: typeof extraCostsTranslations.en;
  language: "en" | "nl";
}

export function InvoiceContextCard({
  invoice,
  organizationId,
  projectId,
  t,
  language,
}: InvoiceContextCardProps) {
  const invoiceDate = invoice.invoiceDate
    ? new Date(invoice.invoiceDate).toLocaleDateString(
        language === "nl" ? "nl-NL" : "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      )
    : null;

  return (
    <div className="bg-gradient-to-br from-sleads-blue/5 to-sleads-blue/10 dark:from-sleads-blue/10 dark:to-sleads-blue/20 border border-sleads-blue/20 dark:border-sleads-blue/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="p-2 sm:p-3 bg-sleads-blue/20 dark:bg-sleads-blue/30 rounded-lg text-sleads-blue shrink-0">
          <Receipt className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-sleads-slate400 mb-1.5 sm:mb-1">
            {t.viewing_invoice_costs}
          </h3>
          <div className="flex flex-col gap-3 sm:gap-2">
            <div>
              <p className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 dark:text-white break-words">
                {invoice.invoiceIdentifiefier ||
                  `${t.invoice_number} #${invoice.invoiceNumber}`}
              </p>
              {invoiceDate && (
                <p className="text-xs text-slate-500 dark:text-sleads-slate400 mt-1">
                  {t.invoice_date}: {invoiceDate}
                </p>
              )}
            </div>
            <Link
              href={`/dashboard/${organizationId}/projects/${projectId}/invoices/${invoice._id}`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-sleads-blue text-white rounded-lg text-sm font-semibold hover:bg-sleads-blue/90 transition-colors touch-manipulation min-h-[44px] sm:min-h-0 w-full sm:w-auto"
            >
              <FileText className="w-4 h-4" />
              {t.view_invoice}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

