"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../../../convex/_generated/dataModel";
import {
  Loader2,
  FileText,
  Save,
  Search,
  X,
  Trash2,
  CheckSquare,
  Square,
} from "lucide-react";
import { useToast } from "@/app/hooks/useToast";
import { useParams } from "next/navigation";

interface Language {
  code: string;
  name: string;
  flag: string;
}

interface CMSField {
  _id: Id<"cms_fields">;
  key: string;
  defaultValue: string;
}

interface CMSFieldsTableProps {
  cmsFields: CMSField[] | undefined;
  selectedLanguages: string[];
  languages: Language[];
  pageId: Id<"cms_pages">;
  splitId?: Id<"cms_splits"> | null;
  organizationId: Id<"organizations">;
}

export default function CMSFieldsTable({
  cmsFields,
  selectedLanguages,
  languages,
  pageId,
  splitId,
  organizationId,
}: CMSFieldsTableProps) {
  const { toast } = useToast();
  const saveCMSFieldValues = useMutation(api.cms.saveCMSFieldValues);
  const deleteCMSField = useMutation(api.cms.deleteCMSField);
  const projectId = useParams().projectId as Id<"projects">;

  // Search and selection state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFields, setSelectedFields] = useState<Set<Id<"cms_fields">>>(
    new Set()
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch existing field values
  const fieldValuesData = useQuery(
    api.cms.getCMSFieldValues,
    pageId
      ? {
          page: pageId,
          projectId,
          splitId: splitId || undefined,
        }
      : "skip"
  );

  const [fieldValues, setFieldValues] = useState<
    Record<string, Record<string, string>>
  >({});
  const [originalFieldValues, setOriginalFieldValues] = useState<
    Record<string, Record<string, string>>
  >({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Filter fields based on search query
  const filteredFields = useMemo(() => {
    if (!cmsFields) return [];
    if (!searchQuery.trim()) return cmsFields;

    const query = searchQuery.toLowerCase().trim();
    return cmsFields.filter(
      (field) =>
        field.key.toLowerCase().includes(query) ||
        field.defaultValue?.toLowerCase().includes(query)
    );
  }, [cmsFields, searchQuery]);

  // Clear selection when search changes
  useEffect(() => {
    setSelectedFields(new Set());
  }, [searchQuery]);

  // Initialize field values from fetched data or cmsFields
  useEffect(() => {
    if (cmsFields) {
      const initialValues: Record<string, Record<string, string>> = {};
      const originalValues: Record<string, Record<string, string>> = {};

      cmsFields.forEach((field) => {
        initialValues[field._id] = {};
        originalValues[field._id] = {};

        // If we have fetched field values data, use those
        if (fieldValuesData) {
          const fieldData = fieldValuesData.find(
            (f) => f.fieldId === field._id
          );
          if (fieldData) {
            selectedLanguages.forEach((langCode) => {
              const value = fieldData.values[langCode] || "";
              initialValues[field._id][langCode] = value;
              originalValues[field._id][langCode] = value;
            });
          } else {
            // No data for this field, initialize empty
            selectedLanguages.forEach((langCode) => {
              initialValues[field._id][langCode] = "";
              originalValues[field._id][langCode] = "";
            });
          }
        } else {
          // No data fetched yet, initialize empty
          selectedLanguages.forEach((langCode) => {
            initialValues[field._id][langCode] = "";
            originalValues[field._id][langCode] = "";
          });
        }
      });

      setFieldValues(initialValues);
      setOriginalFieldValues(originalValues);
      setHasChanges(false);
    }
  }, [cmsFields, selectedLanguages, fieldValuesData, splitId]);

  const handleFieldChange = (
    fieldId: string,
    langCode: string,
    value: string
  ) => {
    setFieldValues((prev) => {
      const updated = {
        ...prev,
        [fieldId]: {
          ...prev[fieldId],
          [langCode]: value,
        },
      };
      // Check if there are any changes compared to original values
      const hasAnyChanges = Object.keys(updated).some((fId) =>
        selectedLanguages.some(
          (lang) =>
            (updated[fId]?.[lang] || "") !==
            (originalFieldValues[fId]?.[lang] || "")
        )
      );
      setHasChanges(hasAnyChanges);
      return updated;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Prepare data for saving
      const saveData = {
        pageId,
        organizationId,
        splitId: splitId || null,
        fieldValues: Object.entries(fieldValues).map(
          ([fieldId, langValues]) => ({
            fieldId: fieldId as Id<"cms_fields">,
            values: Object.entries(langValues).map(([langCode, value]) => ({
              langCode,
              value: value.trim() || null, // Trim whitespace, set to null if empty
            })),
          })
        ),
      };

      // Call the save mutation
      await saveCMSFieldValues(saveData);

      toast({
        title: "Changes saved",
        description: "All field values have been saved successfully.",
        variant: "success",
      });
      // Update original values to match current values
      setOriginalFieldValues(JSON.parse(JSON.stringify(fieldValues)));
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving field values:", error);
      toast({
        title: "Error",
        description: "Failed to save field values.",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Selection handlers
  const toggleFieldSelection = (fieldId: Id<"cms_fields">) => {
    setSelectedFields((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fieldId)) {
        newSet.delete(fieldId);
      } else {
        newSet.add(fieldId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedFields.size === filteredFields.length) {
      setSelectedFields(new Set());
    } else {
      setSelectedFields(new Set(filteredFields.map((f) => f._id)));
    }
  };

  // Delete handlers
  const handleDeleteField = async (fieldId: Id<"cms_fields">) => {
    if (
      !confirm(
        "Are you sure you want to delete this field? All translations for this field will be permanently deleted."
      )
    )
      return;

    setIsDeleting(true);
    try {
      await deleteCMSField({ fieldId });
      toast({
        title: "Field deleted",
        description: "The field has been deleted successfully.",
        variant: "success",
      });
      setSelectedFields((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fieldId);
        return newSet;
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete field.",
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedFields.size === 0) return;

    if (
      !confirm(
        `Are you sure you want to delete ${selectedFields.size} field(s)? All translations for these fields will be permanently deleted.`
      )
    )
      return;

    setIsDeleting(true);
    try {
      // Delete all selected fields
      const deletePromises = Array.from(selectedFields).map((fieldId) =>
        deleteCMSField({ fieldId })
      );
      await Promise.all(deletePromises);

      toast({
        title: "Fields deleted",
        description: `${selectedFields.size} field(s) have been deleted successfully.`,
        variant: "success",
      });
      setSelectedFields(new Set());
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete fields.",
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (cmsFields === undefined || fieldValuesData === undefined) {
    return (
      <div className="p-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (cmsFields.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          No fields found
        </h4>
        <p className="text-xs text-gray-500">
          This page doesn&apos;t have any CMS fields yet.
        </p>
      </div>
    );
  }

  const isAllSelected =
    filteredFields.length > 0 && selectedFields.size === filteredFields.length;
  const isSomeSelected = selectedFields.size > 0;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {/* Header with search and actions */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h4 className="text-base font-bold text-gray-900">CMS Fields</h4>
              <p className="text-xs text-gray-500 mt-1">
                Manage content for each field across different languages
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search fields..."
                  className="w-64 pl-10 pr-8 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Delete selected button */}
              {isSomeSelected && (
                <button
                  onClick={handleDeleteSelected}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Delete ({selectedFields.size})
                </button>
              )}

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Search results info */}
          {searchQuery && (
            <div className="mt-3 text-sm text-gray-600">
              Showing {filteredFields.length} of {cmsFields.length} fields
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {/* Checkbox header */}
                <th className="px-3 py-3 w-10">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                    title={isAllSelected ? "Deselect all" : "Select all"}
                  >
                    {isAllSelected ? (
                      <CheckSquare className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200">
                  Default Value
                </th>
                {selectedLanguages.length > 0 ? (
                  selectedLanguages.map((langCode) => {
                    const lang = languages.find((l) => l.code === langCode);
                    return lang ? (
                      <th
                        key={langCode}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-r border-gray-200 last:border-r-0"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{lang.flag}</span>
                          <span>{lang.name}</span>
                        </div>
                      </th>
                    ) : null;
                  })
                ) : (
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">
                    No languages selected
                  </th>
                )}
                {/* Actions header */}
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFields.length === 0 ? (
                <tr>
                  <td
                    colSpan={4 + selectedLanguages.length}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No fields match your search.
                  </td>
                </tr>
              ) : (
                filteredFields.map((field) => (
                  <tr
                    key={field._id}
                    className={`hover:bg-gray-50 transition-colors ${
                      selectedFields.has(field._id) ? "bg-blue-50" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => toggleFieldSelection(field._id)}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {selectedFields.has(field._id) ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-200">
                      {field.key}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 border-r border-gray-200">
                      <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-200 max-w-xs truncate">
                        {field.defaultValue || (
                          <span className="text-gray-400 italic">
                            No default value
                          </span>
                        )}
                      </div>
                    </td>
                    {selectedLanguages.length > 0 ? (
                      selectedLanguages.map((langCode) => (
                        <td
                          key={`${field._id}-${langCode}`}
                          className="px-4 py-3 border-r border-gray-200 last:border-r-0"
                        >
                          <input
                            type="text"
                            value={fieldValues[field._id]?.[langCode] || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                field._id,
                                langCode,
                                e.target.value
                              )
                            }
                            placeholder="Enter value..."
                            className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                      ))
                    ) : (
                      <td className="px-4 py-3 text-center text-sm text-gray-400">
                        -
                      </td>
                    )}
                    {/* Actions */}
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteField(field._id)}
                        disabled={isDeleting}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete field"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
