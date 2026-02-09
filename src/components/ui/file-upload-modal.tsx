"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Loader2, Image, File, CheckCircle } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (url: string) => void;
  projectId?: Id<"projects"> | null;
  organizationId: Id<"organizations">;
  acceptedTypes?: string;
  title?: string;
}

export function FileUploadModal({
  isOpen,
  onClose,
  onUploadComplete,
  projectId,
  organizationId,
  acceptedTypes = "image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt",
  title = "Upload File",
}: FileUploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.smartObjects.generateUploadUrl);
  const storeImageAndGetUrl = useMutation(api.smartObjects.storeImageAndGetUrl);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError(null);
    setUploadComplete(false);

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      // Step 1: Generate upload URL
      const uploadUrl = await generateUploadUrl();

      // Step 2: Upload file to Convex storage
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });

      if (!result.ok) {
        throw new Error("Failed to upload file");
      }

      const { storageId } = await result.json();

      // Step 3: Store image and get permanent URL
      const permanentUrl = await storeImageAndGetUrl({
        organizationId,
        projectId: projectId || null,
        imageId: storageId as Id<"_storage">,
      });

      setUploadComplete(true);

      // Small delay to show success state
      setTimeout(() => {
        onUploadComplete(permanentUrl);
        handleClose();
      }, 500);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    setUploadComplete(false);
    setIsUploading(false);
    onClose();
  };

  const getFileIcon = () => {
    if (!selectedFile) return <Upload className="w-8 h-8" />;
    if (selectedFile.type.startsWith("image/"))
      return <Image className="w-8 h-8" />;
    return <File className="w-8 h-8" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 dark:bg-black/70 p-4 backdrop-blur-sm z-[60]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md rounded-xl bg-white dark:bg-sleads-slate900 shadow-xl border border-slate-200 dark:border-sleads-slate800"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-sleads-slate800 px-5 py-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {title}
            </h3>
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-sleads-slate300 focus:outline-none transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5">
            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer",
                isDragging
                  ? "border-sleads-blue bg-sleads-blue/5"
                  : "border-slate-300 dark:border-sleads-slate700 hover:border-sleads-blue hover:bg-slate-50 dark:hover:bg-sleads-slate800",
                selectedFile && "border-green-400 bg-green-50 dark:bg-green-900/20"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedTypes}
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center text-center">
                {uploadComplete ? (
                  <CheckCircle className="w-8 h-8 text-green-500 mb-3" />
                ) : (
                  <div
                    className={cn(
                      "mb-3",
                      selectedFile
                        ? "text-green-600 dark:text-green-400"
                        : "text-slate-400"
                    )}
                  >
                    {getFileIcon()}
                  </div>
                )}

                {selectedFile ? (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate max-w-[250px]">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-sleads-slate400">
                      {formatFileSize(selectedFile.size)}
                    </p>
                    {uploadComplete && (
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                        Upload complete!
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      Drop your file here, or{" "}
                      <span className="text-sleads-blue">browse</span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-sleads-slate400">
                      Images, PDFs, documents up to 10MB
                    </p>
                  </div>
                )}
              </div>

              {/* Preview */}
              {previewUrl && (
                <div className="mt-4 flex justify-center">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-32 rounded-lg object-contain border border-slate-200 dark:border-sleads-slate700"
                  />
                </div>
              )}
            </div>

            {/* Error message */}
            {error && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-sleads-slate800 px-5 py-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-sleads-slate300 bg-white dark:bg-sleads-slate800 border border-slate-300 dark:border-sleads-slate700 rounded-lg hover:bg-slate-50 dark:hover:bg-sleads-slate700 focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || isUploading || uploadComplete}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sleads-blue rounded-lg hover:bg-sleads-blue/90 focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : uploadComplete ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Done
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

