"use client";
import React, { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { useApp } from "@/app/contexts/AppContext";
import {
  Calendar,
  Repeat,
  Euro,
  FileText,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
} from "lucide-react";
import { Id, Doc } from "../../../../../../../convex/_generated/dataModel";
import { useParams } from "next/navigation";
import { cn } from "@/app/utils/cn";
import Link from "next/link";
import { useToast } from "@/app/hooks/useToast";
import { monthlySubscriptionsTranslations } from "./monthly-subscriptions-translations";

type Subscription = Doc<"monthly_subscriptions">;
type Invoice = Doc<"invoices">;

export default function ProjectMonthlySubscriptionsPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const organizationId = params.orgID as string;
  const { language } = useApp();

  // Get translations
  const t =
    monthlySubscriptionsTranslations[language as "en" | "nl"] ||
    monthlySubscriptionsTranslations.en;

  const subscriptions = useQuery(
    api.monthlysubscriptions.getSubscriptionsForOrganization,
    {
      projectId: projectId as Id<"projects">,
      organizationId: organizationId as Id<"organizations">,
    }
  );

  const invoices = useQuery(api.invoice.getInvoicesForOrganization, {
    projectId: projectId as Id<"projects">,
    organizationId: organizationId as Id<"organizations">,
  });

  const projectBillingInfo = useQuery(api.project.getProjectBillingInfo, {
    projectId: projectId as Id<"projects">,
    organizationId: organizationId as Id<"organizations">,
  });

  // Create a map of subscription ID to invoices
  const subscriptionInvoicesMap = useMemo(() => {
    if (!invoices || !subscriptions) return new Map();
    const map = new Map<Id<"monthly_subscriptions">, Invoice[]>();
    subscriptions.forEach((sub) => {
      const linkedInvoices = invoices.filter((inv) =>
        inv.subscriptionIds?.includes(sub._id)
      );
      if (linkedInvoices.length > 0) {
        map.set(sub._id, linkedInvoices);
      }
    });
    return map;
  }, [invoices, subscriptions]);

  if (
    subscriptions === undefined ||
    invoices === undefined ||
    projectBillingInfo === undefined
  ) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sleads-blue mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-sleads-slate400">
            {t.loading}
          </p>
        </div>
      </div>
    );
  }

  if (!subscriptions || subscriptions.length === 0) {
    return (
      <div className="bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 rounded-2xl p-12 shadow-sm">
        <div className="flex flex-col items-center justify-center text-center">
          <Repeat className="w-16 h-16 text-slate-300 dark:text-sleads-slate700 mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {t.no_subscriptions}
          </h3>
          <p className="text-slate-500 dark:text-sleads-slate400">
            {t.no_subscriptions_desc}
          </p>
        </div>
      </div>
    );
  }

  // Calculate next invoice date helper function
  const calculateNextInvoiceDate = (
    subscriptionStartDate: number,
    lastInvoiceDate: number | null,
    billingFrequency: "monthly" | "quarterly" | "semiannually" | "yearly"
  ): number => {
    const baseDate = lastInvoiceDate || subscriptionStartDate;
    let monthsToAdd = 1;
    switch (billingFrequency) {
      case "monthly":
        monthsToAdd = 1;
        break;
      case "quarterly":
        monthsToAdd = 3;
        break;
      case "semiannually":
        monthsToAdd = 6;
        break;
      case "yearly":
        monthsToAdd = 12;
        break;
    }
    const base = new Date(baseDate);
    const nextDate = new Date(base);
    nextDate.setMonth(nextDate.getMonth() + monthsToAdd);
    if (base.getDate() !== nextDate.getDate()) {
      nextDate.setDate(0);
    }
    return nextDate.getTime();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {t.page_title}
        </h2>
        <p className="text-sm sm:text-base text-slate-500 dark:text-sleads-slate400">
          {t.page_description}
        </p>
      </div>

      {/* Billing Info Card */}
      {projectBillingInfo?.monthlySubscriptionType && (
        <BillingInfoCard
          billingFrequency={projectBillingInfo.monthlySubscriptionType}
          subscriptions={subscriptions || []}
          calculateNextInvoiceDate={calculateNextInvoiceDate}
          t={t}
          language={language as "en" | "nl"}
        />
      )}

      <div className="grid grid-cols-1 gap-6">
        {subscriptions.map((subscription) => (
          <SubscriptionCard
            key={subscription._id}
            subscription={subscription}
            linkedInvoices={subscriptionInvoicesMap.get(subscription._id) || []}
            organizationId={organizationId}
            projectId={projectId}
            projectBillingInfo={
              projectBillingInfo
                ? {
                    monthlySubscriptionType:
                      projectBillingInfo.monthlySubscriptionType ?? null,
                  }
                : null
            }
            calculateNextInvoiceDate={calculateNextInvoiceDate}
            t={t}
            language={language as "en" | "nl"}
          />
        ))}
      </div>
    </div>
  );
}

function BillingInfoCard({
  billingFrequency,
  subscriptions,
  calculateNextInvoiceDate,
  t,
  language,
}: {
  billingFrequency: "monthly" | "quarterly" | "semiannually" | "yearly";
  subscriptions: Subscription[];
  calculateNextInvoiceDate: (
    startDate: number,
    lastInvoiceDate: number | null,
    frequency: "monthly" | "quarterly" | "semiannually" | "yearly"
  ) => number;
  t: typeof monthlySubscriptionsTranslations.en;
  language: "en" | "nl";
}) {
  // Get billing cycle label
  const billingCycleLabels: Record<
    "monthly" | "quarterly" | "semiannually" | "yearly",
    string
  > = {
    monthly: t.billing_cycle_monthly,
    quarterly: t.billing_cycle_quarterly,
    semiannually: t.billing_cycle_semiannually,
    yearly: t.billing_cycle_yearly,
  };

  // Calculate next invoice date for active subscriptions
  const activeSubscriptions = subscriptions.filter(
    (sub) => sub.subscriptionStatus === "active"
  );

  const nextInvoiceDate = useMemo(() => {
    if (activeSubscriptions.length === 0) return null;
    const nextDates = activeSubscriptions.map((sub) =>
      calculateNextInvoiceDate(
        sub.subscriptionStartDate,
        sub.lastInvoiceDate ?? null,
        billingFrequency
      )
    );
    return Math.min(...nextDates);
  }, [activeSubscriptions, billingFrequency, calculateNextInvoiceDate]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(
      language === "nl" ? "nl-NL" : "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  };

  const [currentTime] = useState(() => Date.now());

  const getDaysUntil = (timestamp: number) => {
    const diff = timestamp - currentTime;
    const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
    return days;
  };

  return (
    <div className="bg-gradient-to-br from-sleads-blue/5 to-sleads-blue/10 dark:from-sleads-blue/10 dark:to-sleads-blue/20 border border-sleads-blue/20 dark:border-sleads-blue/30 rounded-2xl p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3 sm:gap-4 flex-1">
          <div className="p-2 sm:p-3 bg-sleads-blue/20 dark:bg-sleads-blue/30 rounded-lg text-sleads-blue shrink-0">
            <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-slate-600 dark:text-sleads-slate400 mb-1">
              {t.billing_cycle}
            </h3>
            <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {billingCycleLabels[billingFrequency]}
            </p>
          </div>
        </div>
        {nextInvoiceDate && (
          <div className="flex items-start gap-3 sm:gap-4 flex-1 sm:justify-end">
            <div className="p-2 sm:p-3 bg-sleads-blue/20 dark:bg-sleads-blue/30 rounded-lg text-sleads-blue shrink-0">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-slate-600 dark:text-sleads-slate400 mb-1">
                {t.next_invoice_date}
              </h3>
              <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {formatDate(nextInvoiceDate)}
              </p>
              {getDaysUntil(nextInvoiceDate) >= 0 && (
                <p className="text-xs text-slate-500 dark:text-sleads-slate400 mt-1">
                  {getDaysUntil(nextInvoiceDate) === 0
                    ? t.next_invoice_date_soon
                    : getDaysUntil(nextInvoiceDate) === 1
                      ? t.day_until_next_invoice.replace("{days}", "1")
                      : t.days_until_next_invoice.replace(
                          "{days}",
                          getDaysUntil(nextInvoiceDate).toString()
                        )}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SubscriptionCard({
  subscription,
  linkedInvoices,
  organizationId,
  projectId,
  projectBillingInfo,
  calculateNextInvoiceDate,
  t,
  language,
}: {
  subscription: Subscription;
  linkedInvoices: Invoice[];
  organizationId: string;
  projectId: string;
  projectBillingInfo: {
    monthlySubscriptionType:
      | "monthly"
      | "quarterly"
      | "semiannually"
      | "yearly"
      | null;
  } | null;
  calculateNextInvoiceDate: (
    startDate: number,
    lastInvoiceDate: number | null,
    frequency: "monthly" | "quarterly" | "semiannually" | "yearly"
  ) => number;
  t: typeof monthlySubscriptionsTranslations.en;
  language: "en" | "nl";
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const statusColors: Record<string, string> = {
    active:
      "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400",
    cancelled:
      "bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    inactive:
      "bg-gray-100 dark:bg-sleads-slate800 text-gray-700 dark:text-sleads-slate300",
  };

  const startDate = new Date(
    subscription.subscriptionStartDate
  ).toLocaleDateString("nl-NL");
  const endDate = subscription.subscriptionEndDate
    ? new Date(subscription.subscriptionEndDate).toLocaleDateString("nl-NL")
    : null;

  const amountWithTax =
    subscription.subscriptionAmount * (1 + subscription.tax / 100);

  return (
    <>
      <div className="bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="p-2 sm:p-3 bg-sleads-blue/10 dark:bg-sleads-blue/20 rounded-lg text-sleads-blue shrink-0">
                <Repeat className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white mb-2">
                  {subscription.title}
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <span
                    className={cn(
                      "text-xs font-semibold px-2 py-1 rounded-full uppercase tracking-wide w-fit",
                      statusColors[subscription.subscriptionStatus] ||
                        statusColors.inactive
                    )}
                  >
                    {subscription.subscriptionStatus === "active"
                      ? t.status_active
                      : subscription.subscriptionStatus === "cancelled"
                        ? t.status_cancelled
                        : t.status_inactive}
                  </span>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-sleads-slate400">
                    <Euro className="w-4 h-4 shrink-0" />
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {subscription.subscriptionAmount.toFixed(2)}
                      {t.per_month}
                    </span>
                    {subscription.tax > 0 && (
                      <span className="text-xs hidden sm:inline">
                        ({t.tax}: {subscription.tax}% = €
                        {amountWithTax.toFixed(2)}
                        {t.per_month})
                      </span>
                    )}
                  </div>
                  {subscription.tax > 0 && (
                    <span className="text-xs text-slate-500 dark:text-sleads-slate400 sm:hidden">
                      ({t.tax}: {subscription.tax}% = €
                      {amountWithTax.toFixed(2)}
                      {t.per_month})
                    </span>
                  )}
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-sleads-slate400">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span className="truncate">
                      {t.start_date}: {startDate}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* Cancel and expand buttons on the right */}
            <div className="flex items-center gap-2 shrink-0">
              {subscription.subscriptionStatus === "active" && (
                <button
                  onClick={() => setIsCancelModalOpen(true)}
                  className="px-3 sm:px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2"
                  title={t.cancel_subscription}
                >
                  <X className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">
                    {t.cancel_subscription}
                  </span>
                </button>
              )}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-sleads-slate300 hover:bg-slate-100 dark:hover:bg-sleads-slate800 rounded-lg transition-colors shrink-0"
              >
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile: Full width expand/collapse button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full sm:hidden mt-4 py-2.5 px-4 text-sm font-semibold text-slate-700 dark:text-sleads-slate300 bg-slate-50 dark:bg-sleads-slate800 hover:bg-slate-100 dark:hover:bg-sleads-slate700 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span>{t.collapse_details}</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span>{t.expand_details}</span>
              </>
            )}
          </button>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-slate-200 dark:border-sleads-slate800 pt-4 sm:pt-6 space-y-4">
            {/* Description */}
            <div>
              <h4 className="text-sm font-semibold text-slate-600 dark:text-sleads-slate400 mb-1">
                {t.description}:
              </h4>
              <p className="text-sm text-slate-900 dark:text-white">
                {subscription.description}
              </p>
            </div>

            {/* Next Invoice Date Info */}
            {projectBillingInfo?.monthlySubscriptionType &&
              subscription.subscriptionStatus === "active" && (
                <NextInvoiceDateDisplay
                  subscription={subscription}
                  billingFrequency={projectBillingInfo.monthlySubscriptionType}
                  calculateNextInvoiceDate={calculateNextInvoiceDate}
                  t={t}
                  language={language}
                />
              )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-600 dark:text-sleads-slate400 mb-1">
                  {t.amount}:
                </h4>
                <p className="text-sm text-slate-900 dark:text-white">
                  €{subscription.subscriptionAmount.toFixed(2)}
                  {t.per_month}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-600 dark:text-sleads-slate400 mb-1">
                  {t.tax}:
                </h4>
                <p className="text-sm text-slate-900 dark:text-white">
                  {subscription.tax}%
                </p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-600 dark:text-sleads-slate400 mb-1">
                  {t.start_date}:
                </h4>
                <p className="text-sm text-slate-900 dark:text-white">
                  {startDate}
                </p>
              </div>
              {endDate && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-600 dark:text-sleads-slate400 mb-1">
                    {t.end_date}:
                  </h4>
                  <p className="text-sm text-slate-900 dark:text-white">
                    {endDate}
                  </p>
                </div>
              )}
              {subscription.discount && (
                <div className="col-span-1 sm:col-span-2">
                  <h4 className="text-sm font-semibold text-slate-600 dark:text-sleads-slate400 mb-1">
                    {t.discount}:
                  </h4>
                  <p className="text-sm text-slate-900 dark:text-white">
                    {subscription.discountType === "percentage"
                      ? t.discount_percentage.replace(
                          "{value}",
                          subscription.discount.toString()
                        )
                      : t.discount_fixed.replace(
                          "{value}",
                          subscription.discount.toFixed(2)
                        )}
                    {subscription.discountPeriodInMonths &&
                      ` ${t.discount_period
                        .replace(
                          "{months}",
                          subscription.discountPeriodInMonths.toString()
                        )
                        .replace(
                          "{monthsText}",
                          subscription.discountPeriodInMonths === 1
                            ? t.month
                            : t.months
                        )}`}
                  </p>
                </div>
              )}
            </div>

            {/* Linked Invoices */}
            <div>
              <h4 className="text-sm font-semibold text-slate-600 dark:text-sleads-slate400 mb-3">
                {t.linked_invoices}:
              </h4>
              {linkedInvoices.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-sleads-slate400">
                  {t.no_linked_invoices}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {linkedInvoices.map((invoice) => {
                    const invoiceDate = invoice.invoiceDate
                      ? new Date(invoice.invoiceDate).toLocaleDateString(
                          "nl-NL"
                        )
                      : null;
                    const statusColors: Record<string, string> = {
                      draft:
                        "bg-slate-100 dark:bg-sleads-slate800 text-slate-700 dark:text-sleads-slate300",
                      sent: "bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400",
                      paid: "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400",
                      overdue:
                        "bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400",
                      cancelled:
                        "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400",
                    };
                    return (
                      <Link
                        key={invoice._id}
                        href={`/dashboard/${organizationId}/projects/${projectId}/invoices/${invoice._id}`}
                        className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-sleads-blue/10 dark:bg-sleads-blue/20 text-sleads-blue dark:text-sleads-blue border border-sleads-blue/20 dark:border-sleads-blue/30 hover:bg-sleads-blue/20 dark:hover:bg-sleads-blue/30 transition-colors text-xs sm:text-xs"
                      >
                        <FileText className="w-3 h-3 shrink-0" />
                        <span className="font-medium truncate max-w-[120px] sm:max-w-none">
                          {invoice.invoiceIdentifiefier ||
                            `Invoice #${invoice.invoiceNumber}`}
                        </span>
                        {invoiceDate && (
                          <span className="text-xs text-slate-500 dark:text-sleads-slate400 hidden sm:inline">
                            • {invoiceDate}
                          </span>
                        )}
                        <span
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded uppercase font-semibold shrink-0",
                            statusColors[invoice.invoiceStatus] ||
                              statusColors.draft
                          )}
                        >
                          {invoice.invoiceStatus}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {isCancelModalOpen && (
        <CancelSubscriptionModal
          subscription={subscription}
          organizationId={organizationId}
          onClose={() => setIsCancelModalOpen(false)}
          onSuccess={() => {
            setIsCancelModalOpen(false);
          }}
          t={t}
        />
      )}
    </>
  );
}

function NextInvoiceDateDisplay({
  subscription,
  billingFrequency,
  calculateNextInvoiceDate,
  t,
  language,
}: {
  subscription: Subscription;
  billingFrequency: "monthly" | "quarterly" | "semiannually" | "yearly";
  calculateNextInvoiceDate: (
    startDate: number,
    lastInvoiceDate: number | null,
    frequency: "monthly" | "quarterly" | "semiannually" | "yearly"
  ) => number;
  t: typeof monthlySubscriptionsTranslations.en;
  language: "en" | "nl";
}) {
  const [currentTime] = useState(() => Date.now());

  const nextInvoiceInfo = useMemo(() => {
    const nextDate = calculateNextInvoiceDate(
      subscription.subscriptionStartDate,
      subscription.lastInvoiceDate ?? null,
      billingFrequency
    );
    const daysUntil = Math.ceil(
      (nextDate - currentTime) / (24 * 60 * 60 * 1000)
    );
    const formattedDate = new Date(nextDate).toLocaleDateString(
      language === "nl" ? "nl-NL" : "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
    return { nextDate, daysUntil, formattedDate };
  }, [
    subscription.subscriptionStartDate,
    subscription.lastInvoiceDate,
    billingFrequency,
    calculateNextInvoiceDate,
    language,
    currentTime,
  ]);

  return (
    <div className="bg-sleads-blue/5 dark:bg-sleads-blue/10 border border-sleads-blue/20 dark:border-sleads-blue/30 rounded-lg p-3 sm:p-4">
      <div className="flex items-start gap-3">
        <Clock className="w-5 h-5 text-sleads-blue shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-slate-600 dark:text-sleads-slate400 mb-1">
            {t.next_invoice_date}
          </h4>
          <p className="text-base font-bold text-slate-900 dark:text-white">
            {nextInvoiceInfo.formattedDate}
          </p>
          {nextInvoiceInfo.daysUntil >= 0 && (
            <p className="text-xs text-slate-500 dark:text-sleads-slate400 mt-1">
              {nextInvoiceInfo.daysUntil === 0
                ? t.next_invoice_date_soon
                : nextInvoiceInfo.daysUntil === 1
                  ? t.day_until_next_invoice.replace("{days}", "1")
                  : t.days_until_next_invoice.replace(
                      "{days}",
                      nextInvoiceInfo.daysUntil.toString()
                    )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CancelSubscriptionModal({
  subscription,
  organizationId,
  onClose,
  onSuccess,
  t,
}: {
  subscription: Subscription;
  organizationId: string;
  onClose: () => void;
  onSuccess: () => void;
  t: typeof monthlySubscriptionsTranslations.en;
}) {
  const [cancellationDate, setCancellationDate] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const requestCancellation = useMutation(
    api.monthlysubscriptions.requestSubscriptionCancellation
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await requestCancellation({
        organizationId: organizationId as Id<"organizations">,
        subscriptionId: subscription._id,
        cancellationDate: cancellationDate
          ? new Date(cancellationDate).getTime()
          : null,
        message: message || null,
      });
      toast({
        title: t.cancel_success,
        description: t.cancel_success_desc,
        variant: "success",
      });
      onSuccess();
    } catch (error) {
      toast({
        title: t.cancel_error,
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 p-4">
      <div className="bg-white dark:bg-sleads-slate900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-sleads-slate800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {t.cancel_subscription_modal_title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-sleads-slate400 mt-2">
                {t.cancel_subscription_modal_description}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-sleads-slate300 hover:bg-slate-100 dark:hover:bg-sleads-slate800 rounded-lg transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 space-y-4 sm:space-y-6"
        >
          {/* Subscription Summary */}
          <div className="bg-slate-50 dark:bg-sleads-slate800 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
              {subscription.title}
            </h4>
            <div className="text-sm text-slate-600 dark:text-sleads-slate400 space-y-1">
              <p>
                {t.amount}: €{subscription.subscriptionAmount.toFixed(2)}
                {t.per_month}
              </p>
              <p>
                {t.status}:{" "}
                {subscription.subscriptionStatus === "active"
                  ? t.status_active
                  : subscription.subscriptionStatus === "cancelled"
                    ? t.status_cancelled
                    : t.status_inactive}
              </p>
            </div>
          </div>

          {/* Cancellation Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-sleads-slate300 mb-2">
              {t.cancellation_date}
            </label>
            <input
              type="date"
              value={cancellationDate}
              onChange={(e) => setCancellationDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-sleads-slate700 bg-white dark:bg-sleads-slate800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-sleads-blue focus:outline-none focus:ring-1 focus:ring-sleads-blue"
              placeholder={t.cancellation_date_placeholder}
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-sleads-slate300 mb-2">
              {t.cancellation_message}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-300 dark:border-sleads-slate700 bg-white dark:bg-sleads-slate800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:border-sleads-blue focus:outline-none focus:ring-1 focus:ring-sleads-blue resize-none"
              placeholder={t.cancellation_message_placeholder}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 border-t border-slate-200 dark:border-sleads-slate800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-slate-700 dark:text-sleads-slate300 bg-slate-100 dark:bg-sleads-slate800 hover:bg-slate-200 dark:hover:bg-sleads-slate700 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-white bg-sleads-blue hover:bg-sleads-blue/90 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                t.cancel_button
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
