"use client";

import React from "react";
import { Filter } from "lucide-react";
import { cn } from "@/app/utils/cn";
import { FilterType, AgendaItemType } from "./types";
import { getTypeConfig } from "./utils";

interface AgendaFiltersProps {
  filterType: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

export function AgendaFilters({
  filterType,
  onFilterChange,
}: AgendaFiltersProps) {
  const filterOptions: FilterType[] = [
    "all",
    "meeting",
    "deliverable",
    "cancelled",
    "other",
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Filter className="h-4 w-4 text-gray-400" />
      <span className="text-sm text-gray-600">Filter:</span>
      {filterOptions.map((type) => {
        const config =
          type === "all"
            ? { label: "All", color: "bg-gray-100 text-gray-800" }
            : getTypeConfig(type as AgendaItemType);
        return (
          <button
            key={type}
            onClick={() => onFilterChange(type)}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              filterType === type
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            {config.label}
          </button>
        );
      })}
    </div>
  );
}

