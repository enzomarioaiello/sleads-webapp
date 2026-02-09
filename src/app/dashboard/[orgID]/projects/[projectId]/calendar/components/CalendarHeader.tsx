"use client";

import React from "react";
import { Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/app/contexts/AppContext";

interface CalendarHeaderProps {
  onCreateClick: () => void;
}

export function CalendarHeader({ onCreateClick }: CalendarHeaderProps) {
  const { t } = useApp();

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:${window.location.pathname.includes("/projects") ? "justify-end" : "justify-between"} gap-4`}
    >
      {!window.location.pathname.includes("/projects") ? (
        <div>
          <span className="flex items-center">
            <Calendar className="h-8 w-8 text-sleads-blue mr-2" />
            <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 dark:text-white">
              {t("dashboard_internal.project_detail.calendar.title")}
            </h1>
          </span>
          <p className="text-sm md:text-base text-slate-500 dark:text-sleads-slate400 mt-1">
            {t("dashboard_internal.project_detail.calendar.subtitle")}
          </p>
        </div>
      ) : (
        <></>
      )}
      <Button
        onClick={onCreateClick}
        className="w-full sm:w-auto"
        size="default"
      >
        <Plus className="h-4 w-4 mr-2" />
        {t("dashboard_internal.project_detail.calendar.add_event")}
      </Button>
    </div>
  );
}
