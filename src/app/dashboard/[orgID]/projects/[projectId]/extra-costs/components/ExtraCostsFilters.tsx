"use client";
import React from "react";
import { Filter, ChevronDown, Search } from "lucide-react";
import { cn } from "@/app/utils/cn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "./DateRangePicker";
import { extraCostsTranslations } from "../extra-costs-translations";

interface ExtraCostsFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: "all" | "invoiced" | "uninvoiced" | "voided";
  setStatusFilter: (value: "all" | "invoiced" | "uninvoiced" | "voided") => void;
  taxFilter: "all" | 0 | 9 | 21;
  setTaxFilter: (value: "all" | 0 | 9 | 21) => void;
  typeFilter: "all" | "separate" | "grouped";
  setTypeFilter: (value: "all" | "separate" | "grouped") => void;
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  showFilters: boolean;
  setShowFilters: (value: boolean) => void;
  activeFilterCount: number;
  clearFilters: () => void;
  t: typeof extraCostsTranslations.en;
}

export function ExtraCostsFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  taxFilter,
  setTaxFilter,
  typeFilter,
  setTypeFilter,
  dateRange,
  setDateRange,
  showFilters,
  setShowFilters,
  activeFilterCount,
  clearFilters,
  t,
}: ExtraCostsFiltersProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 rounded-xl shadow-sm transition-all duration-200",
        showFilters ? "p-3 sm:p-4" : "p-2 sm:p-3"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between transition-all duration-200",
          showFilters ? "mb-3 sm:mb-4" : "mb-0"
        )}
      >
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 touch-manipulation",
            "text-sm font-medium text-slate-700 dark:text-sleads-slate300",
            "hover:bg-slate-50 dark:hover:bg-sleads-slate800/50",
            "hover:text-sleads-blue dark:hover:text-sleads-blue",
            "active:scale-[0.98]",
            activeFilterCount > 0 &&
              "bg-slate-50 dark:bg-sleads-slate800/30 text-sleads-blue dark:text-sleads-blue"
          )}
        >
          <Filter
            className={cn(
              "w-4 h-4 transition-colors",
              activeFilterCount > 0 && "text-sleads-blue dark:text-sleads-blue"
            )}
          />
          <span className="hidden sm:inline">{t.active_filters}</span>
          <span className="sm:hidden">Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-sleads-blue text-white text-xs font-semibold rounded-full min-w-[20px] text-center shadow-sm">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform duration-200 text-slate-400 dark:text-sleads-slate500",
              showFilters && "rotate-180",
              activeFilterCount > 0 && "text-sleads-blue dark:text-sleads-blue"
            )}
          />
        </button>
        {activeFilterCount > 0 && (
          <button
            onClick={clearFilters}
            className={cn(
              "text-xs sm:text-sm text-slate-500 dark:text-sleads-slate400",
              "hover:text-sleads-blue dark:hover:text-sleads-blue",
              "transition-colors touch-manipulation",
              "px-2.5 py-1.5 rounded-md",
              "hover:bg-slate-50 dark:hover:bg-sleads-slate800/50",
              "active:scale-[0.98]",
              "min-h-[32px] sm:min-h-0"
            )}
          >
            {t.clear_filters}
          </button>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-5 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-slate-200 dark:border-sleads-slate800">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.search_placeholder}
              className="w-full pl-10 pr-4 py-2.5 sm:py-2 rounded-lg border border-slate-300 dark:border-sleads-slate700 bg-white dark:bg-sleads-slate800 text-slate-900 dark:text-white text-sm focus:border-sleads-blue focus:outline-none focus:ring-1 focus:ring-sleads-blue touch-manipulation"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(
                value as "all" | "invoiced" | "uninvoiced" | "voided"
              )
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t.filter_by_status} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.filter_all}</SelectItem>
              <SelectItem value="invoiced">{t.filter_invoiced}</SelectItem>
              <SelectItem value="uninvoiced">{t.filter_uninvoiced}</SelectItem>
              <SelectItem value="voided">{t.filter_voided}</SelectItem>
            </SelectContent>
          </Select>

          {/* Tax Filter */}
          <Select
            value={taxFilter === "all" ? "all" : taxFilter.toString()}
            onValueChange={(value) =>
              setTaxFilter(
                value === "all" ? "all" : (parseInt(value) as 0 | 9 | 21)
              )
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t.filter_by_tax} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.filter_all}</SelectItem>
              <SelectItem value="0">0%</SelectItem>
              <SelectItem value="9">9%</SelectItem>
              <SelectItem value="21">21%</SelectItem>
            </SelectContent>
          </Select>

          {/* Type Filter */}
          <Select
            value={typeFilter}
            onValueChange={(value) =>
              setTypeFilter(value as "all" | "separate" | "grouped")
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t.filter_by_type} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.filter_all}</SelectItem>
              <SelectItem value="separate">{t.filter_separate}</SelectItem>
              <SelectItem value="grouped">{t.filter_grouped}</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range Filter */}
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            placeholder={t.date_range_placeholder}
          />
        </div>
      )}
    </div>
  );
}

