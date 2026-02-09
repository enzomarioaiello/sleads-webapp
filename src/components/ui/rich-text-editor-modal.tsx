"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { TextEditor } from "@/components/TextEditor/TextEditor";

interface RichTextEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (content: string) => void;
  initialContent: string;
  fieldName: string;
  title?: string;
  saveButtonText?: string;
  cancelButtonText?: string;
}

export function RichTextEditorModal({
  isOpen,
  onClose,
  onSave,
  initialContent,
  fieldName,
  title,
  saveButtonText = "Save",
  cancelButtonText = "Cancel",
}: RichTextEditorModalProps) {
  const [content, setContent] = useState(initialContent || "");

  // Reset content when modal opens with new initial content
  useEffect(() => {
    if (isOpen) {
      setContent(initialContent || "");
    }
  }, [isOpen, initialContent]);

  const handleSave = () => {
    onSave(content);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 dark:bg-black/70 p-4 backdrop-blur-sm z-[60]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-5xl max-h-[90vh] rounded-xl bg-white dark:bg-sleads-slate900 shadow-xl border border-slate-200 dark:border-sleads-slate800 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-sleads-slate800 px-6 py-4 shrink-0">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {title || `Edit ${fieldName}`}
              </h3>
              <p className="text-sm text-slate-500 dark:text-sleads-slate400 mt-0.5">
                {fieldName}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-sleads-slate300 focus:outline-none transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Editor Content */}
          <div className="flex-1 overflow-hidden p-4">
            <TextEditor
              content={content}
              onChange={setContent}
              placeholder="Start writing..."
              className="h-full max-h-[calc(90vh-200px)]"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-sleads-slate800 px-6 py-4 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-sleads-slate300 bg-white dark:bg-sleads-slate800 border border-slate-300 dark:border-sleads-slate700 rounded-lg hover:bg-slate-50 dark:hover:bg-sleads-slate700 focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:ring-offset-2 transition-colors"
            >
              {cancelButtonText}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sleads-blue rounded-lg hover:bg-sleads-blue/90 focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:ring-offset-2 transition-colors"
            >
              <Check className="w-4 h-4" />
              {saveButtonText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

