"use client";

import React, { useState, useMemo, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useMutation, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Doc } from "../../../convex/_generated/dataModel";
import {
  Folder,
  File,
  FileText,
  Link as LinkIcon,
  ChevronRight,
  ChevronLeft,
  Grid3x3,
  List,
  Download,
  ExternalLink,
  Loader2,
  Plus,
  X,
  Lock,
  Trash2,
} from "lucide-react";
import { useApp } from "@/app/contexts/AppContext";
import { useToast } from "@/app/hooks/useToast";
import Link from "next/link";
import { useRouter } from "next/navigation";

type FileNode = {
  name: string;
  fullPath: string;
  file?: Doc<"files">;
  children: Map<string, FileNode>;
  isFolder: boolean;
};

type ViewMode = "grid" | "list";
type ContentType = "file" | "url" | "text" | "folder";

interface FileExplorerProps {
  files: Doc<"files">[] | undefined;
  projectId?: string;
  organizationId: string;
  onFileClick?: (file: Doc<"files">) => void;
  basePath?: string;
}

export function FileExplorer({
  files,
  projectId,
  organizationId,
  onFileClick,
  basePath = "/dashboard",
}: FileExplorerProps) {
  const { t } = useApp();
  const { toast } = useToast();
  const [currentPath, setCurrentPath] = useState<string[]>(["/"]);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const router = useRouter();
  // File creation state
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<ContentType | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [lockedBasePath, setLockedBasePath] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formFile, setFormFile] = useState<File | null>(null);

  // Mutations
  const createFileForCustomer = useMutation(api.file.createFileForCustomer);
  const deleteFileForCustomer = useMutation(api.file.deleteFileForCustomer);
  const deleteFolderStructureForCustomer = useMutation(
    api.file.deleteFolderStructureForCustomer
  );
  const generateUploadUrl = useMutation(api.file.generateUploadUrl);
  const getFileUrl = useAction(api.file.getFileUrl);

  // Build file tree from flat file list
  const fileTree = useMemo(() => {
    const root: FileNode = {
      name: "",
      fullPath: "/",
      children: new Map(),
      isFolder: true,
    };

    if (!files) return root;

    files.forEach((file) => {
      const pathParts = file.name.split("/").filter((p: string) => p);
      let current = root;

      if (file.contentType === "folder") {
        pathParts.forEach((part: string, index: number) => {
          const pathSoFar = "/" + pathParts.slice(0, index + 1).join("/");
          if (!current.children.has(part)) {
            current.children.set(part, {
              name: part,
              fullPath: pathSoFar,
              children: new Map(),
              isFolder: true,
            });
          }
          current = current.children.get(part)!;
        });
        current.file = file;
      } else {
        pathParts.slice(0, -1).forEach((part: string, index: number) => {
          const pathSoFar = "/" + pathParts.slice(0, index + 1).join("/");
          if (!current.children.has(part)) {
            current.children.set(part, {
              name: part,
              fullPath: pathSoFar,
              children: new Map(),
              isFolder: true,
            });
          }
          current = current.children.get(part)!;
        });

        const fileName = pathParts[pathParts.length - 1];
        const filePath = "/" + pathParts.join("/");
        current.children.set(fileName, {
          name: fileName,
          fullPath: filePath,
          file,
          children: new Map(),
          isFolder: false,
        });
      }
    });

    return root;
  }, [files]);

  // Get current directory node based on path
  const getCurrentNode = (): FileNode => {
    let current = fileTree;
    for (const segment of currentPath.slice(1)) {
      if (current.children.has(segment)) {
        current = current.children.get(segment)!;
      } else {
        return fileTree;
      }
    }
    return current;
  };

  const currentNode = getCurrentNode();
  const currentItems = Array.from(currentNode.children.values()).sort(
    (a, b) => {
      if (a.isFolder !== b.isFolder) {
        return a.isFolder ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    }
  );

  const navigateToFolder = (folderName: string) => {
    setCurrentPath([...currentPath, folderName]);
  };

  const navigateUp = () => {
    if (currentPath.length > 1) {
      setCurrentPath(currentPath.slice(0, -1));
    }
  };

  const navigateToPath = (index: number) => {
    if (index === 0) {
      setCurrentPath(["/"]);
    } else {
      setCurrentPath(currentPath.slice(0, index + 1));
    }
  };

  const getCurrentFolderPath = (): string => {
    if (currentPath.length === 1 && currentPath[0] === "/") {
      return "/";
    }
    return currentPath.join("/");
  };

  // Check if user has edit permissions for the current folder
  // Permission inheritance: if ANY parent folder has userCanEdit, permission is granted
  const hasEditPermission = useMemo(() => {
    if (!files || !projectId) return false;

    // Get current folder path
    const currentPathStr =
      currentPath.length === 1 && currentPath[0] === "/"
        ? "/"
        : currentPath.join("/");

    const pathParts = currentPathStr.split("/").filter((p) => p !== "");
    const parentPaths: string[] = [];

    // Build all parent folder paths (from root to current folder)
    for (let i = 1; i <= pathParts.length; i++) {
      const parentPath = "/" + pathParts.slice(0, i).join("/");
      parentPaths.push(parentPath);
    }

    // Check if any parent folder exists and has userCanEdit permission
    for (const parentPath of parentPaths) {
      const parentFolder = files.find(
        (f) => f.name === parentPath && f.contentType === "folder"
      );

      if (parentFolder && parentFolder.userCanEdit) {
        return true; // Found a parent with permission
      }
    }

    return false; // No parent folder with edit permission found
  }, [files, currentPath, projectId]);

  // Check if a file/folder has delete permission
  // Permission inheritance: if ANY parent folder has userCanDelete, permission is granted
  const hasDeletePermission = useCallback(
    (filePath: string, file?: Doc<"files">) => {
      if (!files) return false;

      // Check direct file permission
      if (file && file.userCanDelete) {
        return true;
      }

      const pathParts = filePath.split("/").filter((p) => p !== "");
      const parentPaths: string[] = [];

      // Build all parent folder paths (from root to immediate parent)
      for (let i = 1; i < pathParts.length; i++) {
        const parentPath = "/" + pathParts.slice(0, i).join("/");
        parentPaths.push(parentPath);
      }

      // Check if any parent folder exists and has userCanDelete permission
      for (const parentPath of parentPaths) {
        const parentFolder = files.find(
          (f) => f.name === parentPath && f.contentType === "folder"
        );

        if (parentFolder && parentFolder.userCanDelete) {
          return true; // Found a parent with permission
        }
      }

      return false; // No parent folder with delete permission found
    },
    [files]
  );

  const handleAddClick = (type: ContentType) => {
    setCreateType(type);
    const basePath = getCurrentFolderPath();
    setLockedBasePath(basePath);
    setFormName("");
    setFormContent("");
    setFormUrl("");
    setFormFile(null);
    setShowAddMenu(false);
    setShowCreateModal(true);
  };

  const handleCreate = async () => {
    if (!createType || !projectId || !lockedBasePath) return;

    setIsCreating(true);
    try {
      const name = formName.trim();
      if (!name) {
        toast({
          title: t("dashboard_internal.documents.error") || "Error",
          description:
            t("dashboard_internal.documents.enter_name") ||
            "Please enter a name for the file/folder",
          variant: "error",
        });
        setIsCreating(false);
        return;
      }

      // Clean the name (remove any leading/trailing slashes)
      const cleanName = name.replace(/^\/+|\/+$/g, "");
      if (!cleanName) {
        toast({
          title: t("dashboard_internal.documents.error") || "Error",
          description:
            t("dashboard_internal.documents.enter_name") ||
            "Please enter a name for the file/folder",
          variant: "error",
        });
        setIsCreating(false);
        return;
      }

      // Build final path: current folder path + name
      const basePath = lockedBasePath === "/" ? "" : lockedBasePath;
      const finalName = `${basePath}/${cleanName}`;

      let url: string | undefined;
      let content: string | undefined;

      if (createType === "file") {
        if (!formFile) {
          toast({
            title: t("dashboard_internal.documents.error") || "Error",
            description:
              t("dashboard_internal.documents.select_file") ||
              "Please select a file",
            variant: "error",
          });
          setIsCreating(false);
          return;
        }

        // Upload file
        const uploadUrl = await generateUploadUrl();
        const uploadResult = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": formFile.type },
          body: formFile,
        });

        if (!uploadResult.ok) {
          throw new Error("Failed to upload file");
        }

        const result = await uploadResult.json();
        const uploadedStorageId = result.storageId;

        // Get the download URL for the uploaded file
        const fileUrl = await getFileUrl({ fileId: uploadedStorageId });
        url = fileUrl || undefined;
      } else if (createType === "url") {
        if (!formUrl.trim()) {
          toast({
            title: t("dashboard_internal.documents.error") || "Error",
            description:
              t("dashboard_internal.documents.url_required") ||
              "URL is required",
            variant: "error",
          });
          setIsCreating(false);
          return;
        }
        url = formUrl.trim();
      } else if (createType === "text") {
        content = formContent || "";
      }

      // Always set permissions to true for customer-created files
      await createFileForCustomer({
        name: finalName,
        contentType: createType,
        content: content,
        url: url,
        storageId: undefined,
        projectId: projectId as Id<"projects">,
        organizationId: organizationId as Id<"organizations">,
        userCanEdit: true,
        userCanDelete: true,
      });

      toast({
        title: t("dashboard_internal.documents.success") || "Success",
        description:
          t("dashboard_internal.documents.created_success") ||
          `${createType === "folder" ? "Folder" : "File"} created successfully`,
        variant: "success",
      });

      setShowCreateModal(false);
      setCreateType(null);
      setFormName("");
      setFormContent("");
      setFormUrl("");
      setFormFile(null);
      setLockedBasePath(null);
    } catch (error) {
      console.error("Error creating file:", error);
      toast({
        title: t("dashboard_internal.documents.error") || "Error",
        description:
          error instanceof Error
            ? error.message
            : t("dashboard_internal.documents.create_failed") ||
              "Failed to create file",
        variant: "error",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getFileIcon = (file: Doc<"files">) => {
    switch (file.contentType) {
      case "folder":
        return Folder;
      case "url":
        return LinkIcon;
      case "text":
        return FileText;
      default:
        return File;
    }
  };

  const getFileIconColor = (file: Doc<"files">) => {
    switch (file.contentType) {
      case "folder":
        return "text-blue-500 dark:text-blue-400";
      case "url":
        return "text-purple-500 dark:text-purple-400";
      case "text":
        return "text-green-500 dark:text-green-400";
      default:
        return "text-slate-400 dark:text-sleads-slate500";
    }
  };

  // Delete state
  const [deletingItems, setDeletingItems] = useState<Set<string>>(new Set());
  const [shakingItems, setShakingItems] = useState<Set<string>>(new Set());
  const longPressTimer = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const justActivatedDeleteMode = useRef<boolean>(false);

  const handleItemClick = (item: FileNode) => {
    // If delete mode was just activated by long-press, ignore this click
    if (justActivatedDeleteMode.current) {
      justActivatedDeleteMode.current = false;
      return;
    }

    // In delete mode, clicking an item deletes it (if it has permission)
    // But only if clicking the delete button, not the item itself
    if (isDeleteModeActive) {
      // Don't delete on item click - only on delete button click
      return;
    }

    if (item.isFolder) {
      navigateToFolder(item.name);
    } else if (item.file) {
      // If it's a text file and we're in a project, navigate to the file detail page
      if (item.file.contentType === "text" && projectId && organizationId) {
        router.push(
          `${basePath}/${organizationId}/projects/${projectId}/files/${item.file._id}`
        );
        return;
      }
      // Otherwise, use the onFileClick callback if provided
      if (onFileClick) {
        onFileClick(item.file);
      }
    }
  };

  const handleItemLongPress = (item: FileNode) => {
    // Check if this is a protected folder
    if (isProtectedFolder(item.fullPath)) {
      return;
    }

    // Check if user has delete permission
    if (!hasDeletePermission(item.fullPath, item.file)) {
      return;
    }

    // Mark that we just activated delete mode to prevent immediate click
    justActivatedDeleteMode.current = true;

    // Start shaking animation
    setShakingItems((prev) => new Set(prev).add(item.fullPath));

    // Clear the flag after a short delay to allow normal clicks after delete mode is active
    setTimeout(() => {
      justActivatedDeleteMode.current = false;
    }, 300);
  };

  const handleItemLongPressEnd = (item: FileNode) => {
    // Only clear timer if item is not already shaking
    // Once shaking starts, we want to keep it active
    if (!shakingItems.has(item.fullPath)) {
      const timer = longPressTimer.current.get(item.fullPath);
      if (timer) {
        clearTimeout(timer);
        longPressTimer.current.delete(item.fullPath);
      }
    }
  };

  const handleExitDeleteMode = () => {
    // Clear all shaking items
    setShakingItems(new Set());
    // Clear all timers
    longPressTimer.current.forEach((timer) => clearTimeout(timer));
    longPressTimer.current.clear();
  };

  // Check if delete mode is active (any item is shaking)
  const isDeleteModeActive = shakingItems.size > 0;

  // Check if an item is the protected /home/public folder
  const isProtectedFolder = (filePath: string) => {
    return filePath === "/home/public";
  };

  // Check if there are any deletable items (excluding protected folders)
  const hasDeletableItems = useMemo(() => {
    if (!currentItems.length) return false;

    return currentItems.some((item) => {
      // Skip protected folders
      if (isProtectedFolder(item.fullPath)) {
        return false;
      }
      // Check if item has delete permission
      return hasDeletePermission(item.fullPath, item.file);
    });
  }, [currentItems, hasDeletePermission]);

  const handleDeleteClick = async (item: FileNode) => {
    if (!projectId) return;

    // Prevent deletion of protected folders
    if (isProtectedFolder(item.fullPath)) {
      toast({
        title: t("dashboard_internal.documents.error") || "Error",
        description:
          t("dashboard_internal.documents.cannot_delete_protected") ||
          "This folder cannot be deleted",
        variant: "error",
      });
      return;
    }

    const isFolder = item.isFolder;

    if (
      !confirm(
        `Are you sure you want to delete ${isFolder ? "this folder and all its contents" : "this file"}? This action cannot be undone.`
      )
    ) {
      // Don't exit delete mode on cancel - user can still delete other items
      return;
    }

    setDeletingItems((prev) => new Set(prev).add(item.fullPath));

    try {
      if (isFolder) {
        await deleteFolderStructureForCustomer({
          folderPath: item.fullPath,
          projectId: projectId as Id<"projects">,
          organizationId: organizationId as Id<"organizations">,
        });
      } else if (item.file) {
        await deleteFileForCustomer({
          fileId: item.file._id,
          projectId: projectId as Id<"projects">,
          organizationId: organizationId as Id<"organizations">,
        });
      }

      toast({
        title: t("dashboard_internal.documents.success") || "Success",
        description:
          t("dashboard_internal.documents.deleted_success") ||
          `${isFolder ? "Folder" : "File"} deleted successfully`,
        variant: "success",
      });

      // Don't exit delete mode - user can delete more items
    } catch (error) {
      console.error("Error deleting:", error);
      toast({
        title: t("dashboard_internal.documents.error") || "Error",
        description:
          error instanceof Error
            ? error.message
            : t("dashboard_internal.documents.delete_failed") ||
              "Failed to delete",
        variant: "error",
      });
    } finally {
      setDeletingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(item.fullPath);
        return newSet;
      });
    }
  };

  const getFileLinkUrl = (file: Doc<"files">) => {
    if (file.contentType === "text") {
      if (projectId) {
        return `${basePath}/${organizationId}/projects/${projectId}/files/${file._id}`;
      }
      return `${basePath}/${organizationId}/documents/${file._id}`;
    }
    if (file.contentType === "url" && file.url) {
      return file.url;
    }
    if (file.contentType === "file" && file.url) {
      return file.url;
    }
    return null;
  };

  if (files === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400 dark:text-sleads-slate500" />
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header - Mobile: Compact card, Desktop: Flipped layout */}
      <div className="sm:flex sm:flex-col sm:gap-4">
        {/* Desktop: Add button row (top) */}
        <div className="hidden sm:flex sm:items-center sm:gap-2 sm:justify-end">
          {projectId ? (
            hasEditPermission ? (
              <div className="relative">
                <button
                  onClick={() => setShowAddMenu(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-sleads-blue dark:bg-blue-600 text-white rounded-lg hover:bg-sleads-blue/90 dark:hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  {t("dashboard_internal.documents.add") || "Add"}
                </button>

                {showAddMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowAddMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 rounded-xl shadow-lg z-20 overflow-hidden">
                      <div className="py-1">
                        <button
                          onClick={() => handleAddClick("folder")}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-sleads-slate300 hover:bg-slate-50 dark:hover:bg-sleads-slate800 flex items-center gap-2 transition-colors"
                        >
                          <Folder className="w-4 h-4" />
                          {t("dashboard_internal.documents.folder") || "Folder"}
                        </button>
                        <button
                          onClick={() => handleAddClick("file")}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-sleads-slate300 hover:bg-slate-50 dark:hover:bg-sleads-slate800 flex items-center gap-2 transition-colors"
                        >
                          <File className="w-4 h-4" />
                          {t("dashboard_internal.documents.file_upload") ||
                            "File Upload"}
                        </button>
                        <button
                          onClick={() => handleAddClick("url")}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-sleads-slate300 hover:bg-slate-50 dark:hover:bg-sleads-slate800 flex items-center gap-2 transition-colors"
                        >
                          <LinkIcon className="w-4 h-4" />
                          {t("dashboard_internal.documents.url_link") ||
                            "URL Link"}
                        </button>
                        <button
                          onClick={() => handleAddClick("text")}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-sleads-slate300 hover:bg-slate-50 dark:hover:bg-sleads-slate800 flex items-center gap-2 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          {t("dashboard_internal.documents.text_file") ||
                            "Text File"}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg shadow-sm">
                <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-900/30">
                  <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                    {t("dashboard_internal.documents.read_only") || "Read Only"}
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300/80">
                    {t("dashboard_internal.documents.read_only_desc") ||
                      "You don't have permission to create files here"}
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="px-4 py-2 bg-slate-100 dark:bg-sleads-slate800 border border-slate-200 dark:border-sleads-slate700 rounded-lg">
              <p className="text-xs sm:text-sm text-slate-600 dark:text-sleads-slate400">
                {t("dashboard_internal.documents.project_only") ||
                  "Files can only be added from a project"}
              </p>
            </div>
          )}
        </div>

        {/* Mobile: Unified card, Desktop: Breadcrumb and View Toggle */}
        <div className="bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 rounded-xl shadow-sm overflow-hidden sm:overflow-visible sm:bg-transparent sm:border-0 sm:shadow-none sm:rounded-none">
          {/* Top row: Breadcrumb and View Toggle */}
          <div className="flex items-center justify-between gap-2 px-3 sm:px-0 py-2.5 sm:py-0 border-b sm:border-b-0 border-slate-200 dark:border-sleads-slate800">
            {/* Breadcrumb */}
            <nav
              className="flex items-center gap-1.5 min-w-0 flex-1 overflow-x-auto scrollbar-hide sm:overflow-visible sm:flex-wrap bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 rounded-xl px-4 py-2 shadow-sm sm:shadow-sm"
              aria-label="Breadcrumb"
            >
              {currentPath.length > 1 && (
                <button
                  onClick={navigateUp}
                  className="shrink-0 p-1.5 rounded-md sm:rounded-lg hover:bg-slate-100 dark:hover:bg-sleads-slate800 transition-colors text-slate-600 dark:text-sleads-slate400 hover:text-slate-900 dark:hover:text-white"
                  aria-label={t("dashboard_internal.documents.back") || "Back"}
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
              <ol className="flex items-center gap-1 min-w-0 sm:gap-1 text-sm">
                {currentPath.map((segment, index) => {
                  const isLast = index === currentPath.length - 1;
                  const displayName =
                    segment === "/"
                      ? t("dashboard_internal.documents.root") || "Root"
                      : segment;

                  return (
                    <li key={index} className="flex items-center shrink-0">
                      {index > 0 && (
                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 mx-1 sm:mx-1.5 text-slate-400 dark:text-sleads-slate600 sm:text-slate-300 dark:sm:text-sleads-slate600 shrink-0" />
                      )}
                      {isLast ? (
                        <span className="font-medium sm:font-semibold text-slate-900 dark:text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-slate-50 dark:bg-sleads-slate800 text-xs sm:text-sm whitespace-nowrap">
                          {displayName}
                        </span>
                      ) : (
                        <button
                          onClick={() => navigateToPath(index)}
                          className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-slate-600 dark:text-sleads-slate400 hover:text-sleads-blue dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-sleads-slate800 transition-all duration-150 text-xs sm:text-sm whitespace-nowrap font-medium"
                        >
                          {displayName}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>

            {/* View Mode Toggle - Compact on mobile, original on desktop */}
            <div className="flex items-center gap-1 sm:gap-2 bg-slate-100 dark:bg-sleads-slate800 rounded-lg p-0.5 sm:p-1 border border-slate-200 dark:border-sleads-slate700 shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 sm:p-2 rounded-md transition-all ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-sleads-slate700 text-sleads-blue dark:text-blue-400 shadow-sm"
                    : "text-slate-500 dark:text-sleads-slate500 hover:text-slate-700 dark:hover:text-sleads-slate300"
                }`}
                title={
                  t("dashboard_internal.documents.grid_view") || "Grid View"
                }
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 sm:p-2 rounded-md transition-all ${
                  viewMode === "list"
                    ? "bg-white dark:bg-sleads-slate700 text-sleads-blue dark:text-blue-400 shadow-sm"
                    : "text-slate-500 dark:text-sleads-slate500 hover:text-slate-700 dark:hover:text-sleads-slate300"
                }`}
                title={
                  t("dashboard_internal.documents.list_view") || "List View"
                }
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom row: Add button or info message - Mobile only */}
          <div className="px-3 sm:hidden py-2.5">
            {projectId ? (
              hasEditPermission ? (
                <>
                  <button
                    onClick={() => setShowAddMenu(true)}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      setShowAddMenu(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-sleads-blue dark:bg-blue-600 text-white rounded-lg active:bg-sleads-blue/80 dark:active:bg-blue-800 transition-colors font-medium text-sm shadow-sm touch-target"
                  >
                    <Plus className="w-4 h-4" />
                    {t("dashboard_internal.documents.add") || "Add"}
                  </button>

                  {showAddMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                        onClick={() => setShowAddMenu(false)}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                          setShowAddMenu(false);
                        }}
                      />
                      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-sleads-slate900 border-t border-slate-200 dark:border-sleads-slate800 rounded-t-2xl shadow-2xl z-50 max-h-[50vh] overflow-y-auto">
                        <div className="px-4 py-3 border-b border-slate-200 dark:border-sleads-slate800 flex items-center justify-between">
                          <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                            {t("dashboard_internal.documents.add") || "Add"}
                          </h3>
                          <button
                            onClick={() => setShowAddMenu(false)}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              setShowAddMenu(false);
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-sleads-slate800 text-slate-500 dark:text-sleads-slate400 touch-target"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="py-2">
                          <button
                            onClick={() => handleAddClick("folder")}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              handleAddClick("folder");
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-sleads-slate300 active:bg-slate-50 dark:active:bg-sleads-slate800 flex items-center gap-3 transition-colors touch-target"
                          >
                            <Folder className="w-5 h-5" />
                            {t("dashboard_internal.documents.folder") ||
                              "Folder"}
                          </button>
                          <button
                            onClick={() => handleAddClick("file")}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              handleAddClick("file");
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-sleads-slate300 active:bg-slate-50 dark:active:bg-sleads-slate800 flex items-center gap-3 transition-colors touch-target"
                          >
                            <File className="w-5 h-5" />
                            {t("dashboard_internal.documents.file_upload") ||
                              "File Upload"}
                          </button>
                          <button
                            onClick={() => handleAddClick("url")}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              handleAddClick("url");
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-sleads-slate300 active:bg-slate-50 dark:active:bg-sleads-slate800 flex items-center gap-3 transition-colors touch-target"
                          >
                            <LinkIcon className="w-5 h-5" />
                            {t("dashboard_internal.documents.url_link") ||
                              "URL Link"}
                          </button>
                          <button
                            onClick={() => handleAddClick("text")}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              handleAddClick("text");
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-sleads-slate300 active:bg-slate-50 dark:active:bg-sleads-slate800 flex items-center gap-3 transition-colors touch-target"
                          >
                            <FileText className="w-5 h-5" />
                            {t("dashboard_internal.documents.text_file") ||
                              "Text File"}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg shadow-sm">
                  <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-900/30 shrink-0">
                    <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                      {t("dashboard_internal.documents.read_only") ||
                        "Read Only"}
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300/80 truncate">
                      {t("dashboard_internal.documents.read_only_desc") ||
                        "You don't have permission to create files here"}
                    </p>
                  </div>
                </div>
              )
            ) : (
              <div className="px-3 py-2 bg-slate-50 dark:bg-sleads-slate800 border border-slate-200 dark:border-sleads-slate700 rounded-lg">
                <p className="text-xs text-slate-600 dark:text-sleads-slate400 text-center">
                  {t("dashboard_internal.documents.project_only") ||
                    "Files can only be added from a project"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      {currentItems.length === 0 ? (
        <div className="bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 rounded-xl p-8 sm:p-12 text-center">
          <Folder className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-slate-300 dark:text-sleads-slate700" />
          <p className="text-slate-500 dark:text-sleads-slate400 text-sm sm:text-lg font-medium">
            {t("dashboard_internal.documents.empty") || "This folder is empty"}
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View (Mac-style) */
        <div className="bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-sm">
          {/* Hint for long-press deletion or Exit delete mode button */}
          {isDeleteModeActive ? (
            <div className="mb-4 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="p-1 rounded-md bg-red-100 dark:bg-red-900/30 shrink-0">
                  <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-red-900 dark:text-red-200">
                    {t("dashboard_internal.documents.delete_mode_active") ||
                      "Delete mode active"}
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300/80 mt-0.5">
                    {t("dashboard_internal.documents.delete_mode_hint") ||
                      "Tap any item to delete it"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleExitDeleteMode}
                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors touch-target"
              >
                {t("dashboard_internal.documents.exit_delete_mode") || "Done"}
              </button>
            </div>
          ) : (
            currentItems.some((item) =>
              hasDeletePermission(item.fullPath, item.file)
            ) && (
              <div className="mb-4 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg flex items-start gap-2.5">
                <div className="p-1 rounded-md bg-blue-100 dark:bg-blue-900/30 shrink-0 mt-0.5">
                  <Trash2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                    {t("dashboard_internal.documents.delete_hint_title") ||
                      "Delete files"}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300/80 mt-0.5">
                    {t("dashboard_internal.documents.delete_hint") ||
                      "Long press on any file or folder to delete it"}
                  </p>
                </div>
              </div>
            )
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {currentItems.map((item) => {
              const Icon = item.isFolder
                ? Folder
                : item.file
                  ? getFileIcon(item.file)
                  : File;
              const iconColor = item.isFolder
                ? "text-blue-500 dark:text-blue-400"
                : item.file
                  ? getFileIconColor(item.file)
                  : "text-slate-400 dark:text-sleads-slate500";

              const isProtected = isProtectedFolder(item.fullPath);
              const canDelete =
                !isProtected && hasDeletePermission(item.fullPath, item.file);
              const isShaking = isDeleteModeActive; // All items shake when delete mode is active
              const isDeleting = deletingItems.has(item.fullPath);

              return (
                <div key={item.fullPath} className="relative">
                  <motion.div
                    className="relative"
                    animate={
                      isShaking
                        ? {
                            x: [0, -2, 2, -2, 2, -2, 2, 0],
                            transition: {
                              duration: 0.5,
                              repeat: Infinity,
                            },
                          }
                        : {}
                    }
                    onMouseDown={() => {
                      if (canDelete) {
                        const timer = setTimeout(() => {
                          handleItemLongPress(item);
                        }, 500); // 500ms long press
                        longPressTimer.current.set(item.fullPath, timer);
                      }
                    }}
                    onMouseUp={() => handleItemLongPressEnd(item)}
                    onMouseLeave={() => handleItemLongPressEnd(item)}
                    onTouchStart={() => {
                      if (canDelete) {
                        const timer = setTimeout(() => {
                          handleItemLongPress(item);
                        }, 500); // 500ms long press
                        longPressTimer.current.set(item.fullPath, timer);
                      }
                    }}
                    onTouchEnd={() => handleItemLongPressEnd(item)}
                  >
                    <motion.button
                      onClick={() => handleItemClick(item)}
                      whileHover={!isShaking ? { scale: 1.05 } : {}}
                      whileTap={!isShaking ? { scale: 0.95 } : {}}
                      disabled={isDeleting}
                      className="flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl hover:bg-slate-50 dark:hover:bg-sleads-slate800 transition-colors group relative w-full"
                    >
                      <div
                        className={`w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-lg sm:rounded-xl bg-slate-50 dark:bg-sleads-slate800 group-hover:bg-slate-100 dark:group-hover:bg-sleads-slate700 transition-colors ${iconColor} ${isShaking ? "ring-2 ring-red-500 dark:ring-red-400" : ""}`}
                      >
                        <Icon className="w-6 h-6 sm:w-8 sm:h-8" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white text-center line-clamp-2 max-w-full wrap-break-word">
                        {item.name}
                      </span>
                    </motion.button>
                  </motion.div>
                  {isShaking && canDelete && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(item);
                      }}
                      disabled={isDeleting}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg z-20 disabled:opacity-50 touch-target flex items-center justify-center"
                      title={
                        t("dashboard_internal.documents.delete") || "Delete"
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  )}
                  {item.file && !isShaking && (
                    <div className="flex items-center gap-2 mt-1 justify-center">
                      {item.file.contentType === "url" && item.file.url && (
                        <a
                          href={item.file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-sleads-slate700 text-slate-500 dark:text-sleads-slate400"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      {item.file.contentType === "file" && item.file.url && (
                        <a
                          href={item.file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-sleads-slate700 text-slate-500 dark:text-sleads-slate400"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                      {item.file.contentType === "text" && (
                        <Link
                          href={getFileLinkUrl(item.file) || "#"}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-sleads-slate700 text-slate-500 dark:text-sleads-slate400"
                        >
                          <FileText className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  )}
                  {isDeleting && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 dark:bg-black/40 rounded-lg sm:rounded-xl z-30">
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List View (Tree-style) */
        <div className="bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
          {/* Hint for long-press deletion or Exit delete mode button */}
          {isDeleteModeActive ? (
            <div className="px-4 py-2.5 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800/50 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="p-1 rounded-md bg-red-100 dark:bg-red-900/30 shrink-0">
                  <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-red-900 dark:text-red-200">
                    {t("dashboard_internal.documents.delete_mode_active") ||
                      "Delete mode active"}
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300/80 mt-0.5">
                    {t("dashboard_internal.documents.delete_mode_hint") ||
                      "Tap any item to delete it"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleExitDeleteMode}
                className="px-3 py-1.5 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors touch-target"
              >
                {t("dashboard_internal.documents.exit_delete_mode") || "Done"}
              </button>
            </div>
          ) : (
            hasDeletableItems && (
              <div className="px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800/50 flex items-start gap-2.5">
                <div className="p-1 rounded-md bg-blue-100 dark:bg-blue-900/30 shrink-0 mt-0.5">
                  <Trash2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                    {t("dashboard_internal.documents.delete_hint_title") ||
                      "Delete files"}
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300/80 mt-0.5">
                    {t("dashboard_internal.documents.delete_hint") ||
                      "Long press on any file or folder to delete it"}
                  </p>
                </div>
              </div>
            )
          )}
          <div className="divide-y divide-slate-200 dark:divide-sleads-slate800">
            {currentItems.map((item) => {
              const Icon = item.isFolder
                ? Folder
                : item.file
                  ? getFileIcon(item.file)
                  : File;
              const iconColor = item.isFolder
                ? "text-blue-500 dark:text-blue-400"
                : item.file
                  ? getFileIconColor(item.file)
                  : "text-slate-400 dark:text-sleads-slate500";

              const isProtected = isProtectedFolder(item.fullPath);
              const canDelete =
                !isProtected && hasDeletePermission(item.fullPath, item.file);
              const isShaking = isDeleteModeActive; // All items shake when delete mode is active
              const isDeleting = deletingItems.has(item.fullPath);

              return (
                <div key={item.fullPath} className="relative">
                  <motion.div
                    className="relative"
                    animate={
                      isShaking
                        ? {
                            x: [0, -2, 2, -2, 2, -2, 2, 0],
                            transition: {
                              duration: 0.5,
                              repeat: Infinity,
                            },
                          }
                        : {}
                    }
                    onMouseDown={() => {
                      if (canDelete) {
                        const timer = setTimeout(() => {
                          handleItemLongPress(item);
                        }, 500); // 500ms long press
                        longPressTimer.current.set(item.fullPath, timer);
                      }
                    }}
                    onMouseUp={() => handleItemLongPressEnd(item)}
                    onMouseLeave={() => handleItemLongPressEnd(item)}
                    onTouchStart={() => {
                      if (canDelete) {
                        const timer = setTimeout(() => {
                          handleItemLongPress(item);
                        }, 500); // 500ms long press
                        longPressTimer.current.set(item.fullPath, timer);
                      }
                    }}
                    onTouchEnd={() => handleItemLongPressEnd(item)}
                  >
                    <motion.button
                      onClick={() => handleItemClick(item)}
                      whileHover={
                        !isShaking
                          ? { backgroundColor: "rgba(0,0,0,0.02)" }
                          : {}
                      }
                      disabled={isDeleting}
                      className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-slate-50 dark:hover:bg-sleads-slate800 transition-colors group relative"
                    >
                      <div
                        className={`shrink-0 ${iconColor} ${isShaking ? "ring-2 ring-red-500 dark:ring-red-400 rounded" : ""}`}
                      >
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="font-medium text-sm sm:text-base text-slate-900 dark:text-white truncate">
                          {item.name}
                        </div>
                        {!item.file && (
                          <div className="text-xs text-slate-500 dark:text-sleads-slate400 mt-0.5">
                            {item.isFolder ? "folder" : "File"}
                          </div>
                        )}
                        {item.file && (
                          <div className="text-xs text-slate-500 dark:text-sleads-slate400 mt-0.5">
                            {item.file.contentType || "folder"}
                          </div>
                        )}
                      </div>
                      {isShaking && canDelete ? (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(item);
                          }}
                          disabled={isDeleting}
                          className="w-9 h-9 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg shrink-0 disabled:opacity-50 touch-target flex items-center justify-center"
                          title={
                            t("dashboard_internal.documents.delete") || "Delete"
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      ) : item.isFolder ? (
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 dark:text-sleads-slate500 shrink-0" />
                      ) : item.file ? (
                        <div className="flex items-center gap-2 shrink-0">
                          {item.file.contentType === "url" && item.file.url && (
                            <a
                              href={item.file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-sleads-slate700 text-slate-500 dark:text-sleads-slate400"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          {item.file.contentType === "file" &&
                            item.file.url && (
                              <a
                                href={item.file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-sleads-slate700 text-slate-500 dark:text-sleads-slate400"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            )}
                          {item.file.contentType === "text" && (
                            <Link
                              href={getFileLinkUrl(item.file) || "#"}
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-sleads-slate700 text-slate-500 dark:text-sleads-slate400"
                            >
                              <FileText className="w-4 h-4" />
                            </Link>
                          )}
                        </div>
                      ) : null}
                    </motion.button>
                  </motion.div>
                  {isDeleting && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 dark:bg-black/40 rounded-lg z-30">
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create File Modal */}
      {showCreateModal && createType && lockedBasePath && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-md rounded-2xl bg-white dark:bg-sleads-slate900 shadow-2xl border border-slate-200 dark:border-sleads-slate800 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-sleads-blue/5 to-blue-50 dark:from-sleads-blue/10 dark:to-sleads-slate800 border-b border-slate-200 dark:border-sleads-slate800">
              <div className="flex items-center gap-3">
                {createType === "folder" && (
                  <Folder className="w-5 h-5 text-sleads-blue dark:text-blue-400" />
                )}
                {createType === "file" && (
                  <File className="w-5 h-5 text-sleads-blue dark:text-blue-400" />
                )}
                {createType === "url" && (
                  <LinkIcon className="w-5 h-5 text-sleads-blue dark:text-blue-400" />
                )}
                {createType === "text" && (
                  <FileText className="w-5 h-5 text-sleads-blue dark:text-blue-400" />
                )}
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {createType === "folder"
                    ? t("dashboard_internal.documents.create_folder") ||
                      "Create Folder"
                    : createType === "file"
                      ? t("dashboard_internal.documents.create_file") ||
                        "Create File"
                      : createType === "url"
                        ? t("dashboard_internal.documents.create_url") ||
                          "Create URL Link"
                        : t("dashboard_internal.documents.create_text") ||
                          "Create Text File"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateType(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 dark:text-sleads-slate500 hover:text-slate-600 dark:hover:text-sleads-slate300 hover:bg-slate-100 dark:hover:bg-sleads-slate800 focus:outline-none transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Current location indicator */}
              <div className="px-3 py-2 bg-slate-50 dark:bg-sleads-slate800 rounded-lg border border-slate-200 dark:border-sleads-slate700">
                <p className="text-xs font-medium text-slate-500 dark:text-sleads-slate400 mb-1">
                  {t("dashboard_internal.documents.current_location") ||
                    "Current location"}
                </p>
                <p className="text-sm font-mono text-slate-700 dark:text-sleads-slate300">
                  {lockedBasePath === "/"
                    ? t("dashboard_internal.documents.root") || "Root"
                    : lockedBasePath}
                </p>
              </div>

              {/* Name input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-sleads-slate300 mb-2">
                  {t("dashboard_internal.documents.name") || "Name"}
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isCreating && formName.trim()) {
                      handleCreate();
                    }
                  }}
                  className="w-full rounded-lg border-2 border-slate-300 dark:border-sleads-slate700 bg-white dark:bg-sleads-slate900 px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:border-sleads-blue transition-all"
                  placeholder={
                    createType === "folder"
                      ? t(
                          "dashboard_internal.documents.folder_name_placeholder"
                        ) || "Enter folder name"
                      : createType === "file"
                        ? t(
                            "dashboard_internal.documents.file_name_placeholder"
                          ) || "Enter file name"
                        : createType === "url"
                          ? t(
                              "dashboard_internal.documents.link_name_placeholder"
                            ) || "Enter link name"
                          : t(
                              "dashboard_internal.documents.text_file_name_placeholder"
                            ) || "Enter file name"
                  }
                  autoFocus
                />
              </div>

              {/* File upload */}
              {createType === "file" && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-sleads-slate300 mb-2">
                    {t("dashboard_internal.documents.file") || "File"}
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setFormFile(file);
                        if (file && !formName.trim()) {
                          setFormName(file.name);
                        }
                      }}
                      className="w-full rounded-lg border-2 border-slate-300 dark:border-sleads-slate700 bg-white dark:bg-sleads-slate900 px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:border-sleads-blue transition-all file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-sleads-blue file:text-white hover:file:bg-sleads-blue/90"
                    />
                  </div>
                </div>
              )}

              {/* URL input */}
              {createType === "url" && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-sleads-slate300 mb-2">
                    URL
                  </label>
                  <input
                    type="url"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    className="w-full rounded-lg border-2 border-slate-300 dark:border-sleads-slate700 bg-white dark:bg-sleads-slate900 px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:border-sleads-blue transition-all"
                    placeholder="https://example.com"
                  />
                </div>
              )}

              {/* Text content */}
              {createType === "text" && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-sleads-slate300 mb-2">
                    {t("dashboard_internal.documents.content") || "Content"}
                  </label>
                  <textarea
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    className="w-full min-h-[120px] rounded-lg border-2 border-slate-300 dark:border-sleads-slate700 bg-white dark:bg-sleads-slate900 px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:border-sleads-blue transition-all resize-none"
                    placeholder={
                      t("dashboard_internal.documents.enter_text") ||
                      "Enter text content..."
                    }
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-sleads-slate800">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateType(null);
                  }}
                  disabled={isCreating}
                  className="px-5 py-2.5 rounded-lg bg-slate-100 dark:bg-sleads-slate800 text-slate-700 dark:text-sleads-slate300 hover:bg-slate-200 dark:hover:bg-sleads-slate700 transition-colors font-medium text-sm disabled:opacity-50"
                >
                  {t("dashboard_internal.documents.cancel") || "Cancel"}
                </button>
                <button
                  onClick={handleCreate}
                  disabled={isCreating || !formName.trim()}
                  className="px-5 py-2.5 rounded-lg bg-sleads-blue dark:bg-blue-600 text-white hover:bg-sleads-blue/90 dark:hover:bg-blue-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                >
                  {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t("dashboard_internal.documents.create") || "Create"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
