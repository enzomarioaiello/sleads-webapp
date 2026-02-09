"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Highlighter,
  Palette,
} from "lucide-react";
import { useCallback, useEffect } from "react";
import { cn } from "@/app/utils/cn";

interface TextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
}

export function TextEditor({
  content,
  onChange,
  placeholder = "Start typing...",
  editable = true,
  className,
}: TextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class:
            "text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300",
        },
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "focus:outline-none min-h-[500px] px-6 py-8 max-w-4xl mx-auto text-gray-900 dark:text-white prose prose-slate dark:prose-invert max-w-none",
      },
    },
  });

  const setLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) {
      return;
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const setColor = useCallback(
    (color: string) => {
      if (!editor) return;
      editor.chain().focus().setColor(color).run();
    },
    [editor]
  );

  // Update editor content when content prop changes (e.g., when file loads)
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentContent = editor.getHTML();
      // Only update if content is actually different to avoid unnecessary updates
      if (currentContent !== content) {
        editor.commands.setContent(content, { emitUpdate: false }); // Don't emit update to avoid infinite loop
      }
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div
      className={cn(
        "border border-gray-200 dark:border-sleads-slate800 rounded-xl bg-white dark:bg-sleads-slate900 shadow-lg overflow-hidden",
        className
      )}
    >
      {/* Toolbar */}
      {editable && (
        <div className="border-b border-gray-200 dark:border-sleads-slate800 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-sleads-slate800 dark:to-sleads-slate800 px-4 py-3 flex items-center gap-1 flex-wrap shadow-sm">
          {/* Text Formatting */}
          <div className="flex items-center gap-0.5 border-r border-gray-300 dark:border-sleads-slate700 pr-2 mr-2">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={!editor.can().chain().focus().toggleBold().run()}
              className={cn(
                "p-2 rounded-md hover:bg-white dark:hover:bg-sleads-slate700 transition-all duration-150 text-gray-600 dark:text-sleads-slate300",
                editor.isActive("bold") &&
                  "bg-white dark:bg-sleads-slate700 shadow-sm text-blue-600 dark:text-blue-400"
              )}
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={!editor.can().chain().focus().toggleItalic().run()}
              className={cn(
                "p-2 rounded-md hover:bg-white dark:hover:bg-sleads-slate700 transition-all duration-150 text-gray-600 dark:text-sleads-slate300",
                editor.isActive("italic") &&
                  "bg-white dark:bg-sleads-slate700 shadow-sm text-blue-600 dark:text-blue-400"
              )}
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              disabled={!editor.can().chain().focus().toggleStrike().run()}
              className={cn(
                "p-2 rounded-md hover:bg-white dark:hover:bg-sleads-slate700 transition-all duration-150 text-gray-600 dark:text-sleads-slate300",
                editor.isActive("strike") &&
                  "bg-white dark:bg-sleads-slate700 shadow-sm text-blue-600 dark:text-blue-400"
              )}
              title="Strikethrough"
            >
              <Strikethrough className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCode().run()}
              disabled={!editor.can().chain().focus().toggleCode().run()}
              className={cn(
                "p-2 rounded-md hover:bg-white dark:hover:bg-sleads-slate700 transition-all duration-150 text-gray-600 dark:text-sleads-slate300",
                editor.isActive("code") &&
                  "bg-white dark:bg-sleads-slate700 shadow-sm text-blue-600 dark:text-blue-400"
              )}
              title="Code"
            >
              <Code className="w-4 h-4" />
            </button>
          </div>

          {/* Headings */}
          <div className="flex items-center gap-0.5 border-r border-gray-300 dark:border-sleads-slate700 pr-2 mr-2">
            <button
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              className={cn(
                "p-2 rounded-md hover:bg-white dark:hover:bg-sleads-slate700 transition-all duration-150 text-gray-600 dark:text-sleads-slate300",
                editor.isActive("heading", { level: 1 }) &&
                  "bg-white dark:bg-sleads-slate700 shadow-sm text-blue-600 dark:text-blue-400"
              )}
              title="Heading 1"
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              className={cn(
                "p-2 rounded-md hover:bg-white dark:hover:bg-sleads-slate700 transition-all duration-150 text-gray-600 dark:text-sleads-slate300",
                editor.isActive("heading", { level: 2 }) &&
                  "bg-white dark:bg-sleads-slate700 shadow-sm text-blue-600 dark:text-blue-400"
              )}
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              className={cn(
                "p-2 rounded-md hover:bg-white dark:hover:bg-sleads-slate700 transition-all duration-150 text-gray-600 dark:text-sleads-slate300",
                editor.isActive("heading", { level: 3 }) &&
                  "bg-white dark:bg-sleads-slate700 shadow-sm text-blue-600 dark:text-blue-400"
              )}
              title="Heading 3"
            >
              <Heading3 className="w-4 h-4" />
            </button>
          </div>

          {/* Lists */}
          <div className="flex items-center gap-0.5 border-r border-gray-300 dark:border-sleads-slate700 pr-2 mr-2">
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={cn(
                "p-2 rounded-md hover:bg-white dark:hover:bg-sleads-slate700 transition-all duration-150 text-gray-600 dark:text-sleads-slate300",
                editor.isActive("bulletList") &&
                  "bg-white dark:bg-sleads-slate700 shadow-sm text-blue-600 dark:text-blue-400"
              )}
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={cn(
                "p-2 rounded-md hover:bg-white dark:hover:bg-sleads-slate700 transition-all duration-150 text-gray-600 dark:text-sleads-slate300",
                editor.isActive("orderedList") &&
                  "bg-white dark:bg-sleads-slate700 shadow-sm text-blue-600 dark:text-blue-400"
              )}
              title="Ordered List"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={cn(
                "p-2 rounded-md hover:bg-white dark:hover:bg-sleads-slate700 transition-all duration-150 text-gray-600 dark:text-sleads-slate300",
                editor.isActive("blockquote") &&
                  "bg-white dark:bg-sleads-slate700 shadow-sm text-blue-600 dark:text-blue-400"
              )}
              title="Quote"
            >
              <Quote className="w-4 h-4" />
            </button>
          </div>

          {/* Links & Colors */}
          <div className="flex items-center gap-0.5 border-r border-gray-300 dark:border-sleads-slate700 pr-2 mr-2">
            <button
              onClick={setLink}
              className={cn(
                "p-2 rounded-md hover:bg-white dark:hover:bg-sleads-slate700 transition-all duration-150 text-gray-600 dark:text-sleads-slate300",
                editor.isActive("link") &&
                  "bg-white dark:bg-sleads-slate700 shadow-sm text-blue-600 dark:text-blue-400"
              )}
              title="Link"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
            <div className="relative group">
              <button
                className={cn(
                  "p-2 rounded-md hover:bg-white dark:hover:bg-sleads-slate700 transition-all duration-150 text-gray-600 dark:text-sleads-slate300",
                  editor.isActive("textStyle") &&
                    "bg-white dark:bg-sleads-slate700 shadow-sm text-blue-600 dark:text-blue-400"
                )}
                title="Text Color"
              >
                <Palette className="w-4 h-4" />
              </button>
              <div className="absolute left-0 top-full mt-2 bg-white dark:bg-sleads-slate800 border border-gray-200 dark:border-sleads-slate700 rounded-lg shadow-xl p-3 z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 grid grid-cols-6 gap-2">
                {[
                  "#000000",
                  "#374151",
                  "#6B7280",
                  "#EF4444",
                  "#F59E0B",
                  "#10B981",
                  "#3B82F6",
                  "#8B5CF6",
                  "#EC4899",
                ].map((color) => (
                  <button
                    key={color}
                    onClick={() => setColor(color)}
                    className="w-7 h-7 rounded-md border-2 border-gray-200 dark:border-sleads-slate600 hover:scale-125 hover:border-gray-400 dark:hover:border-sleads-slate400 transition-all shadow-sm"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className={cn(
                "p-2 rounded-md hover:bg-white dark:hover:bg-sleads-slate700 transition-all duration-150 text-gray-600 dark:text-sleads-slate300",
                editor.isActive("highlight") &&
                  "bg-white dark:bg-sleads-slate700 shadow-sm text-blue-600 dark:text-blue-400"
              )}
              title="Highlight"
            >
              <Highlighter className="w-4 h-4" />
            </button>
          </div>

          {/* Undo/Redo */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().chain().focus().undo().run()}
              className="p-2 rounded-md hover:bg-white dark:hover:bg-sleads-slate700 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 dark:text-sleads-slate300"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().chain().focus().redo().run()}
              className="p-2 rounded-md hover:bg-white dark:hover:bg-sleads-slate700 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed text-gray-600 dark:text-sleads-slate300"
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Editor Content */}
      <div className="overflow-y-auto max-h-[calc(100vh-300px)] bg-gradient-to-b from-white to-gray-50/30 dark:from-sleads-slate900 dark:to-sleads-slate900/50">
        <div className="max-w-4xl mx-auto">
          <EditorContent
            editor={editor}
            className="min-h-[600px] focus-within:outline-none prose prose-slate dark:prose-invert max-w-none"
          />
        </div>
      </div>
    </div>
  );
}
