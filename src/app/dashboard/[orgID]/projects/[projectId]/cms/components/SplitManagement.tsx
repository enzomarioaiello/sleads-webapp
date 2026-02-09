"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../../convex/_generated/dataModel";
import { Sparkles, Plus, Trash2, X, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/app/hooks/useToast";
import { useApp } from "@/app/contexts/AppContext";

interface SplitManagementProps {
  projectId: Id<"projects">;
  orgId: Id<"organizations">;
}

export default function SplitManagement({
  projectId,
  orgId,
}: SplitManagementProps) {
  const { toast } = useToast();
  const { t } = useApp();
  const addSplit = useMutation(api.cms.addSplit);
  const deleteSplit = useMutation(api.cms.deleteSplit);

  const [isAddSplitModalOpen, setIsAddSplitModalOpen] = useState(false);
  const [newSplitName, setNewSplitName] = useState("");
  const [isCreatingSplit, setIsCreatingSplit] = useState(false);
  const [deletingSplitId, setDeletingSplitId] =
    useState<Id<"cms_splits"> | null>(null);

  const allSplits = useQuery(api.cms.getAllSplits, {
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
          "dashboard_internal.project_detail.cms.variants.variant_created"
        ),
        description: `"${newSplitName.trim()}" ${t("dashboard_internal.project_detail.cms.variants.variant_created").toLowerCase()}.`,
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
                "dashboard_internal.project_detail.cms.variants.variant_create_error"
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
        t("dashboard_internal.project_detail.cms.variants.delete_confirm")
      )
    )
      return;

    setDeletingSplitId(splitId);
    try {
      await deleteSplit({
        splitId,
        organizationId: orgId,
      });
      toast({
        title: t(
          "dashboard_internal.project_detail.cms.variants.variant_deleted"
        ),
        description: t(
          "dashboard_internal.project_detail.cms.variants.variant_deleted"
        ),
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : t(
                "dashboard_internal.project_detail.cms.variants.variant_delete_error"
              ),
        variant: "error",
      });
    } finally {
      setDeletingSplitId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-white dark:bg-sleads-slate900 rounded-xl border border-slate-200 dark:border-sleads-slate800 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-sleads-blue/10 rounded-lg">
              <Sparkles className="w-5 h-5 text-sleads-blue dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t(
                  "dashboard_internal.project_detail.cms.variants.content_variants"
                )}
              </h3>
              <p className="text-sm text-slate-500 dark:text-sleads-slate400">
                {t(
                  "dashboard_internal.project_detail.cms.variants.manage_variants_desc"
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAddSplitModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sleads-blue text-white text-sm font-semibold rounded-lg hover:bg-sleads-blue/90 focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:ring-offset-2 transition-all shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">
              {t("dashboard_internal.project_detail.cms.variants.new_variant")}
            </span>
            <span className="sm:hidden">
              {t("dashboard_internal.project_detail.cms.variants.new")}
            </span>
          </button>
        </div>

        {allSplits !== undefined && (
          <div className="mt-4 text-sm text-slate-600 dark:text-sleads-slate400">
            <span className="font-semibold">{allSplits.length}</span>{" "}
            {allSplits.length !== 1
              ? t(
                  "dashboard_internal.project_detail.cms.variants.variants_available_plural"
                )
              : t(
                  "dashboard_internal.project_detail.cms.variants.variants_available"
                )}
          </div>
        )}
      </div>

      {/* Splits List */}
      {allSplits === undefined ? (
        <div className="p-12 flex items-center justify-center bg-white dark:bg-sleads-slate900 rounded-xl border border-slate-200 dark:border-sleads-slate800">
          <Loader2 className="w-6 h-6 animate-spin text-sleads-blue" />
        </div>
      ) : allSplits.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-12 text-center bg-white dark:bg-sleads-slate900 rounded-xl border-2 border-dashed border-slate-200 dark:border-sleads-slate800"
        >
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-sleads-slate800 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-slate-400" />
          </div>
          <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            {t("dashboard_internal.project_detail.cms.variants.no_variants")}
          </h4>
          <p className="text-sm text-slate-500 dark:text-sleads-slate400 mb-6 max-w-md mx-auto">
            {t(
              "dashboard_internal.project_detail.cms.variants.no_variants_desc"
            )}
          </p>
          <button
            onClick={() => setIsAddSplitModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sleads-blue text-white text-sm font-semibold rounded-lg hover:bg-sleads-blue/90 transition-colors shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            {t("dashboard_internal.project_detail.cms.variants.create_first")}
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allSplits.map((split) => (
            <motion.div
              key={split._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-sleads-slate900 rounded-xl border border-slate-200 dark:border-sleads-slate800 p-5 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-sleads-blue/10 rounded-lg">
                    <Sparkles className="w-4 h-4 text-sleads-blue dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {split.split}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-sleads-slate400 mt-0.5">
                      {t(
                        "dashboard_internal.project_detail.cms.variants.created"
                      )}{" "}
                      {new Date(split.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-sleads-slate500 mt-1 font-mono">
                      ID: {split._id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteSplit(split._id)}
                  disabled={deletingSplitId === split._id}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t(
                    "dashboard_internal.project_detail.cms.variants.delete_variant"
                  )}
                >
                  {deletingSplitId === split._id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-sleads-slate400">
                <AlertCircle className="w-3 h-3" />
                <span>
                  {t(
                    "dashboard_internal.project_detail.cms.variants.available_all_pages"
                  )}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
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
                {t(
                  "dashboard_internal.project_detail.cms.variants.new_variant_title"
                )}
              </h3>
              <button
                onClick={() => {
                  setIsAddSplitModalOpen(false);
                  setNewSplitName("");
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-sleads-slate300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSplit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-sleads-slate300 mb-2">
                  {t(
                    "dashboard_internal.project_detail.cms.variants.variant_name"
                  )}
                </label>
                <input
                  type="text"
                  value={newSplitName}
                  onChange={(e) => setNewSplitName(e.target.value)}
                  placeholder={t(
                    "dashboard_internal.project_detail.cms.variants.variant_name_placeholder"
                  )}
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 dark:border-sleads-slate800 bg-white dark:bg-sleads-slate900 text-slate-900 dark:text-white focus:border-sleads-blue focus:outline-none focus:ring-2 focus:ring-sleads-blue/20 transition-all"
                  autoFocus
                  required
                />
                <p className="text-xs text-slate-500 dark:text-sleads-slate400 mt-2">
                  {t(
                    "dashboard_internal.project_detail.cms.variants.variant_desc"
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
                        "dashboard_internal.project_detail.cms.variants.creating"
                      )}
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      {t(
                        "dashboard_internal.project_detail.cms.variants.create_variant"
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
                  {t("dashboard_internal.project_detail.cms.variants.cancel")}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
