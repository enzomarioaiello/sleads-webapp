"use client";

import React from "react";
import { Id } from "../../../../../../../../../convex/_generated/dataModel";
import { Modal } from "@/app/admin-dashboard/components/ui/Modal";
import { Input } from "@/app/admin-dashboard/components/ui/Input";
import { Button } from "@/app/admin-dashboard/components/ui/Button";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";
import { AgendaFormData, AgendaItemType } from "./types";

interface AgendaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onDelete?: () => void;
  formData: AgendaFormData;
  setFormData: React.Dispatch<React.SetStateAction<AgendaFormData>>;
  isSubmitting: boolean;
  editingItemId: Id<"project_agenda_items"> | null;
}

export function AgendaForm({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  formData,
  setFormData,
  isSubmitting,
  editingItemId,
}: AgendaFormProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingItemId ? "Edit Agenda Item" : "Create Agenda Item"}
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            required
            placeholder="Enter agenda item title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            required
            rows={4}
            className="flex w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Enter description"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type <span className="text-red-500">*</span>
          </label>
          <Select
            value={formData.type}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                type: value as AgendaItemType,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="deliverable">Deliverable</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date & Time <span className="text-red-500">*</span>
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
                  const month = String(date.getMonth() + 1).padStart(2, "0");
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
              dateLabel="Date"
              timeLabel="Time"
              dateId="start-date"
              timeId="start-time"
              required
              minDate={new Date()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date & Time <span className="text-red-500">*</span>
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
                  const month = String(date.getMonth() + 1).padStart(2, "0");
                  const day = String(date.getDate()).padStart(2, "0");
                  const dateStr = `${year}-${month}-${day}`;
                  setFormData({ ...formData, endDate: dateStr });
                }
              }}
              onTimeChange={(time) =>
                setFormData({ ...formData, endTime: time })
              }
              dateLabel="Date"
              timeLabel="Time"
              dateId="end-date"
              timeId="end-time"
              required
              minDate={
                formData.startDate
                  ? new Date(`${formData.startDate}T${formData.startTime}`)
                  : new Date()
              }
            />
            {formData.startDate === formData.endDate && (
              <p className="text-xs text-gray-500 mt-2">Same day event</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <Input
            type="text"
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            placeholder="Enter location (optional)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teams Link
          </label>
          <Input
            type="url"
            value={formData.teams_link}
            onChange={(e) =>
              setFormData({ ...formData, teams_link: e.target.value })
            }
            placeholder="https://teams.microsoft.com/... (optional)"
          />
        </div>

        <div className="flex justify-between items-center pt-4">
          {editingItemId && onDelete && (
            <Button
              type="button"
              variant="danger"
              onClick={onDelete}
              disabled={isSubmitting}
            >
              Delete
            </Button>
          )}
          <div className="flex gap-3 ml-auto">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {editingItemId ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

