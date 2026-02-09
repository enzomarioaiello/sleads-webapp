"use client";

import React from "react";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { FilterType, AgendaItemType } from "./types";
import { getTypeConfig } from "./utils";
import { useApp } from "@/app/contexts/AppContext";

interface CalendarFiltersProps {
  filterType: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export function CalendarFilters({
  filterType,
  onFilterChange,
}: CalendarFiltersProps) {
  const { t } = useApp();
  const filterOptions: FilterType[] = [
    "all",
    "meeting",
    "deliverable",
    "cancelled",
    "other",
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Filter className="h-4 w-4 text-slate-400 dark:text-sleads-slate500" />
      <span className="text-sm text-slate-600 dark:text-sleads-slate300">
        {t("dashboard_internal.project_detail.calendar.filter")}:
      </span>
      {filterOptions.map((type) => {
        const config =
          type === "all"
            ? {
                label: t("dashboard_internal.project_detail.calendar.filter_all"),
                color: "bg-slate-100 text-slate-800 dark:bg-sleads-slate800 dark:text-sleads-slate200",
              }
            : getTypeConfig(type as AgendaItemType);
        return (
          <button
            key={type}
            onClick={() => onFilterChange(type)}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              filterType === type
                ? "bg-sleads-blue text-white dark:bg-sleads-blue dark:text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-sleads-slate800 dark:text-sleads-slate300 dark:hover:bg-sleads-slate700"
            )}
          >
            {type === "all" ? config.label : t(`dashboard_internal.project_detail.calendar.type_${type}`)}
          </button>
        );
      })}
    </div>
  );
}

