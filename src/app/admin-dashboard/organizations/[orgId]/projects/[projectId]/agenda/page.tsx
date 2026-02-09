"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../../convex/_generated/dataModel";
import { Loader2 } from "lucide-react";
import { useToast } from "@/app/hooks/useToast";
import { AgendaHeader } from "./components/AgendaHeader";
import { AgendaFilters } from "./components/AgendaFilters";
import { AgendaForm } from "./components/AgendaForm";
import { CalendarView } from "./components/CalendarView";
import {
  AgendaItem,
  AgendaFormData,
  FilterType,
  ViewType,
} from "./components/types";
import { formatLocalDate, formatLocalTime } from "./components/utils";

export default function ProjectAgendaPage() {
  const params = useParams();
  const projectId = params.projectId as Id<"projects">;
  const orgId = params.orgId as Id<"organizations">;
  const { toast } = useToast();

  const agendaItems = useQuery(api.projectAgenda.getAgendaItems, {
    projectId,
    organizationId: orgId,
  });

  const createAgendaItem = useMutation(api.projectAgenda.createAgendaItem);
  const updateAgendaItem = useMutation(api.projectAgenda.updateAgendaItem);
  const deleteAgendaItem = useMutation(api.projectAgenda.deleteAgendaItem);

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
          title: "Error",
          description: "Please fill in all required date and time fields.",
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
          title: "Error",
          description: "Please enter valid dates and times.",
          variant: "error",
        });
        setIsSubmitting(false);
        return;
      }

      if (endDateTime <= startDateTime) {
        toast({
          title: "Error",
          description: "End date/time must be after start date/time.",
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
          title: "Agenda item updated",
          description: "The agenda item has been updated successfully.",
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
          createdByAdmin: true,
          location: formData.location || null,
          teams_link: formData.teams_link || null,
          type: formData.type,
        });
        toast({
          title: "Agenda item created",
          description: "The agenda item has been created successfully.",
          variant: "success",
        });
      }

      setIsModalOpen(false);
      resetForm();
    } catch {
      toast({
        title: "Error",
        description: editingItemId
          ? "Failed to update agenda item."
          : "Failed to create agenda item.",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!editingItemId) return;
    if (!confirm("Are you sure you want to delete this agenda item?")) return;

    try {
      await deleteAgendaItem({
        agendaItemId: editingItemId,
        organizationId: orgId,
      });
      toast({
        title: "Agenda item deleted",
        description: "The agenda item has been deleted successfully.",
        variant: "success",
      });
      setIsModalOpen(false);
      resetForm();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete agenda item.",
        variant: "error",
      });
    }
  };

  // Handle event drop (drag and drop)
  const handleEventDrop = async (item: AgendaItem, start: Date, end: Date) => {
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
        title: "Event moved",
        description: "The event has been moved successfully.",
        variant: "success",
      });
    } catch {
      // Revert optimistic update on error
      setOptimisticUpdates((prev) => {
        const newMap = new Map(prev);
        newMap.delete(item._id);
        return newMap;
      });

      toast({
        title: "Error",
        description: "Failed to move event.",
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
        title: "Event resized",
        description: "The event duration has been updated successfully.",
        variant: "success",
      });
    } catch {
      // Revert optimistic update on error
      setOptimisticUpdates((prev) => {
        const newMap = new Map(prev);
        newMap.delete(item._id);
        return newMap;
      });

      toast({
        title: "Error",
        description: "Failed to resize event.",
        variant: "error",
      });
    }
  };

  // Merge optimistic updates with query data
  const itemsWithOptimisticUpdates = useMemo(() => {
    if (!agendaItems) return [];

    return agendaItems.map((item) => {
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
    return itemsWithOptimisticUpdates.filter((item) => {
      if (filterType === "all") return true;
      return item.type === filterType;
    });
  }, [itemsWithOptimisticUpdates, filterType]);

  if (agendaItems === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AgendaHeader onCreateClick={handleCreate} />

      <AgendaFilters filterType={filterType} onFilterChange={setFilterType} />

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

      <AgendaForm
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
      />
    </div>
  );
}
