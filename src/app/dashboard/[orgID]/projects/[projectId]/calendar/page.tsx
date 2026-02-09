"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../convex/_generated/dataModel";
import { Loader2 } from "lucide-react";
import { useToast } from "@/app/hooks/useToast";
import { useApp } from "@/app/contexts/AppContext";
import { CalendarHeader } from "./components/CalendarHeader";
import { CalendarFilters } from "./components/CalendarFilters";
import { CalendarForm } from "./components/CalendarForm";
import { CalendarView } from "./components/CalendarView";
import {
  AgendaItem,
  AgendaFormData,
  FilterType,
  ViewType,
} from "./components/types";
import { formatLocalDate, formatLocalTime } from "./components/utils";

export default function ProjectCalendarPage() {
  const params = useParams();
  const projectId = params.projectId as Id<"projects">;
  const orgId = params.orgID as Id<"organizations">;
  const { toast } = useToast();
  const { t } = useApp();

  const agendaItems = useQuery(api.projectAgenda.getAgendaItems, {
    projectId,
    organizationId: orgId,
  });

  const createAgendaItem = useMutation(
    api.projectAgenda.createAgendaItemForUser
  );
  const updateAgendaItem = useMutation(
    api.projectAgenda.updateAgendaItemForUser
  );
  const deleteAgendaItem = useMutation(
    api.projectAgenda.deleteAgendaItemForUser
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] =
    useState<Id<"project_agenda_items"> | null>(null);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>("month");

  // Optimistic updates: track pending changes by item ID
  const [optimisticUpdates, setOptimisticUpdates] = useState<
    Map<Id<"project_agenda_items">, Partial<AgendaItem>>
  >(new Map());

  // Initialize form with default values
  const getInitialFormData = (): AgendaFormData => {
    const now = new Date();
    const defaultDate = formatLocalDate(now);
    return {
      title: "",
      description: "",
      startDate: defaultDate,
      startTime: "09:00",
      endDate: defaultDate,
      endTime: "10:00",
      location: "",
      teams_link: "",
      type: "meeting",
    };
  };

  const [formData, setFormData] =
    useState<AgendaFormData>(getInitialFormData());

  // Reset form
  const resetForm = () => {
    setFormData(getInitialFormData());
    setEditingItemId(null);
  };

  // Open create modal
  const handleCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  // Handle event click from calendar
  const handleEventClick = (item: AgendaItem) => {
    const startDate = new Date(item.startDate);
    const endDate = new Date(item.endDate);

    setFormData({
      title: item.title,
      description: item.description,
      startDate: formatLocalDate(startDate),
      startTime: formatLocalTime(startDate),
      endDate: formatLocalDate(endDate),
      endTime: formatLocalTime(endDate),
      location: item.location || "",
      teams_link: item.teams_link || "",
      type: item.type,
    });
    setEditingItemId(item._id);
    setIsModalOpen(true);
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (
        !formData.startDate ||
        !formData.startTime ||
        !formData.endDate ||
        !formData.endTime
      ) {
        toast({
          title: t("dashboard_internal.project_detail.calendar.error"),
          description: t(
            "dashboard_internal.project_detail.calendar.fill_all_fields"
          ),
          variant: "error",
        });
        setIsSubmitting(false);
        return;
      }

      // Create date objects with proper timezone handling
      const startDateStr = `${formData.startDate}T${formData.startTime}:00`;
      const endDateStr = `${formData.endDate}T${formData.endTime}:00`;

      const startDateTime = new Date(startDateStr);
      const endDateTime = new Date(endDateStr);

      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        toast({
          title: t("dashboard_internal.project_detail.calendar.error"),
          description: t(
            "dashboard_internal.project_detail.calendar.invalid_dates"
          ),
          variant: "error",
        });
        setIsSubmitting(false);
        return;
      }

      if (endDateTime <= startDateTime) {
        toast({
          title: t("dashboard_internal.project_detail.calendar.error"),
          description: t(
            "dashboard_internal.project_detail.calendar.end_after_start"
          ),
          variant: "error",
        });
        setIsSubmitting(false);
        return;
      }

      if (editingItemId) {
        // Update existing item
        await updateAgendaItem({
          agendaItemId: editingItemId,
          organizationId: orgId,
          title: formData.title || null,
          description: formData.description || null,
          startDate: startDateTime.getTime(),
          endDate: endDateTime.getTime(),
          location: formData.location || null,
          teams_link: formData.teams_link || null,
          type: formData.type || null,
        });

        // Clear any optimistic updates for this item
        setOptimisticUpdates((prev) => {
          const newMap = new Map(prev);
          newMap.delete(editingItemId);
          return newMap;
        });

        toast({
          title: t("dashboard_internal.project_detail.calendar.event_updated"),
          description: t(
            "dashboard_internal.project_detail.calendar.event_updated_desc"
          ),
          variant: "success",
        });
      } else {
        // Create new item
        await createAgendaItem({
          projectId,
          organizationId: orgId,
          title: formData.title,
          description: formData.description,
          startDate: startDateTime.getTime(),
          endDate: endDateTime.getTime(),
          location: formData.location || null,
          teams_link: formData.teams_link || null,
          type: formData.type,
        });
        toast({
          title: t("dashboard_internal.project_detail.calendar.event_created"),
          description: t(
            "dashboard_internal.project_detail.calendar.event_created_desc"
          ),
          variant: "success",
        });
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error &&
        (error.message.includes("Unauthorized") ||
          error.message.includes("admin-created"))
          ? t(
              "dashboard_internal.project_detail.calendar.cannot_edit_admin_event"
            )
          : editingItemId
            ? t("dashboard_internal.project_detail.calendar.update_failed")
            : t("dashboard_internal.project_detail.calendar.create_failed");
      toast({
        title: t("dashboard_internal.project_detail.calendar.error"),
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!editingItemId) return;
    if (
      !confirm(t("dashboard_internal.project_detail.calendar.confirm_delete"))
    )
      return;

    try {
      await deleteAgendaItem({
        agendaItemId: editingItemId,
        organizationId: orgId,
      });
      toast({
        title: t("dashboard_internal.project_detail.calendar.event_deleted"),
        description: t(
          "dashboard_internal.project_detail.calendar.event_deleted_desc"
        ),
        variant: "success",
      });
      setIsModalOpen(false);
      resetForm();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error &&
        (error.message.includes("Unauthorized") ||
          error.message.includes("admin-created"))
          ? t(
              "dashboard_internal.project_detail.calendar.cannot_delete_admin_event"
            )
          : t("dashboard_internal.project_detail.calendar.delete_failed");
      toast({
        title: t("dashboard_internal.project_detail.calendar.error"),
        description: errorMessage,
        variant: "error",
      });
    }
  };

  // Handle event drop (drag and drop)
  const handleEventDrop = async (item: AgendaItem, start: Date, end: Date) => {
    // Check if user can edit this item
    if (item.createdByAdmin) {
      toast({
        title: t(
          "dashboard_internal.project_detail.calendar.cannot_edit_admin_event"
        ),
        description: t(
          "dashboard_internal.project_detail.calendar.cannot_edit_admin_event_desc"
        ),
        variant: "error",
      });
      return;
    }

    // Optimistically update immediately
    setOptimisticUpdates((prev) => {
      const newMap = new Map(prev);
      newMap.set(item._id, {
        ...item,
        startDate: start.getTime(),
        endDate: end.getTime(),
      });
      return newMap;
    });

    try {
      await updateAgendaItem({
        agendaItemId: item._id,
        organizationId: orgId,
        startDate: start.getTime(),
        endDate: end.getTime(),
      });

      // Clear optimistic update on success
      setOptimisticUpdates((prev) => {
        const newMap = new Map(prev);
        newMap.delete(item._id);
        return newMap;
      });

      toast({
        title: t("dashboard_internal.project_detail.calendar.event_moved"),
        description: t(
          "dashboard_internal.project_detail.calendar.event_moved_desc"
        ),
        variant: "success",
      });
    } catch (error: unknown) {
      // Revert optimistic update on error
      setOptimisticUpdates((prev) => {
        const newMap = new Map(prev);
        newMap.delete(item._id);
        return newMap;
      });

      const errorMessage =
        error instanceof Error &&
        (error.message.includes("Unauthorized") ||
          error.message.includes("admin-created"))
          ? t(
              "dashboard_internal.project_detail.calendar.cannot_edit_admin_event"
            )
          : t("dashboard_internal.project_detail.calendar.move_failed");
      toast({
        title: t("dashboard_internal.project_detail.calendar.error"),
        description: errorMessage,
        variant: "error",
      });
    }
  };

  // Handle event resize
  const handleEventResize = async (
    item: AgendaItem,
    start: Date,
    end: Date
  ) => {
    // Check if user can edit this item
    if (item.createdByAdmin) {
      toast({
        title: t(
          "dashboard_internal.project_detail.calendar.cannot_edit_admin_event"
        ),
        description: t(
          "dashboard_internal.project_detail.calendar.cannot_edit_admin_event_desc"
        ),
        variant: "error",
      });
      return;
    }

    // Optimistically update immediately
    setOptimisticUpdates((prev) => {
      const newMap = new Map(prev);
      newMap.set(item._id, {
        ...item,
        startDate: start.getTime(),
        endDate: end.getTime(),
      });
      return newMap;
    });

    try {
      await updateAgendaItem({
        agendaItemId: item._id,
        organizationId: orgId,
        startDate: start.getTime(),
        endDate: end.getTime(),
      });

      // Clear optimistic update on success
      setOptimisticUpdates((prev) => {
        const newMap = new Map(prev);
        newMap.delete(item._id);
        return newMap;
      });

      toast({
        title: t("dashboard_internal.project_detail.calendar.event_resized"),
        description: t(
          "dashboard_internal.project_detail.calendar.event_resized_desc"
        ),
        variant: "success",
      });
    } catch (error: unknown) {
      // Revert optimistic update on error
      setOptimisticUpdates((prev) => {
        const newMap = new Map(prev);
        newMap.delete(item._id);
        return newMap;
      });

      const errorMessage =
        error instanceof Error &&
        (error.message.includes("Unauthorized") ||
          error.message.includes("admin-created"))
          ? t(
              "dashboard_internal.project_detail.calendar.cannot_edit_admin_event"
            )
          : t("dashboard_internal.project_detail.calendar.resize_failed");
      toast({
        title: t("dashboard_internal.project_detail.calendar.error"),
        description: errorMessage,
        variant: "error",
      });
    }
  };

  // Merge optimistic updates with query data
  const itemsWithOptimisticUpdates = useMemo(() => {
    if (!agendaItems) return [];

    return agendaItems.map((item: AgendaItem) => {
      const optimisticUpdate = optimisticUpdates.get(item._id);
      if (optimisticUpdate) {
        // Merge optimistic update with base item
        return { ...item, ...optimisticUpdate } as AgendaItem;
      }
      return item;
    });
  }, [agendaItems, optimisticUpdates]);

  // Filter items
  const filteredItems = useMemo(() => {
    if (!itemsWithOptimisticUpdates) return [];
    return itemsWithOptimisticUpdates.filter((item: AgendaItem) => {
      if (filterType === "all") return true;
      return item.type === filterType;
    });
  }, [itemsWithOptimisticUpdates, filterType]);

  if (agendaItems === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400 dark:text-sleads-slate400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CalendarHeader onCreateClick={handleCreate} />

      <CalendarFilters filterType={filterType} onFilterChange={setFilterType} />

      <CalendarView
        events={filteredItems}
        currentDate={currentDate}
        onNavigate={setCurrentDate}
        onViewChange={setView}
        onEventClick={handleEventClick}
        onEventDrop={handleEventDrop}
        onEventResize={handleEventResize}
        view={view}
      />

      <CalendarForm
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isSubmitting}
        editingItemId={editingItemId}
        canDelete={
          editingItemId
            ? !agendaItems.find(
                (item: AgendaItem) => item._id === editingItemId
              )?.createdByAdmin
            : false
        }
        isReadOnly={
          editingItemId
            ? !!agendaItems.find(
                (item: AgendaItem) => item._id === editingItemId
              )?.createdByAdmin
            : false
        }
      />
    </div>
  );
}
