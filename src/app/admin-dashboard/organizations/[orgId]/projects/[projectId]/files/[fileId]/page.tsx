"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../../../convex/_generated/dataModel";
import { Loader2, ArrowLeft, Save, FileText, AlertCircle } from "lucide-react";
import { useToast } from "@/app/hooks/useToast";
import { Button } from "@/app/admin-dashboard/components/ui/Button";
import { TextEditor } from "@/components/TextEditor/TextEditor";
import Link from "next/link";

export default function FileDetailPage() {
  const params = useParams();
  const fileId = params.fileId as Id<"files">;
  const orgId = params.orgId as string;
  const projectId = params.projectId as string;
  const { toast } = useToast();

  const file = useQuery(api.file.getFile, { fileId });
  const updateFileContent = useMutation(api.file.updateFileContent);

  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

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
    if (!file || !hasChanges) return;

    setIsSaving(true);
    try {
      await updateFileContent({
        fileId: file._id,
        content: content || "",
      });

      toast({
        title: "Success",
        description: "File content saved successfully",
        variant: "success",
      });

      // Force a small delay to ensure the query updates
      setTimeout(() => {
        setHasChanges(false);
      }, 100);
    } catch (error) {
      console.error("Error saving file:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save file content",
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
        <h2 className="text-xl font-semibold text-gray-900">File not found</h2>
        <Link
          href={`/admin-dashboard/organizations/${orgId}/projects/${projectId}/files`}
        >
          <Button variant="secondary">Back to Files</Button>
        </Link>
      </div>
    );
  }

  if (file.contentType !== "text") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <FileText className="h-12 w-12 text-gray-400" />
        <h2 className="text-xl font-semibold text-gray-900">
          This file is not a text file
        </h2>
        <p className="text-gray-500">
          Text editor is only available for text files.
        </p>
        <Link
          href={`/admin-dashboard/organizations/${orgId}/projects/${projectId}/files`}
        >
          <Button variant="secondary">Back to Files</Button>
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
            href={`/admin-dashboard/organizations/${orgId}/projects/${projectId}/files`}
          >
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {file.name.split("/").pop() || file.name}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{file.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-sm text-amber-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Unsaved changes
            </span>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            isLoading={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="bg-white rounded-lg shadow-sm">
        <TextEditor
          content={content}
          onChange={setContent}
          placeholder="Start typing your content here..."
          editable={true}
        />
      </div>
    </div>
  );
}
