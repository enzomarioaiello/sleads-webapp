"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "../../../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../../../convex/_generated/dataModel";
import {
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Plus,
  AlertCircle,
  Trash2,
  Pencil,
  Eye,
  X,
} from "lucide-react";
import { useToast } from "@/app/hooks/useToast";

interface DataViewProps {
  projectId: Id<"projects">;
  orgId: Id<"organizations">;
  project: {
    _id: Id<"projects">;
    smartObjectsKey: string | null | undefined;
    smartObjectsUrl: string | null | undefined;
  };
  tableName: string;
  onOpenCreateModal: () => void;
  onDataCreated?: () => void;
  schema?: any;
  onOpenEditModal?: (rowData: any) => void;
}

export default function DataView({
  projectId,
  orgId,
  project,
  tableName,
  onOpenCreateModal,
  onDataCreated,
  schema,
  onOpenEditModal,
}: DataViewProps) {
  const { toast } = useToast();
  const [tableData, setTableData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [numItems, setNumItems] = useState(10);
  // Popover state for FK hover
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [objectData, setObjectData] = useState<any>(null);
  const [loadingObject, setLoadingObject] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  // Full content modal state
  const [contentModal, setContentModal] = useState<{
    isOpen: boolean;
    fieldName: string;
    content: string;
  }>({ isOpen: false, fieldName: "", content: "" });

  const getTableData = useAction(api.smartObjects.getTableData);
  const deleteTableData = useAction(api.smartObjects.deleteTableData);
  const getObject = useAction(api.smartObjects.getObject);

  // Helper function to format cell values, especially dates
  const formatCellValue = (value: any, fieldName?: string): string => {
    if (value === null || value === undefined) {
      return "";
    }

    // Check if it's an object/array
    if (typeof value === "object") {
      return JSON.stringify(value);
    }

    // Check if it's a number that could be a timestamp
    if (typeof value === "number") {
      const fieldNameLower = fieldName?.toLowerCase() || "";
      const isDateField =
        fieldNameLower.includes("date") ||
        fieldNameLower.includes("time") ||
        fieldNameLower.includes("at") ||
        fieldNameLower === "createdat" ||
        fieldNameLower === "updatedat";

      // Check if it's a reasonable timestamp
      const isTimestamp =
        (value > 946684800000 && value < 4102444800000) ||
        (value > 946684800 && value < 4102444800);

      if (isDateField || isTimestamp) {
        try {
          // Handle both seconds and milliseconds
          const timestamp = value > 10000000000 ? value : value * 1000;
          const date = new Date(timestamp);
          // Check if date is valid
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

  // Check if a value looks like an ID (foreign key)
  const isLikelyId = (value: any, fieldName?: string): boolean => {
    if (typeof value !== "string") return false;

    // Check if field name suggests it's an ID
    const fieldNameLower = fieldName?.toLowerCase() || "";
    const idPatterns = [
      /id$/i, // ends with "id"
      /^.*Id$/i, // camelCase ending with Id
      /_id$/i, // ends with "_id"
    ];

    if (idPatterns.some((pattern) => pattern.test(fieldNameLower))) {
      // Check if it looks like a Convex ID (starts with a letter, has underscores)
      // Or any reasonable ID format
      return value.length > 5 && /^[a-zA-Z0-9_]+$/.test(value);
    }

    return false;
  };

  // Fetch object data on hover
  const handleIdHover = async (id: string, event: React.MouseEvent) => {
    if (hoveredId === id && objectData) return; // Already loaded

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

  // Handle delete with confirmation
  const handleDelete = async (objectId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this item? This action cannot be undone."
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
        title: "Success",
        description: "Item deleted successfully",
        variant: "success",
      });

      // Refresh table data
      await fetchTableData(true);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete item";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "error",
      });
    }
  };

  const fetchTableData = async (resetCursor = false) => {
    if (!tableName || !project.smartObjectsUrl || !project.smartObjectsKey) {
      return;
    }

    setLoadingData(true);
    setDataError(null);

    try {
      const data = await getTableData({
        projectId: projectId,
        organizationId: orgId,
        tableName: tableName,
        cursor: resetCursor ? null : cursor,
        numItems: numItems,
      });

      const response = data as {
        continueCursor?: string | null;
        isDone?: boolean;
        page?: any[];
      };

      setTableData(response);
      setCursor(response.continueCursor || null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch table data";
      setDataError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (tableName) {
      setCursor(null);
      setTableData(null);
      setDataError(null);
      // Fetch data when table changes
      const fetchData = async () => {
        setLoadingData(true);
        setDataError(null);
        try {
          const data = await getTableData({
            projectId: projectId,
            organizationId: orgId,
            tableName: tableName,
            cursor: null,
            numItems: numItems,
          });
          const response = data as {
            continueCursor?: string | null;
            isDone?: boolean;
            page?: any[];
          };
          setTableData(response);
          setCursor(response.continueCursor || null);
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to fetch table data";
          setDataError(errorMessage);
          toast({
            title: "Error",
            description: errorMessage,
            variant: "error",
          });
        } finally {
          setLoadingData(false);
        }
      };
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableName, numItems]);

  // Refresh when data is created
  useEffect(() => {
    if (onDataCreated) {
      fetchTableData(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onDataCreated]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">
            Items per page:
          </label>
          <select
            value={numItems}
            onChange={(e) => {
              setNumItems(Number(e.target.value));
            }}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:border-transparent"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sleads-blue rounded-lg hover:bg-sleads-blue/90 focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:ring-offset-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
          <button
            onClick={() => fetchTableData(true)}
            disabled={loadingData}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw
              className={`w-4 h-4 ${loadingData ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loadingData && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-sleads-blue" />
        </div>
      )}

      {/* Error State */}
      {dataError && !loadingData && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800">{dataError}</p>
          </div>
        </div>
      )}

      {/* Data Table */}
      {!loadingData && !dataError && tableData && (
        <>
          {tableData.page && tableData.page.length > 0 ? (
            <>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(tableData.page[0]).map((key) => (
                        <th
                          key={key}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {key}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tableData.page.map((row: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        {Object.entries(row).map(
                          ([fieldName, value]: [string, any]) => {
                            const isId = isLikelyId(value, fieldName);
                            const cellValue = formatCellValue(value, fieldName);
                            const maxLength = 100;
                            const isTruncated = cellValue.length > maxLength;
                            const displayValue = isTruncated
                              ? cellValue.slice(0, maxLength) + "..."
                              : cellValue;

                            return (
                              <td
                                key={fieldName}
                                className="px-4 py-3 text-sm text-gray-900 relative max-w-xs"
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
                                        ? "cursor-pointer text-sleads-blue hover:underline"
                                        : ""
                                    } ${isTruncated ? "line-clamp-2" : ""}`}
                                  >
                                    {displayValue}
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
                                      className="shrink-0 p-1 text-gray-400 hover:text-sleads-blue hover:bg-gray-100 rounded transition-colors"
                                      title="View full content"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>

                                {/* Popover */}
                                {isId &&
                                  hoveredId === value &&
                                  popoverPosition && (
                                    <div
                                      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-md max-h-96 overflow-auto"
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
                                          <span className="text-sm text-gray-600">
                                            Loading...
                                          </span>
                                        </div>
                                      ) : objectData ? (
                                        <div className="space-y-2">
                                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                            Object Details
                                          </div>
                                          {Object.entries(objectData).map(
                                            ([key, val]: [string, any]) => (
                                              <div
                                                key={key}
                                                className="text-sm border-b border-gray-100 pb-2 last:border-0 last:pb-0"
                                              >
                                                <span className="font-medium text-gray-700">
                                                  {key}:
                                                </span>{" "}
                                                <span className="text-gray-900">
                                                  {formatCellValue(val, key)}
                                                </span>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      ) : (
                                        <div className="text-sm text-gray-500">
                                          Failed to load object
                                        </div>
                                      )}
                                    </div>
                                  )}
                              </td>
                            );
                          }
                        )}
                        {/* Actions column */}
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            {onOpenEditModal && (
                              <button
                                onClick={() => onOpenEditModal(row)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-sm font-medium text-sleads-blue hover:text-sleads-blue/80 hover:bg-sleads-blue/10 rounded transition-colors"
                                title="Edit item"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(row._id)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                              title="Delete item"
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

              {/* Pagination Controls */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {tableData.page.length} item
                  {tableData.page.length !== 1 ? "s" : ""}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCursor(null);
                      fetchTableData(true);
                    }}
                    disabled={!cursor || loadingData}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    First
                  </button>
                  <button
                    onClick={() => fetchTableData(false)}
                    disabled={!cursor || tableData.isDone || loadingData}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">
                No data available for this table.
              </p>
            </div>
          )}
        </>
      )}

      {/* Full Content Modal */}
      {contentModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl max-h-[80vh] bg-white dark:bg-sleads-slate900 rounded-xl shadow-xl border border-gray-200 dark:border-sleads-slate800 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-sleads-slate800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {contentModal.fieldName}
              </h3>
              <button
                onClick={() =>
                  setContentModal({ isOpen: false, fieldName: "", content: "" })
                }
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-sleads-slate300 rounded-lg hover:bg-gray-100 dark:hover:bg-sleads-slate800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <pre className="whitespace-pre-wrap wrap-break-word text-sm text-gray-800 dark:text-sleads-slate200 font-mono bg-gray-50 dark:bg-sleads-slate800 p-4 rounded-lg border border-gray-200 dark:border-sleads-slate700">
                {contentModal.content}
              </pre>
            </div>
            <div className="flex justify-end px-6 py-4 border-t border-gray-200 dark:border-sleads-slate800">
              <button
                onClick={() =>
                  setContentModal({ isOpen: false, fieldName: "", content: "" })
                }
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-sleads-slate300 bg-white dark:bg-sleads-slate800 border border-gray-300 dark:border-sleads-slate700 rounded-lg hover:bg-gray-50 dark:hover:bg-sleads-slate700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
