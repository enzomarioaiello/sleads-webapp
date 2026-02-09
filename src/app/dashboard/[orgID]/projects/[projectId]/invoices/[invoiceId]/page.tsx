"use client";
import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../../../convex/_generated/api";
import { useApp } from "@/app/contexts/AppContext";
import { ArrowLeft, Download } from "lucide-react";
import { Id } from "../../../../../../../../convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DocumentPreview } from "@/components/QuoteInvoiceBuilder/DocumentPreview";
import { motion } from "framer-motion";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.invoiceId as string;
  const projectId = params.projectId as string;
  const organizationId = params.orgID as string;
  const { t } = useApp();

  const invoiceInfo = useQuery(api.invoice.getInformationForInvoice, {
    invoiceId: invoiceId as Id<"invoices">,
  });

  if (invoiceInfo === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sleads-blue mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-sleads-slate400">
            {t("dashboard_internal.project_detail.loading")}
          </p>
        </div>
      </div>
    );
  }

  if (!invoiceInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-slate-500 dark:text-sleads-slate400 mb-4">
          {t("dashboard_internal.project_detail.not_found")}
        </p>
        <Link
          href={`/dashboard/${organizationId}/projects/${projectId}/invoices`}
          className="px-4 py-2 rounded-xl bg-sleads-blue text-white text-sm font-semibold hover:bg-sleads-blue/90 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("dashboard_internal.project_detail.back_to_invoices")}
        </Link>
      </div>
    );
  }

  const invoice = invoiceInfo.invoice;
  const hasFileUrl = !!invoice.invoiceFileUrl;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          href={`/dashboard/${organizationId}/projects/${projectId}/invoices`}
          className="inline-flex items-center gap-2 text-slate-600 dark:text-sleads-slate400 hover:text-sleads-blue dark:hover:text-sleads-blue transition-colors text-sm font-medium w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("dashboard_internal.project_detail.back_to_invoices")}
        </Link>

        {/* Download Button - Show if file URL exists */}
        {hasFileUrl && invoice.invoiceFileUrl && (
          <a
            href={invoice.invoiceFileUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-sleads-blue hover:bg-sleads-blue/90 text-white text-sm font-semibold transition-colors shadow-lg shadow-sleads-blue/20"
          >
            <Download className="w-4 h-4" />
            {t("dashboard_internal.project_detail.download_invoice")}
          </a>
        )}
      </div>

      {/* Invoice Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 rounded-2xl p-4 sm:p-6 shadow-sm overflow-x-auto"
      >
        <div className="min-w-0">
          <DocumentPreview
            invoiceId={invoiceId as Id<"invoices">}
            type="invoice"
          />
        </div>
      </motion.div>
    </div>
  );
}
