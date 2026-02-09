"use client";
import React, { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { useApp } from "@/app/contexts/AppContext";
import { Calendar, FileText, Download, Eye, Repeat } from "lucide-react";
import { Id, Doc } from "../../../../../../../convex/_generated/dataModel";
import { useParams } from "next/navigation";
import { cn } from "@/app/utils/cn";
import Link from "next/link";

export default function ProjectInvoicesPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const organizationId = params.orgID as string;
  const { t } = useApp();

  // Store these for passing to child components
  const orgId = organizationId;
  const projId = projectId;

  const invoices = useQuery(api.invoice.getInvoicesForOrganization, {
    projectId: projectId as Id<"projects">,
    organizationId: organizationId as Id<"organizations">,
  });

  // Get subscription titles for all invoices that have subscriptions
  const subscriptionIdsForAllInvoices =
    invoices
      ?.flatMap((invoice) => invoice.subscriptionIds || [])
      .filter((id, index, self) => self.indexOf(id) === index) || [];

  const subscriptionTitles = useQuery(
    api.monthlysubscriptions.getSubscriptionTitles,
    subscriptionIdsForAllInvoices.length > 0
      ? { subscriptionIds: subscriptionIdsForAllInvoices }
      : "skip"
  );

  // Create a map of subscription ID to title for quick lookup
  const subscriptionTitleMap = useMemo(() => {
    if (!subscriptionTitles) return new Map();
    return new Map(subscriptionTitles.map((sub) => [sub._id, sub.title]));
  }, [subscriptionTitles]);

  // Split invoices by status
  const { sentInvoices, paidInvoices, overdueInvoices, cancelledInvoices } =
    useMemo(() => {
      if (!invoices) {
        return {
          sentInvoices: [],
          paidInvoices: [],
          overdueInvoices: [],
          cancelledInvoices: [],
        };
      }

      const sent = invoices.filter((i) => i.invoiceStatus === "sent");
      const paid = invoices.filter((i) => i.invoiceStatus === "paid");
      const overdue = invoices.filter((i) => i.invoiceStatus === "overdue");
      const cancelled = invoices.filter((i) => i.invoiceStatus === "cancelled");

      return {
        sentInvoices: sent,
        paidInvoices: paid,
        overdueInvoices: overdue,
        cancelledInvoices: cancelled,
      };
    }, [invoices]);

  if (invoices === undefined) {
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

  if (!invoices || invoices.length === 0) {
    return (
      <div className="bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 rounded-2xl p-12 shadow-sm">
        <div className="flex flex-col items-center justify-center text-center">
          <FileText className="w-16 h-16 text-slate-300 dark:text-sleads-slate700 mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {t("dashboard_internal.project_detail.no_invoices")}
          </h3>
          <p className="text-slate-500 dark:text-sleads-slate400">
            {t("dashboard_internal.project_detail.no_invoices_desc")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Sent Invoices Section */}
      <InvoiceSection
        title={t("dashboard_internal.project_detail.sent_invoices")}
        description={t("dashboard_internal.project_detail.sent_invoices_desc")}
        invoices={sentInvoices}
        t={t}
        organizationId={orgId}
        projectId={projId}
        subscriptionTitleMap={subscriptionTitleMap}
      />

      {/* Paid Invoices Section */}
      <InvoiceSection
        title={t("dashboard_internal.project_detail.paid_invoices")}
        description={t("dashboard_internal.project_detail.paid_invoices_desc")}
        invoices={paidInvoices}
        t={t}
        organizationId={orgId}
        projectId={projId}
        subscriptionTitleMap={subscriptionTitleMap}
      />

      {/* Overdue Invoices Section */}
      <InvoiceSection
        title={t("dashboard_internal.project_detail.overdue_invoices")}
        description={t(
          "dashboard_internal.project_detail.overdue_invoices_desc"
        )}
        invoices={overdueInvoices}
        t={t}
        organizationId={orgId}
        projectId={projId}
        subscriptionTitleMap={subscriptionTitleMap}
      />

      {/* Cancelled Invoices Section */}
      <InvoiceSection
        title={t("dashboard_internal.project_detail.cancelled_invoices")}
        description={t(
          "dashboard_internal.project_detail.cancelled_invoices_desc"
        )}
        invoices={cancelledInvoices}
        t={t}
        organizationId={orgId}
        projectId={projId}
        subscriptionTitleMap={subscriptionTitleMap}
      />
    </div>
  );
}

// Invoice Section Component
function InvoiceSection({
  title,
  description,
  invoices,
  t,
  organizationId: orgId,
  projectId: projId,
  subscriptionTitleMap,
}: {
  title: string;
  description: string;
  invoices: Doc<"invoices">[];
  t: (path: string) => string;
  organizationId: string;
  projectId: string;
  subscriptionTitleMap: Map<Id<"monthly_subscriptions">, string>;
}) {
  if (invoices.length === 0) {
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
        {invoices.map((invoice) => (
          <InvoiceCard
            key={invoice._id}
            invoice={invoice}
            t={t}
            organizationId={orgId}
            projectId={projId}
            subscriptionTitleMap={subscriptionTitleMap}
          />
        ))}
      </div>
    </div>
  );
}

// Invoice Card Component
function InvoiceCard({
  invoice,
  t,
  organizationId,
  projectId,
  subscriptionTitleMap,
}: {
  invoice: Doc<"invoices">;
  t: (path: string) => string;
  organizationId: string;
  projectId: string;
  subscriptionTitleMap: Map<Id<"monthly_subscriptions">, string>;
}) {
  const total = invoice.invoiceItems?.reduce(
    (acc: number, item) =>
      acc + item.quantity * item.priceExclTax * (1 + item.tax / 100),
    0
  );

  const invoiceDate = invoice.invoiceDate
    ? new Date(invoice.invoiceDate).toLocaleDateString("nl-NL")
    : null;
  const dueDate = invoice.invoiceDueDate
    ? new Date(invoice.invoiceDueDate).toLocaleDateString("nl-NL")
    : null;

  const statusColors: Record<string, string> = {
    draft:
      "bg-slate-100 dark:bg-sleads-slate800 text-slate-700 dark:text-sleads-slate300",
    sent: "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400",
    paid: "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400",
    overdue:
      "bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400",
    cancelled: "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400",
  };

  return (
    <div className="bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-sleads-blue/10 dark:bg-sleads-blue/20 rounded-lg text-sleads-blue">
          <FileText className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-900 dark:text-white">
            {invoice.invoiceIdentifiefier ||
              `Invoice #${invoice.invoiceNumber}`}
          </h3>
          <span
            className={cn(
              "text-xs font-semibold px-2 py-1 rounded-full uppercase tracking-wide mt-1 inline-block",
              statusColors[invoice.invoiceStatus] || statusColors.draft
            )}
          >
            {invoice.invoiceStatus}
          </span>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {invoice.subscriptionIds &&
          invoice.subscriptionIds.length > 0 && (
            <div className="flex items-start gap-2 pb-3 border-b border-slate-200 dark:border-sleads-slate800">
              <Repeat className="w-4 h-4 mt-0.5 flex-shrink-0 text-sleads-blue" />
              <div className="flex-1">
                <div className="text-xs font-semibold text-slate-600 dark:text-sleads-slate400 mb-1.5">
                  {t("dashboard_internal.project_detail.subscriptions") ||
                    "Subscriptions"}:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {invoice.subscriptionIds.map((subId) => {
                    const title =
                      subscriptionTitleMap.get(subId) || "Unknown";
                    return (
                      <span
                        key={subId}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sleads-blue/10 dark:bg-sleads-blue/20 text-sleads-blue dark:text-sleads-blue border border-sleads-blue/20 dark:border-sleads-blue/30"
                      >
                        {title}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        {invoiceDate && (
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-sleads-slate400">
            <Calendar className="w-4 h-4" />
            <span>
              <strong>
                {t("dashboard_internal.project_detail.invoice_date")}:
              </strong>{" "}
              {invoiceDate}
            </span>
          </div>
        )}
        {dueDate && (
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-sleads-slate400">
            <Calendar className="w-4 h-4" />
            <span>
              <strong>
                {t("dashboard_internal.project_detail.invoice_due_date")}:
              </strong>{" "}
              {dueDate}
            </span>
          </div>
        )}
        <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-sleads-slate800">
          <span className="text-sm font-semibold text-slate-600 dark:text-sleads-slate400">
            {t("dashboard_internal.project_detail.invoice_total")}:
          </span>
          <span className="text-lg font-bold text-slate-900 dark:text-white">
            €{total.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Link
          href={`/dashboard/${organizationId}/projects/${projectId}/invoices/${invoice._id}`}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-50 dark:bg-sleads-slate800 text-slate-700 dark:text-white text-sm font-semibold hover:bg-slate-100 dark:hover:bg-sleads-slate700 transition-colors"
        >
          <Eye className="w-4 h-4" />
          {t("dashboard_internal.project_detail.view_invoice")}
        </Link>
        {invoice.invoiceFileUrl && (
          <a
            href={invoice.invoiceFileUrl}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sleads-blue text-white text-sm font-semibold hover:bg-sleads-blue/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            {t("dashboard_internal.project_detail.download_invoice")}
          </a>
        )}
      </div>
    </div>
  );
}
