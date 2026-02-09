"use client";

import React from "react";
import { motion } from "framer-motion";
import { useAction } from "convex/react";
import { api } from "../../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../../convex/_generated/dataModel";
import { X, Languages, Loader2 } from "lucide-react";
import { useToast } from "@/app/hooks/useToast";
import { useApp } from "@/app/contexts/AppContext";

interface Language {
  code: string;
  name: string;
  flag: string;
}

interface QuickTranslationModalProps {
  isOpen: boolean;
  onClose: () => void;
  fieldId: Id<"cms_fields">;
  fieldKey: string;
  sourceLang: string;
  sourceValue: string;
  targetLangs: string[];
  languages: Language[];
  pageId: Id<"cms_pages">;
  splitId?: Id<"cms_splits"> | null;
  organizationId: Id<"organizations">;
  projectId: Id<"projects">;
}

export default function QuickTranslationModal({
  isOpen,
  onClose,
  fieldId,
  fieldKey,
  sourceLang,
  sourceValue,
  targetLangs,
  languages,
  pageId,
  splitId,
  organizationId,
  projectId,
}: QuickTranslationModalProps) {
  const { toast } = useToast();
  const { t } = useApp();
  const translateCMSFieldQuick = useAction(api.cmsActions.translateCMSFieldQuick);
  const [isTranslating, setIsTranslating] = React.useState(false);

  // Calculate word count
  const wordCount = React.useMemo(() => {
    const text = sourceValue || "";
    return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
  }, [sourceValue]);

  // Calculate pricing
  const pricing = React.useMemo(() => {
    let pricePerTarget: number;
    if (wordCount > 10) {
      pricePerTarget = 0.03; // 3 cents per target if >10 words
    } else if (targetLangs.length === 1) {
      pricePerTarget = 0.02; // 2 cents total if only 1 target
    } else {
      pricePerTarget = 0.01; // 1 cent per target
    }

    const totalCost = pricePerTarget * targetLangs.length;

    return {
      pricePerTarget,
      totalCost,
      wordCount,
    };
  }, [wordCount, targetLangs.length]);

  const handleTranslate = async () => {
    setIsTranslating(true);

    try {
      const result = await translateCMSFieldQuick({
        pageId,
        splitId: splitId || null,
        fieldId,
        sourceLang,
        targetLangs,
        organizationId,
        projectId,
      });

      toast({
        title: t("dashboard_internal.project_detail.cms.fields.quick_translate.success"),
        description: t(
          "dashboard_internal.project_detail.cms.fields.quick_translate.success_desc"
        )
          .replace("{count}", result.translatedLanguages.toString())
          .replace("{cost}", result.cost.toFixed(2)),
        variant: "success",
      });

      onClose();
    } catch (error) {
      console.error("Quick translation error:", error);
      toast({
        title: t("dashboard_internal.project_detail.cms.fields.quick_translate.error"),
        description:
          error instanceof Error
            ? error.message
            : t("dashboard_internal.project_detail.cms.fields.quick_translate.error_desc"),
        variant: "error",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  if (!isOpen) return null;

  const sourceLangLabel =
    sourceLang === "default"
      ? t("dashboard_internal.project_detail.cms.fields.translate.default_value")
      : languages.find((l) => l.code === sourceLang)?.name || sourceLang;

  const sourceLangFlag =
    sourceLang === "default"
      ? "📄"
      : languages.find((l) => l.code === sourceLang)?.flag || "🌐";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-sleads-slate900 rounded-xl border border-slate-200 dark:border-sleads-slate800 shadow-xl w-full max-w-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-sleads-slate800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sleads-blue/10 dark:bg-sleads-blue/20 rounded-lg">
              <Languages className="w-5 h-5 text-sleads-blue" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t("dashboard_internal.project_detail.cms.fields.quick_translate.title")}
              </h3>
              <p className="text-sm text-slate-500 dark:text-sleads-slate400 mt-0.5">
                {fieldKey}
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

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Source */}
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-sleads-slate400 mb-2 uppercase">
              {t("dashboard_internal.project_detail.cms.fields.quick_translate.source")}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{sourceLangFlag}</span>
              <span className="text-sm font-medium text-slate-700 dark:text-sleads-slate300">
                {sourceLangLabel}
              </span>
            </div>
            <div className="text-sm text-slate-600 dark:text-sleads-slate400 bg-slate-50 dark:bg-sleads-slate800 p-3 rounded-lg border border-slate-200 dark:border-sleads-slate700 line-clamp-3">
              {sourceValue}
            </div>
          </div>

          {/* Target Languages */}
          <div>
            <div className="text-xs font-medium text-slate-500 dark:text-sleads-slate400 mb-2 uppercase">
              {t("dashboard_internal.project_detail.cms.fields.quick_translate.target")}
            </div>
            <div className="flex flex-wrap gap-2">
              {targetLangs.map((langCode) => {
                const lang = languages.find((l) => l.code === langCode);
                return (
                  <div
                    key={langCode}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-sleads-blue/10 border border-sleads-blue/20 rounded-lg"
                  >
                    <span className="text-lg">{lang?.flag || "🌐"}</span>
                    <span className="text-sm font-medium text-slate-700 dark:text-sleads-slate300">
                      {lang?.name || langCode}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing Info */}
          <div className="bg-slate-50 dark:bg-sleads-slate800/50 rounded-lg p-4 border border-slate-200 dark:border-sleads-slate700">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-sleads-slate400">
                  {t("dashboard_internal.project_detail.cms.fields.quick_translate.words")}:
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {pricing.wordCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-sleads-slate400">
                  {t("dashboard_internal.project_detail.cms.fields.quick_translate.targets")}:
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {targetLangs.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-sleads-slate400">
                  {t("dashboard_internal.project_detail.cms.fields.quick_translate.price_per_target")}:
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  €{pricing.pricePerTarget.toFixed(2)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-sleads-slate700 flex justify-between">
                <span className="font-semibold text-slate-900 dark:text-white">
                  {t("dashboard_internal.project_detail.cms.fields.quick_translate.total_cost")}:
                </span>
                <span className="font-bold text-sleads-blue text-lg">
                  €{pricing.totalCost.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-sleads-slate800">
          <button
            onClick={onClose}
            disabled={isTranslating}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-sleads-slate300 bg-slate-100 dark:bg-sleads-slate800 hover:bg-slate-200 dark:hover:bg-sleads-slate700 rounded-lg transition-colors disabled:opacity-50"
          >
            {t("dashboard_internal.project_detail.cms.content.cancel")}
          </button>
          <button
            onClick={handleTranslate}
            disabled={isTranslating}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-sleads-blue hover:bg-sleads-blue/90 rounded-lg transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTranslating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t("dashboard_internal.project_detail.cms.fields.quick_translate.translating")}
              </>
            ) : (
              <>
                <Languages className="w-4 h-4" />
                {t("dashboard_internal.project_detail.cms.fields.quick_translate.accept")}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

