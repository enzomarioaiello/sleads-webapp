"use client";
import React, { useState } from "react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import Link from "next/link";
import { cn } from "@/app/utils/cn";
import { Doc } from "../../../../../../../../convex/_generated/dataModel";
import { extraCostsTranslations } from "../extra-costs-translations";

type ExtraCost = Doc<"extra_costs">;

interface ExtraCostRowProps {
  cost: ExtraCost;
  organizationId: string;
  projectId: string;
  t: typeof extraCostsTranslations.en;
  language: "en" | "nl";
}

export function ExtraCostRow({
  cost,
  organizationId,
  projectId,
  t,
  language,
}: ExtraCostRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculations
  const total = cost.amount * cost.priceExclTax;
  const taxAmount = total * (cost.tax / 100);
  const totalWithTax = total + taxAmount;

  // Status checks
  const isInvoiced = cost.invoicedDate !== null || cost.invoiceId !== null;
  const isVoided = cost.voided === true;
  const isSeparate = cost.showSeparatelyOnInvoice === true;
  const isReimbursement = total < 0;

  // Status badge
  const getStatusBadge = () => {
    if (isVoided) {
      return (
        <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full bg-gray-100 dark:bg-sleads-slate800 text-gray-700 dark:text-sleads-slate300">
          {t.status_voided}
        </span>
      );
    }
    if (isInvoiced) {
      return (
        <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400">
          {t.status_invoiced}
        </span>
      );
    }
    return (
      <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400">
        {t.status_uninvoiced}
      </span>
    );
  };

  // Type badge
  const getTypeBadge = () => {
    if (isSeparate) {
      return (
        <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 ml-0.5 sm:ml-1">
          {t.status_separate}
        </span>
      );
    }
    return (
      <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 ml-0.5 sm:ml-1">
        {t.status_grouped}
      </span>
    );
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(
      language === "nl" ? "nl-NL" : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  // Truncate name
  const truncateName = (name: string, maxLength: number = 25) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength) + "...";
  };

  // Format price per unit to show all significant digits
  const formatPricePerUnit = (price: number): string => {
    // Show up to 8 decimal places and remove trailing zeros
    const formatted = price.toFixed(8);
    // Remove trailing zeros and the decimal point if not needed
    return formatted.replace(/\.?0+$/, "");
  };

  return (
    <>
      <tr
        className={cn(
          "hover:bg-slate-50 dark:hover:bg-sleads-slate800/50 transition-colors",
          isVoided && "opacity-60",
          "even:bg-slate-50/50 dark:even:bg-sleads-slate800/30"
        )}
      >
        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm sticky left-0 bg-white dark:bg-sleads-slate900 z-10 border-r border-slate-200 dark:border-sleads-slate800">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 sm:p-1 hover:bg-slate-200 dark:hover:bg-sleads-slate700 rounded transition-colors touch-manipulation flex-shrink-0"
              aria-label={isExpanded ? t.collapse_details : t.expand_details}
            >
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
              )}
            </button>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-slate-900 dark:text-white text-xs sm:text-base leading-tight">
                {truncateName(cost.name, 20)}
              </div>
              {isReimbursement && (
                <span className="text-[10px] sm:text-xs text-red-600 dark:text-red-400 block mt-0.5">
                  {t.reimbursement}
                </span>
              )}
            </div>
          </div>
        </td>
        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-right text-slate-900 dark:text-white">
          {cost.amount}
        </td>
        <td className="px-2 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-sm text-right text-slate-900 dark:text-white">
          <span className="font-mono">€{formatPricePerUnit(cost.priceExclTax)}</span>
        </td>
        <td
          className={cn(
            "px-2 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-sm text-right font-semibold",
            isReimbursement
              ? "text-red-600 dark:text-red-400"
              : "text-slate-900 dark:text-white"
          )}
        >
          <span className="font-mono">€{total.toFixed(2)}</span>
        </td>
        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-center hidden md:table-cell">
          <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full bg-slate-100 dark:bg-sleads-slate800 text-slate-700 dark:text-sleads-slate300">
            {cost.tax}%
          </span>
        </td>
        <td
          className={cn(
            "px-2 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-sm text-right font-bold",
            isReimbursement
              ? "text-red-600 dark:text-red-400"
              : "text-slate-900 dark:text-white"
          )}
        >
          <span className="font-mono">€{totalWithTax.toFixed(2)}</span>
        </td>
        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-center">
          <div className="flex items-center justify-center gap-0.5 sm:gap-1 flex-wrap">
            {getStatusBadge()}
            {getTypeBadge()}
          </div>
        </td>
        <td className="px-2 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-sm text-center text-slate-600 dark:text-sleads-slate400 hidden lg:table-cell">
          {formatDate(cost.createdAt)}
        </td>
        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-center">
          {isInvoiced && cost.invoiceId && (
            <Link
              href={`/dashboard/${organizationId}/projects/${projectId}/invoices/${cost.invoiceId}`}
              className="inline-flex items-center gap-1 text-sleads-blue hover:text-sleads-blue/80 transition-colors touch-manipulation p-1 sm:p-1"
              title={t.view_invoice}
            >
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Link>
          )}
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-slate-50 dark:bg-sleads-slate800/50">
          <td colSpan={9} className="px-3 sm:px-4 py-3 sm:py-4">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-600 dark:text-sleads-slate400 mb-1">
                  {t.description}:
                </h4>
                <p className="text-sm text-slate-900 dark:text-white">
                  {cost.description}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-600 dark:text-sleads-slate400 mb-1">
                    {t.quantity_label}:
                  </h4>
                  <p className="text-sm text-slate-900 dark:text-white">
                    {cost.amount}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-600 dark:text-sleads-slate400 mb-1">
                    {t.price_per_unit_label}:
                  </h4>
                  <p className="text-sm text-slate-900 dark:text-white">
                    €{formatPricePerUnit(cost.priceExclTax)}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-600 dark:text-sleads-slate400 mb-1">
                    {t.subtotal_label}:
                  </h4>
                  <p className="text-sm text-slate-900 dark:text-white">
                    €{total.toFixed(2)}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-600 dark:text-sleads-slate400 mb-1">
                    {t.tax_label} ({cost.tax}%):
                  </h4>
                  <p className="text-sm text-slate-900 dark:text-white">
                    €{taxAmount.toFixed(2)}
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-600 dark:text-sleads-slate400 mb-1">
                    {t.total_with_tax}:
                  </h4>
                  <p
                    className={cn(
                      "text-sm font-bold",
                      isReimbursement
                        ? "text-red-600 dark:text-red-400"
                        : "text-slate-900 dark:text-white"
                    )}
                  >
                    €{totalWithTax.toFixed(2)}
                  </p>
                </div>
                {isInvoiced && cost.invoiceId && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-600 dark:text-sleads-slate400 mb-1">
                      {t.invoice}:
                    </h4>
                    <Link
                      href={`/dashboard/${organizationId}/projects/${projectId}/invoices/${cost.invoiceId}`}
                      className="inline-flex items-center gap-1 text-sm text-sleads-blue hover:text-sleads-blue/80 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      {t.view_invoice}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

