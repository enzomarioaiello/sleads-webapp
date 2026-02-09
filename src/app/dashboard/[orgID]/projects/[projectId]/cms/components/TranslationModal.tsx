"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAction } from "convex/react";
import { api } from "../../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../../convex/_generated/dataModel";
import {
  X,
  Search,
  Check,
  Loader2,
  Languages,
  CheckSquare,
  Square,
} from "lucide-react";
import { useToast } from "@/app/hooks/useToast";
import { useApp } from "@/app/contexts/AppContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface TranslationModalProps {
  isOpen: boolean;
  onClose: () => void;
  cmsFields: CMSField[] | undefined;
  fieldValuesData:
    | Array<{
        fieldId: Id<"cms_fields">;
        key: string;
        defaultValue: string;
        values: Record<string, string | null>;
      }>
    | undefined;
  selectedLanguages: string[];
  languages: Language[];
  pageId: Id<"cms_pages">;
  splitId?: Id<"cms_splits"> | null;
  organizationId: Id<"organizations">;
  projectId: Id<"projects">;
}

export default function TranslationModal({
  isOpen,
  onClose,
  cmsFields,
  fieldValuesData,
  selectedLanguages,
  languages,
  pageId,
  splitId,
  organizationId,
  projectId,
}: TranslationModalProps) {
  const { toast } = useToast();
  const { t } = useApp();
  const translateCMSFields = useAction(api.cmsActions.translateCMSFields);

  const [sourceLang, setSourceLang] = useState<string>("default");
  const [targetLang, setTargetLang] = useState<string>("");
  const [selectedFields, setSelectedFields] = useState<Set<Id<"cms_fields">>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      setSourceLang("default");
      setTargetLang("");
      setSelectedFields(new Set());
      setSearchQuery("");
      setShowConfirm(false);
    } else if (selectedLanguages.length > 0 && !targetLang) {
      setTargetLang(selectedLanguages[0]);
    }
  }, [isOpen, selectedLanguages, targetLang]);

  // Get available fields with their source and target values
  const availableFields = useMemo(() => {
    if (!cmsFields || !fieldValuesData) return [];

    return cmsFields
      .map((field) => {
        const fieldData = fieldValuesData.find((f) => f.fieldId === field._id);
        let sourceValue = "";
        let targetValue = "";

        if (sourceLang === "default") {
          sourceValue = field.defaultValue || "";
        } else {
          sourceValue = fieldData?.values[sourceLang] || "";
        }

        if (targetLang) {
          targetValue = fieldData?.values[targetLang] || "";
        }

        return {
          fieldId: field._id,
          key: field.key,
          sourceValue,
          targetValue,
        };
      })
      .filter((field) => {
        // Only show fields that have source content
        if (!field.sourceValue.trim()) return false;

        // Filter by search query
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          return (
            field.key.toLowerCase().includes(query) ||
            field.sourceValue.toLowerCase().includes(query) ||
            field.targetValue.toLowerCase().includes(query)
          );
        }

        return true;
      });
  }, [cmsFields, fieldValuesData, sourceLang, targetLang, searchQuery]);

  // Calculate word count for selected fields
  const wordCount = useMemo(() => {
    return availableFields
      .filter((field) => selectedFields.has(field.fieldId))
      .reduce((count, field) => {
        const text = field.sourceValue || "";
        // Simple word count - split by whitespace and filter empty strings
        const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
        return count + words.length;
      }, 0);
  }, [availableFields, selectedFields]);

  // Calculate estimated cost (words × 0.02 + start tariff)
  const START_TARIFF = 0.50;
  const estimatedCost = wordCount * 0.02 + START_TARIFF;

  // Toggle field selection
  const toggleField = (fieldId: Id<"cms_fields">) => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(fieldId)) {
        next.delete(fieldId);
      } else {
        next.add(fieldId);
      }
      return next;
    });
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedFields.size === availableFields.length) {
      setSelectedFields(new Set());
    } else {
      setSelectedFields(new Set(availableFields.map((f) => f.fieldId)));
    }
  };

  // Handle translation
  const handleTranslate = async () => {
    if (selectedFields.size === 0) {
      toast({
        title: t("dashboard_internal.project_detail.cms.fields.translate.no_fields_selected"),
        description: t(
          "dashboard_internal.project_detail.cms.fields.translate.select_fields"
        ),
        variant: "error",
      });
      return;
    }

    if (!targetLang) {
      toast({
        title: t("dashboard_internal.project_detail.cms.fields.translate.no_target"),
        description: t(
          "dashboard_internal.project_detail.cms.fields.translate.select_target_error"
        ),
        variant: "error",
      });
      return;
    }

    setShowConfirm(true);
  };

  const confirmTranslate = async () => {
    setIsTranslating(true);
    setShowConfirm(false);

    try {
      const result = await translateCMSFields({
        pageId,
        splitId: splitId || null,
        sourceLang,
        targetLang,
        fieldIds: Array.from(selectedFields),
        organizationId,
        projectId,
      });

      toast({
        title: t("dashboard_internal.project_detail.cms.fields.translate.success"),
        description: t(
          "dashboard_internal.project_detail.cms.fields.translate.success_desc"
        )
          .replace("{count}", result.translatedFields.toString())
          .replace("{cost}", result.cost.toFixed(2)),
        variant: "success",
      });

      onClose();
      // Data will automatically refresh via Convex queries
    } catch (error) {
      console.error("Translation error:", error);
      toast({
        title: t("dashboard_internal.project_detail.cms.fields.translate.error"),
        description:
          error instanceof Error
            ? error.message
            : t("dashboard_internal.project_detail.cms.fields.translate.error_desc"),
        variant: "error",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  if (!isOpen) return null;

  const sourceLangOptions = [
    { value: "default", label: t("dashboard_internal.project_detail.cms.fields.translate.default_value"), flag: "📄" },
    ...selectedLanguages.map((langCode) => {
      const lang = languages.find((l) => l.code === langCode);
      return {
        value: langCode,
        label: lang?.name || langCode,
        flag: lang?.flag || "🌐",
      };
    }),
  ];

  const targetLangOptions = selectedLanguages
    .filter((langCode) => langCode !== sourceLang || sourceLang === "default")
    .map((langCode) => {
      const lang = languages.find((l) => l.code === langCode);
      return {
        value: langCode,
        label: lang?.name || langCode,
        flag: lang?.flag || "🌐",
      };
    });

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-sleads-slate900 rounded-xl border border-slate-200 dark:border-sleads-slate800 shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-sleads-slate800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sleads-blue/10 dark:bg-sleads-blue/20 rounded-lg">
                  <Languages className="w-5 h-5 text-sleads-blue" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {t("dashboard_internal.project_detail.cms.fields.translate.title")}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-sleads-slate400 mt-0.5">
                    {t("dashboard_internal.project_detail.cms.fields.translate.subtitle")}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isTranslating}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-sleads-slate300 hover:bg-slate-100 dark:hover:bg-sleads-slate800 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Language Selectors */}
            <div className="p-6 border-b border-slate-200 dark:border-sleads-slate800 bg-slate-50 dark:bg-sleads-slate800/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-sleads-slate300 mb-2">
                    {t("dashboard_internal.project_detail.cms.fields.translate.source_language")}
                  </label>
                  <Select
                    value={sourceLang}
                    onValueChange={(value) => {
                      setSourceLang(value);
                      setSelectedFields(new Set());
                    }}
                    disabled={isTranslating}
                  >
                    <SelectTrigger className="w-full h-11 border-2 border-slate-200 dark:border-sleads-slate700 bg-white dark:bg-sleads-slate900 text-slate-900 dark:text-white text-sm font-medium focus:border-sleads-blue focus:ring-2 focus:ring-sleads-blue/20 disabled:opacity-50">
                      <SelectValue>
                        {sourceLangOptions.find((o) => o.value === sourceLang) && (
                          <span>
                            {sourceLangOptions.find((o) => o.value === sourceLang)?.flag}{" "}
                            {sourceLangOptions.find((o) => o.value === sourceLang)?.label}
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {sourceLangOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <span className="flex items-center gap-2">
                            <span>{option.flag}</span>
                            <span>{option.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-sleads-slate300 mb-2">
                    {t("dashboard_internal.project_detail.cms.fields.translate.target_language")}
                  </label>
                  <Select
                    value={targetLang || undefined}
                    onValueChange={(value) => {
                      setTargetLang(value);
                      setSelectedFields(new Set());
                    }}
                    disabled={isTranslating || targetLangOptions.length === 0}
                  >
                    <SelectTrigger className="w-full h-11 border-2 border-slate-200 dark:border-sleads-slate700 bg-white dark:bg-sleads-slate900 text-slate-900 dark:text-white text-sm font-medium focus:border-sleads-blue focus:ring-2 focus:ring-sleads-blue/20 disabled:opacity-50">
                      <SelectValue
                        placeholder={t(
                          "dashboard_internal.project_detail.cms.fields.translate.select_target"
                        )}
                      >
                        {targetLang &&
                          targetLangOptions.find((o) => o.value === targetLang) && (
                            <span>
                              {targetLangOptions.find((o) => o.value === targetLang)?.flag}{" "}
                              {targetLangOptions.find((o) => o.value === targetLang)?.label}
                            </span>
                          )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {targetLangOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <span className="flex items-center gap-2">
                            <span>{option.flag}</span>
                            <span>{option.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="p-6 border-b border-slate-200 dark:border-sleads-slate800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t(
                    "dashboard_internal.project_detail.cms.fields.translate.search_placeholder"
                  )}
                  disabled={isTranslating}
                  className="w-full pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-sleads-slate900 border border-slate-300 dark:border-sleads-slate700 rounded-lg focus:border-sleads-blue focus:outline-none focus:ring-2 focus:ring-sleads-blue/20 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Fields Table */}
            <div className="flex-1 overflow-y-auto p-6">
              {availableFields.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-slate-500 dark:text-sleads-slate400">
                    {t("dashboard_internal.project_detail.cms.fields.translate.no_fields")}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Select All */}
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-sleads-slate800/50 rounded-lg border border-slate-200 dark:border-sleads-slate700">
                    <button
                      onClick={toggleSelectAll}
                      disabled={isTranslating}
                      className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-sleads-slate300 hover:text-sleads-blue transition-colors disabled:opacity-50"
                    >
                      {selectedFields.size === availableFields.length ? (
                        <CheckSquare className="w-5 h-5 text-sleads-blue" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                      {t("dashboard_internal.project_detail.cms.fields.translate.select_all")} (
                      {selectedFields.size}/{availableFields.length})
                    </button>
                  </div>

                  {/* Fields List */}
                  <div className="space-y-2">
                    {availableFields.map((field) => {
                      const isSelected = selectedFields.has(field.fieldId);
                      return (
                        <div
                          key={field.fieldId}
                          className={`
                            p-4 rounded-lg border-2 transition-all cursor-pointer
                            ${
                              isSelected
                                ? "border-sleads-blue bg-blue-50 dark:bg-sleads-blue/10"
                                : "border-slate-200 dark:border-sleads-slate700 bg-white dark:bg-sleads-slate900 hover:border-slate-300 dark:hover:border-sleads-slate600"
                            }
                          `}
                          onClick={() => !isTranslating && toggleField(field.fieldId)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 text-sleads-blue" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-mono text-sm font-semibold text-slate-900 dark:text-white mb-2">
                                {field.key}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <div className="text-xs font-medium text-slate-500 dark:text-sleads-slate400 mb-1 uppercase">
                                    {sourceLang === "default"
                                      ? t("dashboard_internal.project_detail.cms.fields.translate.source")
                                      : sourceLangOptions.find((o) => o.value === sourceLang)?.label}
                                  </div>
                                  <div className="text-sm text-slate-700 dark:text-sleads-slate300 bg-slate-50 dark:bg-sleads-slate800 p-2 rounded border border-slate-200 dark:border-sleads-slate700 line-clamp-3">
                                    {field.sourceValue || (
                                      <span className="text-slate-400 italic">
                                        {t("dashboard_internal.project_detail.cms.fields.translate.empty")}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs font-medium text-slate-500 dark:text-sleads-slate400 mb-1 uppercase">
                                    {targetLangOptions.find((o) => o.value === targetLang)?.label ||
                                      t("dashboard_internal.project_detail.cms.fields.translate.target")}
                                  </div>
                                  <div className="text-sm text-slate-700 dark:text-sleads-slate300 bg-slate-50 dark:bg-sleads-slate800 p-2 rounded border border-slate-200 dark:border-sleads-slate700 line-clamp-3">
                                    {field.targetValue || (
                                      <span className="text-slate-400 italic">
                                        {t("dashboard_internal.project_detail.cms.fields.translate.empty")}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer with Cost and Actions */}
            <div className="p-6 border-t border-slate-200 dark:border-sleads-slate800 bg-slate-50 dark:bg-sleads-slate800/50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-sm">
                  <div className="text-slate-600 dark:text-sleads-slate400">
                    {t("dashboard_internal.project_detail.cms.fields.translate.selected_fields")}:{" "}
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {selectedFields.size}
                    </span>
                  </div>
                  <div className="text-slate-600 dark:text-sleads-slate400 mt-1">
                    {t("dashboard_internal.project_detail.cms.fields.translate.estimated_words")}:{" "}
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {wordCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-slate-600 dark:text-sleads-slate400 mt-1">
                    {t("dashboard_internal.project_detail.cms.fields.translate.estimated_cost")}:{" "}
                    <span className="font-semibold text-sleads-blue">
                      €{estimatedCost.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    disabled={isTranslating}
                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-sleads-slate300 bg-slate-100 dark:bg-sleads-slate800 hover:bg-slate-200 dark:hover:bg-sleads-slate700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {t("dashboard_internal.project_detail.cms.content.cancel")}
                  </button>
                  <button
                    onClick={handleTranslate}
                    disabled={
                      isTranslating ||
                      selectedFields.size === 0 ||
                      !targetLang ||
                      availableFields.length === 0
                    }
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sleads-blue hover:bg-sleads-blue/90 rounded-lg transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isTranslating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t("dashboard_internal.project_detail.cms.fields.translate.translating")}
                      </>
                    ) : (
                      <>
                        <Languages className="w-4 h-4" />
                        {t("dashboard_internal.project_detail.cms.fields.translate.translate")}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Confirmation Dialog */}
          <AnimatePresence>
            {showConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowConfirm(false)}
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white dark:bg-sleads-slate900 rounded-xl border border-slate-200 dark:border-sleads-slate800 shadow-xl p-6 max-w-md w-full"
                >
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {t("dashboard_internal.project_detail.cms.fields.translate.confirm_title")}
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-sleads-slate400 mb-4">
                    {t("dashboard_internal.project_detail.cms.fields.translate.confirm_desc")
                      .replace("{count}", selectedFields.size.toString())
                      .replace("{cost}", estimatedCost.toFixed(2))}
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-sleads-slate300 bg-slate-100 dark:bg-sleads-slate800 hover:bg-slate-200 dark:hover:bg-sleads-slate700 rounded-lg transition-colors"
                    >
                      {t("dashboard_internal.project_detail.cms.content.cancel")}
                    </button>
                    <button
                      onClick={confirmTranslate}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-sleads-blue hover:bg-sleads-blue/90 rounded-lg transition-colors"
                    >
                      {t("dashboard_internal.project_detail.cms.fields.translate.confirm")}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}

