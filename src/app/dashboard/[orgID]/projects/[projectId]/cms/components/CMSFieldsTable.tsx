"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../../convex/_generated/dataModel";
import { Loader2, FileText, Save, Check, X, Search, Languages, ArrowRight } from "lucide-react";
import { useToast } from "@/app/hooks/useToast";
import { useApp } from "@/app/contexts/AppContext";
import { useParams } from "next/navigation";
import TranslationModal from "./TranslationModal";
import QuickTranslationModal from "./QuickTranslationModal";

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
  const { t } = useApp();
  const saveCMSFieldValues = useMutation(api.cms.saveCMSFieldValues);
  const projectId = useParams().projectId as Id<"projects">;

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

  // Modal state for textarea editing
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editingLangCode, setEditingLangCode] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");

  // Search state
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Translation modal state
  const [isTranslationModalOpen, setIsTranslationModalOpen] = useState(false);
  
  // Quick translation modal state
  const [quickTranslateState, setQuickTranslateState] = useState<{
    isOpen: boolean;
    fieldId: Id<"cms_fields"> | null;
    fieldKey: string;
    sourceLang: string;
    sourceValue: string;
    targetLangs: string[];
  }>({
    isOpen: false,
    fieldId: null,
    fieldKey: "",
    sourceLang: "",
    sourceValue: "",
    targetLangs: [],
  });
  
  // Hover state for quick translate
  const [hoveredCell, setHoveredCell] = useState<{
    fieldId: Id<"cms_fields">;
    langCode: string;
  } | null>(null);

  useEffect(() => {
    if (cmsFields) {
      const initialValues: Record<string, Record<string, string>> = {};
      const originalValues: Record<string, Record<string, string>> = {};

      cmsFields.forEach((field) => {
        initialValues[field._id] = {};
        originalValues[field._id] = {};

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
            selectedLanguages.forEach((langCode) => {
              initialValues[field._id][langCode] = "";
              originalValues[field._id][langCode] = "";
            });
          }
        } else {
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

  const handleDoubleClick = (
    fieldId: string,
    langCode: string,
    currentValue: string
  ) => {
    setEditingFieldId(fieldId);
    setEditingLangCode(langCode);
    setEditingValue(currentValue);
    setIsModalOpen(true);
  };

  const handleModalSave = () => {
    if (editingFieldId && editingLangCode !== null) {
      handleFieldChange(editingFieldId, editingLangCode, editingValue);
      setIsModalOpen(false);
      setEditingFieldId(null);
      setEditingLangCode(null);
      setEditingValue("");
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingFieldId(null);
    setEditingLangCode(null);
    setEditingValue("");
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const saveData = {
        pageId,
        organizationId,
        splitId: splitId || null,
        fieldValues: Object.entries(fieldValues).map(
          ([fieldId, langValues]) => ({
            fieldId: fieldId as Id<"cms_fields">,
            values: Object.entries(langValues).map(([langCode, value]) => ({
              langCode,
              value: value.trim() || null,
            })),
          })
        ),
      };

      await saveCMSFieldValues(saveData);

      toast({
        title: t("dashboard_internal.project_detail.cms.fields.changes_saved"),
        description: t(
          "dashboard_internal.project_detail.cms.fields.changes_saved"
        ),
        variant: "success",
      });
      setOriginalFieldValues(JSON.parse(JSON.stringify(fieldValues)));
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving field values:", error);
      toast({
        title: "Error",
        description: t(
          "dashboard_internal.project_detail.cms.fields.save_error"
        ),
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (cmsFields === undefined || fieldValuesData === undefined) {
    return (
      <div className="p-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-sleads-blue" />
      </div>
    );
  }

  if (cmsFields.length === 0) {
    return (
      <div className="p-12 text-center bg-white dark:bg-sleads-slate900 rounded-xl border border-slate-200 dark:border-sleads-slate800">
        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-sleads-slate800 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-slate-400" />
        </div>
        <h4 className="text-sm font-semibold text-slate-700 dark:text-sleads-slate300 mb-2">
          {t("dashboard_internal.project_detail.cms.fields.no_fields")}
        </h4>
        <p className="text-xs text-slate-500 dark:text-sleads-slate400">
          {t("dashboard_internal.project_detail.cms.fields.no_fields_desc")}
        </p>
      </div>
    );
  }

  // Filter fields based on search query
  const filteredFields = cmsFields.filter((field) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase().trim();

    // Search in field key
    if (field.key.toLowerCase().includes(query)) return true;

    // Search in default value
    if (field.defaultValue?.toLowerCase().includes(query)) return true;

    // Search in all language-specific values
    const fieldValue = fieldValues[field._id];
    if (fieldValue) {
      for (const langCode of selectedLanguages) {
        const value = fieldValue[langCode] || "";
        if (value.toLowerCase().includes(query)) return true;
      }
    }

    return false;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-sleads-slate900 rounded-xl border border-slate-200 dark:border-sleads-slate800 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-sleads-slate800 bg-slate-50 dark:bg-sleads-slate800/50">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              {t("dashboard_internal.project_detail.cms.fields.content_fields")}
            </h4>
            <p className="text-xs text-slate-500 dark:text-sleads-slate400 mt-1">
              {t(
                "dashboard_internal.project_detail.cms.fields.edit_content_desc"
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedLanguages.length > 0 && (
              <button
                onClick={() => setIsTranslationModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-sleads-blue bg-blue-50 dark:bg-sleads-blue/10 hover:bg-blue-100 dark:hover:bg-sleads-blue/20 border border-sleads-blue/20 transition-all"
              >
                <Languages className="w-4 h-4" />
                {t("dashboard_internal.project_detail.cms.fields.translate.button")}
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className={`
            inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all
            ${
              hasChanges
                ? "bg-sleads-blue text-white hover:bg-sleads-blue/90 shadow-md hover:shadow-lg"
                : "bg-slate-200 dark:bg-sleads-slate700 text-slate-500 dark:text-sleads-slate400 cursor-not-allowed"
            }
            ${isSaving ? "opacity-50 cursor-not-allowed" : ""}
          `}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("dashboard_internal.project_detail.cms.fields.saving")}
                </>
              ) : hasChanges ? (
                <>
                  <Save className="w-4 h-4" />
                  {t("dashboard_internal.project_detail.cms.fields.save_changes")}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {t("dashboard_internal.project_detail.cms.fields.saved")}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t(
              "dashboard_internal.project_detail.cms.fields.search_placeholder"
            )}
            className="w-full pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-sleads-slate900 border border-slate-300 dark:border-sleads-slate700 rounded-lg focus:border-sleads-blue focus:outline-none focus:ring-2 focus:ring-sleads-blue/20 transition-all"
          />
        </div>
      </div>

      {/* Table - Mobile responsive */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-sleads-slate800/50 border-b border-slate-200 dark:border-sleads-slate800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-sleads-slate300 uppercase tracking-wider sticky left-0 bg-slate-50 dark:bg-sleads-slate800/50 z-10 border-r border-slate-200 dark:border-sleads-slate800 min-w-[120px]">
                {t("dashboard_internal.project_detail.cms.fields.field_id")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-sleads-slate300 uppercase tracking-wider border-r border-slate-200 dark:border-sleads-slate800 min-w-[150px]">
                {t(
                  "dashboard_internal.project_detail.cms.fields.default_value"
                )}
              </th>
              {selectedLanguages.length > 0 ? (
                selectedLanguages.map((langCode) => {
                  const lang = languages.find((l) => l.code === langCode);
                  return lang ? (
                    <th
                      key={langCode}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-sleads-slate300 uppercase tracking-wider border-r border-slate-200 dark:border-sleads-slate800 last:border-r-0 min-w-[180px]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{lang.flag}</span>
                        <span className="hidden sm:inline">{lang.name}</span>
                        <span className="sm:hidden">
                          {lang.code.toUpperCase()}
                        </span>
                      </div>
                    </th>
                  ) : null;
                })
              ) : (
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-sleads-slate400">
                  {t(
                    "dashboard_internal.project_detail.cms.fields.no_languages"
                  )}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-sleads-slate900 divide-y divide-slate-200 dark:divide-sleads-slate800">
            {filteredFields.length === 0 ? (
              <tr>
                <td
                  colSpan={selectedLanguages.length + 2}
                  className="px-4 py-8 text-center text-sm text-slate-500 dark:text-sleads-slate400"
                >
                  {t("dashboard_internal.project_detail.cms.fields.no_results")}
                </td>
              </tr>
            ) : (
              filteredFields.map((field) => (
                <tr
                  key={field._id}
                  className="hover:bg-slate-50 dark:hover:bg-sleads-slate800/50 transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-mono text-slate-900 dark:text-white sticky left-0 bg-white dark:bg-sleads-slate900 z-10 border-r border-slate-200 dark:border-sleads-slate800">
                    <div className="font-semibold">{field.key}</div>
                  </td>
                  <td
                    className="px-4 py-3 text-sm text-slate-700 dark:text-sleads-slate300 border-r border-slate-200 dark:border-sleads-slate800 relative"
                    onMouseEnter={() => {
                      if (field.defaultValue?.trim()) {
                        setHoveredCell({ fieldId: field._id, langCode: "default" });
                      }
                    }}
                    onMouseLeave={() => {
                      if (hoveredCell?.langCode === "default") {
                        setHoveredCell(null);
                      }
                    }}
                  >
                    <div className="px-3 py-2 bg-slate-50 dark:bg-sleads-slate800 rounded-md border border-slate-200 dark:border-sleads-slate700">
                      {field.defaultValue || (
                        <span className="text-slate-400 dark:text-sleads-slate500 italic">
                          {t(
                            "dashboard_internal.project_detail.cms.fields.no_default"
                          )}
                        </span>
                      )}
                    </div>
                    
                    {/* Quick Translate Hover UI for default value */}
                    {hoveredCell?.fieldId === field._id &&
                      hoveredCell?.langCode === "default" &&
                      field.defaultValue?.trim() &&
                      selectedLanguages.length > 0 && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-1 flex items-center gap-1 bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate700 rounded-lg shadow-lg p-1 z-20">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuickTranslateState({
                                isOpen: true,
                                fieldId: field._id,
                                fieldKey: field.key,
                                sourceLang: "default",
                                sourceValue: field.defaultValue,
                                targetLangs: ["all"],
                              });
                              setHoveredCell(null);
                            }}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-sleads-slate800 rounded transition-colors"
                            title={t("dashboard_internal.project_detail.cms.fields.quick_translate.translate_all")}
                          >
                            <Languages className="w-4 h-4 text-sleads-blue" />
                          </button>
                          {selectedLanguages.map((targetLang) => {
                            const targetLangData = languages.find((l) => l.code === targetLang);
                            return (
                              <button
                                key={targetLang}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setQuickTranslateState({
                                    isOpen: true,
                                    fieldId: field._id,
                                    fieldKey: field.key,
                                    sourceLang: "default",
                                    sourceValue: field.defaultValue,
                                    targetLangs: [targetLang],
                                  });
                                  setHoveredCell(null);
                                }}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-sleads-slate800 rounded transition-colors"
                                title={targetLangData?.name || targetLang}
                              >
                                <span className="text-lg">{targetLangData?.flag || "🌐"}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                  </td>
                  {selectedLanguages.length > 0 ? (
                    selectedLanguages.map((langCode) => {
                      const cellValue = fieldValues[field._id]?.[langCode] || "";
                      const hasContent = cellValue.trim().length > 0;
                      const isHovered = hoveredCell?.fieldId === field._id && hoveredCell?.langCode === langCode;
                      const otherLanguages = selectedLanguages.filter((l) => l !== langCode);
                      
                      return (
                        <td
                          key={`${field._id}-${langCode}`}
                          className="px-4 py-3 border-r border-slate-200 dark:border-sleads-slate800 last:border-r-0 relative"
                          onMouseEnter={() => {
                            if (hasContent) {
                              setHoveredCell({ fieldId: field._id, langCode });
                            }
                          }}
                          onMouseLeave={() => {
                            if (hoveredCell?.fieldId === field._id && hoveredCell?.langCode === langCode) {
                              setHoveredCell(null);
                            }
                          }}
                        >
                          <input
                            type="text"
                            value={cellValue}
                            onChange={(e) =>
                              handleFieldChange(
                                field._id,
                                langCode,
                                e.target.value
                              )
                            }
                            onDoubleClick={() =>
                              handleDoubleClick(
                                field._id,
                                langCode,
                                cellValue
                              )
                            }
                            placeholder={t(
                              "dashboard_internal.project_detail.cms.fields.enter_value"
                            )}
                            className="w-full px-3 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-sleads-slate800 border border-slate-300 dark:border-sleads-slate700 rounded-lg focus:border-sleads-blue focus:outline-none focus:ring-2 focus:ring-sleads-blue/20 transition-all cursor-text"
                            title={t(
                              "dashboard_internal.project_detail.cms.fields.double_click_to_edit"
                            )}
                          />
                          
                          {/* Quick Translate Hover UI */}
                          {isHovered && hasContent && otherLanguages.length > 0 && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-1 flex items-center gap-1 bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate700 rounded-lg shadow-lg p-1 z-20">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setQuickTranslateState({
                                    isOpen: true,
                                    fieldId: field._id,
                                    fieldKey: field.key,
                                    sourceLang: langCode,
                                    sourceValue: cellValue,
                                    targetLangs: ["all"],
                                  });
                                  setHoveredCell(null);
                                }}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-sleads-slate800 rounded transition-colors"
                                title={t("dashboard_internal.project_detail.cms.fields.quick_translate.translate_all")}
                              >
                                <Languages className="w-4 h-4 text-sleads-blue" />
                              </button>
                              {otherLanguages.map((targetLang) => {
                                const targetLangData = languages.find((l) => l.code === targetLang);
                                return (
                                  <button
                                    key={targetLang}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setQuickTranslateState({
                                        isOpen: true,
                                        fieldId: field._id,
                                        fieldKey: field.key,
                                        sourceLang: langCode,
                                        sourceValue: cellValue,
                                        targetLangs: [targetLang],
                                      });
                                      setHoveredCell(null);
                                    }}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-sleads-slate800 rounded transition-colors"
                                    title={targetLangData?.name || targetLang}
                                  >
                                    <span className="text-lg">{targetLangData?.flag || "🌐"}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      );
                    })
                  ) : (
                    <td className="px-4 py-3 text-center text-sm text-slate-400 dark:text-sleads-slate500">
                      -
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {isModalOpen && editingFieldId && editingLangCode !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleModalClose}
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
                  {t("dashboard_internal.project_detail.cms.fields.edit_field")}
                </h3>
                <p className="text-sm text-slate-500 dark:text-sleads-slate400 mt-1">
                  {cmsFields?.find((f) => f._id === editingFieldId)?.key} •{" "}
                  {languages.find((l) => l.code === editingLangCode)?.name}
                </p>
              </div>
              <button
                onClick={handleModalClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-sleads-slate300 hover:bg-slate-100 dark:hover:bg-sleads-slate800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 p-6 overflow-y-auto">
              <textarea
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                placeholder={t(
                  "dashboard_internal.project_detail.cms.fields.enter_value"
                )}
                className="w-full h-64 px-4 py-3 text-sm text-slate-900 dark:text-white bg-white dark:bg-sleads-slate800 border-2 border-slate-200 dark:border-sleads-slate700 rounded-lg focus:border-sleads-blue focus:outline-none focus:ring-2 focus:ring-sleads-blue/20 transition-all resize-none font-mono"
                autoFocus
              />
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-sleads-slate800">
              <button
                onClick={handleModalClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-sleads-slate300 bg-slate-100 dark:bg-sleads-slate800 hover:bg-slate-200 dark:hover:bg-sleads-slate700 rounded-lg transition-colors"
              >
                {t("dashboard_internal.project_detail.cms.content.cancel")}
              </button>
              <button
                onClick={handleModalSave}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-sleads-blue hover:bg-sleads-blue/90 rounded-lg transition-colors shadow-sm hover:shadow-md"
              >
                <Save className="w-4 h-4" />
                {t("dashboard_internal.project_detail.cms.fields.save")}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Translation Modal */}
      <TranslationModal
        isOpen={isTranslationModalOpen}
        onClose={() => setIsTranslationModalOpen(false)}
        cmsFields={cmsFields}
        fieldValuesData={fieldValuesData}
        selectedLanguages={selectedLanguages}
        languages={languages}
        pageId={pageId}
        splitId={splitId}
        organizationId={organizationId}
        projectId={projectId}
      />

      {/* Quick Translation Modal */}
      {quickTranslateState.isOpen && quickTranslateState.fieldId && (
        <QuickTranslationModal
          isOpen={quickTranslateState.isOpen}
          onClose={() =>
            setQuickTranslateState({
              isOpen: false,
              fieldId: null,
              fieldKey: "",
              sourceLang: "",
              sourceValue: "",
              targetLangs: [],
            })
          }
          fieldId={quickTranslateState.fieldId}
          fieldKey={quickTranslateState.fieldKey}
          sourceLang={quickTranslateState.sourceLang}
          sourceValue={quickTranslateState.sourceValue}
          targetLangs={
            quickTranslateState.targetLangs[0] === "all"
              ? selectedLanguages.filter((l) => l !== quickTranslateState.sourceLang)
              : quickTranslateState.targetLangs
          }
          languages={languages}
          pageId={pageId}
          splitId={splitId}
          organizationId={organizationId}
          projectId={projectId}
        />
      )}
    </motion.div>
  );
}
