import { AgendaItem, AgendaItemType } from "./types";
import {
  Video,
  FileText,
  Ban,
  MoreHorizontal,
  Calendar,
  LucideIcon,
} from "lucide-react";

export interface TypeConfig {
  icon: LucideIcon;
  color: string;
  label: string;
}

export const getTypeConfig = (type: AgendaItemType): TypeConfig => {
  switch (type) {
    case "meeting":
      return {
        icon: Video,
        color: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
        label: "Meeting",
      };
    case "deliverable":
      return {
        icon: FileText,
        color: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
        label: "Deliverable",
      };
    case "cancelled":
      return {
        icon: Ban,
        color: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
        label: "Cancelled",
      };
    case "other":
      return {
        icon: MoreHorizontal,
        color: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
        label: "Other",
      };
    default:
      return {
        icon: Calendar,
        color: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
        label: "Unknown",
      };
  }
};

export const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const isOngoing = (item: AgendaItem) => {
  const now = Date.now();
  return item.startDate <= now && item.endDate >= now;
};

export const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatLocalTime = (date: Date) => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

