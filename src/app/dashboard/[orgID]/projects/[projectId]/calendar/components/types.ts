import { Doc, Id } from "../../../../../../../../convex/_generated/dataModel";

export type AgendaItemType = "meeting" | "deliverable" | "cancelled" | "other";
export type FilterType = "all" | AgendaItemType;
export type ViewType = "month" | "week" | "day";

export type AgendaItem = Doc<"project_agenda_items">;

export interface AgendaFormData {
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
  teams_link: string;
  type: AgendaItemType;
}
