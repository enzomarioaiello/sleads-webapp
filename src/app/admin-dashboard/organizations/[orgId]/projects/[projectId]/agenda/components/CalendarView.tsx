"use client";

import React, { useMemo, useState, useCallback } from "react";
import { Calendar, momentLocalizer, View, Event } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "./CalendarView.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/app/utils/cn";
import { AgendaItem, ViewType } from "./types";
import { formatTime } from "./utils";

const localizer = momentLocalizer(moment);
const DragAndDropCalendar = withDragAndDrop(Calendar);

interface CalendarViewProps {
  events: AgendaItem[];
  currentDate: Date;
  onNavigate: (date: Date) => void;
  onViewChange: (view: ViewType) => void;
  onEventClick: (event: AgendaItem) => void;
  onEventDrop?: (event: AgendaItem, start: Date, end: Date) => void;
  onEventResize?: (event: AgendaItem, start: Date, end: Date) => void;
  view: ViewType;
}

interface CalendarEvent extends Event {
  resource: AgendaItem;
}

export function CalendarView({
  events,
  currentDate,
  onNavigate,
  onViewChange,
  onEventClick,
  onEventDrop,
  onEventResize,
  view,
}: CalendarViewProps) {
  const [currentView, setCurrentView] = useState<View>(
    view === "month" ? "month" : view === "week" ? "week" : "day"
  );

  // Helper functions for type colors (defined before useMemo)
  const getTypeColor = (type: AgendaItem["type"]) => {
    switch (type) {
      case "meeting":
        return "#3b82f6"; // blue
      case "deliverable":
        return "#10b981"; // green
      case "cancelled":
        return "#ef4444"; // red
      case "other":
        return "#6b7280"; // gray
      default:
        return "#6b7280";
    }
  };

  const getTypeBorderColor = (type: AgendaItem["type"]) => {
    switch (type) {
      case "meeting":
        return "#2563eb";
      case "deliverable":
        return "#059669";
      case "cancelled":
        return "#dc2626";
      case "other":
        return "#4b5563";
      default:
        return "#4b5563";
    }
  };

  // Convert agenda items to calendar events
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return events.map((item) => {
      return {
        title: item.title,
        start: new Date(item.startDate),
        end: new Date(item.endDate),
        resource: item,
        // Add styling based on type
        style: {
          backgroundColor: getTypeColor(item.type),
          borderColor: getTypeBorderColor(item.type),
          color: "#fff",
        },
      };
    });
  }, [events]);

  const handleNavigate = (action: "PREV" | "NEXT" | "TODAY" | Date) => {
    if (action === "PREV") {
      const newDate = new Date(currentDate);
      if (currentView === "month") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else if (currentView === "week") {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setDate(newDate.getDate() - 1);
      }
      onNavigate(newDate);
    } else if (action === "NEXT") {
      const newDate = new Date(currentDate);
      if (currentView === "month") {
        newDate.setMonth(newDate.getMonth() + 1);
      } else if (currentView === "week") {
        newDate.setDate(newDate.getDate() + 7);
      } else {
        newDate.setDate(newDate.getDate() + 1);
      }
      onNavigate(newDate);
    } else if (action === "TODAY") {
      onNavigate(new Date());
    } else if (action instanceof Date) {
      onNavigate(action);
    }
  };

  const handleViewChange = (newView: View) => {
    setCurrentView(newView);
    const viewMap: Record<View, ViewType> = {
      month: "month",
      week: "week",
      day: "day",
      agenda: "month",
      work_week: "week",
    };
    onViewChange(viewMap[newView] || "month");
  };

  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => {
      onEventClick(event.resource);
    },
    [onEventClick]
  );

  const handleEventDrop = useCallback(
    ({
      event,
      start,
      end,
    }: {
      event: CalendarEvent;
      start: Date;
      end: Date;
    }) => {
      if (onEventDrop) {
        onEventDrop(event.resource, start, end);
      }
    },
    [onEventDrop]
  );

  const handleEventResize = useCallback(
    ({
      event,
      start,
      end,
    }: {
      event: CalendarEvent;
      start: Date;
      end: Date;
    }) => {
      if (onEventResize) {
        onEventResize(event.resource, start, end);
      }
    },
    [onEventResize]
  );

  const eventStyleGetter = (event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: getTypeColor(event.resource.type),
        borderColor: getTypeBorderColor(event.resource.type),
        borderLeftWidth: "4px",
        color: "#fff",
        borderRadius: "4px",
        padding: "2px 4px",
        fontSize: "0.875rem",
      },
    };
  };

  const formatEventTime = ({ start, end }: { start: Date; end: Date }) => {
    return `${formatTime(start.getTime())} - ${formatTime(end.getTime())}`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Calendar Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleNavigate("PREV")}
            className="p-2 hover:bg-gray-200 rounded-md transition-colors"
            title="Previous"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={() => handleNavigate("TODAY")}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => handleNavigate("NEXT")}
            className="p-2 hover:bg-gray-200 rounded-md transition-colors"
            title="Next"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
          <div className="ml-4 text-lg font-semibold text-gray-900">
            {moment(currentDate).format(
              currentView === "month"
                ? "MMMM YYYY"
                : currentView === "week"
                  ? "MMMM YYYY"
                  : "MMMM D, YYYY"
            )}
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleViewChange("day")}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              currentView === "day"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            )}
          >
            Day
          </button>
          <button
            onClick={() => handleViewChange("week")}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              currentView === "week"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            )}
          >
            Week
          </button>
          <button
            onClick={() => handleViewChange("month")}
            className={cn(
              "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
              currentView === "month"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
            )}
          >
            Month
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="h-[600px] p-4">
        {/* @ts-expect-error - react-big-calendar types are incomplete for drag-and-drop */}
        <DragAndDropCalendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%" }}
          view={currentView}
          onView={handleViewChange}
          date={currentDate}
          onNavigate={handleNavigate}
          onSelectEvent={handleSelectEvent}
          onEventDrop={onEventDrop ? handleEventDrop : undefined}
          onEventResize={onEventResize ? handleEventResize : undefined}
          eventPropGetter={eventStyleGetter}
          formats={{
            eventTimeRangeFormat: formatEventTime,
            timeGutterFormat: (date) => moment(date).format("HH:mm"),
          }}
          defaultView="month"
          popup
          showMultiDayTimes
          step={60}
          timeslots={1}
        />
      </div>
    </div>
  );
}
