"use client";

import React, { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../../convex/_generated/dataModel";
import { Doc } from "../../../../../../../../convex/_generated/dataModel";
import {
  Loader2,
  Trash2,
  File,
  Folder,
  Plus,
  ChevronRight,
  ChevronDown,
  Link as LinkIcon,
  FileText,
  Edit,
  Lock,
  Unlock,
  ExternalLink,
  Download,
} from "lucide-react";
import { useToast } from "@/app/hooks/useToast";
import { Modal } from "@/app/admin-dashboard/components/ui/Modal";
import { Input } from "@/app/admin-dashboard/components/ui/Input";
import { Button } from "@/app/admin-dashboard/components/ui/Button";
import { Badge } from "@/app/admin-dashboard/components/ui/Badge";

type FileNode = {
  name: string;
  fullPath: string;
  file?: Doc<"files">;
  children: Map<string, FileNode>;
  isFolder: boolean;
};

type ContentType = "file" | "url" | "text" | "folder";

export default function ProjectFilesPage() {
  const params = useParams();
  const projectId = params.projectId as Id<"projects">;
  const orgId = params.orgId as string;
  const { toast } = useToast();

  const files = useQuery(api.file.getFiles, {
    projectId,
  });

  const createFile = useMutation(api.file.createFile);
  const deleteFile = useMutation(api.file.deleteFile);
  const deleteFolderStructure = useMutation(api.file.deleteFolderStructure);
  const generateUploadUrl = useMutation(api.file.generateUploadUrl);
  const getFileUrl = useAction(api.file.getFileUrl);
  const editPermissionsOfFile = useMutation(api.file.editPerissionsOfFile);

  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    new Set(["/"])
  );
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<ContentType | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createBasePath, setCreateBasePath] = useState<string>("/");
  const [lockedBasePath, setLockedBasePath] = useState<string | null>(null);

  // Edit permissions modal state
  const [showEditPermissionsModal, setShowEditPermissionsModal] =
    useState(false);
  const [editingFile, setEditingFile] = useState<Doc<"files"> | null>(null);
  const [editUserCanEdit, setEditUserCanEdit] = useState(false);
  const [editUserCanDelete, setEditUserCanDelete] = useState(false);
  const [isUpdatingPermissions, setIsUpdatingPermissions] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formFile, setFormFile] = useState<File | null>(null);
  const [userCanEdit, setUserCanEdit] = useState(false);
  const [userCanDelete, setUserCanDelete] = useState(false);

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
      const pathParts = file.name.split("/").filter((p) => p);
      let current = root;

      if (file.contentType === "folder") {
        // For folders, create nodes for each path segment
        pathParts.forEach((part, index) => {
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
        // For files, create folder nodes for all but the last part
        pathParts.slice(0, -1).forEach((part, index) => {
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

        // Add the file as the last node
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

  // Check if a file can be edited/deleted based on permissions and inheritance
  const getFilePermissions = (
    filePath: string
  ): { canEdit: boolean; canDelete: boolean } => {
    if (!files) return { canEdit: false, canDelete: false };

    // Find the file itself
    const file = files.find((f) => f.name === filePath);
    if (file) {
      return { canEdit: file.userCanEdit, canDelete: file.userCanDelete };
    }

    // Check for folder inheritance - look for folders that this path is under
    const pathParts = filePath.split("/").filter((p) => p);
    for (let i = pathParts.length; i > 0; i--) {
      const folderPath = "/" + pathParts.slice(0, i).join("/");
      const folder = files.find(
        (f) => f.name === folderPath && f.contentType === "folder"
      );
      if (folder) {
        return { canEdit: folder.userCanEdit, canDelete: folder.userCanDelete };
      }
    }

    return { canEdit: false, canDelete: false };
  };

  const toggleExpanded = (path: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  const handleAddClick = (type: ContentType) => {
    setCreateType(type);
    const basePath = selectedPath || "/";
    setCreateBasePath(basePath);

    // Lock the base path if it's not root
    if (basePath !== "/") {
      setLockedBasePath(basePath);
      // Start with empty suffix - user will add the filename/path
      setFormName("");
    } else {
      setLockedBasePath(null);
      // For root, allow full path editing
      setFormName("/");
    }

    setFormContent("");
    setFormUrl("");
    setFormFile(null);
    setUserCanEdit(false);
    setUserCanDelete(false);
    setShowAddMenu(false);
    setShowCreateModal(true);
  };

  const handleCreate = async () => {
    if (!createType) return;

    setIsCreating(true);
    try {
      let finalName: string;

      // If we have a locked base path, combine it with the form name
      if (lockedBasePath) {
        const suffix = formName.trim();
        if (!suffix) {
          toast({
            title: "Error",
            description: "Please enter a name for the file/folder",
            variant: "error",
          });
          return;
        }

        // Ensure suffix doesn't start with / (we'll add it)
        const cleanSuffix = suffix.startsWith("/") ? suffix.slice(1) : suffix;
        finalName = `${lockedBasePath}/${cleanSuffix}`;
      } else {
        // For root, use the full path
        finalName = formName.trim();
        if (!finalName) {
          toast({
            title: "Error",
            description: "Name is required",
            variant: "error",
          });
          return;
        }

        // Ensure name starts with /
        if (!finalName.startsWith("/")) {
          finalName = "/" + finalName;
        }
      }

      // For folders, ensure it doesn't end with / (we store without trailing slash)
      if (createType === "folder" && finalName.endsWith("/")) {
        finalName = finalName.slice(0, -1);
      }

      let url: string | undefined;
      let content: string | undefined;

      if (createType === "file") {
        if (!formFile) {
          toast({
            title: "Error",
            description: "Please select a file",
            variant: "error",
          });
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
            title: "Error",
            description: "URL is required",
            variant: "error",
          });
          return;
        }
        url = formUrl.trim();
      } else if (createType === "text") {
        content = formContent;
      }

      await createFile({
        name: finalName,
        contentType: createType,
        content: content,
        url: url,
        storageId: undefined, // Don't store storageId, use URL instead
        projectId: projectId,
        organizationId: orgId as Id<"organizations">,
        userCanEdit,
        userCanDelete,
      });

      toast({
        title: "Success",
        description: `${createType === "folder" ? "Folder" : "File"} created successfully`,
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
        title: "Error",
        description: "Failed to create file",
        variant: "error",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (fileId: Id<"files">) => {
    if (!confirm("Are you sure you want to delete this file/folder?")) return;

    try {
      await deleteFile({ fileId });
      toast({
        title: "Success",
        description: "File deleted successfully",
        variant: "success",
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "error",
      });
    }
  };

  const handleDeleteFolder = async (folderPath: string) => {
    if (
      !confirm(
        `Are you sure you want to delete the folder "${folderPath}" and all its contents? This action cannot be undone.`
      )
    )
      return;

    try {
      await deleteFolderStructure({
        folderPath,
        projectId,
      });
      toast({
        title: "Success",
        description: "Folder and all its contents deleted successfully",
        variant: "success",
      });
    } catch (error) {
      console.error("Error deleting folder:", error);
      toast({
        title: "Error",
        description: "Failed to delete folder",
        variant: "error",
      });
    }
  };

  const handleEditPermissions = (file: Doc<"files">) => {
    setEditingFile(file);
    setEditUserCanEdit(file.userCanEdit);
    setEditUserCanDelete(file.userCanDelete);
    setShowEditPermissionsModal(true);
  };

  const handleEditFolderPermissions = async (folderPath: string) => {
    if (!files) return;

    // Try to find existing folder record
    const folderFile = files.find(
      (f) => f.name === folderPath && f.contentType === "folder"
    );

    // If folder doesn't exist, create it first
    if (!folderFile) {
      try {
        const newFolderId = await createFile({
          name: folderPath,
          contentType: "folder",
          content: undefined,
          url: undefined,
          storageId: undefined,
          projectId: projectId,
          organizationId: orgId as Id<"organizations">,
          userCanEdit: false,
          userCanDelete: false,
        });

        // Wait a bit for the query to update, then find the new folder
        // We'll need to get it from the files query after it updates
        // For now, let's just show the modal with default permissions
        setEditingFile({
          _id: newFolderId,
          name: folderPath,
          contentType: "folder",
          userCanEdit: false,
          userCanDelete: false,
        } as Doc<"files">);
        setEditUserCanEdit(false);
        setEditUserCanDelete(false);
        setShowEditPermissionsModal(true);
        return;
      } catch (error) {
        console.error("Error creating folder:", error);
        toast({
          title: "Error",
          description: "Failed to create folder record",
          variant: "error",
        });
        return;
      }
    }

    // If folder exists, edit it normally
    handleEditPermissions(folderFile);
  };

  const handleUpdatePermissions = async () => {
    if (!editingFile) return;

    setIsUpdatingPermissions(true);
    try {
      await editPermissionsOfFile({
        fileId: editingFile._id,
        userCanEdit: editUserCanEdit,
        userCanDelete: editUserCanDelete,
      });

      const isFolder = editingFile.contentType === "folder";
      toast({
        title: "Success",
        description: isFolder
          ? "Folder permissions updated. All children have inherited the new permissions."
          : "Permissions updated successfully",
        variant: "success",
      });

      setShowEditPermissionsModal(false);
      setEditingFile(null);
    } catch (error) {
      console.error("Error updating permissions:", error);
      toast({
        title: "Error",
        description: "Failed to update permissions",
        variant: "error",
      });
    } finally {
      setIsUpdatingPermissions(false);
    }
  };

  const renderFileNode = (
    node: FileNode,
    depth: number = 0
  ): React.ReactNode => {
    const isExpanded = expandedPaths.has(node.fullPath);
    const hasChildren = node.children.size > 0;

    // Get permissions - check if it's a folder with or without a file record
    let permissions = { canEdit: false, canDelete: false };
    if (node.file) {
      permissions = getFilePermissions(node.file.name);
    } else if (node.isFolder) {
      // For folders without a file record, check for parent folder permissions
      permissions = getFilePermissions(node.fullPath);
    }

    return (
      <div key={node.fullPath}>
        <div
          className={`flex items-center gap-2 py-1.5 px-2 hover:bg-gray-50 rounded ${
            selectedPath === node.fullPath ? "bg-blue-50" : ""
          }`}
          style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleExpanded(node.fullPath)}
              className="text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}

          {node.isFolder ? (
            <Folder className="w-4 h-4 text-blue-500" />
          ) : node.file?.contentType === "url" ? (
            <LinkIcon className="w-4 h-4 text-purple-500" />
          ) : node.file?.contentType === "text" ? (
            <FileText className="w-4 h-4 text-green-500" />
          ) : (
            <File className="w-4 h-4 text-gray-400" />
          )}

          <span className="flex-1 text-sm text-gray-900">
            {node.name || "/"}
          </span>

          {node.file && !node.isFolder && (
            <>
              <div className="flex items-center gap-1">
                {permissions.canEdit && (
                  <Badge variant="success" className="text-xs">
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Badge>
                )}
                {permissions.canDelete && (
                  <Badge variant="success" className="text-xs">
                    <Unlock className="w-3 h-3 mr-1" />
                    Delete
                  </Badge>
                )}
                {!permissions.canEdit && !permissions.canDelete && (
                  <Badge variant="default" className="text-xs">
                    <Lock className="w-3 h-3 mr-1" />
                    Locked
                  </Badge>
                )}
              </div>

              {node.file.contentType === "url" && node.file.url && (
                <a
                  href={node.file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  title="Open URL"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

              {node.file.contentType === "text" && (
                <Link
                  href={`/admin-dashboard/organizations/${orgId}/projects/${projectId}/files/${node.file._id}`}
                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  title="Edit Text File"
                >
                  <FileText className="w-4 h-4" />
                </Link>
              )}

              {node.file.contentType === "file" && node.file.url && (
                <a
                  href={node.file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  title="Download/View File"
                >
                  <Download className="w-4 h-4" />
                </a>
              )}

              <button
                onClick={() => handleEditPermissions(node.file!)}
                className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                title="Edit Permissions"
              >
                <Edit className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleDelete(node.file!._id)}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}

          {node.isFolder && !node.file && (
            <>
              <div className="flex items-center gap-1">
                {permissions.canEdit && (
                  <Badge variant="success" className="text-xs">
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Badge>
                )}
                {permissions.canDelete && (
                  <Badge variant="success" className="text-xs">
                    <Unlock className="w-3 h-3 mr-1" />
                    Delete
                  </Badge>
                )}
                {!permissions.canEdit && !permissions.canDelete && (
                  <Badge variant="default" className="text-xs">
                    <Lock className="w-3 h-3 mr-1" />
                    Locked
                  </Badge>
                )}
              </div>

              <button
                onClick={() => handleEditFolderPermissions(node.fullPath)}
                className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                title="Edit Permissions"
              >
                <Edit className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFolder(node.fullPath);
                }}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                title="Delete Folder"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddMenu(true);
                  setSelectedPath(node.fullPath);
                }}
                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                title="Add file/folder"
              >
                <Plus className="w-4 h-4" />
              </button>
            </>
          )}

          {node.isFolder && node.file && (
            <>
              <button
                onClick={() => handleEditPermissions(node.file!)}
                className="p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                title="Edit Permissions"
              >
                <Edit className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFolder(node.fullPath);
                }}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                title="Delete Folder"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddMenu(true);
                  setSelectedPath(node.fullPath);
                }}
                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                title="Add file/folder"
              >
                <Plus className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div>
            {Array.from(node.children.values())
              .sort((a, b) => {
                // Folders first, then files
                if (a.isFolder !== b.isFolder) {
                  return a.isFolder ? -1 : 1;
                }
                return a.name.localeCompare(b.name);
              })
              .map((child) => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (files === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Files</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage project files and folders
          </p>
        </div>
        <div className="relative">
          <Button
            onClick={() => {
              setShowAddMenu(true);
              setSelectedPath("/");
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add File/Folder
          </Button>

          {showAddMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowAddMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                <div className="py-1">
                  <button
                    onClick={() => handleAddClick("folder")}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Folder className="w-4 h-4" />
                    Folder
                  </button>
                  <button
                    onClick={() => handleAddClick("file")}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <File className="w-4 h-4" />
                    File Upload
                  </button>
                  <button
                    onClick={() => handleAddClick("url")}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <LinkIcon className="w-4 h-4" />
                    URL Link
                  </button>
                  <button
                    onClick={() => handleAddClick("text")}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Text File
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-medium text-gray-900">File Browser</h2>
        </div>
        <div className="p-4">
          {files.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Folder className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>
                No files yet. Click &quot;Add File/Folder&quot; to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-1">{renderFileNode(fileTree)}</div>
          )}
        </div>
      </div>

      {showCreateModal && createType && (
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setCreateType(null);
            setLockedBasePath(null);
          }}
          title={`Create ${createType === "folder" ? "Folder" : createType === "file" ? "File" : createType === "url" ? "URL Link" : "Text File"}`}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {lockedBasePath ? "Name" : "Path/Name"}
              </label>
              {lockedBasePath ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center px-3 py-2 bg-gray-100 border border-gray-300 rounded-l-md text-sm text-gray-700 font-mono">
                    {lockedBasePath}/
                  </div>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="flex-1 rounded-l-none"
                    placeholder={
                      createType === "folder"
                        ? "folder-name"
                        : createType === "file"
                          ? "filename.pdf"
                          : createType === "url"
                            ? "link-name"
                            : "file.txt"
                    }
                  />
                </div>
              ) : (
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={
                    createType === "folder"
                      ? "/home/test/hello"
                      : createType === "file"
                        ? "/home/test/hello/filename.pdf"
                        : createType === "url"
                          ? "/home/test/hello/link"
                          : "/home/test/hello/file.txt"
                  }
                />
              )}
              <p className="text-xs text-gray-500 mt-1">
                {lockedBasePath
                  ? `Enter the ${createType === "folder" ? "folder" : "file"} name. The path will be: ${lockedBasePath}/[name]`
                  : createType === "folder"
                    ? "Enter the full folder path (e.g., /home/test/hello)"
                    : "Enter the full file path including filename"}
              </p>
            </div>

            {createType === "file" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File
                </label>
                <Input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setFormFile(file);
                    // Auto-fill the name with the selected file's name
                    if (file) {
                      if (lockedBasePath) {
                        // If base path is locked, just use the filename
                        setFormName(file.name);
                      } else if (
                        formName === createBasePath ||
                        formName === "/"
                      ) {
                        // If at root or same as base path, prepend the path
                        const basePath =
                          createBasePath === "/" ? "" : createBasePath;
                        setFormName(`${basePath}/${file.name}`);
                      }
                    }
                  }}
                />
              </div>
            )}

            {createType === "url" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <Input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            )}

            {createType === "text" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="flex min-h-[100px] w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter text content..."
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Permissions
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={userCanEdit}
                    onChange={(e) => setUserCanEdit(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Users can edit
                    {createType === "folder" && " (inherited by children)"}
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={userCanDelete}
                    onChange={(e) => setUserCanDelete(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Users can delete
                    {createType === "folder" && " (inherited by children)"}
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateType(null);
                }}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} isLoading={isCreating}>
                Create
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showEditPermissionsModal && editingFile && (
        <Modal
          isOpen={showEditPermissionsModal}
          onClose={() => {
            setShowEditPermissionsModal(false);
            setEditingFile(null);
          }}
          title={`Edit Permissions: ${editingFile.name.split("/").pop() || editingFile.name}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Path:</span> {editingFile.name}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Type:</span>{" "}
                {editingFile.contentType}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Permissions
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editUserCanEdit}
                    onChange={(e) => setEditUserCanEdit(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Users can edit
                    {editingFile.contentType === "folder" &&
                      " (inherited by children)"}
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editUserCanDelete}
                    onChange={(e) => setEditUserCanDelete(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Users can delete
                    {editingFile.contentType === "folder" &&
                      " (inherited by children)"}
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowEditPermissionsModal(false);
                  setEditingFile(null);
                }}
                disabled={isUpdatingPermissions}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdatePermissions}
                isLoading={isUpdatingPermissions}
              >
                Update Permissions
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
