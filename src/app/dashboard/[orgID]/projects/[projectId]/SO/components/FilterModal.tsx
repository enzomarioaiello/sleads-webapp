"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Filter, RotateCcw, Search, Loader2 } from "lucide-react";
import { useAction } from "convex/react";
import { api } from "../../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../../convex/_generated/dataModel";
import { useApp } from "@/app/contexts/AppContext";
import { SchemaResponse } from "../../../../../../admin-dashboard/organizations/[orgId]/projects/[projectId]/smart-objects/components/types";
import { SearchableSelect } from "@/components/ui/searchable-select";

export interface FilterValues {
  [fieldName: string]: {
    value: any;
    operator:
      | "equals"
      | "contains"
      | "gt"
      | "lt"
      | "gte"
      | "lte"
      | "empty"
      | "not_empty";
  };
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableName: string;
  schema: SchemaResponse | null;
  currentFilters: FilterValues;
  onApplyFilters: (filters: FilterValues) => void;
  onClearFilters: () => void;
  projectId: Id<"projects">;
  orgId: Id<"organizations">;
}

export default function FilterModal({
  isOpen,
  onClose,
  tableName,
  schema,
  currentFilters,
  onApplyFilters,
  onClearFilters,
  projectId,
  orgId,
}: FilterModalProps) {
  const { t } = useApp();
  const [filters, setFilters] = useState<FilterValues>(currentFilters);
  const [referencedData, setReferencedData] = useState<Record<string, any[]>>(
    {}
  );
  const [loadingReferences, setLoadingReferences] = useState<
    Record<string, boolean>
  >({});

  const getTableData = useAction(api.smartObjects.getTableData);

  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters, isOpen]);

  // Fetch referenced table data for ID fields
  const fetchReferencedData = async (refTableName: string) => {
    if (referencedData[refTableName]) return;

    setLoadingReferences((prev) => ({ ...prev, [refTableName]: true }));
    try {
      const data = await getTableData({
        projectId,
        organizationId: orgId,
        tableName: refTableName,
        cursor: null,
        numItems: 500,
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

  if (!isOpen || !schema) return null;

  const table = schema.schema.tables[tableName];
  if (!table?.validator?.fields) return null;

  const fields = Object.entries(table.validator.fields).filter(
    ([name]) => name !== "_id" && name !== "_creationTime"
  );

  const getFieldType = (fieldDef: any): string => {
    if (fieldDef.kind === "string") return "string";
    if (fieldDef.kind === "float64") return "number";
    if (fieldDef.kind === "boolean") return "boolean";
    if (fieldDef.kind === "id") return "id";
    if (fieldDef.kind === "union") {
      const nonNullMember = fieldDef.members?.find(
        (m: any) => m.kind !== "null"
      );
      if (nonNullMember) return getFieldType(nonNullMember);
    }
    return "string";
  };

  const getReferencedTable = (fieldDef: any): string | null => {
    if (fieldDef.kind === "id" && fieldDef.tableName) {
      return fieldDef.tableName;
    }
    if (fieldDef.kind === "union" && fieldDef.members) {
      const idMember = fieldDef.members.find((m: any) => m.kind === "id");
      if (idMember?.tableName) return idMember.tableName;
    }
    return null;
  };

  const getOperatorsForType = (type: string) => {
    const base = [
      {
        value: "empty",
        label: t(
          "dashboard_internal.project_detail.cms.smart_objects.filter.is_empty"
        ),
      },
      {
        value: "not_empty",
        label: t(
          "dashboard_internal.project_detail.cms.smart_objects.filter.is_not_empty"
        ),
      },
    ];

    if (type === "id") {
      return [
        {
          value: "equals",
          label: t(
            "dashboard_internal.project_detail.cms.smart_objects.filter.equals"
          ),
        },
        ...base,
      ];
    }

    if (type === "string") {
      return [
        {
          value: "contains",
          label: t(
            "dashboard_internal.project_detail.cms.smart_objects.filter.contains"
          ),
        },
        {
          value: "equals",
          label: t(
            "dashboard_internal.project_detail.cms.smart_objects.filter.equals"
          ),
        },
        ...base,
      ];
    }

    if (type === "number") {
      return [
        {
          value: "equals",
          label: t(
            "dashboard_internal.project_detail.cms.smart_objects.filter.equals"
          ),
        },
        {
          value: "gt",
          label: t(
            "dashboard_internal.project_detail.cms.smart_objects.filter.greater_than"
          ),
        },
        {
          value: "gte",
          label: t(
            "dashboard_internal.project_detail.cms.smart_objects.filter.greater_or_equal"
          ),
        },
        {
          value: "lt",
          label: t(
            "dashboard_internal.project_detail.cms.smart_objects.filter.less_than"
          ),
        },
        {
          value: "lte",
          label: t(
            "dashboard_internal.project_detail.cms.smart_objects.filter.less_or_equal"
          ),
        },
        ...base,
      ];
    }

    if (type === "boolean") {
      return [
        {
          value: "equals",
          label: t(
            "dashboard_internal.project_detail.cms.smart_objects.filter.equals"
          ),
        },
      ];
    }

    return [
      {
        value: "contains",
        label: t(
          "dashboard_internal.project_detail.cms.smart_objects.filter.contains"
        ),
      },
      ...base,
    ];
  };

  const updateFilter = (
    fieldName: string,
    key: "value" | "operator",
    newValue: any
  ) => {
    setFilters((prev) => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        [key]: newValue,
      },
    }));
  };

  const initializeFilter = (fieldName: string, type: string, fieldDef: any) => {
    if (!filters[fieldName]) {
      const defaultOperator = type === "string" ? "contains" : "equals";
      setFilters((prev) => ({
        ...prev,
        [fieldName]: {
          value: type === "boolean" ? "true" : "",
          operator: defaultOperator,
        },
      }));

      // If it's an ID field, fetch the referenced data
      if (type === "id") {
        const refTable = getReferencedTable(fieldDef);
        if (refTable) {
          fetchReferencedData(refTable);
        }
      }
    }
  };

  const removeFilter = (fieldName: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };

  const handleApply = () => {
    // Remove filters with empty values (except for empty/not_empty operators)
    const cleanedFilters: FilterValues = {};
    Object.entries(filters).forEach(([fieldName, filter]) => {
      if (
        filter.operator === "empty" ||
        filter.operator === "not_empty" ||
        (filter.value !== "" &&
          filter.value !== null &&
          filter.value !== undefined)
      ) {
        cleanedFilters[fieldName] = filter;
      }
    });
    onApplyFilters(cleanedFilters);
    onClose();
  };

  const handleClear = () => {
    setFilters({});
    onClearFilters();
    onClose();
  };

  const activeFilterCount = Object.keys(filters).filter((key) => {
    const filter = filters[key];
    return (
      filter.operator === "empty" ||
      filter.operator === "not_empty" ||
      (filter.value !== "" &&
        filter.value !== null &&
        filter.value !== undefined)
    );
  }).length;

  // Get display label for a referenced item
  const getItemLabel = (item: any): string => {
    // Try common label fields
    const labelFields = [
      "name",
      "title",
      "label",
      "displayName",
      "email",
      "username",
    ];
    for (const field of labelFields) {
      if (item[field]) return String(item[field]);
    }
    // Fallback to _id
    return item._id || "Unknown";
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 dark:bg-black/70 p-4 backdrop-blur-sm z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-2xl rounded-xl bg-white dark:bg-sleads-slate900 shadow-xl border border-slate-200 dark:border-sleads-slate800"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-sleads-slate800 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sleads-blue/10 dark:bg-sleads-blue/20 rounded-lg">
              <Filter className="w-5 h-5 text-sleads-blue" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t(
                  "dashboard_internal.project_detail.cms.smart_objects.filter.title"
                )}
              </h3>
              <p className="text-sm text-slate-500 dark:text-sleads-slate400">
                {t(
                  "dashboard_internal.project_detail.cms.smart_objects.filter.subtitle"
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-sleads-slate300 focus:outline-none transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Fields */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {fields.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-sleads-slate400 py-8">
              {t(
                "dashboard_internal.project_detail.cms.smart_objects.filter.no_fields"
              )}
            </p>
          ) : (
            fields.map(([fieldName, fieldDef]: [string, any]) => {
              const type = getFieldType(fieldDef);
              const operators = getOperatorsForType(type);
              const filter = filters[fieldName];
              const isActive = !!filter;
              const refTable = getReferencedTable(fieldDef);
              const refData = refTable ? referencedData[refTable] : null;
              const isLoadingRef = refTable
                ? loadingReferences[refTable]
                : false;

              return (
                <div
                  key={fieldName}
                  className={`p-4 rounded-lg border transition-all ${
                    isActive
                      ? "border-sleads-blue/50 bg-sleads-blue/5 dark:bg-sleads-blue/10"
                      : "border-slate-200 dark:border-sleads-slate700 bg-slate-50 dark:bg-sleads-slate800/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-slate-900 dark:text-white">
                      {fieldName}
                      <span className="ml-2 text-xs text-slate-500 dark:text-sleads-slate400">
                        ({type}
                        {refTable && ` → ${refTable}`})
                      </span>
                    </label>
                    {isActive ? (
                      <button
                        type="button"
                        onClick={() => removeFilter(fieldName)}
                        className="text-xs text-red-500 hover:text-red-600 dark:text-red-400"
                      >
                        {t(
                          "dashboard_internal.project_detail.cms.smart_objects.filter.remove"
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          initializeFilter(fieldName, type, fieldDef)
                        }
                        className="text-xs text-sleads-blue hover:underline"
                      >
                        {t(
                          "dashboard_internal.project_detail.cms.smart_objects.filter.add_filter"
                        )}
                      </button>
                    )}
                  </div>

                  {isActive && (
                    <div className="flex gap-3">
                      {/* Operator Select */}
                      <select
                        value={filter.operator}
                        onChange={(e) =>
                          updateFilter(fieldName, "operator", e.target.value)
                        }
                        className="px-3 py-2 text-sm border border-slate-300 dark:border-sleads-slate700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sleads-blue dark:bg-sleads-slate800 dark:text-white"
                      >
                        {operators.map((op) => (
                          <option key={op.value} value={op.value}>
                            {op.label}
                          </option>
                        ))}
                      </select>

                      {/* Value Input */}
                      {filter.operator !== "empty" &&
                        filter.operator !== "not_empty" && (
                          <>
                            {type === "boolean" ? (
                              <select
                                value={filter.value}
                                onChange={(e) =>
                                  updateFilter(
                                    fieldName,
                                    "value",
                                    e.target.value
                                  )
                                }
                                className="flex-1 px-3 py-2 text-sm border border-slate-300 dark:border-sleads-slate700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sleads-blue dark:bg-sleads-slate800 dark:text-white"
                              >
                                <option value="true">
                                  {t(
                                    "dashboard_internal.project_detail.cms.smart_objects.form.true_value"
                                  )}
                                </option>
                                <option value="false">
                                  {t(
                                    "dashboard_internal.project_detail.cms.smart_objects.form.false_value"
                                  )}
                                </option>
                              </select>
                            ) : type === "number" ? (
                              <input
                                type="number"
                                value={filter.value}
                                onChange={(e) =>
                                  updateFilter(
                                    fieldName,
                                    "value",
                                    e.target.value
                                  )
                                }
                                placeholder={t(
                                  "dashboard_internal.project_detail.cms.smart_objects.form.enter_number"
                                )}
                                className="flex-1 px-3 py-2 text-sm border border-slate-300 dark:border-sleads-slate700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sleads-blue dark:bg-sleads-slate800 dark:text-white"
                              />
                            ) : type === "id" && refTable ? (
                              // ID field with searchable select
                              <div className="flex-1">
                                {isLoadingRef ? (
                                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Loading...
                                  </div>
                                ) : refData && refData.length > 0 ? (
                                  <SearchableSelect
                                    options={refData.map((item) => ({
                                      value: item._id,
                                      label: `${getItemLabel(item)} (${item._id.slice(-8)})`,
                                    }))}
                                    value={filter.value || ""}
                                    onValueChange={(value) =>
                                      updateFilter(fieldName, "value", value)
                                    }
                                    placeholder={t(
                                      "dashboard_internal.project_detail.cms.smart_objects.filter.select_value"
                                    )}
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    value={filter.value}
                                    onChange={(e) =>
                                      updateFilter(
                                        fieldName,
                                        "value",
                                        e.target.value
                                      )
                                    }
                                    placeholder={t(
                                      "dashboard_internal.project_detail.cms.smart_objects.filter.search_placeholder"
                                    )}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-sleads-slate700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sleads-blue dark:bg-sleads-slate800 dark:text-white"
                                  />
                                )}
                              </div>
                            ) : (
                              <input
                                type="text"
                                value={filter.value}
                                onChange={(e) =>
                                  updateFilter(
                                    fieldName,
                                    "value",
                                    e.target.value
                                  )
                                }
                                placeholder={t(
                                  "dashboard_internal.project_detail.cms.smart_objects.filter.search_placeholder"
                                )}
                                className="flex-1 px-3 py-2 text-sm border border-slate-300 dark:border-sleads-slate700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sleads-blue dark:bg-sleads-slate800 dark:text-white"
                              />
                            )}
                          </>
                        )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-sleads-slate800 px-6 py-4">
          <div className="text-sm text-slate-500 dark:text-sleads-slate400">
            {activeFilterCount > 0 ? (
              <span>
                {activeFilterCount}{" "}
                {t(
                  "dashboard_internal.project_detail.cms.smart_objects.filter.active_filters"
                )}
              </span>
            ) : (
              <span>
                {t(
                  "dashboard_internal.project_detail.cms.smart_objects.filter.no_filters"
                )}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-sleads-slate300 bg-white dark:bg-sleads-slate800 border border-slate-300 dark:border-sleads-slate700 rounded-lg hover:bg-slate-50 dark:hover:bg-sleads-slate700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              {t(
                "dashboard_internal.project_detail.cms.smart_objects.filter.clear_all"
              )}
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sleads-blue rounded-lg hover:bg-sleads-blue/90 transition-colors"
            >
              <Search className="w-4 h-4" />
              {t(
                "dashboard_internal.project_detail.cms.smart_objects.filter.apply"
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
