"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../../../convex/_generated/dataModel";
import { Loader2, FileText, Sparkles, Plus, Trash2, X } from "lucide-react";
import { useToast } from "@/app/hooks/useToast";
import CMSFieldsTable from "./CMSFieldsTable";

interface Language {
  code: string;
  name: string;
  flag: string;
}

interface ContentTabProps {
  projectId: Id<"projects">;
  orgId: Id<"organizations">;
  cmsPages:
    | Array<{ _id: Id<"cms_pages">; name: string; slug: string }>
    | undefined;
  project: {
    selectedLanguages?: string[] | null;
  };
  languages: Language[];
}

export default function ContentTab({
  projectId,
  orgId,
  cmsPages,
  project,
  languages,
}: ContentTabProps) {
  const { toast } = useToast();
  const [selectedSplit, setSelectedSplit] = useState<string>("");
  const [selectedPage, setSelectedPage] = useState<string>("");
  const [isAddSplitModalOpen, setIsAddSplitModalOpen] = useState(false);
  const [newSplitName, setNewSplitName] = useState("");
  const [isCreatingSplit, setIsCreatingSplit] = useState(false);

  const addSplit = useMutation(api.cms.addSplit);
  const deleteSplit = useMutation(api.cms.deleteSplit);
  const deleteCMSPage = useMutation(api.cms.deleteCMSPage);

  // Get the selected page object
  const selectedPageObj = cmsPages?.find((page) => page.slug === selectedPage);

  // Get CMS fields for the selected page
  const cmsFields = useQuery(
    api.cms.getCMSPageFields,
    selectedPageObj?._id
      ? {
          pageId: selectedPageObj._id,
          organizationId: orgId,
        }
      : "skip"
  );

  // Get splits for the project
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
      // If the deleted split was selected, reset to default
      if (selectedSplit === splitId) {
        setSelectedSplit("default");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete split.",
        variant: "error",
      });
    }
  };

  const handleDeletePage = async (pageId: Id<"cms_pages">) => {
    if (
      !confirm(
        "Are you sure you want to delete this page? All fields and content for this page will be permanently deleted."
      )
    )
      return;

    try {
      await deleteCMSPage({
        pageId,
      });
      toast({
        title: "Page deleted",
        description: "Page has been deleted successfully.",
        variant: "success",
      });
      // If the deleted page was selected, reset selection
      if (selectedPageObj?._id === pageId) {
        setSelectedPage("");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete page.",
        variant: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Content Management
              </h3>
              <p className="text-sm text-gray-600">
                Select a split variant and page to manage your content
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Split Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <label className="block text-sm font-semibold text-gray-900">
                    Select Split
                  </label>
                </div>
                <button
                  onClick={() => setIsAddSplitModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Split
                </button>
              </div>
              <div className="relative">
                <select
                  value={selectedSplit}
                  onChange={(e) => setSelectedSplit(e.target.value)}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-sm font-medium text-gray-900 bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all hover:border-gray-300"
                >
                  <option value="">Choose a split variant...</option>
                  <option value="default">Default</option>
                  {splits &&
                    splits.map((split) => (
                      <option key={split._id} value={split._id}>
                        {split.split}
                      </option>
                    ))}
                </select>
                {selectedSplit &&
                  selectedSplit !== "default" &&
                  splits?.some((s) => s._id === selectedSplit) && (
                    <button
                      onClick={() =>
                        handleDeleteSplit(selectedSplit as Id<"cms_splits">)
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete split"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <span>
                  Select which split variant you want to manage (available for
                  all pages)
                </span>
              </p>
            </div>

            {/* Page Selector */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <label className="block text-sm font-semibold text-gray-900">
                  Select Page
                </label>
              </div>
              {cmsPages === undefined ? (
                <div className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-sm font-medium text-gray-500 bg-gray-50 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Loading pages...
                </div>
              ) : (
                <div className="relative">
                  <select
                    value={selectedPage}
                    onChange={(e) => setSelectedPage(e.target.value)}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 pr-12 text-sm font-medium text-gray-900 bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all hover:border-gray-300"
                  >
                    <option value="">Choose a page...</option>
                    {cmsPages && cmsPages.length > 0 ? (
                      cmsPages.map((page) => (
                        <option key={page._id} value={page.slug}>
                          {page.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        No pages available
                      </option>
                    )}
                  </select>
                  {selectedPageObj && (
                    <button
                      onClick={() => handleDeletePage(selectedPageObj._id)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete page"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
              <p className="text-xs text-gray-500">
                Select which page you want to manage content for
              </p>
            </div>
          </div>

          {/* CMS Fields Table */}
          {selectedSplit && selectedPage && selectedPageObj?._id && (
            <div className="mt-8">
              <CMSFieldsTable
                cmsFields={cmsFields}
                selectedLanguages={project.selectedLanguages || []}
                languages={languages}
                pageId={selectedPageObj._id}
                splitId={
                  selectedSplit === "default"
                    ? null
                    : (selectedSplit as Id<"cms_splits">)
                }
                organizationId={orgId}
              />
            </div>
          )}

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
                      Enter a unique name for this split variant
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

          {/* Empty State */}
          {(!selectedSplit || !selectedPage) && (
            <div className="mt-8 p-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                {!selectedSplit && !selectedPage
                  ? "Select a split and page to get started"
                  : !selectedSplit
                    ? "Select a split variant to view content"
                    : "Select a page to view content"}
              </h4>
              <p className="text-xs text-gray-500">
                {!selectedSplit && !selectedPage
                  ? "Choose a split variant and page from the dropdowns above"
                  : !selectedSplit
                    ? "Choose a split variant from the dropdown above"
                    : "Choose a page from the dropdown above"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
