"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "../../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../../convex/_generated/dataModel";
import {
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Plus,
  AlertCircle,
  Trash2,
  Pencil,
  Link,
  Info,
  Database,
  Eye,
  X,
  Filter,
  Search,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/app/hooks/useToast";
import { useApp } from "@/app/contexts/AppContext";
import CreateEditModal from "./CreateEditModal";
import FilterModal, { FilterValues } from "./FilterModal";

interface DataTableViewProps {
  projectId: Id<"projects">;
  orgId: Id<"organizations">;
  project: {
    _id: Id<"projects">;
    smartObjectsKey: string | null | undefined;
    smartObjectsUrl: string | null | undefined;
  };
  tableName: string;
  schema?: any;
}

export default function DataTableView({
  projectId,
  orgId,
  project,
  tableName,
  schema,
}: DataTableViewProps) {
  const { toast } = useToast();
  const { t } = useApp();
  const [tableData, setTableData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [numItems, setNumItems] = useState(10);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [objectData, setObjectData] = useState<any>(null);
  const [loadingObject, setLoadingObject] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<any>(null);
  const [contentModal, setContentModal] = useState<{
    isOpen: boolean;
    fieldName: string;
    content: string;
  }>({ isOpen: false, fieldName: "", content: "" });
  // Filter state
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({});
  const [allData, setAllData] = useState<any[]>([]);
  const [quickSearch, setQuickSearch] = useState("");

  const getTableData = useAction(api.smartObjects.getTableData);
  const deleteTableData = useAction(api.smartObjects.deleteTableData);
  const getObject = useAction(api.smartObjects.getObject);

  const formatCellValue = (value: any, fieldName?: string): string => {
    if (value === null || value === undefined) {
      return "";
    }

    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    if (typeof value === "number") {
      const fieldNameLower = fieldName?.toLowerCase() || "";
      const isDateField =
        fieldNameLower.includes("date") ||
        fieldNameLower.includes("time") ||
        fieldNameLower.includes("at") ||
        fieldNameLower === "createdat" ||
        fieldNameLower === "updatedat";

      const isTimestamp =
        (value > 946684800000 && value < 4102444800000) ||
        (value > 946684800 && value < 4102444800);

      if (isDateField || isTimestamp) {
        try {
          const timestamp = value > 10000000000 ? value : value * 1000;
          const date = new Date(timestamp);
          if (!isNaN(date.getTime())) {
            return date.toLocaleString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: false,
            });
          }
        } catch {
          // If date parsing fails, return as number
        }
      }
    }

    return String(value);
  };

  // This function checks if a value is likely a Convex-style ID (e.g., "jh76gpzeg4epg0kmzn5ftvadn97yswnh")
  // It ignores the field/column name and bases the decision entirely on the structure: no spaces are allowed.
  const isLikelyId = (value: any): boolean => {
    if (typeof value !== "string") return false;
    // Convex IDs: lowercase letters and numbers, 24-40 chars, no spaces allowed
    return /^[a-z0-9]{28,36}$/.test(value) && !/\s/.test(value);
  };

  const handleIdHover = async (id: string, event: React.MouseEvent) => {
    if (hoveredId === id && objectData) return;

    setHoveredId(id);
    setPopoverPosition({ x: event.clientX, y: event.clientY });
    setLoadingObject(true);
    setObjectData(null);

    try {
      const data = await getObject({
        projectId: projectId,
        organizationId: orgId,
        objectId: id,
      });
      setObjectData(data);
    } catch (err) {
      console.error("Failed to fetch object:", err);
      setObjectData(null);
    } finally {
      setLoadingObject(false);
    }
  };

  const handleIdLeave = () => {
    setHoveredId(null);
    setObjectData(null);
    setPopoverPosition(null);
  };

  const handleDelete = async (objectId: string) => {
    if (
      !window.confirm(
        t(
          "dashboard_internal.project_detail.cms.smart_objects.tables.delete_confirm"
        )
      )
    ) {
      return;
    }

    try {
      await deleteTableData({
        projectId: projectId,
        organizationId: orgId,
        objectId: objectId,
      });

      toast({
        title: t(
          "dashboard_internal.project_detail.cms.smart_objects.tables.delete_success_title"
        ),
        description: t(
          "dashboard_internal.project_detail.cms.smart_objects.tables.delete_success_desc"
        ),
        variant: "success",
      });

      await fetchTableData(true);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t(
              "dashboard_internal.project_detail.cms.smart_objects.tables.delete_error"
            );
      toast({
        title: t(
          "dashboard_internal.project_detail.cms.smart_objects.tables.error_title"
        ),
        description: errorMessage,
        variant: "error",
      });
    }
  };

  const handleEdit = (row: any) => {
    setEditingRow(row);
    setIsEditModalOpen(true);
  };

  const fetchTableData = async (resetCursor = false, forFiltering = false) => {
    if (!tableName || !project.smartObjectsUrl || !project.smartObjectsKey) {
      return;
    }

    setLoadingData(true);
    setDataError(null);

    try {
      // Load more data when filtering is enabled (5000 records for client-side filtering)
      const fetchNumItems = forFiltering ? 5000 : numItems;

      const data = await getTableData({
        projectId: projectId,
        organizationId: orgId,
        tableName: tableName,
        cursor: resetCursor ? null : cursor,
        numItems: fetchNumItems,
      });

      const response = data as {
        continueCursor?: string | null;
        isDone?: boolean;
        page?: any[];
      };

      setTableData(response);
      setCursor(response.continueCursor || null);

      // Store all data for filtering
      if (forFiltering || resetCursor) {
        setAllData(response.page || []);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : t(
              "dashboard_internal.project_detail.cms.smart_objects.tables.fetch_error"
            );
      setDataError(errorMessage);
      toast({
        title: t(
          "dashboard_internal.project_detail.cms.smart_objects.tables.error_title"
        ),
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setLoadingData(false);
    }
  };

  // Apply filters to data
  const applyFilters = (data: any[]): any[] => {
    let result = data;

    // Apply quick search (searches all string fields)
    if (quickSearch.trim()) {
      const searchLower = quickSearch.toLowerCase().trim();
      result = result.filter((row) =>
        Object.values(row).some((value) => {
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(searchLower);
        })
      );
    }

    // Apply advanced filters
    Object.entries(filters).forEach(([fieldName, filter]) => {
      result = result.filter((row) => {
        const value = row[fieldName];
        const filterValue = filter.value;

        switch (filter.operator) {
          case "empty":
            return value === null || value === undefined || value === "";
          case "not_empty":
            return value !== null && value !== undefined && value !== "";
          case "equals":
            if (typeof value === "boolean") {
              return String(value) === filterValue;
            }
            if (typeof value === "number") {
              return value === Number(filterValue);
            }
            return (
              String(value).toLowerCase() === String(filterValue).toLowerCase()
            );
          case "contains":
            if (value === null || value === undefined) return false;
            return String(value)
              .toLowerCase()
              .includes(String(filterValue).toLowerCase());
          case "gt":
            return Number(value) > Number(filterValue);
          case "gte":
            return Number(value) >= Number(filterValue);
          case "lt":
            return Number(value) < Number(filterValue);
          case "lte":
            return Number(value) <= Number(filterValue);
          default:
            return true;
        }
      });
    });

    return result;
  };

  // Get filtered data
  const hasActiveFilters =
    Object.keys(filters).length > 0 || quickSearch.trim() !== "";
  const filteredData =
    hasActiveFilters && allData.length > 0
      ? applyFilters(allData)
      : tableData?.page || [];
  const displayData =
    hasActiveFilters && allData.length > 0
      ? filteredData
      : tableData?.page || [];

  // Load all data for filtering (5k records)
  const loadAllDataForFiltering = async (forceReload = false) => {
    if (allData.length === 0 || forceReload) {
      setLoadingData(true);
      try {
        const data = await getTableData({
          projectId: projectId,
          organizationId: orgId,
          tableName: tableName,
          cursor: null,
          numItems: 5000,
        });
        const response = data as {
          continueCursor?: string | null;
          isDone?: boolean;
          page?: any[];
        };
        setAllData(response.page || []);
      } catch (err) {
        console.error("Failed to load data for filtering:", err);
      } finally {
        setLoadingData(false);
      }
    }
  };

  // Auto-load all data when filters become active
  useEffect(() => {
    if (hasActiveFilters && allData.length === 0 && tableName) {
      loadAllDataForFiltering();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasActiveFilters, tableName]);

  // Reset everything when table changes
  useEffect(() => {
    if (tableName) {
      setCursor(null);
      setTableData(null);
      setDataError(null);
      setFilters({});
      setQuickSearch("");
      setAllData([]);
      fetchTableData(true, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableName]);

  // Handle numItems change - only refetch if no filters are active
  useEffect(() => {
    if (tableName && !hasActiveFilters) {
      setCursor(null);
      fetchTableData(true, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numItems]);

  if (loadingData && !tableData) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-sleads-blue" />
      </div>
    );
  }

  if (dataError && !loadingData) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-800 dark:text-red-200">{dataError}</p>
        </div>
      </div>
    );
  }

  if (!tableData || !tableData.page || tableData.page.length === 0) {
    return (
      <>
        <div className="text-center py-12">
          <Database className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            {t(
              "dashboard_internal.project_detail.cms.smart_objects.tables.no_data"
            )}
          </h3>
          <p className="text-sm text-slate-500 dark:text-sleads-slate400 mb-6">
            {t(
              "dashboard_internal.project_detail.cms.smart_objects.tables.no_data_desc"
            )}
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sleads-blue rounded-lg hover:bg-sleads-blue/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t(
              "dashboard_internal.project_detail.cms.smart_objects.tables.create_first"
            )}
          </button>
        </div>

        {/* Create Modal for empty state */}
        {isCreateModalOpen && schema && (
          <CreateEditModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            projectId={projectId}
            orgId={orgId}
            project={project}
            tableName={tableName}
            schema={schema}
            onSuccess={() => {
              setIsCreateModalOpen(false);
              fetchTableData(true, false);
            }}
          />
        )}
      </>
    );
  }

  const columns = Object.keys(tableData.page[0]);

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sleads-blue rounded-lg hover:bg-sleads-blue/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t(
              "dashboard_internal.project_detail.cms.smart_objects.tables.create_new"
            )}
          </button>
          <button
            onClick={() => {
              fetchTableData(true, false);
              setAllData([]); // Reset filter data on refresh
            }}
            disabled={loadingData}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-sleads-slate300 bg-white dark:bg-sleads-slate800 border border-slate-300 dark:border-sleads-slate700 rounded-lg hover:bg-slate-50 dark:hover:bg-sleads-slate700 focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 ${loadingData ? "animate-spin" : ""}`}
            />
            {t(
              "dashboard_internal.project_detail.cms.smart_objects.tables.refresh"
            )}
          </button>
          <button
            onClick={() => {
              setIsFilterModalOpen(true);
              loadAllDataForFiltering();
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              hasActiveFilters
                ? "text-white bg-sleads-blue hover:bg-sleads-blue/90"
                : "text-slate-700 dark:text-sleads-slate300 bg-white dark:bg-sleads-slate800 border border-slate-300 dark:border-sleads-slate700 hover:bg-slate-50 dark:hover:bg-sleads-slate700"
            }`}
          >
            <Filter className="w-4 h-4" />
            {t(
              "dashboard_internal.project_detail.cms.smart_objects.filter.title"
            )}
            {hasActiveFilters && Object.keys(filters).length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
                {Object.keys(filters).length}
              </span>
            )}
          </button>
        </div>

        {/* Items per page selector - disabled when filtering */}
        <div className="flex items-center gap-2">
          <label
            className={`text-sm ${
              hasActiveFilters
                ? "text-slate-400 dark:text-sleads-slate600"
                : "text-slate-600 dark:text-sleads-slate400"
            }`}
          >
            {t(
              "dashboard_internal.project_detail.cms.smart_objects.tables.items_per_page"
            )}
            :
          </label>
          <Select
            value={String(numItems)}
            onValueChange={(value) => setNumItems(Number(value))}
            disabled={hasActiveFilters}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["5", "10", "25", "50", "100"].map((val) => (
                <SelectItem key={val} value={val}>
                  {val}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              (
              {t(
                "dashboard_internal.project_detail.cms.smart_objects.filter.disabled_while_filtering"
              )}
              )
            </span>
          )}
        </div>
      </div>

      {/* Quick Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={quickSearch}
            onChange={(e) => {
              setQuickSearch(e.target.value);
              if (e.target.value && allData.length === 0) {
                loadAllDataForFiltering();
              }
            }}
            placeholder={t(
              "dashboard_internal.project_detail.cms.smart_objects.filter.quick_search"
            )}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 dark:border-sleads-slate700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sleads-blue dark:bg-sleads-slate800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-sleads-slate500"
          />
          {quickSearch && (
            <button
              type="button"
              onClick={() => setQuickSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-sleads-slate300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter results info */}
        {hasActiveFilters ? (
          <div className="flex items-center gap-3">
            {loadingData && allData.length === 0 ? (
              <span className="text-sm text-slate-600 dark:text-sleads-slate400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t(
                  "dashboard_internal.project_detail.cms.smart_objects.filter.loading_data"
                )}
              </span>
            ) : (
              <span className="text-sm text-slate-600 dark:text-sleads-slate400">
                {displayData.length}{" "}
                {t(
                  "dashboard_internal.project_detail.cms.smart_objects.filter.filtered_of"
                )}{" "}
                {allData.length}{" "}
                {t(
                  "dashboard_internal.project_detail.cms.smart_objects.tables.items"
                )}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setFilters({});
                setQuickSearch("");
              }}
              className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 hover:underline"
            >
              {t(
                "dashboard_internal.project_detail.cms.smart_objects.filter.clear_all"
              )}
            </button>
          </div>
        ) : (
          <span className="text-xs text-amber-600 dark:text-amber-400 italic">
            {t(
              "dashboard_internal.project_detail.cms.smart_objects.filter.warning"
            )}
          </span>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-800 dark:text-blue-200">
          {t(
            "dashboard_internal.project_detail.cms.smart_objects.tables.data_info"
          )}
        </p>
      </div>

      {/* Mobile-friendly table */}
      <div className="overflow-x-auto border border-slate-200 dark:border-sleads-slate800 rounded-lg">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-sleads-slate800">
          <thead className="bg-slate-50 dark:bg-sleads-slate800">
            <tr>
              {columns.map((key) => (
                <th
                  key={key}
                  className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-sleads-slate400 uppercase tracking-wider"
                >
                  {key}
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-sleads-slate400 uppercase tracking-wider w-24">
                {t(
                  "dashboard_internal.project_detail.cms.smart_objects.tables.actions"
                )}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-sleads-slate900 divide-y divide-slate-200 dark:divide-sleads-slate800">
            {displayData.map((row: any, idx: number) => (
              <tr
                key={idx}
                className="hover:bg-slate-50 dark:hover:bg-sleads-slate800 transition-colors"
              >
                {columns.map((fieldName) => {
                  const value = row[fieldName];
                  const isId = isLikelyId(value);
                  const cellValue = formatCellValue(value, fieldName);
                  const maxLength = 100;
                  const isTruncated = cellValue.length > maxLength;
                  const displayValue = isTruncated
                    ? cellValue.slice(0, maxLength) + "..."
                    : cellValue;

                  return (
                    <td
                      key={fieldName}
                      className="px-4 py-3 text-sm text-slate-900 dark:text-white relative max-w-xs"
                      onMouseEnter={
                        isId && value
                          ? (e) => handleIdHover(value, e)
                          : undefined
                      }
                      onMouseLeave={isId ? handleIdLeave : undefined}
                    >
                      <div className="flex items-start gap-1">
                        <span
                          className={`${
                            isId && value
                              ? "cursor-pointer text-sleads-blue dark:text-blue-400 hover:underline"
                              : ""
                          } ${isTruncated ? "line-clamp-2" : ""}`}
                        >
                          {displayValue}
                          {isId && value && (
                            <Link className="inline text-sleads-blue dark:text-blue-400 h-3 w-3 ml-1" />
                          )}
                        </span>
                        {isTruncated && (
                          <button
                            type="button"
                            onClick={() =>
                              setContentModal({
                                isOpen: true,
                                fieldName,
                                content: cellValue,
                              })
                            }
                            className="shrink-0 p-1 text-slate-400 hover:text-sleads-blue dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-sleads-slate800 rounded transition-colors"
                            title={t(
                              "dashboard_internal.project_detail.cms.smart_objects.tables.view_full_content"
                            )}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Popover */}
                      {isId && hoveredId === value && popoverPosition && (
                        <div
                          className="fixed z-50 bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 rounded-lg shadow-lg p-4 max-w-md max-h-96 overflow-auto"
                          style={{
                            left: `${popoverPosition.x + 10}px`,
                            top: `${popoverPosition.y + 10}px`,
                          }}
                          onMouseEnter={() => setHoveredId(value)}
                          onMouseLeave={handleIdLeave}
                        >
                          {loadingObject ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-sleads-blue" />
                              <span className="text-sm text-slate-600 dark:text-sleads-slate400">
                                {t(
                                  "dashboard_internal.project_detail.cms.smart_objects.tables.loading"
                                )}
                              </span>
                            </div>
                          ) : objectData ? (
                            <div className="space-y-2">
                              <div className="text-xs font-semibold text-slate-500 dark:text-sleads-slate400 uppercase tracking-wide mb-2">
                                {t(
                                  "dashboard_internal.project_detail.cms.smart_objects.tables.object_details"
                                )}
                              </div>
                              {Object.entries(objectData).map(
                                ([key, val]: [string, any]) => (
                                  <div
                                    key={key}
                                    className="text-sm border-b border-slate-100 dark:border-sleads-slate800 pb-2 last:border-0 last:pb-0"
                                  >
                                    <span className="font-medium text-slate-700 dark:text-sleads-slate300">
                                      {key}:
                                    </span>{" "}
                                    <span className="text-slate-900 dark:text-white">
                                      {formatCellValue(val, key)}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-slate-500 dark:text-sleads-slate400">
                              {t(
                                "dashboard_internal.project_detail.cms.smart_objects.tables.failed_to_load"
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
                {/* Actions column */}
                <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(row)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-sm font-medium text-sleads-blue dark:text-blue-400 hover:text-sleads-blue/80 dark:hover:text-blue-300 hover:bg-sleads-blue/10 dark:hover:bg-sleads-blue/20 rounded transition-colors"
                      title={t(
                        "dashboard_internal.project_detail.cms.smart_objects.tables.edit"
                      )}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(row._id)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title={t(
                        "dashboard_internal.project_detail.cms.smart_objects.tables.delete"
                      )}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {tableData && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-slate-500 dark:text-sleads-slate400">
            {hasActiveFilters ? (
              <>
                {t(
                  "dashboard_internal.project_detail.cms.smart_objects.tables.showing"
                )}{" "}
                {displayData.length}{" "}
                {t(
                  "dashboard_internal.project_detail.cms.smart_objects.filter.filtered_of"
                )}{" "}
                {allData.length}{" "}
                {t(
                  "dashboard_internal.project_detail.cms.smart_objects.tables.items"
                )}
              </>
            ) : (
              <>
                {t(
                  "dashboard_internal.project_detail.cms.smart_objects.tables.showing"
                )}{" "}
                {tableData.page.length}{" "}
                {t(
                  "dashboard_internal.project_detail.cms.smart_objects.tables.items"
                )}
              </>
            )}
          </div>
          {!hasActiveFilters && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCursor(null);
                  fetchTableData(true, false);
                }}
                disabled={!cursor || loadingData}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-sleads-slate300 bg-white dark:bg-sleads-slate800 border border-slate-300 dark:border-sleads-slate700 rounded-lg hover:bg-slate-50 dark:hover:bg-sleads-slate700 focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                {t(
                  "dashboard_internal.project_detail.cms.smart_objects.tables.first"
                )}
              </button>
              <button
                onClick={() => fetchTableData(false, false)}
                disabled={tableData.isDone || loadingData}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-sleads-slate300 bg-white dark:bg-sleads-slate800 border border-slate-300 dark:border-sleads-slate700 rounded-lg hover:bg-slate-50 dark:hover:bg-sleads-slate700 focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t(
                  "dashboard_internal.project_detail.cms.smart_objects.tables.next"
                )}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {isCreateModalOpen && schema && (
        <CreateEditModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          projectId={projectId}
          orgId={orgId}
          project={project}
          tableName={tableName}
          schema={schema}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            fetchTableData(true, false);
            setAllData([]); // Reset filter data
          }}
        />
      )}

      {isEditModalOpen && schema && editingRow && (
        <CreateEditModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingRow(null);
          }}
          projectId={projectId}
          orgId={orgId}
          project={project}
          tableName={tableName}
          schema={schema}
          editingRow={editingRow}
          onSuccess={() => {
            setIsEditModalOpen(false);
            setEditingRow(null);
            fetchTableData(true, false);
            setAllData([]); // Reset filter data
          }}
        />
      )}

      {/* Full Content Modal */}
      {contentModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl max-h-[80vh] bg-white dark:bg-sleads-slate900 rounded-xl shadow-xl border border-slate-200 dark:border-sleads-slate800 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-sleads-slate800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {contentModal.fieldName}
              </h3>
              <button
                onClick={() =>
                  setContentModal({ isOpen: false, fieldName: "", content: "" })
                }
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-sleads-slate300 rounded-lg hover:bg-slate-100 dark:hover:bg-sleads-slate800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <pre className="whitespace-pre-wrap wrap-break-word text-sm text-slate-800 dark:text-sleads-slate200 font-mono bg-slate-50 dark:bg-sleads-slate800 p-4 rounded-lg border border-slate-200 dark:border-sleads-slate700">
                {contentModal.content}
              </pre>
            </div>
            <div className="flex justify-end px-6 py-4 border-t border-slate-200 dark:border-sleads-slate800">
              <button
                onClick={() =>
                  setContentModal({ isOpen: false, fieldName: "", content: "" })
                }
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-sleads-slate300 bg-white dark:bg-sleads-slate800 border border-slate-300 dark:border-sleads-slate700 rounded-lg hover:bg-slate-50 dark:hover:bg-sleads-slate700 transition-colors"
              >
                {t(
                  "dashboard_internal.project_detail.cms.smart_objects.tables.close"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        tableName={tableName}
        schema={schema}
        currentFilters={filters}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters);
          // Force reload 5k data when filters are applied
          if (Object.keys(newFilters).length > 0) {
            loadAllDataForFiltering(true);
          }
        }}
        onClearFilters={() => {
          setFilters({});
          setQuickSearch("");
          setAllData([]); // Clear filter data
        }}
        projectId={projectId}
        orgId={orgId}
      />
    </div>
  );
}
