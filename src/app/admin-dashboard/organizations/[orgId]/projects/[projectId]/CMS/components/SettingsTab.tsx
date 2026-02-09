"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../../../convex/_generated/dataModel";
import { Globe, Check, Sparkles, Plus, Trash2, X, Loader2 } from "lucide-react";
import { useToast } from "@/app/hooks/useToast";
import { cn } from "@/app/utils/cn";

interface Language {
  code: string;
  name: string;
  flag: string;
}

interface SettingsTabProps {
  projectId: Id<"projects">;
  orgId: Id<"organizations">;
  project: {
    selectedLanguages?: string[] | null;
  };
  selectedLanguages: string[];
  setSelectedLanguages: React.Dispatch<React.SetStateAction<string[]>>;
  languages: Language[];
}

export default function SettingsTab({
  projectId,
  orgId,
  project,
  selectedLanguages,
  setSelectedLanguages,
  languages,
}: SettingsTabProps) {
  const { toast } = useToast();
  const changeSelectedLanguages = useMutation(api.cms.changeSelectedLanguages);
  const addSplit = useMutation(api.cms.addSplit);
  const deleteSplit = useMutation(api.cms.deleteSplit);

  const [isAddSplitModalOpen, setIsAddSplitModalOpen] = useState(false);
  const [newSplitName, setNewSplitName] = useState("");
  const [isCreatingSplit, setIsCreatingSplit] = useState(false);
  const [deletingSplitId, setDeletingSplitId] =
    useState<Id<"cms_splits"> | null>(null);

  // Get all splits for the project
  const allSplits = useQuery(api.cms.getAllSplits, {
    projectId,
    organizationId: orgId,
  });

  const toggleLanguage = (code: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(code)
        ? prev.filter((lang) => lang !== code)
        : [...prev, code]
    );
  };

  const handleSaveLanguages = async () => {
    try {
      await changeSelectedLanguages({
        projectId,
        organizationId: orgId,
        selectedLanguages: selectedLanguages,
      });
      toast({
        title: "Settings saved",
        description: `Language settings updated for ${selectedLanguages.length} language${selectedLanguages.length !== 1 ? "s" : ""}.`,
        variant: "success",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to save language settings.",
        variant: "error",
      });
    }
  };

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
        title: "Split created",
        description: `Split "${newSplitName.trim()}" has been created successfully.`,
        variant: "success",
      });
      setNewSplitName("");
      setIsAddSplitModalOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create split.",
        variant: "error",
      });
    } finally {
      setIsCreatingSplit(false);
    }
  };

  const handleDeleteSplit = async (splitId: Id<"cms_splits">) => {
    if (
      !confirm(
        "Are you sure you want to delete this split? All field values for this split will be deleted."
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
        title: "Split deleted",
        description: "Split has been deleted successfully.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete split.",
        variant: "error",
      });
    } finally {
      setDeletingSplitId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Language Settings */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Language Settings
            </h3>
            <p className="text-sm text-gray-500">
              Select which languages your CMS should support
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              {selectedLanguages.length} language
              {selectedLanguages.length !== 1 ? "s" : ""} selected
            </p>
            {selectedLanguages.length > 0 && (
              <button
                onClick={() => setSelectedLanguages([])}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {languages.map((lang) => {
              const isSelected = selectedLanguages.includes(lang.code);
              return (
                <button
                  key={lang.code}
                  onClick={() => toggleLanguage(lang.code)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left",
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                  )}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium truncate",
                        isSelected ? "text-blue-900" : "text-gray-900"
                      )}
                    >
                      {lang.name}
                    </p>
                    <p
                      className={cn(
                        "text-xs truncate",
                        isSelected ? "text-blue-700" : "text-gray-500"
                      )}
                    >
                      {lang.code.toUpperCase()}
                    </p>
                  </div>
                  {isSelected && (
                    <Check className="w-5 h-5 text-blue-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleSaveLanguages}
              disabled={
                selectedLanguages.length === 0 ||
                JSON.stringify(selectedLanguages.sort()) ===
                  JSON.stringify((project?.selectedLanguages || []).sort())
              }
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              Save Language Settings
            </button>
          </div>
        </div>
      </div>

      {/* Split Management */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Split Management
            </h3>
            <p className="text-sm text-gray-500">
              Create and manage split variants for A/B testing and content
              variations
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              {allSplits
                ? `${allSplits.length} split${allSplits.length !== 1 ? "s" : ""} for this project`
                : "Loading splits..."}
            </p>
            <button
              onClick={() => setIsAddSplitModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Split
            </button>
          </div>

          {/* Splits List */}
          {allSplits === undefined ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : allSplits.length === 0 ? (
            <div className="p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center">
              <Sparkles className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700 mb-1">
                No splits created yet
              </p>
              <p className="text-xs text-gray-500">
                Create your first split variant to get started. Splits can be
                used across all pages in this project.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {allSplits.map((split) => (
                <div
                  key={split._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {split.split}
                      </p>
                      <p className="text-xs text-gray-500">
                        Created {new Date(split.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteSplit(split._id)}
                    disabled={deletingSplitId === split._id}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete split"
                  >
                    {deletingSplitId === split._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Split Modal */}
      {isAddSplitModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Create New Split
              </h3>
              <button
                onClick={() => {
                  setIsAddSplitModalOpen(false);
                  setNewSplitName("");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSplit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Split Name
                </label>
                <input
                  type="text"
                  value={newSplitName}
                  onChange={(e) => setNewSplitName(e.target.value)}
                  placeholder="e.g., A/B Test Variant, Mobile Version"
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-2.5 text-sm text-gray-900 bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all"
                  autoFocus
                  required
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  Enter a unique name for this split variant. This split will be
                  available for all pages in this project.
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!newSplitName.trim() || isCreatingSplit}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingSplit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Split
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddSplitModalOpen(false);
                    setNewSplitName("");
                  }}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
