"use client";
import React, { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { useApp } from "@/app/contexts/AppContext";
import { Calendar, FileText, Download, Eye } from "lucide-react";
import { Id, Doc } from "../../../../../../../convex/_generated/dataModel";
import { useParams } from "next/navigation";
import { cn } from "@/app/utils/cn";
import Link from "next/link";

export default function ProjectQuotesPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const organizationId = params.orgID as string;
  const { t } = useApp();

  // Store these for passing to child components
  const orgId = organizationId;
  const projId = projectId;

  const quotes = useQuery(api.quote.getQuotesForOrganization, {
    projectId: projectId as Id<"projects">,
    organizationId: organizationId as Id<"organizations">,
  });

  // Split quotes by status
  const { openQuotes, acceptedQuotes, rejectedQuotes } = useMemo(() => {
    if (!quotes) {
      return { openQuotes: [], acceptedQuotes: [], rejectedQuotes: [] };
    }

    const open = quotes.filter((q) => q.quoteStatus === "sent");
    const accepted = quotes.filter((q) => q.quoteStatus === "accepted");
    const rejected = quotes.filter((q) => q.quoteStatus === "rejected");

    return {
      openQuotes: open,
      acceptedQuotes: accepted,
      rejectedQuotes: rejected,
    };
  }, [quotes]);

  if (quotes === undefined) {
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

  if (!quotes || quotes.length === 0) {
    return (
      <div className="bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 rounded-2xl p-12 shadow-sm">
        <div className="flex flex-col items-center justify-center text-center">
          <FileText className="w-16 h-16 text-slate-300 dark:text-sleads-slate700 mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {t("dashboard_internal.project_detail.no_quotes")}
          </h3>
          <p className="text-slate-500 dark:text-sleads-slate400">
            {t("dashboard_internal.project_detail.no_quotes_desc")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Open Quotes Section */}
      <QuoteSection
        title={t("dashboard_internal.project_detail.open_quotes")}
        description={t("dashboard_internal.project_detail.open_quotes_desc")}
        quotes={openQuotes}
        t={t}
        organizationId={orgId}
        projectId={projId}
      />

      {/* Accepted Quotes Section */}
      <QuoteSection
        title={t("dashboard_internal.project_detail.accepted_quotes")}
        description={t(
          "dashboard_internal.project_detail.accepted_quotes_desc"
        )}
        quotes={acceptedQuotes}
        t={t}
        organizationId={orgId}
        projectId={projId}
      />

      {/* Rejected Quotes Section */}
      <QuoteSection
        title={t("dashboard_internal.project_detail.rejected_quotes")}
        description={t(
          "dashboard_internal.project_detail.rejected_quotes_desc"
        )}
        quotes={rejectedQuotes}
        t={t}
        organizationId={orgId}
        projectId={projId}
      />
    </div>
  );
}

// Quote Section Component
function QuoteSection({
  title,
  description,
  quotes,
  t,
  organizationId: orgId,
  projectId: projId,
}: {
  title: string;
  description: string;
  quotes: Doc<"quotes">[];
  t: (path: string) => string;
  organizationId: string;
  projectId: string;
}) {
  if (quotes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {title}
        </h2>
        <p className="text-slate-500 dark:text-sleads-slate400">
          {description}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quotes.map((quote) => (
          <QuoteCard
            key={quote._id}
            quote={quote}
            t={t}
            organizationId={orgId}
            projectId={projId}
          />
        ))}
      </div>
    </div>
  );
}

// Quote Card Component
function QuoteCard({
  quote,
  t,
  organizationId,
  projectId,
}: {
  quote: Doc<"quotes">;
  t: (path: string) => string;
  organizationId: string;
  projectId: string;
}) {
  const total = quote.quoteItems?.reduce(
    (acc: number, item) =>
      acc + item.quantity * item.priceExclTax * (1 + item.tax / 100),
    0
  );

  const quoteDate = quote.quoteDate
    ? new Date(quote.quoteDate).toLocaleDateString("nl-NL")
    : null;
  const validUntil = quote.quoteValidUntil
    ? new Date(quote.quoteValidUntil).toLocaleDateString("nl-NL")
    : null;

  const statusColors: Record<string, string> = {
    draft:
      "bg-slate-100 dark:bg-sleads-slate800 text-slate-700 dark:text-sleads-slate300",
    sent: "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400",
    accepted:
      "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400",
    rejected: "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400",
    expired:
      "bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400",
  };

  return (
    <div className="bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-sleads-blue/10 dark:bg-sleads-blue/20 rounded-lg text-sleads-blue">
          <FileText className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-900 dark:text-white">
            {quote.quoteIdentifiefier || `Quote #${quote.quoteNumber}`}
          </h3>
          <span
            className={cn(
              "text-xs font-semibold px-2 py-1 rounded-full uppercase tracking-wide mt-1 inline-block",
              statusColors[quote.quoteStatus] || statusColors.draft
            )}
          >
            {quote.quoteStatus}
          </span>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {quoteDate && (
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-sleads-slate400">
            <Calendar className="w-4 h-4" />
            <span>
              <strong>
                {t("dashboard_internal.project_detail.quote_date")}:
              </strong>{" "}
              {quoteDate}
            </span>
          </div>
        )}
        {validUntil && (
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-sleads-slate400">
            <Calendar className="w-4 h-4" />
            <span>
              <strong>
                {t("dashboard_internal.project_detail.quote_valid_until")}:
              </strong>{" "}
              {validUntil}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-sleads-slate800">
          <span className="text-sm font-semibold text-slate-600 dark:text-sleads-slate400">
            {t("dashboard_internal.project_detail.quote_total")}:
          </span>
          <span className="text-lg font-bold text-slate-900 dark:text-white">
            €{total.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Link
          href={`/dashboard/${organizationId}/projects/${projectId}/quotes/${quote._id}`}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-50 dark:bg-sleads-slate800 text-slate-700 dark:text-white text-sm font-semibold hover:bg-slate-100 dark:hover:bg-sleads-slate700 transition-colors"
        >
          <Eye className="w-4 h-4" />
          {t("dashboard_internal.project_detail.view_quote")}
        </Link>
        {quote.quoteFileUrl && (
          <a
            href={quote.quoteFileUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sleads-blue text-white text-sm font-semibold hover:bg-sleads-blue/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            {t("dashboard_internal.project_detail.download_quote")}
          </a>
        )}
      </div>
    </div>
  );
}
