"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "../../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../../convex/_generated/dataModel";
import { Globe, Check, Save, Loader2, Search } from "lucide-react";
import { useToast } from "@/app/hooks/useToast";
import { useApp } from "@/app/contexts/AppContext";
import { cn } from "@/app/utils/cn";

interface Language {
  code: string;
  name: string;
  flag: string;
}

interface LanguageSettingsProps {
  projectId: Id<"projects">;
  orgId: Id<"organizations">;
  project: {
    selectedLanguages?: string[] | null;
  };
  selectedLanguages: string[];
  setSelectedLanguages: React.Dispatch<React.SetStateAction<string[]>>;
  languages: Language[];
}

export default function LanguageSettings({
  projectId,
  orgId,
  selectedLanguages,
  setSelectedLanguages,
  languages,
}: LanguageSettingsProps) {
  const { toast } = useToast();
  const { t } = useApp();
  const changeSelectedLanguages = useMutation(api.cms.changeSelectedLanguages);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const toggleLanguage = (code: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(code)
        ? prev.filter((lang) => lang !== code)
        : [...prev, code]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await changeSelectedLanguages({
        projectId,
        organizationId: orgId,
        selectedLanguages: selectedLanguages,
      });
      toast({
        title: t(
          "dashboard_internal.project_detail.cms.languages.languages_updated"
        ),
        description: `${selectedLanguages.length} ${
          selectedLanguages.length !== 1
            ? t(
                "dashboard_internal.project_detail.cms.languages.languages_selected_plural"
              )
            : t(
                "dashboard_internal.project_detail.cms.languages.languages_selected"
              )
        }.`,
        variant: "success",
      });
    } catch {
      toast({
        title: "Error",
        description: t(
          "dashboard_internal.project_detail.cms.languages.save_error"
        ),
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Filter languages based on search query
  const filteredLanguages = languages.filter((lang) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      lang.name.toLowerCase().includes(query) ||
      lang.code.toLowerCase().includes(query)
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-white dark:bg-sleads-slate900 rounded-xl border border-slate-200 dark:border-sleads-slate800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-sleads-blue/10 rounded-lg">
              <Globe className="w-5 h-5 text-sleads-blue" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t(
                  "dashboard_internal.project_detail.cms.languages.supported_languages"
                )}
              </h3>
              <p className="text-sm text-slate-500 dark:text-sleads-slate400">
                {t(
                  "dashboard_internal.project_detail.cms.languages.select_languages_desc"
                )}
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sleads-blue text-white text-sm font-semibold rounded-lg hover:bg-sleads-blue/90 focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("dashboard_internal.project_detail.cms.languages.saving")}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t(
                  "dashboard_internal.project_detail.cms.languages.save_changes"
                )}
              </>
            )}
          </button>
        </div>

        <div className="text-sm text-slate-600 dark:text-sleads-slate400 mb-4">
          <span className="font-semibold">{selectedLanguages.length}</span>{" "}
          {selectedLanguages.length !== 1
            ? t(
                "dashboard_internal.project_detail.cms.languages.languages_selected_plural"
              )
            : t(
                "dashboard_internal.project_detail.cms.languages.languages_selected"
              )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t(
              "dashboard_internal.project_detail.cms.languages.search_placeholder"
            )}
            className="w-full pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white bg-white dark:bg-sleads-slate900 border border-slate-300 dark:border-sleads-slate700 rounded-lg focus:border-sleads-blue focus:outline-none focus:ring-2 focus:ring-sleads-blue/20 transition-all"
          />
        </div>
      </div>

      {/* Language Grid */}
      {filteredLanguages.length === 0 ? (
        <div className="bg-white dark:bg-sleads-slate900 rounded-xl border border-slate-200 dark:border-sleads-slate800 p-12 text-center">
          <p className="text-sm text-slate-500 dark:text-sleads-slate400">
            {t("dashboard_internal.project_detail.cms.languages.no_results")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredLanguages.map((lang) => {
            const isSelected = selectedLanguages.includes(lang.code);
            return (
              <motion.button
                key={lang.code}
                onClick={() => toggleLanguage(lang.code)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
                  isSelected
                    ? "border-sleads-blue bg-blue-50 dark:bg-sleads-blue/10 shadow-md"
                    : "border-slate-200 dark:border-sleads-slate800 bg-white dark:bg-sleads-slate900 hover:border-slate-300 dark:hover:border-sleads-slate700 hover:shadow-sm"
                )}
              >
                <span className="text-2xl">{lang.flag}</span>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-semibold truncate",
                      isSelected
                        ? "text-sleads-blue dark:text-blue-400"
                        : "text-slate-900 dark:text-white"
                    )}
                  >
                    {lang.name}
                  </p>
                  <p
                    className={cn(
                      "text-xs truncate",
                      isSelected
                        ? "text-blue-700 dark:text-blue-300"
                        : "text-slate-500 dark:text-sleads-slate400"
                    )}
                  >
                    {lang.code.toUpperCase()}
                  </p>
                </div>
                {isSelected && (
                  <div className="p-1 bg-sleads-blue rounded-full">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {selectedLanguages.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-8 text-center bg-slate-50 dark:bg-sleads-slate800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-sleads-slate700"
        >
          <Globe className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700 dark:text-sleads-slate300">
            {t("dashboard_internal.project_detail.cms.languages.no_languages")}
          </p>
          <p className="text-xs text-slate-500 dark:text-sleads-slate400 mt-1">
            {t(
              "dashboard_internal.project_detail.cms.languages.no_languages_desc"
            )}
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
