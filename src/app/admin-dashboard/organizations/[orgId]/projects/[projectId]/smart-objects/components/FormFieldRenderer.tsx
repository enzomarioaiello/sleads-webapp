"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState } from "react";
import {
  Plus,
  Upload,
  Trash2,
  Loader2,
  FileText,
  X,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Code,
} from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../../../../../../../convex/_generated/api";
import { useApp } from "@/app/contexts/AppContext";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { FileUploadModal } from "@/components/ui/file-upload-modal";
import { RichTextEditorModal } from "@/components/ui/rich-text-editor-modal";
import { Id } from "../../../../../../../../../convex/_generated/dataModel";

// Helper to get a friendly type label
function getElementTypeLabel(elementDef: any): string {
  if (!elementDef) return "item";
  switch (elementDef.kind) {
    case "string":
      return "text";
    case "float64":
      return "number";
    case "boolean":
      return "true/false";
    case "object":
      return "item";
    default:
      return "item";
  }
}

// Smart visual array editor based on element type
function SmartArrayEditor({
  fieldName,
  fieldValue,
  fieldDef,
  isOptional,
  formData,
  setFormData,
  t,
}: {
  fieldName: string;
  fieldValue: any;
  fieldDef: any;
  isOptional: boolean;
  formData: Record<string, any>;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  t: (key: string, params?: Record<string, string>) => string;
}) {
  const [showJsonMode, setShowJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  const elementType = fieldDef?.element?.kind || "any";
  const elementDef = fieldDef?.element;
  const items: any[] = Array.isArray(fieldValue) ? fieldValue : [];

  // Get default value for new items based on element type
  const getDefaultValue = () => {
    if (!elementDef) return "";
    switch (elementDef.kind) {
      case "string":
        return "";
      case "float64":
        return 0;
      case "boolean":
        return false;
      case "object": {
        // Create default object with all fields
        const defaultObj: Record<string, any> = {};
        if (elementDef.fields) {
          Object.entries(elementDef.fields).forEach(
            ([key, def]: [string, any]) => {
              if (def.kind === "string") defaultObj[key] = "";
              else if (def.kind === "float64") defaultObj[key] = 0;
              else if (def.kind === "boolean") defaultObj[key] = false;
              else defaultObj[key] = null;
            }
          );
        }
        return defaultObj;
      }
      default:
        return "";
    }
  };

  const addItem = () => {
    const newItems = [...items, getDefaultValue()];
    setFormData({ ...formData, [fieldName]: newItems });
    // Expand newly added item if it's an object
    if (elementType === "object") {
      setExpandedItems((prev) => new Set([...prev, newItems.length - 1]));
    }
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      [fieldName]: newItems.length > 0 ? newItems : isOptional ? null : [],
    });
    setExpandedItems((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
  };

  const updateItem = (index: number, value: any) => {
    const newItems = [...items];
    newItems[index] = value;
    setFormData({ ...formData, [fieldName]: newItems });
  };

  const toggleExpand = (index: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const switchToJsonMode = () => {
    setJsonText(JSON.stringify(items, null, 2));
    setJsonError(null);
    setShowJsonMode(true);
  };

  const applyJsonChanges = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        setJsonError(
          t(
            "dashboard_internal.project_detail.cms.smart_objects.form.value_must_be_array"
          )
        );
        return;
      }
      setFormData({ ...formData, [fieldName]: parsed });
      setShowJsonMode(false);
      setJsonError(null);
    } catch {
      setJsonError(
        t(
          "dashboard_internal.project_detail.cms.smart_objects.form.invalid_json_syntax"
        )
      );
    }
  };

  // Render input for a primitive value
  const renderPrimitiveInput = (
    value: any,
    onChange: (val: any) => void,
    type: string
  ) => {
    if (type === "boolean") {
      return (
        <select
          value={value ? "true" : "false"}
          onChange={(e) => onChange(e.target.value === "true")}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-sleads-slate700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sleads-blue dark:bg-sleads-slate800 dark:text-white"
        >
          <option value="true">
            {t(
              "dashboard_internal.project_detail.cms.smart_objects.form.true_value"
            )}
          </option>
          <option value="false">
            {t(
              "dashboard_internal.project_detail.cms.smart_objects.form.false_value"
            )}
          </option>
        </select>
      );
    }
    if (type === "float64") {
      return (
        <input
          type="number"
          value={value ?? ""}
          onChange={(e) =>
            onChange(e.target.value ? Number(e.target.value) : 0)
          }
          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-sleads-slate700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sleads-blue dark:bg-sleads-slate800 dark:text-white"
          placeholder={t(
            "dashboard_internal.project_detail.cms.smart_objects.form.enter_number"
          )}
        />
      );
    }
    // Default: string
    return (
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-sleads-slate700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sleads-blue dark:bg-sleads-slate800 dark:text-white"
        placeholder={t(
          "dashboard_internal.project_detail.cms.smart_objects.form.enter_text"
        )}
      />
    );
  };

  // Render object fields
  const renderObjectFields = (obj: Record<string, any>, index: number) => {
    if (!elementDef?.fields) {
      return (
        <div className="text-sm text-gray-500 dark:text-sleads-slate400">
          {t(
            "dashboard_internal.project_detail.cms.smart_objects.form.complex_object_use_json"
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {Object.entries(elementDef.fields).map(([key, def]: [string, any]) => {
          const fieldType = def.kind;
          const isFieldOptional = def.isOptional === "optional";
          return (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600 dark:text-sleads-slate400">
                {key}
                {!isFieldOptional && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>
              {renderPrimitiveInput(
                obj?.[key],
                (val) => updateItem(index, { ...obj, [key]: val }),
                fieldType
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // JSON mode
  if (showJsonMode) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {fieldName}
            {isOptional && (
              <span className="text-gray-500 ml-1 text-xs">(optional)</span>
            )}
          </label>
          <button
            type="button"
            onClick={() => setShowJsonMode(false)}
            className="text-xs text-sleads-blue hover:underline"
          >
            {t(
              "dashboard_internal.project_detail.cms.smart_objects.form.back_to_visual"
            )}
          </button>
        </div>
        <textarea
          value={jsonText}
          onChange={(e) => {
            setJsonText(e.target.value);
            setJsonError(null);
          }}
          rows={8}
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sleads-blue font-mono dark:bg-sleads-slate800 dark:text-white ${
            jsonError
              ? "border-red-500"
              : "border-gray-300 dark:border-sleads-slate700"
          }`}
        />
        {jsonError && <p className="text-xs text-red-500">{jsonError}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={applyJsonChanges}
            className="px-3 py-1.5 text-xs font-medium text-white bg-sleads-blue rounded-lg hover:bg-sleads-blue/90"
          >
            {t(
              "dashboard_internal.project_detail.cms.smart_objects.form.apply_changes"
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowJsonMode(false)}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-sleads-slate300 bg-gray-100 dark:bg-sleads-slate800 rounded-lg hover:bg-gray-200 dark:hover:bg-sleads-slate700"
          >
            {t(
              "dashboard_internal.project_detail.cms.smart_objects.form.cancel"
            )}
          </button>
        </div>
      </div>
    );
  }

  // Visual mode
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {fieldName}
          <span className="text-gray-500 ml-1 text-xs">
            ({items.length}{" "}
            {items.length === 1
              ? getElementTypeLabel(elementDef)
              : `${getElementTypeLabel(elementDef)}s`}
            )
          </span>
          {isOptional && (
            <span className="text-gray-500 ml-1 text-xs">(optional)</span>
          )}
        </label>
        <button
          type="button"
          onClick={switchToJsonMode}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-sleads-slate400 dark:hover:text-sleads-slate300"
          title={t(
            "dashboard_internal.project_detail.cms.smart_objects.form.edit_as_json"
          )}
        >
          <Code className="w-3 h-3" />
          JSON
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            className="border border-gray-200 dark:border-sleads-slate700 rounded-lg overflow-hidden"
          >
            {elementType === "object" ? (
              // Object item with expand/collapse
              <>
                <div
                  className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-sleads-slate800/50 cursor-pointer"
                  onClick={() => toggleExpand(index)}
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-sleads-slate300">
                      {t(
                        "dashboard_internal.project_detail.cms.smart_objects.form.item_number"
                      )}{" "}
                      {index + 1}
                    </span>
                    {!expandedItems.has(index) && elementDef?.fields && (
                      <span className="text-xs text-gray-500 dark:text-sleads-slate400 truncate max-w-[200px]">
                        {Object.keys(elementDef.fields)
                          .slice(0, 2)
                          .map((k) => `${k}: ${item?.[k] ?? "..."}`)
                          .join(", ")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem(index);
                      }}
                      className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      title={t(
                        "dashboard_internal.project_detail.cms.smart_objects.form.remove_item"
                      )}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {expandedItems.has(index) ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>
                {expandedItems.has(index) && (
                  <div className="p-3 border-t border-gray-200 dark:border-sleads-slate700">
                    {renderObjectFields(item, index)}
                  </div>
                )}
              </>
            ) : (
              // Primitive item (string, number, boolean)
              <div className="flex items-center gap-2 p-2">
                <GripVertical className="w-4 h-4 text-gray-400 shrink-0" />
                {renderPrimitiveInput(
                  item,
                  (val) => updateItem(index, val),
                  elementType
                )}
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded shrink-0"
                  title={t(
                    "dashboard_internal.project_detail.cms.smart_objects.form.remove_item"
                  )}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-sleads-blue bg-sleads-blue/5 border border-dashed border-sleads-blue/30 rounded-lg hover:bg-sleads-blue/10 transition-colors"
      >
        <Plus className="w-4 h-4" />
        {t(
          "dashboard_internal.project_detail.cms.smart_objects.form.add_item"
        )}{" "}
        {getElementTypeLabel(elementDef)}
      </button>
    </div>
  );
}

// Smart visual object editor based on field definitions
function SmartObjectEditor({
  fieldName,
  fieldValue,
  fieldDef,
  isOptional,
  formData,
  setFormData,
  t,
}: {
  fieldName: string;
  fieldValue: any;
  fieldDef: any;
  isOptional: boolean;
  formData: Record<string, any>;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  t: (key: string, params?: Record<string, string>) => string;
}) {
  const [showJsonMode, setShowJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  const objectFields = fieldDef?.fields;
  const hasKnownFields = objectFields && Object.keys(objectFields).length > 0;
  const obj: Record<string, any> =
    typeof fieldValue === "object" && fieldValue !== null ? fieldValue : {};

  const updateField = (key: string, value: any) => {
    const newObj = { ...obj, [key]: value };
    setFormData({ ...formData, [fieldName]: newObj });
  };

  const switchToJsonMode = () => {
    setJsonText(JSON.stringify(obj, null, 2));
    setJsonError(null);
    setShowJsonMode(true);
  };

  const applyJsonChanges = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        setJsonError(
          t(
            "dashboard_internal.project_detail.cms.smart_objects.form.value_must_be_object"
          )
        );
        return;
      }
      setFormData({ ...formData, [fieldName]: parsed });
      setShowJsonMode(false);
      setJsonError(null);
    } catch {
      setJsonError(
        t(
          "dashboard_internal.project_detail.cms.smart_objects.form.invalid_json_syntax"
        )
      );
    }
  };

  // Render input for a primitive value
  const renderPrimitiveInput = (key: string, value: any, def: any) => {
    const type = def?.kind || "string";
    const isFieldOptional = def?.isOptional === "optional";

    if (type === "boolean") {
      return (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600 dark:text-sleads-slate400">
            {key}
            {!isFieldOptional && <span className="text-red-500 ml-1">*</span>}
          </label>
          <select
            value={value ? "true" : "false"}
            onChange={(e) => updateField(key, e.target.value === "true")}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-sleads-slate700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sleads-blue dark:bg-sleads-slate800 dark:text-white"
          >
            <option value="true">
              {t(
                "dashboard_internal.project_detail.cms.smart_objects.form.true_value"
              )}
            </option>
            <option value="false">
              {t(
                "dashboard_internal.project_detail.cms.smart_objects.form.false_value"
              )}
            </option>
          </select>
        </div>
      );
    }
    if (type === "float64") {
      return (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600 dark:text-sleads-slate400">
            {key}
            {!isFieldOptional && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="number"
            value={value ?? ""}
            onChange={(e) =>
              updateField(
                key,
                e.target.value
                  ? Number(e.target.value)
                  : isFieldOptional
                    ? null
                    : 0
              )
            }
            className="px-3 py-2 text-sm border border-gray-300 dark:border-sleads-slate700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sleads-blue dark:bg-sleads-slate800 dark:text-white"
            placeholder={
              isFieldOptional
                ? t(
                    "dashboard_internal.project_detail.cms.smart_objects.form.optional_placeholder"
                  )
                : t(
                    "dashboard_internal.project_detail.cms.smart_objects.form.enter_number"
                  )
            }
          />
        </div>
      );
    }
    // Default: string
    return (
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600 dark:text-sleads-slate400">
          {key}
          {!isFieldOptional && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) =>
            updateField(key, e.target.value || (isFieldOptional ? null : ""))
          }
          className="px-3 py-2 text-sm border border-gray-300 dark:border-sleads-slate700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sleads-blue dark:bg-sleads-slate800 dark:text-white"
          placeholder={
            isFieldOptional
              ? t(
                  "dashboard_internal.project_detail.cms.smart_objects.form.optional_placeholder"
                )
              : t(
                  "dashboard_internal.project_detail.cms.smart_objects.form.enter_text"
                )
          }
        />
      </div>
    );
  };

  // JSON mode
  if (showJsonMode) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {fieldName}
            {isOptional && (
              <span className="text-gray-500 ml-1 text-xs">(optional)</span>
            )}
          </label>
          <button
            type="button"
            onClick={() => setShowJsonMode(false)}
            className="text-xs text-sleads-blue hover:underline"
          >
            {t(
              "dashboard_internal.project_detail.cms.smart_objects.form.back_to_visual"
            )}
          </button>
        </div>
        <textarea
          value={jsonText}
          onChange={(e) => {
            setJsonText(e.target.value);
            setJsonError(null);
          }}
          rows={8}
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sleads-blue font-mono dark:bg-sleads-slate800 dark:text-white ${
            jsonError
              ? "border-red-500"
              : "border-gray-300 dark:border-sleads-slate700"
          }`}
        />
        {jsonError && <p className="text-xs text-red-500">{jsonError}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={applyJsonChanges}
            className="px-3 py-1.5 text-xs font-medium text-white bg-sleads-blue rounded-lg hover:bg-sleads-blue/90"
          >
            {t(
              "dashboard_internal.project_detail.cms.smart_objects.form.apply_changes"
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowJsonMode(false)}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-sleads-slate300 bg-gray-100 dark:bg-sleads-slate800 rounded-lg hover:bg-gray-200 dark:hover:bg-sleads-slate700"
          >
            {t(
              "dashboard_internal.project_detail.cms.smart_objects.form.cancel"
            )}
          </button>
        </div>
      </div>
    );
  }

  // If we don't have known fields, show JSON mode by default
  if (!hasKnownFields) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {fieldName} (Object)
            {isOptional && (
              <span className="text-gray-500 ml-1 text-xs">(optional)</span>
            )}
          </label>
        </div>
        <textarea
          value={jsonText || JSON.stringify(obj, null, 2)}
          onChange={(e) => {
            setJsonText(e.target.value);
            try {
              const parsed = JSON.parse(e.target.value);
              if (
                typeof parsed === "object" &&
                parsed !== null &&
                !Array.isArray(parsed)
              ) {
                setFormData({ ...formData, [fieldName]: parsed });
                setJsonError(null);
              } else {
                setJsonError(
                  t(
                    "dashboard_internal.project_detail.cms.smart_objects.form.value_must_be_object"
                  )
                );
              }
            } catch {
              setJsonError(
                t(
                  "dashboard_internal.project_detail.cms.smart_objects.form.invalid_json"
                )
              );
            }
          }}
          rows={4}
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sleads-blue font-mono dark:bg-sleads-slate800 dark:text-white ${
            jsonError
              ? "border-red-500"
              : "border-gray-300 dark:border-sleads-slate700"
          }`}
          placeholder='{"key": "value"}'
        />
        {jsonError && <p className="text-xs text-red-500">{jsonError}</p>}
      </div>
    );
  }

  // Visual mode with known fields
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {fieldName}
          {isOptional && (
            <span className="text-gray-500 ml-1 text-xs">(optional)</span>
          )}
        </label>
        <button
          type="button"
          onClick={switchToJsonMode}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-sleads-slate400 dark:hover:text-sleads-slate300"
          title={t(
            "dashboard_internal.project_detail.cms.smart_objects.form.edit_as_json"
          )}
        >
          <Code className="w-3 h-3" />
          JSON
        </button>
      </div>

      <div className="border border-gray-200 dark:border-sleads-slate700 rounded-lg p-4 space-y-4 bg-gray-50/50 dark:bg-sleads-slate800/30">
        {Object.entries(objectFields).map(([key, def]: [string, any]) => (
          <div key={key}>{renderPrimitiveInput(key, obj[key], def)}</div>
        ))}
      </div>
    </div>
  );
}

interface FormFieldRendererProps {
  fieldName: string;
  fieldDef: any;
  tableName: string;
  fieldValue: any;
  formData: Record<string, any>;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  referencedData: Record<string, any[]>;
  loadingReferences: Record<string, boolean>;
  dateTimeValues: Record<string, { date: Date | undefined; time: string }>;
  setDateTimeValues: React.Dispatch<
    React.SetStateAction<
      Record<string, { date: Date | undefined; time: string }>
    >
  >;
  onFetchReferencedData: (tableName: string) => void;
  onCreateReferencedItem?: (tableName: string, fieldName: string) => void;
  schema?: any;
  organizationId?: Id<"organizations">;
  projectId?: Id<"projects"> | null;
}

export default function FormFieldRenderer({
  fieldName,
  fieldDef,
  tableName,
  fieldValue,
  formData,
  setFormData,
  referencedData,
  loadingReferences,
  dateTimeValues,
  setDateTimeValues,
  onFetchReferencedData,
  onCreateReferencedItem,
  organizationId,
  projectId,
}: FormFieldRendererProps) {
  const { t } = useApp();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isRichTextModalOpen, setIsRichTextModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteImage = useMutation(api.smartObjects.deleteImage);

  // Check if field is optional
  let isOptional = fieldDef.isOptional === "optional";

  // For union types, check if they have a null member
  if (fieldDef.kind === "union" && fieldDef.members) {
    const hasNullMember = fieldDef.members.some((m: any) => m.kind === "null");
    if (hasNullMember) {
      isOptional = true;
    }
  }

  // Handle id references
  if (fieldDef.kind === "id" && fieldDef.tableName) {
    const refTableName = fieldDef.tableName;
    if (!referencedData[refTableName] && !loadingReferences[refTableName]) {
      onFetchReferencedData(refTableName);
    }

    const sentinelNone = "__none";
    const currentValue = fieldValue ?? sentinelNone;

    // Build options for searchable select
    const options = [
      {
        value: sentinelNone,
        label: isOptional ? `None (optional)` : `Select ${refTableName}...`,
      },
      ...(referencedData[refTableName]?.map((item: any) => {
        let displayValue = item._id;
        if (item.name) displayValue = `${item.name} (${item._id})`;
        else if (item.email) displayValue = `${item.email} (${item._id})`;
        else if (item.title) displayValue = `${item.title} (${item._id})`;
        else if (item.slug) displayValue = `${item.slug} (${item._id})`;
        else if (item.key) displayValue = `${item.key} (${item._id})`;

        return {
          value: item._id,
          label: displayValue,
        };
      }) || []),
    ];

    return (
      <div key={fieldName} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {fieldName}
          {isOptional && (
            <span className="text-gray-500 ml-1 text-xs">(optional)</span>
          )}
          {!isOptional && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="flex gap-2">
          <SearchableSelect
            value={currentValue}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                [fieldName]:
                  value === sentinelNone ? (isOptional ? null : "") : value,
              })
            }
            options={options}
            placeholder={
              isOptional ? `None (optional)` : `Select ${refTableName}...`
            }
            searchPlaceholder={`Search ${refTableName}...`}
            emptyMessage={`No ${refTableName} found`}
            loading={loadingReferences[refTableName]}
            className="flex-1"
          />
          {onCreateReferencedItem && (
            <button
              type="button"
              onClick={() => onCreateReferencedItem(refTableName, fieldName)}
              className="px-3 py-2 text-sm font-medium text-white bg-sleads-blue rounded-lg hover:bg-sleads-blue/90 focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:ring-offset-2 transition-colors flex items-center justify-center"
              title={`Create new ${refTableName}`}
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Handle union types (often optional fields with null)
  if (fieldDef.kind === "union" && fieldDef.members) {
    const hasNullMember = fieldDef.members.some((m: any) => m.kind === "null");
    const nonNullMembers = fieldDef.members.filter(
      (m: any) => m.kind !== "null"
    );

    if (hasNullMember) {
      isOptional = true;
    }

    // If all non-null members are literals, create a select dropdown
    if (
      nonNullMembers.length > 0 &&
      nonNullMembers.every((m: any) => m.kind === "literal")
    ) {
      return (
        <div key={fieldName} className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {fieldName}
            {isOptional && (
              <span className="text-gray-500 ml-1 text-xs">(optional)</span>
            )}
            {!isOptional && <span className="text-red-500 ml-1">*</span>}
          </label>
          <Select
            value={fieldValue ?? "__none"}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                [fieldName]:
                  value === "__none" ? (isOptional ? null : "") : value,
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={isOptional ? "None (optional)" : "Select..."}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">
                {isOptional ? "None (optional)" : "Select..."}
              </SelectItem>
              {nonNullMembers.map((member: any, idx: number) => (
                <SelectItem key={idx} value={member.value}>
                  {String(member.value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    // Check if the union contains a float64 that might be a date/time
    const float64Member = nonNullMembers.find((m: any) => m.kind === "float64");
    if (float64Member) {
      const fieldNameLower = fieldName.toLowerCase();
      const isDateTimeField =
        fieldNameLower.includes("date") ||
        fieldNameLower.includes("time") ||
        fieldNameLower.includes("at") ||
        fieldNameLower === "createdat" ||
        fieldNameLower === "updatedat";

      if (isDateTimeField) {
        const dateTimeFieldDef = {
          ...float64Member,
          isOptional: hasNullMember ? "optional" : "required",
        };
        return (
          <FormFieldRenderer
            fieldName={fieldName}
            fieldDef={dateTimeFieldDef}
            tableName={tableName}
            fieldValue={fieldValue}
            formData={formData}
            setFormData={setFormData}
            referencedData={referencedData}
            loadingReferences={loadingReferences}
            dateTimeValues={dateTimeValues}
            setDateTimeValues={setDateTimeValues}
            onFetchReferencedData={onFetchReferencedData}
            organizationId={organizationId}
            projectId={projectId}
          />
        );
      }
    }

    // Otherwise, use the first non-null member
    if (nonNullMembers.length > 0) {
      const memberDef = {
        ...nonNullMembers[0],
        isOptional: hasNullMember ? "optional" : "required",
      };
      return (
        <FormFieldRenderer
          fieldName={fieldName}
          fieldDef={memberDef}
          tableName={tableName}
          fieldValue={fieldValue}
          formData={formData}
          setFormData={setFormData}
          referencedData={referencedData}
          loadingReferences={loadingReferences}
          dateTimeValues={dateTimeValues}
          setDateTimeValues={setDateTimeValues}
          onFetchReferencedData={onFetchReferencedData}
          organizationId={organizationId}
          projectId={projectId}
        />
      );
    }
  }

  // Handle string
  if (fieldDef.kind === "string") {
    // Check if field name suggests it's for files/images/urls
    const fieldNameLower = fieldName.toLowerCase();
    const isLikelyFileField =
      fieldNameLower.includes("image") ||
      fieldNameLower.includes("file") ||
      fieldNameLower.includes("url") ||
      fieldNameLower.includes("photo") ||
      fieldNameLower.includes("avatar") ||
      fieldNameLower.includes("logo") ||
      fieldNameLower.includes("thumbnail") ||
      fieldNameLower.includes("cover") ||
      fieldNameLower.includes("banner") ||
      fieldNameLower.includes("attachment") ||
      fieldNameLower.includes("media") ||
      fieldNameLower.includes("src");

    // Check if field name suggests it's for rich text content
    const isLikelyRichTextField =
      fieldNameLower.includes("richtext") ||
      fieldNameLower.includes("rich_text") ||
      fieldNameLower.includes("content") ||
      fieldNameLower.includes("body") ||
      fieldNameLower.includes("description") ||
      fieldNameLower.includes("html") ||
      fieldNameLower.includes("wysiwyg") ||
      fieldNameLower.includes("editor") ||
      fieldNameLower.includes("article") ||
      fieldNameLower.includes("post") ||
      fieldNameLower.includes("bio") ||
      fieldNameLower.includes("biography") ||
      fieldNameLower.includes("about") ||
      fieldNameLower.includes("summary") ||
      fieldNameLower.includes("notes") ||
      fieldNameLower.includes("comment") ||
      fieldNameLower.includes("message") ||
      fieldNameLower.includes("details") ||
      fieldNameLower.includes("text");

    // Check if this is an uploaded file (contains convex.cloud)
    const isUploadedFile =
      fieldValue &&
      typeof fieldValue === "string" &&
      fieldValue.includes("convex.cloud");

    const handleDeleteFile = async () => {
      if (!organizationId || !fieldValue) return;

      setIsDeleting(true);
      try {
        await deleteImage({
          organizationId,
          imageUrl: fieldValue,
        });
        // Clear the field after successful deletion
        setFormData({ ...formData, [fieldName]: "" });
      } catch (error) {
        console.error("Failed to delete file:", error);
        // Still clear the field even if deletion fails (file might already be deleted)
        setFormData({ ...formData, [fieldName]: "" });
      } finally {
        setIsDeleting(false);
      }
    };

    return (
      <div key={fieldName} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {fieldName}
          {isOptional && (
            <span className="text-gray-500 ml-1 text-xs">(optional)</span>
          )}
          {!isOptional && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={fieldValue || ""}
            onChange={(e) =>
              setFormData({ ...formData, [fieldName]: e.target.value })
            }
            required={!isOptional}
            placeholder={isOptional ? "Optional" : ""}
            readOnly={isUploadedFile}
            className={`flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-sleads-slate700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:border-transparent dark:bg-sleads-slate800 dark:text-white ${
              isUploadedFile
                ? "bg-gray-50 dark:bg-sleads-slate900 text-gray-500 dark:text-sleads-slate400 cursor-not-allowed"
                : ""
            }`}
          />
          {/* Rich Text Editor Button - only for fields that suggest rich text */}
          {!isUploadedFile && isLikelyRichTextField && (
            <button
              type="button"
              onClick={() => setIsRichTextModalOpen(true)}
              className="px-3 py-2 text-sm font-medium text-slate-700 dark:text-sleads-slate300 bg-white dark:bg-sleads-slate800 border border-slate-300 dark:border-sleads-slate700 rounded-lg hover:bg-slate-50 dark:hover:bg-sleads-slate700 focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:ring-offset-2 transition-colors flex items-center justify-center"
              title={t(
                "dashboard_internal.project_detail.cms.smart_objects.form.rich_text_editor"
              )}
            >
              <FileText className="w-4 h-4" />
            </button>
          )}
          {/* Upload Button */}
          {organizationId && isLikelyFileField && !isUploadedFile && (
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="px-3 py-2 text-sm font-medium text-slate-700 dark:text-sleads-slate300 bg-white dark:bg-sleads-slate800 border border-slate-300 dark:border-sleads-slate700 rounded-lg hover:bg-slate-50 dark:hover:bg-sleads-slate700 focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:ring-offset-2 transition-colors flex items-center justify-center"
              title={t(
                "dashboard_internal.project_detail.cms.smart_objects.form.upload_file"
              )}
            >
              <Upload className="w-4 h-4" />
            </button>
          )}
          {/* Delete Button for uploaded files */}
          {organizationId && isLikelyFileField && isUploadedFile && (
            <button
              type="button"
              onClick={handleDeleteFile}
              disabled={isDeleting}
              className="px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-white dark:bg-sleads-slate800 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              title={t(
                "dashboard_internal.project_detail.cms.smart_objects.form.delete_file"
              )}
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {/* Show image preview if value looks like an image URL */}
        {fieldValue &&
          typeof fieldValue === "string" &&
          (fieldValue.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i) ||
            fieldValue.includes("convex.cloud")) &&
          isLikelyFileField && (
            <div className="mt-2">
              <img
                src={fieldValue}
                alt="Preview"
                className="max-h-24 rounded-lg border border-slate-200 dark:border-sleads-slate700 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}

        {/* File Upload Modal */}
        {organizationId && (
          <FileUploadModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onUploadComplete={(url) => {
              setFormData({ ...formData, [fieldName]: url });
            }}
            organizationId={organizationId}
            projectId={projectId}
            title={`${t("dashboard_internal.project_detail.cms.smart_objects.form.upload_for")} ${fieldName}`}
          />
        )}

        {/* Rich Text Editor Modal */}
        <RichTextEditorModal
          isOpen={isRichTextModalOpen}
          onClose={() => setIsRichTextModalOpen(false)}
          onSave={(content) => {
            setFormData({ ...formData, [fieldName]: content });
          }}
          initialContent={fieldValue || ""}
          fieldName={fieldName}
          title={`${t("dashboard_internal.project_detail.cms.smart_objects.form.edit_rich_text")} ${fieldName}`}
          saveButtonText={t(
            "dashboard_internal.project_detail.cms.smart_objects.form.save"
          )}
          cancelButtonText={t(
            "dashboard_internal.project_detail.cms.smart_objects.form.cancel"
          )}
        />
      </div>
    );
  }

  // Handle number/float64 - check if it's a date/time field
  if (fieldDef.kind === "float64") {
    const fieldNameLower = fieldName.toLowerCase();
    const isDateTimeField =
      fieldNameLower.includes("date") ||
      fieldNameLower.includes("time") ||
      fieldNameLower.includes("at") ||
      fieldNameLower === "createdat" ||
      fieldNameLower === "updatedat";

    if (isDateTimeField) {
      // Initialize date/time values if not set
      if (!dateTimeValues[fieldName]) {
        let initialDate: Date | undefined;
        let initialTime = "00:00";

        if (fieldValue && typeof fieldValue === "number") {
          const timestamp =
            fieldValue > 10000000000 ? fieldValue : fieldValue * 1000;
          const date = new Date(timestamp);
          if (!isNaN(date.getTime())) {
            initialDate = date;
            initialTime = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
          }
        }

        setDateTimeValues((prev) => ({
          ...prev,
          [fieldName]: { date: initialDate, time: initialTime },
        }));
      }

      const dateTimeValue = dateTimeValues[fieldName] || {
        date: undefined,
        time: "00:00",
      };

      return (
        <div key={fieldName} className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-medium text-gray-700">
              {fieldName}
              {isOptional && (
                <span className="text-gray-500 ml-1 text-xs">(optional)</span>
              )}
              {!isOptional && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>
          <DateTimePicker
            date={dateTimeValue.date}
            time={dateTimeValue.time}
            onDateChange={(date) => {
              setDateTimeValues((prev) => ({
                ...prev,
                [fieldName]: { ...dateTimeValue, date },
              }));
              if (date) {
                const [hours, minutes] = dateTimeValue.time
                  .split(":")
                  .map(Number);
                date.setHours(hours || 0, minutes || 0, 0, 0);
                setFormData({
                  ...formData,
                  [fieldName]: date.getTime(),
                });
              } else {
                setFormData({
                  ...formData,
                  [fieldName]: isOptional ? null : Date.now(),
                });
              }
            }}
            onTimeChange={(time) => {
              setDateTimeValues((prev) => ({
                ...prev,
                [fieldName]: { ...dateTimeValue, time },
              }));
              if (dateTimeValue.date) {
                const [hours, minutes] = time.split(":").map(Number);
                const newDate = new Date(dateTimeValue.date);
                newDate.setHours(hours || 0, minutes || 0, 0, 0);
                setFormData({
                  ...formData,
                  [fieldName]: newDate.getTime(),
                });
              }
            }}
            dateLabel="Date"
            timeLabel="Time"
            dateId={`${fieldName}-date`}
            timeId={`${fieldName}-time`}
            required={!isOptional}
          />
        </div>
      );
    }

    // Regular number input for non-date/time fields
    return (
      <div key={fieldName} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {fieldName}
          {isOptional && (
            <span className="text-gray-500 ml-1 text-xs">(optional)</span>
          )}
          {!isOptional && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          type="number"
          step="any"
          value={fieldValue ?? ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              [fieldName]: e.target.value
                ? Number(e.target.value)
                : isOptional
                  ? null
                  : 0,
            })
          }
          required={!isOptional}
          placeholder={isOptional ? "Optional" : ""}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:border-transparent"
        />
      </div>
    );
  }

  // Handle boolean
  if (fieldDef.kind === "boolean") {
    return (
      <div key={fieldName} className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={fieldValue || false}
            onChange={(e) =>
              setFormData({ ...formData, [fieldName]: e.target.checked })
            }
            className="w-4 h-4 text-sleads-blue border-gray-300 rounded focus:ring-sleads-blue"
          />
          <span className="text-sm font-medium text-gray-700">
            {fieldName}
            {isOptional && (
              <span className="text-gray-500 ml-1 text-xs">(optional)</span>
            )}
            {!isOptional && <span className="text-red-500 ml-1">*</span>}
          </span>
        </label>
      </div>
    );
  }

  // Handle literal (enum-like)
  if (fieldDef.kind === "literal") {
    return (
      <div key={fieldName} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          {fieldName}
          {isOptional && (
            <span className="text-gray-500 ml-1 text-xs">(optional)</span>
          )}
          {!isOptional && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          type="text"
          value={fieldDef.value}
          readOnly
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
        />
      </div>
    );
  }

  // Handle array
  if (fieldDef.kind === "array") {
    return (
      <SmartArrayEditor
        fieldName={fieldName}
        fieldValue={fieldValue}
        fieldDef={fieldDef}
        isOptional={isOptional}
        formData={formData}
        setFormData={setFormData}
        t={t}
      />
    );
  }

  // Handle object
  if (fieldDef.kind === "object") {
    return (
      <SmartObjectEditor
        fieldName={fieldName}
        fieldValue={fieldValue}
        fieldDef={fieldDef}
        isOptional={isOptional}
        formData={formData}
        setFormData={setFormData}
        t={t}
      />
    );
  }

  // Default: textarea for unknown types
  return (
    <div key={fieldName} className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {fieldName} (JSON)
        {isOptional && (
          <span className="text-gray-500 ml-1 text-xs">(optional)</span>
        )}
        {!isOptional && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        value={
          typeof fieldValue === "object"
            ? JSON.stringify(fieldValue, null, 2)
            : String(fieldValue ?? "")
        }
        onChange={(e) => {
          try {
            const parsed = JSON.parse(e.target.value);
            setFormData({ ...formData, [fieldName]: parsed });
          } catch {
            setFormData({ ...formData, [fieldName]: e.target.value });
          }
        }}
        required={!isOptional}
        rows={3}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:border-transparent font-mono"
        placeholder={isOptional ? "Optional" : ""}
      />
    </div>
  );
}
