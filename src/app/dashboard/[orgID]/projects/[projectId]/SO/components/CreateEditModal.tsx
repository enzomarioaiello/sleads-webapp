"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { useAction } from "convex/react";
import { api } from "../../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../../convex/_generated/dataModel";
import { useToast } from "@/app/hooks/useToast";
import { useApp } from "@/app/contexts/AppContext";
import FormFieldRenderer from "../../../../../../admin-dashboard/organizations/[orgId]/projects/[projectId]/smart-objects/components/FormFieldRenderer";
import { SchemaResponse } from "../../../../../../admin-dashboard/organizations/[orgId]/projects/[projectId]/smart-objects/components/types";

interface CreateEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: Id<"projects">;
  orgId: Id<"organizations">;
  project: {
    _id: Id<"projects">;
    smartObjectsKey: string | null | undefined;
    smartObjectsUrl: string | null | undefined;
  };
  tableName: string;
  schema: SchemaResponse;
  editingRow?: any;
  onSuccess: () => void;
}

export default function CreateEditModal({
  isOpen,
  onClose,
  projectId,
  orgId,
  project,
  tableName,
  schema,
  editingRow,
  onSuccess,
}: CreateEditModalProps) {
  const { toast } = useToast();
  const { t } = useApp();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [referencedData, setReferencedData] = useState<Record<string, any[]>>(
    {}
  );
  const [loadingReferences, setLoadingReferences] = useState<
    Record<string, boolean>
  >({});
  const [dateTimeValues, setDateTimeValues] = useState<
    Record<string, { date: Date | undefined; time: string }>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getTableData = useAction(api.smartObjects.getTableData);
  const createTableData = useAction(api.smartObjects.createTableData);
  const updateTableData = useAction(api.smartObjects.updateTableData);

  const isEdit = !!editingRow;

  // Initialize form data
  useEffect(() => {
    if (!isOpen || !schema) return;

    const table = schema.schema.tables[tableName];
    if (!table?.validator?.fields) return;

    const initialData: Record<string, any> = {};
    const initialDateTimeValues: Record<
      string,
      { date: Date | undefined; time: string }
    > = {};

    Object.entries(table.validator.fields).forEach(
      ([fieldName, fieldDef]: [string, any]) => {
        if (fieldName === "_id" || fieldName === "_creationTime") return;

        const value = isEdit ? editingRow[fieldName] : undefined;
        const fieldNameLower = fieldName.toLowerCase();
        const isDateTimeField =
          fieldDef.kind === "float64" &&
          (fieldNameLower.includes("date") ||
            fieldNameLower.includes("time") ||
            fieldNameLower.includes("at") ||
            fieldNameLower === "createdat" ||
            fieldNameLower === "updatedat");

        if (isEdit && value !== undefined) {
          if (isDateTimeField && typeof value === "number") {
            const timestamp = value > 10000000000 ? value : value * 1000;
            const date = new Date(timestamp);
            if (!isNaN(date.getTime())) {
              initialData[fieldName] = value;
              initialDateTimeValues[fieldName] = {
                date: date,
                time: `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`,
              };
            } else {
              initialData[fieldName] = value;
              initialDateTimeValues[fieldName] = {
                date: undefined,
                time: "00:00",
              };
            }
          } else {
            initialData[fieldName] = value ?? null;
            if (isDateTimeField) {
              initialDateTimeValues[fieldName] = {
                date: undefined,
                time: "00:00",
              };
            }
          }
        } else {
          // New item defaults
          if (fieldDef.isOptional === "optional") {
            initialData[fieldName] = null;
            if (isDateTimeField) {
              initialDateTimeValues[fieldName] = {
                date: undefined,
                time: "00:00",
              };
            }
          } else if (fieldDef.kind === "boolean") {
            initialData[fieldName] = false;
          } else if (fieldDef.kind === "array") {
            initialData[fieldName] = [];
          } else if (fieldDef.kind === "object") {
            initialData[fieldName] = {};
          } else if (isDateTimeField) {
            const now = new Date();
            initialData[fieldName] = now.getTime();
            initialDateTimeValues[fieldName] = {
              date: now,
              time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
            };
          } else if (fieldDef.kind === "float64") {
            initialData[fieldName] = 0;
          } else {
            initialData[fieldName] = "";
          }
        }
      }
    );

    setFormData(initialData);
    setDateTimeValues(initialDateTimeValues);
  }, [isOpen, schema, tableName, isEdit, editingRow]);

  const fetchReferencedData = async (refTableName: string) => {
    if (referencedData[refTableName]) return;

    setLoadingReferences((prev) => ({ ...prev, [refTableName]: true }));
    try {
      const data = await getTableData({
        projectId,
        organizationId: orgId,
        tableName: refTableName,
        cursor: null,
        numItems: 100,
      });

      const response = data as {
        continueCursor?: string | null;
        isDone?: boolean;
        page?: any[];
      };

      setReferencedData((prev) => ({
        ...prev,
        [refTableName]: response.page || [],
      }));
    } catch (err) {
      console.error(`Failed to fetch ${refTableName}:`, err);
    } finally {
      setLoadingReferences((prev) => ({ ...prev, [refTableName]: false }));
    }
  };

  const prepareDataForSchema = (
    data: Record<string, any>
  ): Record<string, any> => {
    if (!schema) return data;

    const table = schema.schema.tables[tableName];
    if (!table?.validator?.fields) return data;

    const prepared: Record<string, any> = {};

    Object.entries(table.validator.fields).forEach(
      ([fieldName, fieldDef]: [string, any]) => {
        if (fieldName === "_id" || fieldName === "_creationTime") return;

        const value = data[fieldName];
        const isOptional = fieldDef.isOptional === "optional";

        if (value === null && !isOptional) return;

        if (fieldDef.kind === "union" && fieldDef.members) {
          const hasNull = fieldDef.members.some((m: any) => m.kind === "null");
          if (hasNull && value === null && isOptional) {
            prepared[fieldName] = null;
            return;
          }
          if (value !== null && value !== undefined) {
            prepared[fieldName] = value;
          }
          return;
        }

        if (fieldDef.kind === "float64") {
          if (value !== null && value !== undefined) {
            prepared[fieldName] =
              typeof value === "number" ? value : Number(value);
          } else if (isOptional) {
            prepared[fieldName] = null;
          }
        } else if (fieldDef.kind === "boolean") {
          prepared[fieldName] = Boolean(value);
        } else if (fieldDef.kind === "string") {
          if (value !== null && value !== undefined) {
            prepared[fieldName] = String(value);
          } else if (isOptional) {
            prepared[fieldName] = null;
          }
        } else if (fieldDef.kind === "id") {
          if (value !== null && value !== undefined) {
            prepared[fieldName] = String(value);
          } else if (isOptional) {
            prepared[fieldName] = null;
          }
        } else {
          if (value !== null && value !== undefined) {
            prepared[fieldName] = value;
          } else if (isOptional) {
            prepared[fieldName] = null;
          }
        }
      }
    );

    return prepared;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    try {
      const preparedData = prepareDataForSchema(formData);

      if (isEdit) {
        await updateTableData({
          projectId,
          organizationId: orgId,
          objectId: editingRow._id,
          data: preparedData,
        });

        toast({
          title: t(
            "dashboard_internal.project_detail.cms.smart_objects.tables.update_success_title"
          ),
          description: t(
            "dashboard_internal.project_detail.cms.smart_objects.tables.update_success_desc"
          ),
          variant: "success",
        });
      } else {
        await createTableData({
          projectId,
          organizationId: orgId,
          tableName,
          data: preparedData,
        });

        toast({
          title: t(
            "dashboard_internal.project_detail.cms.smart_objects.tables.create_success_title"
          ),
          description: t(
            "dashboard_internal.project_detail.cms.smart_objects.tables.create_success_desc"
          ),
          variant: "success",
        });
      }

      onSuccess();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t(
              "dashboard_internal.project_detail.cms.smart_objects.tables.submit_error"
            );
      toast({
        title: t(
          "dashboard_internal.project_detail.cms.smart_objects.tables.error_title"
        ),
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !schema) return null;

  const table = schema.schema.tables[tableName];
  if (!table?.validator?.fields) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 dark:bg-black/70 p-4 backdrop-blur-sm z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-3xl rounded-xl bg-white dark:bg-sleads-slate900 shadow-xl border border-slate-200 dark:border-sleads-slate800"
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-sleads-slate800 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {isEdit
              ? `${t(
                  "dashboard_internal.project_detail.cms.smart_objects.tables.edit"
                )} ${tableName}`
              : `${t(
                  "dashboard_internal.project_detail.cms.smart_objects.tables.create"
                )} ${tableName}`}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-sleads-slate300 focus:outline-none transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {Object.entries(table.validator.fields)
              .filter(
                ([fieldName]) =>
                  fieldName !== "_id" && fieldName !== "_creationTime"
              )
              .sort(
                (
                  [aName, aDef]: [string, any],
                  [bName, bDef]: [string, any]
                ) => {
                  // Priority fields first (common naming patterns)
                  const priorityFields = [
                    "name",
                    "title",
                    "label",
                    "displayName",
                    "firstName",
                    "lastName",
                    "email",
                    "username",
                  ];
                  const aIsPriority = priorityFields.some((p) =>
                    aName.toLowerCase().includes(p.toLowerCase())
                  );
                  const bIsPriority = priorityFields.some((p) =>
                    bName.toLowerCase().includes(p.toLowerCase())
                  );
                  if (aIsPriority && !bIsPriority) return -1;
                  if (!aIsPriority && bIsPriority) return 1;

                  // Required fields before optional
                  const aIsOptional = aDef.isOptional === "optional";
                  const bIsOptional = bDef.isOptional === "optional";
                  if (!aIsOptional && bIsOptional) return -1;
                  if (aIsOptional && !bIsOptional) return 1;

                  // ID reference fields after priority but before other fields
                  const aIsId =
                    aDef.kind === "id" ||
                    (aDef.kind === "union" &&
                      aDef.members?.some((m: any) => m.kind === "id"));
                  const bIsId =
                    bDef.kind === "id" ||
                    (bDef.kind === "union" &&
                      bDef.members?.some((m: any) => m.kind === "id"));
                  if (aIsId && !bIsId) return -1;
                  if (!aIsId && bIsId) return 1;

                  // Keep original order for the rest
                  return 0;
                }
              )
              .map(([fieldName, fieldDef]: [string, any]) => (
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
                  onFetchReferencedData={fetchReferencedData}
                  schema={schema}
                  organizationId={orgId}
                  projectId={projectId}
                />
              ))}
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-sleads-slate800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-sleads-slate300 bg-white dark:bg-sleads-slate800 border border-slate-300 dark:border-sleads-slate700 rounded-lg hover:bg-slate-50 dark:hover:bg-sleads-slate700 focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t(
                "dashboard_internal.project_detail.cms.smart_objects.tables.cancel"
              )}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sleads-blue rounded-lg hover:bg-sleads-blue/90 focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isEdit
                    ? t(
                        "dashboard_internal.project_detail.cms.smart_objects.tables.updating"
                      )
                    : t(
                        "dashboard_internal.project_detail.cms.smart_objects.tables.creating"
                      )}
                </>
              ) : isEdit ? (
                t(
                  "dashboard_internal.project_detail.cms.smart_objects.tables.update"
                )
              ) : (
                t(
                  "dashboard_internal.project_detail.cms.smart_objects.tables.create"
                )
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
