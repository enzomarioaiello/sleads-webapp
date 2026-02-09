"use client";
import React, { RefObject } from "react";
import { Loader2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/app/utils/cn";
import { Doc } from "../../../../../../../../convex/_generated/dataModel";
import { ExtraCostRow } from "./ExtraCostRow";
import { extraCostsTranslations } from "../extra-costs-translations";

type ExtraCost = Doc<"extra_costs">;

interface ExtraCostsTableProps {
  extraCosts: ExtraCost[];
  organizationId: string;
  projectId: string;
  t: typeof extraCostsTranslations.en;
  language: "en" | "nl";
  paginationResult: {
    isDone: boolean;
    continueCursor: string | null;
  } | null;
  isLoadingMore: boolean;
  observerTarget: RefObject<HTMLDivElement | null>;
  handleLoadMore: () => void;
  sortField: "name" | "quantity" | "pricePerUnit" | "subtotal" | "total" | "createdAt" | null;
  sortDirection: "asc" | "desc";
  onSort: (field: "name" | "quantity" | "pricePerUnit" | "subtotal" | "total" | "createdAt") => void;
}

export function ExtraCostsTable({
  extraCosts,
  organizationId,
  projectId,
  t,
  language,
  paginationResult,
  isLoadingMore,
  observerTarget,
  handleLoadMore,
  sortField,
  sortDirection,
  onSort,
}: ExtraCostsTableProps) {
  const SortButton = ({
    field,
    children,
    align = "left",
  }: {
    field: "name" | "quantity" | "pricePerUnit" | "subtotal" | "total" | "createdAt";
    children: React.ReactNode;
    align?: "left" | "right" | "center";
  }) => {
    const isActive = sortField === field;
    const alignmentClass =
      align === "right"
        ? "justify-end"
        : align === "center"
        ? "justify-center"
        : "justify-start";
    return (
      <button
        onClick={() => onSort(field)}
        className={cn(
          "flex items-center gap-1 hover:text-sleads-blue dark:hover:text-sleads-blue transition-colors touch-manipulation",
          isActive && "text-sleads-blue dark:text-sleads-blue",
          alignmentClass
        )}
      >
        <span>{children}</span>
        {isActive ? (
          sortDirection === "asc" ? (
            <ArrowUp className="w-3 h-3 flex-shrink-0" />
          ) : (
            <ArrowDown className="w-3 h-3 flex-shrink-0" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-40 flex-shrink-0" />
        )}
      </button>
    );
  };
  return (
    <div className="bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="inline-block min-w-full align-middle px-4 sm:px-0">
          <table className="w-full min-w-[700px] sm:min-w-0 table-fixed sm:table-auto">
            <thead className="bg-slate-50 dark:bg-sleads-slate800 border-b border-slate-200 dark:border-sleads-slate700 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-2 sm:px-4 py-2 text-left text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-sleads-slate400 uppercase tracking-wider sticky left-0 bg-slate-50 dark:bg-sleads-slate800 z-20 min-w-[120px] sm:min-w-0">
                  <SortButton field="name">{t.name}</SortButton>
                </th>
                <th className="px-2 sm:px-4 py-2 text-right text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-sleads-slate400 uppercase tracking-wider min-w-[60px] sm:min-w-0">
                  <SortButton field="quantity" align="right">{t.quantity}</SortButton>
                </th>
                <th className="px-2 sm:px-4 py-2 text-right text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-sleads-slate400 uppercase tracking-wider min-w-[90px] sm:min-w-0">
                  <SortButton field="pricePerUnit" align="right">{t.price_per_unit}</SortButton>
                </th>
                <th className="px-2 sm:px-4 py-2 text-right text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-sleads-slate400 uppercase tracking-wider min-w-[80px] sm:min-w-0">
                  <SortButton field="subtotal" align="right">{t.subtotal}</SortButton>
                </th>
                <th className="px-2 sm:px-4 py-2 text-center text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-sleads-slate400 uppercase tracking-wider hidden md:table-cell min-w-[60px]">
                  {t.tax}
                </th>
                <th className="px-2 sm:px-4 py-2 text-right text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-sleads-slate400 uppercase tracking-wider min-w-[80px] sm:min-w-0">
                  <SortButton field="total" align="right">{t.total}</SortButton>
                </th>
                <th className="px-2 sm:px-4 py-2 text-center text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-sleads-slate400 uppercase tracking-wider min-w-[100px] sm:min-w-0">
                  {t.status}
                </th>
                <th className="px-2 sm:px-4 py-2 text-center text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-sleads-slate400 uppercase tracking-wider hidden lg:table-cell">
                  <SortButton field="createdAt" align="center">{t.created_date}</SortButton>
                </th>
                <th className="px-2 sm:px-4 py-2 text-center text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-sleads-slate400 uppercase tracking-wider w-10 sm:w-12">
                  {/* Expand column */}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-sleads-slate800">
              {extraCosts.map((cost) => (
                <ExtraCostRow
                  key={cost._id}
                  cost={cost}
                  organizationId={organizationId}
                  projectId={projectId}
                  t={t}
                  language={language}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Load More / Infinite Scroll */}
      {paginationResult && !paginationResult.isDone && (
        <div
          ref={observerTarget}
          className="flex items-center justify-center py-4 sm:py-6 border-t border-slate-200 dark:border-sleads-slate800"
        >
          {isLoadingMore ? (
            <div className="flex items-center gap-2 text-slate-500 dark:text-sleads-slate400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">{t.loading_more}</span>
            </div>
          ) : (
            <button
              onClick={handleLoadMore}
              className="px-6 py-2.5 sm:px-4 sm:py-2 bg-sleads-blue text-white rounded-lg text-sm font-semibold hover:bg-sleads-blue/90 transition-colors touch-manipulation min-h-[44px] sm:min-h-0"
            >
              {t.load_more}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

