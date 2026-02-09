"use client";
import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../../../convex/_generated/api";
import { useApp } from "@/app/contexts/AppContext";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
} from "lucide-react";
import { Id } from "../../../../../../../../convex/_generated/dataModel";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DocumentPreview } from "@/components/QuoteInvoiceBuilder/DocumentPreview";
import { useToast } from "@/app/hooks/useToast";
import { motion } from "framer-motion";

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.quoteId as string;
  const projectId = params.projectId as string;
  const organizationId = params.orgID as string;
  const { t } = useApp();
  const { toast } = useToast();

  const quoteInfo = useQuery(api.quote.getInformationForQuote, {
    quoteId: quoteId as Id<"quotes">,
  });

  const acceptQuote = useMutation(api.quote.acceptQuote);
  const rejectQuote = useMutation(api.quote.rejectQuote);

  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleAccept = async () => {
    if (!confirm(t("dashboard_internal.project_detail.accept_quote_confirm"))) {
      return;
    }

    setIsAccepting(true);
    try {
      await acceptQuote({
        quoteId: quoteId as Id<"quotes">,
        organizationId: organizationId as Id<"organizations">,
      });
      toast({
        title: t("dashboard_internal.project_detail.quote_accepted"),
        variant: "success",
      });
      // Redirect back to quotes page
      router.push(`/dashboard/${organizationId}/projects/${projectId}/quotes`);
    } catch {
      toast({
        title: t("dashboard_internal.project_detail.accept_error"),
        variant: "error",
      });
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    if (!confirm(t("dashboard_internal.project_detail.reject_quote_confirm"))) {
      return;
    }

    setIsRejecting(true);
    try {
      await rejectQuote({
        quoteId: quoteId as Id<"quotes">,
        organizationId: organizationId as Id<"organizations">,
      });
      toast({
        title: t("dashboard_internal.project_detail.quote_rejected"),
        variant: "success",
      });
      // Redirect back to quotes page
      router.push(`/dashboard/${organizationId}/projects/${projectId}/quotes`);
    } catch {
      toast({
        title: t("dashboard_internal.project_detail.reject_error"),
        variant: "error",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  if (quoteInfo === undefined) {
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

  if (!quoteInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-slate-500 dark:text-sleads-slate400 mb-4">
          {t("dashboard_internal.project_detail.not_found")}
        </p>
        <Link
          href={`/dashboard/${organizationId}/projects/${projectId}/quotes`}
          className="px-4 py-2 rounded-xl bg-sleads-blue text-white text-sm font-semibold hover:bg-sleads-blue/90 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("dashboard_internal.project_detail.back_to_quotes")}
        </Link>
      </div>
    );
  }

  const quote = quoteInfo.quote;
  const isSent = quote.quoteStatus === "sent";
  const hasFileUrl = !!quote.quoteFileUrl;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link
          href={`/dashboard/${organizationId}/projects/${projectId}/quotes`}
          className="inline-flex items-center gap-2 text-slate-600 dark:text-sleads-slate400 hover:text-sleads-blue dark:hover:text-sleads-blue transition-colors text-sm font-medium w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("dashboard_internal.project_detail.back_to_quotes")}
        </Link>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Download Button - Show if file URL exists */}
          {hasFileUrl && quote.quoteFileUrl && (
            <a
              href={quote.quoteFileUrl}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-sleads-blue hover:bg-sleads-blue/90 text-white text-sm font-semibold transition-colors shadow-lg shadow-sleads-blue/20"
            >
              <Download className="w-4 h-4" />
              {t("dashboard_internal.project_detail.download_quote")}
            </a>
          )}

          {/* Accept/Reject Buttons - Only show for sent quotes */}
          {isSent && (
            <>
              <button
                onClick={handleAccept}
                disabled={isAccepting || isRejecting}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-600/20"
              >
                {isAccepting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {t("dashboard_internal.project_detail.accept_quote")}
              </button>
              <button
                onClick={handleReject}
                disabled={isAccepting || isRejecting}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-600/20"
              >
                {isRejecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                {t("dashboard_internal.project_detail.reject_quote")}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Quote Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 rounded-2xl p-4 sm:p-6 shadow-sm overflow-x-auto"
      >
        <div className="min-w-0">
          <DocumentPreview quoteId={quoteId as Id<"quotes">} type="quote" />
        </div>
      </motion.div>
    </div>
  );
}
