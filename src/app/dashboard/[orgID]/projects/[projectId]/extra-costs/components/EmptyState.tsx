"use client";
import React from "react";
import { DollarSign, Filter } from "lucide-react";
import { extraCostsTranslations } from "../extra-costs-translations";

interface EmptyStateProps {
  type: "no_costs" | "no_filtered_results";
  onClearFilters?: () => void;
  t: typeof extraCostsTranslations.en;
}

export function EmptyState({ type, onClearFilters, t }: EmptyStateProps) {
  if (type === "no_costs") {
    return (
      <div className="bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 rounded-2xl p-12 shadow-sm">
        <div className="flex flex-col items-center justify-center text-center">
          <DollarSign className="w-16 h-16 text-slate-300 dark:text-sleads-slate700 mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {t.no_extra_costs}
          </h3>
          <p className="text-slate-500 dark:text-sleads-slate400">
            {t.no_extra_costs_desc}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 rounded-2xl p-8 shadow-sm">
      <div className="flex flex-col items-center justify-center text-center">
        <Filter className="w-12 h-12 text-slate-300 dark:text-sleads-slate700 mb-4" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          {t.no_filtered_results}
        </h3>
        <p className="text-slate-500 dark:text-sleads-slate400 mb-4">
          {t.no_filtered_results_desc}
        </p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="px-4 py-2 bg-sleads-blue text-white rounded-lg text-sm font-semibold hover:bg-sleads-blue/90 transition-colors"
          >
            {t.clear_filters}
          </button>
        )}
      </div>
    </div>
  );
}

