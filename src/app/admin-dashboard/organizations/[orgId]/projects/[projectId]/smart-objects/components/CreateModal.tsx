"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React from "react";
import { X, Loader2 } from "lucide-react";
import { SchemaResponse } from "./types";
import FormFieldRenderer from "./FormFieldRenderer";
import { Id } from "../../../../../../../../../convex/_generated/dataModel";

interface CreateModalProps {
  isOpen: boolean;
  tableName: string | null;
  schema: SchemaResponse | null;
  formData: Record<string, any>;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  referencedData: Record<string, any[]>;
  loadingReferences: Record<string, boolean>;
  dateTimeValues: Record<string, { date: Date | undefined; time: string }>;
  setDateTimeValues: React.Dispatch<
    React.SetStateAction<
      Record<string, { date: Date | undefined; time: string }>
    >
  >;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFetchReferencedData: (tableName: string) => void;
  onCreateReferencedItem?: (tableName: string, fieldName: string) => void;
  isNested?: boolean;
  isEdit?: boolean;
  organizationId?: Id<"organizations">;
  projectId?: Id<"projects"> | null;
}

export default function CreateModal({
  isOpen,
  tableName,
  schema,
  formData,
  setFormData,
  referencedData,
  loadingReferences,
  dateTimeValues,
  setDateTimeValues,
  isSubmitting,
  onClose,
  onSubmit,
  onFetchReferencedData,
  onCreateReferencedItem,
  isNested = false,
  isEdit = false,
  organizationId,
  projectId,
}: CreateModalProps) {
  if (!isOpen || !tableName || !schema) return null;

  const table = schema.schema.tables[tableName];
  if (!table?.validator?.fields) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4 backdrop-blur-sm ${
        isNested ? "z-[60]" : "z-50"
      }`}
    >
      <div className="relative w-full max-w-3xl rounded-lg bg-white shadow-lg">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900">
            {isEdit ? "Edit" : "Create"} {tableName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6">
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {Object.entries(table.validator.fields).map(
              ([fieldName, fieldDef]: [string, any]) => {
                // Skip _id and _creationTime as they're auto-generated
                if (fieldName === "_id" || fieldName === "_creationTime") {
                  return null;
                }
                return (
                  <FormFieldRenderer
                    key={fieldName}
                    fieldName={fieldName}
                    fieldDef={fieldDef}
                    tableName={tableName}
                    fieldValue={formData[fieldName]}
                    formData={formData}
                    setFormData={setFormData}
                    referencedData={referencedData}
                    loadingReferences={loadingReferences}
                    dateTimeValues={dateTimeValues}
                    setDateTimeValues={setDateTimeValues}
                    onFetchReferencedData={onFetchReferencedData}
                    onCreateReferencedItem={onCreateReferencedItem}
                    schema={schema}
                    organizationId={organizationId}
                    projectId={projectId}
                  />
                );
              }
            )}
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sleads-blue rounded-lg hover:bg-sleads-blue/90 focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isEdit ? "Updating..." : "Creating..."}
                </>
              ) : isEdit ? (
                "Update"
              ) : (
                "Create"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
