"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../../convex/_generated/dataModel";
import {
  Loader2,
  ArrowLeft,
  Save,
  FileText,
  AlertCircle,
  Lock,
} from "lucide-react";
import { useToast } from "@/app/hooks/useToast";
import { useApp } from "@/app/contexts/AppContext";
import { TextEditor } from "@/components/TextEditor/TextEditor";
import Link from "next/link";

export default function FileDetailPage() {
  const params = useParams();
  const fileId = params.fileId as Id<"files">;
  const orgID = params.orgID as string;
  const projectId = params.projectId as string;
  const { toast } = useToast();
  const { t } = useApp();

  const file = useQuery(api.file.getFileForCustomer, {
    fileId,
    organizationId: orgID as Id<"organizations">,
    projectId: projectId as Id<"projects">,
  });

  // Get all files to check parent folder permissions
  const allFiles = useQuery(api.file.getFilesForCustomers, {
    organizationId: orgID as Id<"organizations">,
    projectId: projectId as Id<"projects">,
  });

  const updateFileContent = useMutation(api.file.updateFileContentForCustomer);

  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Check if user has edit permission
  // Permission inheritance: if ANY parent folder has userCanEdit, permission is granted
  const hasEditPermission = React.useMemo(() => {
    if (!file || !allFiles) return false;

    // Check direct file permission
    if (file.userCanEdit) {
      return true;
    }

    // Check permission inheritance from parent folders
    const pathParts = file.name.split("/").filter((p) => p !== "");
    const parentPaths: string[] = [];

    // Build all parent folder paths (from root to immediate parent)
    for (let i = 1; i < pathParts.length; i++) {
      const parentPath = "/" + pathParts.slice(0, i).join("/");
      parentPaths.push(parentPath);
    }

    // Check if any parent folder exists and has userCanEdit permission
    for (const parentPath of parentPaths) {
      const parentFolder = allFiles.find(
        (f) => f.name === parentPath && f.contentType === "folder"
      );

      if (parentFolder && parentFolder.userCanEdit) {
        return true; // Found a parent with permission
      }
    }

    return false; // No parent folder with edit permission found
  }, [file, allFiles]);

  // Initialize content when file loads or content changes
  useEffect(() => {
    if (file) {
      const fileContent = file.content || "";
      // Only update if it's different to avoid unnecessary re-renders
      if (fileContent !== content) {
        setContent(fileContent);
        setHasChanges(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file?._id, file?.content]); // Reset when file ID or content changes

  // Check if content has changed
  useEffect(() => {
    if (file) {
      const fileContent = file.content || "";
      // Normalize both strings for comparison (trim whitespace)
      const normalizedFileContent = fileContent.trim();
      const normalizedCurrentContent = content.trim();
      setHasChanges(normalizedFileContent !== normalizedCurrentContent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, file?.content]);

  const handleSave = async () => {
    if (!file || !hasChanges || !hasEditPermission) return;

    setIsSaving(true);
    try {
      await updateFileContent({
        fileId: file._id,
        content: content || "",
        organizationId: orgID as Id<"organizations">,
        projectId: projectId as Id<"projects">,
      });

      toast({
        title: t("dashboard_internal.documents.success") || "Success",
        description:
          t("dashboard_internal.documents.saved_success") ||
          "File content saved successfully",
        variant: "success",
      });

      // Force a small delay to ensure the query updates
      setTimeout(() => {
        setHasChanges(false);
      }, 100);
    } catch (error) {
      console.error("Error saving file:", error);
      toast({
        title: t("dashboard_internal.documents.error") || "Error",
        description:
          error instanceof Error
            ? error.message
            : t("dashboard_internal.documents.save_failed") ||
              "Failed to save file content",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (file === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (file === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-gray-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t("dashboard_internal.documents.file_not_found") || "File not found"}
        </h2>
        <Link
          href={`/dashboard/${orgID}/projects/${projectId}/files`}
          className="px-4 py-2 bg-sleads-blue dark:bg-blue-600 text-white rounded-lg hover:bg-sleads-blue/90 dark:hover:bg-blue-700 transition-colors"
        >
          {t("dashboard_internal.documents.back_to_files") || "Back to Files"}
        </Link>
      </div>
    );
  }

  if (file.contentType !== "text") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <FileText className="h-12 w-12 text-gray-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t("dashboard_internal.documents.not_text_file") ||
            "This file is not a text file"}
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          {t("dashboard_internal.documents.text_editor_only") ||
            "Text editor is only available for text files."}
        </p>
        <Link
          href={`/dashboard/${orgID}/projects/${projectId}/files`}
          className="px-4 py-2 bg-sleads-blue dark:bg-blue-600 text-white rounded-lg hover:bg-sleads-blue/90 dark:hover:bg-blue-700 transition-colors"
        >
          {t("dashboard_internal.documents.back_to_files") || "Back to Files"}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/${orgID}/projects/${projectId}/files`}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-sleads-slate800 transition-colors text-slate-600 dark:text-sleads-slate400 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {file.name.split("/").pop() || file.name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {file.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!hasEditPermission && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg">
              <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-medium text-amber-900 dark:text-amber-200">
                {t("dashboard_internal.documents.read_only") || "Read Only"}
              </span>
            </div>
          )}
          {hasEditPermission && hasChanges && (
            <span className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {t("dashboard_internal.documents.unsaved_changes") ||
                "Unsaved changes"}
            </span>
          )}
          {hasEditPermission && (
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="px-4 py-2 bg-sleads-blue dark:bg-blue-600 text-white rounded-lg hover:bg-sleads-blue/90 dark:hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {t("dashboard_internal.documents.save") || "Save"}
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="bg-white dark:bg-sleads-slate900 rounded-lg shadow-sm border border-slate-200 dark:border-sleads-slate800">
        <TextEditor
          content={content}
          onChange={setContent}
          placeholder={
            t("dashboard_internal.documents.start_typing") ||
            "Start typing your content here..."
          }
          editable={hasEditPermission}
        />
      </div>
    </div>
  );
}
