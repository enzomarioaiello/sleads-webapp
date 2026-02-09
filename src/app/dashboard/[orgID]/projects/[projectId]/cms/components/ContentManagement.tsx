"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../../convex/_generated/dataModel";
import {
  FileText,
  Sparkles,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useToast } from "@/app/hooks/useToast";
import { useApp } from "@/app/contexts/AppContext";
import CMSFieldsTable from "./CMSFieldsTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/app/utils/cn";

interface Language {
  code: string;
  name: string;
  flag: string;
}

interface ContentManagementProps {
  projectId: Id<"projects">;
  orgId: Id<"organizations">;
  cmsPages:
    | Array<{ _id: Id<"cms_pages">; name: string; slug: string }>
    | undefined;
  selectedLanguages: string[];
  languages: Language[];
}

export default function ContentManagement({
  projectId,
  orgId,
  cmsPages,
  selectedLanguages,
  languages,
}: ContentManagementProps) {
  const { toast } = useToast();
  const { t } = useApp();
  const [selectedPage, setSelectedPage] = useState<string>("");
  const [selectedSplit, setSelectedSplit] = useState<string>("");
  const [isAddSplitModalOpen, setIsAddSplitModalOpen] = useState(false);
  const [newSplitName, setNewSplitName] = useState("");
  const [isCreatingSplit, setIsCreatingSplit] = useState(false);

  const addSplit = useMutation(api.cms.addSplit);
  const deleteSplit = useMutation(api.cms.deleteSplit);

  const selectedPageObj = cmsPages?.find((page) => page.slug === selectedPage);

  const cmsFields = useQuery(
    api.cms.getCMSPageFields,
    selectedPageObj?._id
      ? {
          pageId: selectedPageObj._id,
          organizationId: orgId,
        }
      : "skip"
  );

  const splits = useQuery(api.cms.getSplits, {
    projectId,
    organizationId: orgId,
  });

  const handleAddSplit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSplitName.trim()) return;

    setIsCreatingSplit(true);
    try {
      await addSplit({
        projectId,
        organizationId: orgId,
        splitName: newSplitName.trim(),
      });
      toast({
        title: t(
          "dashboard_internal.project_detail.cms.content.variant_created"
        ),
        description: `"${newSplitName.trim()}" ${t("dashboard_internal.project_detail.cms.content.variant_created").toLowerCase()}.`,
        variant: "success",
      });
      setNewSplitName("");
      setIsAddSplitModalOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : t(
                "dashboard_internal.project_detail.cms.content.variant_create_error"
              ),
        variant: "error",
      });
    } finally {
      setIsCreatingSplit(false);
    }
  };

  const handleDeleteSplit = async (splitId: Id<"cms_splits">) => {
    if (
      !confirm(
        t("dashboard_internal.project_detail.cms.content.delete_confirm")
      )
    )
      return;

    try {
      await deleteSplit({
        splitId,
        organizationId: orgId,
      });
      toast({
        title: t(
          "dashboard_internal.project_detail.cms.content.variant_deleted"
        ),
        description: t(
          "dashboard_internal.project_detail.cms.content.variant_deleted"
        ),
        variant: "success",
      });
      if (selectedSplit === splitId) {
        setSelectedSplit("");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : t(
                "dashboard_internal.project_detail.cms.content.variant_delete_error"
              ),
        variant: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Page Selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-sleads-slate900 rounded-xl border border-slate-200 dark:border-sleads-slate800 p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <FileText className="w-4 h-4 text-sleads-blue" />
              {t("dashboard_internal.project_detail.cms.content.select_page")}
            </label>
            <div className="w-6" />
          </div>
          {cmsPages === undefined ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : (
            <Select
              value={selectedPage || undefined}
              onValueChange={(value) => {
                setSelectedPage(value);
                setSelectedSplit(""); // Reset split when page changes
              }}
            >
              <SelectTrigger className="w-full h-11 border-2 border-slate-200 dark:border-sleads-slate800 bg-white dark:bg-sleads-slate900 text-slate-900 dark:text-white text-sm font-medium focus:border-sleads-blue focus:ring-2 focus:ring-sleads-blue/20">
                <SelectValue
                  placeholder={t(
                    "dashboard_internal.project_detail.cms.content.choose_page"
                  )}
                />
              </SelectTrigger>
              <SelectContent>
                {cmsPages && cmsPages.length > 0 ? (
                  cmsPages.map((page) => (
                    <SelectItem key={page._id} value={page.slug}>
                      {page.name}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-1.5 text-sm text-slate-500 dark:text-sleads-slate400">
                    {t(
                      "dashboard_internal.project_detail.cms.content.no_pages"
                    )}
                  </div>
                )}
              </SelectContent>
            </Select>
          )}
        </motion.div>

        {/* Split Selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-sleads-slate900 rounded-xl border border-slate-200 dark:border-sleads-slate800 p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <Sparkles className="w-4 h-4 text-sleads-blue" />
              {t(
                "dashboard_internal.project_detail.cms.content.select_variant"
              )}
            </label>
            <button
              onClick={() => setIsAddSplitModalOpen(true)}
              className="flex items-center justify-center p-1.5 text-sleads-blue hover:bg-blue-50 dark:hover:bg-sleads-blue/10 rounded-lg transition-colors"
              title={t(
                "dashboard_internal.project_detail.cms.content.add_variant"
              )}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Select
              value={selectedSplit === "" ? "__default__" : selectedSplit || undefined}
              onValueChange={(value) => {
                // Convert "__default__" back to empty string to maintain existing functionality
                setSelectedSplit(value === "__default__" ? "" : value);
              }}
            >
              <SelectTrigger className="w-full h-11 border-2 border-slate-200 dark:border-sleads-slate800 bg-white dark:bg-sleads-slate900 text-slate-900 dark:text-white text-sm font-medium focus:border-sleads-blue focus:ring-2 focus:ring-sleads-blue/20 pr-10">
                <SelectValue
                  placeholder={t(
                    "dashboard_internal.project_detail.cms.content.default_variant"
                  )}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__default__">
                  {t(
                    "dashboard_internal.project_detail.cms.content.default_variant"
                  )}
                </SelectItem>
                {splits &&
                  splits.map((split) => (
                    <SelectItem key={split._id} value={split._id}>
                      {split.split}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {selectedSplit &&
              selectedSplit !== "" &&
              splits?.some((s) => s._id === selectedSplit) && (
                <button
                  onClick={() =>
                    handleDeleteSplit(selectedSplit as Id<"cms_splits">)
                  }
                  className="absolute right-10 top-1/2 -translate-y-1/2 p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors z-10"
                  title={t(
                    "dashboard_internal.project_detail.cms.content.delete_variant"
                  )}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
          </div>
        </motion.div>
      </div>

      {/* Fields Table */}
      {selectedPage && selectedPageObj?._id && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <CMSFieldsTable
            cmsFields={cmsFields}
            selectedLanguages={selectedLanguages}
            languages={languages}
            pageId={selectedPageObj._id}
            splitId={
              selectedSplit && selectedSplit !== ""
                ? (selectedSplit as Id<"cms_splits">)
                : null
            }
            organizationId={orgId}
          />
        </motion.div>
      )}

      {/* Empty State */}
      {(!selectedPage || !selectedPageObj?._id) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-sleads-slate900 rounded-xl border-2 border-dashed border-slate-200 dark:border-sleads-slate800"
        >
          <div className="p-4 bg-slate-100 dark:bg-sleads-slate800 rounded-full mb-4">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            {!selectedPage
              ? t(
                  "dashboard_internal.project_detail.cms.content.select_page_to_start"
                )
              : t("dashboard_internal.project_detail.cms.content.loading_page")}
          </h4>
          <p className="text-sm text-slate-500 dark:text-sleads-slate400 text-center max-w-md">
            {!selectedPage
              ? t(
                  "dashboard_internal.project_detail.cms.content.select_page_desc"
                )
              : t("dashboard_internal.project_detail.cms.content.loading_page")}
          </p>
        </motion.div>
      )}

      {/* Add Split Modal */}
      {isAddSplitModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-sleads-slate900 rounded-xl shadow-xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t("dashboard_internal.project_detail.cms.content.new_variant")}
              </h3>
              <button
                onClick={() => {
                  setIsAddSplitModalOpen(false);
                  setNewSplitName("");
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-sleads-slate300 transition-colors"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAddSplit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-sleads-slate300 mb-2">
                  {t(
                    "dashboard_internal.project_detail.cms.content.variant_name"
                  )}
                </label>
                <input
                  type="text"
                  value={newSplitName}
                  onChange={(e) => setNewSplitName(e.target.value)}
                  placeholder={t(
                    "dashboard_internal.project_detail.cms.content.variant_name_placeholder"
                  )}
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 dark:border-sleads-slate800 bg-white dark:bg-sleads-slate900 text-slate-900 dark:text-white focus:border-sleads-blue focus:outline-none focus:ring-2 focus:ring-sleads-blue/20 transition-all"
                  autoFocus
                  required
                />
                <p className="text-xs text-slate-500 dark:text-sleads-slate400 mt-2">
                  {t(
                    "dashboard_internal.project_detail.cms.content.variant_desc"
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!newSplitName.trim() || isCreatingSplit}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-sleads-blue text-white text-sm font-semibold rounded-lg hover:bg-sleads-blue/90 focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingSplit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t(
                        "dashboard_internal.project_detail.cms.content.creating"
                      )}
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      {t(
                        "dashboard_internal.project_detail.cms.content.create_variant"
                      )}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddSplitModalOpen(false);
                    setNewSplitName("");
                  }}
                  className="px-4 py-3 text-sm font-medium text-slate-700 dark:text-sleads-slate300 bg-slate-100 dark:bg-sleads-slate800 hover:bg-slate-200 dark:hover:bg-sleads-slate700 rounded-lg transition-colors"
                >
                  {t("dashboard_internal.project_detail.cms.content.cancel")}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
