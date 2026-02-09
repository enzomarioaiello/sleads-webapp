"use client";

import React from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { Id } from "../../../../../../../../convex/_generated/dataModel";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AgendaFormData, AgendaItemType } from "./types";
import { useApp } from "@/app/contexts/AppContext";
import { Doc } from "../../../../../../../../convex/_generated/dataModel";

interface CalendarFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onDelete?: () => void;
  formData: AgendaFormData;
  setFormData: React.Dispatch<React.SetStateAction<AgendaFormData>>;
  isSubmitting: boolean;
  editingItemId: Id<"project_agenda_items"> | null;
  canDelete: boolean;
  isReadOnly?: boolean;
  selectedProjectId?: Id<"projects"> | null;
  projects?: Doc<"projects">[];
  onProjectChange?: (projectId: Id<"projects"> | null) => void;
}

export function CalendarForm({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  formData,
  setFormData,
  isSubmitting,
  editingItemId,
  canDelete,
  isReadOnly = false,
  selectedProjectId,
  projects,
  onProjectChange,
}: CalendarFormProps) {
  const { t } = useApp();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-sleads-slate900 rounded-xl border border-slate-200 dark:border-sleads-slate800 shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-sleads-slate800">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {editingItemId
                ? isReadOnly
                  ? t("dashboard_internal.project_detail.calendar.view_event")
                  : t("dashboard_internal.project_detail.calendar.edit_event")
                : t("dashboard_internal.project_detail.calendar.create_event")}
            </h3>
            {isReadOnly && editingItemId && (
              <p className="text-sm text-slate-500 dark:text-sleads-slate400 mt-1">
                {t(
                  "dashboard_internal.project_detail.calendar.read_only_admin_event"
                )}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-sleads-slate300 hover:bg-slate-100 dark:hover:bg-sleads-slate800 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-6 overflow-y-auto">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-sleads-slate300 mb-1">
                {t("dashboard_internal.project_detail.calendar.form.title")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                disabled={isReadOnly}
                placeholder={t(
                  "dashboard_internal.project_detail.calendar.form.title_placeholder"
                )}
                className="dark:bg-sleads-slate800 dark:border-sleads-slate700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-sleads-slate300 mb-1">
                {t(
                  "dashboard_internal.project_detail.calendar.form.description"
                )}{" "}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
                disabled={isReadOnly}
                rows={4}
                className="flex w-full rounded-md border border-slate-300 dark:border-sleads-slate700 bg-transparent dark:bg-sleads-slate800 px-3 py-2 text-sm placeholder:text-slate-400 dark:placeholder:text-sleads-slate500 focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 text-slate-900 dark:text-sleads-slate200"
                placeholder={t(
                  "dashboard_internal.project_detail.calendar.form.description_placeholder"
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-sleads-slate300 mb-1">
                {t("dashboard_internal.project_detail.calendar.form.type")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    type: value as AgendaItemType,
                  })
                }
                disabled={isReadOnly}
              >
                <SelectTrigger
                  className="dark:bg-sleads-slate800 dark:border-sleads-slate700"
                  disabled={isReadOnly}
                >
                  <SelectValue
                    placeholder={t(
                      "dashboard_internal.project_detail.calendar.form.type_placeholder"
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">
                    {t(
                      "dashboard_internal.project_detail.calendar.type_meeting"
                    )}
                  </SelectItem>
                  <SelectItem value="deliverable">
                    {t(
                      "dashboard_internal.project_detail.calendar.type_deliverable"
                    )}
                  </SelectItem>
                  <SelectItem value="cancelled">
                    {t(
                      "dashboard_internal.project_detail.calendar.type_cancelled"
                    )}
                  </SelectItem>
                  <SelectItem value="other">
                    {t("dashboard_internal.project_detail.calendar.type_other")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-sleads-slate300 mb-2">
                  {t(
                    "dashboard_internal.project_detail.calendar.form.start_datetime"
                  )}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <DateTimePicker
                  date={
                    formData.startDate
                      ? new Date(
                          parseInt(formData.startDate.split("-")[0]),
                          parseInt(formData.startDate.split("-")[1]) - 1,
                          parseInt(formData.startDate.split("-")[2])
                        )
                      : undefined
                  }
                  time={formData.startTime}
                  onDateChange={(date) => {
                    if (date) {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(
                        2,
                        "0"
                      );
                      const day = String(date.getDate()).padStart(2, "0");
                      const dateStr = `${year}-${month}-${day}`;
                      setFormData((prev) => {
                        const shouldUpdateEndDate =
                          prev.endDate && prev.endDate < dateStr;
                        return {
                          ...prev,
                          startDate: dateStr,
                          endDate: shouldUpdateEndDate ? dateStr : prev.endDate,
                        };
                      });
                    }
                  }}
                  onTimeChange={(time) =>
                    setFormData({ ...formData, startTime: time })
                  }
                  dateLabel={t(
                    "dashboard_internal.project_detail.calendar.form.date"
                  )}
                  timeLabel={t(
                    "dashboard_internal.project_detail.calendar.form.time"
                  )}
                  dateId="start-date"
                  timeId="start-time"
                  required
                  minDate={new Date()}
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-sleads-slate300 mb-2">
                  {t(
                    "dashboard_internal.project_detail.calendar.form.end_datetime"
                  )}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <DateTimePicker
                  date={
                    formData.endDate
                      ? new Date(
                          parseInt(formData.endDate.split("-")[0]),
                          parseInt(formData.endDate.split("-")[1]) - 1,
                          parseInt(formData.endDate.split("-")[2])
                        )
                      : undefined
                  }
                  time={formData.endTime}
                  onDateChange={(date) => {
                    if (date) {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(
                        2,
                        "0"
                      );
                      const day = String(date.getDate()).padStart(2, "0");
                      const dateStr = `${year}-${month}-${day}`;
                      setFormData({ ...formData, endDate: dateStr });
                    }
                  }}
                  onTimeChange={(time) =>
                    setFormData({ ...formData, endTime: time })
                  }
                  dateLabel={t(
                    "dashboard_internal.project_detail.calendar.form.date"
                  )}
                  timeLabel={t(
                    "dashboard_internal.project_detail.calendar.form.time"
                  )}
                  dateId="end-date"
                  timeId="end-time"
                  required
                  minDate={
                    formData.startDate
                      ? new Date(`${formData.startDate}T${formData.startTime}`)
                      : new Date()
                  }
                  disabled={isReadOnly}
                />
                {formData.startDate === formData.endDate && (
                  <p className="text-xs text-slate-500 dark:text-sleads-slate400 mt-2">
                    {t(
                      "dashboard_internal.project_detail.calendar.form.same_day_event"
                    )}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-sleads-slate300 mb-1">
                {t("dashboard_internal.project_detail.calendar.form.location")}
              </label>
              <Input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                disabled={isReadOnly}
                placeholder={t(
                  "dashboard_internal.project_detail.calendar.form.location_placeholder"
                )}
                className="dark:bg-sleads-slate800 dark:border-sleads-slate700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-sleads-slate300 mb-1">
                {t(
                  "dashboard_internal.project_detail.calendar.form.teams_link"
                )}
              </label>
              <Input
                type="url"
                value={formData.teams_link}
                onChange={(e) =>
                  setFormData({ ...formData, teams_link: e.target.value })
                }
                disabled={isReadOnly}
                placeholder={t(
                  "dashboard_internal.project_detail.calendar.form.teams_link_placeholder"
                )}
                className="dark:bg-sleads-slate800 dark:border-sleads-slate700"
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-sleads-slate800">
              {editingItemId && onDelete && canDelete && !isReadOnly && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onDelete}
                  disabled={isSubmitting}
                >
                  {t("dashboard_internal.project_detail.calendar.delete")}
                </Button>
              )}
              <div className="flex gap-3 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  {isReadOnly
                    ? t("dashboard_internal.project_detail.calendar.close")
                    : t("dashboard_internal.project_detail.calendar.cancel")}
                </Button>
                {!isReadOnly && (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                      ? t("dashboard_internal.project_detail.calendar.saving")
                      : editingItemId
                        ? t("dashboard_internal.project_detail.calendar.update")
                        : t(
                            "dashboard_internal.project_detail.calendar.create"
                          )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
