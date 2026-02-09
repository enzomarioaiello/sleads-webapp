"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { DocumentPreview } from "./DocumentPreview";
import { Plus, Pencil, X, Trash2, Languages } from "lucide-react";
import { useToast } from "@/app/hooks/useToast";
import { Language } from "@/locales/dictionary";

// Simple hook if not available
function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

interface QuoteInvoiceBuilderProps {
  type: "quote" | "invoice";
  docId?: Id<"quotes"> | Id<"invoices"> | string; // Using string to allow empty initial state easier
  projectId: Id<"projects">;
  organizationId: string;
  onDocIdChange?: (id: string) => void;
}

export const QuoteInvoiceBuilder: React.FC<QuoteInvoiceBuilderProps> = ({
  type,
  docId,
  projectId,
  organizationId,
  onDocIdChange,
}) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [internalDocId, setInternalDocId] = useState<string | undefined>(
    docId as string
  );

  // Queries
  const quote = useQuery(
    api.quote.getQuote,
    type === "quote"
      ? {
          quoteId: internalDocId as Id<"quotes"> | null,
        }
      : "skip"
  );

  const invoice = useQuery(
    api.invoice.getInvoice,
    type === "invoice"
      ? {
          invoiceId: internalDocId as Id<"invoices"> | null,
        }
      : "skip"
  );

  // Mutations
  const createQuote = useMutation(api.quote.createQuote);
  const updateQuote = useMutation(api.quote.updateQuote);
  const updateInvoice = useMutation(api.invoice.updateInvoice);
  const createInvoice = useMutation(api.invoice.createInvoice);

  // Local State for Form
  const [formData, setFormData] = useState({
    quoteDate: undefined as number | undefined,
    quoteValidUntil: undefined as number | undefined,
    invoiceDate: undefined as number | undefined,
    invoiceDueDate: undefined as number | undefined,
    quoteItems: [] as {
      name: string;
      description: string;
      quantity: number;
      priceExclTax: number;
      tax: 0 | 9 | 21;
    }[],
    language: "en" as Language,
  });

  const currentDoc = type === "quote" ? quote : invoice;
  const [language, setLanguage] = useState<Language>(
    currentDoc?.language || "en"
  );

  const [dataLoaded, setDataLoaded] = useState(false);

  // Sync from DB to Local State ONLY ONCE when opened or doc changes and data is available
  useEffect(() => {
    if (
      isOpen &&
      currentDoc &&
      !dataLoaded &&
      currentDoc._id === internalDocId
    ) {
      // Defer state update to avoid synchronous state update warning
      const timer = setTimeout(() => {
        const docLanguage = currentDoc.language || "en";
        if (type === "quote") {
          const q = currentDoc as typeof quote;
          setFormData({
            quoteDate: q?.quoteDate || undefined,
            quoteValidUntil: q?.quoteValidUntil || undefined,
            invoiceDate: undefined,
            invoiceDueDate: undefined,
            quoteItems: q?.quoteItems || [],
            language: docLanguage,
          });
        } else {
          const inv = currentDoc as typeof invoice;
          setFormData({
            quoteDate: undefined,
            quoteValidUntil: undefined,
            invoiceDate: inv?.invoiceDate || undefined,
            invoiceDueDate: inv?.invoiceDueDate || undefined,
            quoteItems: inv?.invoiceItems || [],
            language: docLanguage,
          });
        }
        setLanguage(docLanguage);
        setDataLoaded(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [currentDoc, isOpen, dataLoaded, internalDocId, type, quote, invoice]);

  // Handle Opening Modal
  const handleOpen = async () => {
    setDataLoaded(false);
    setIsOpen(true);
    if (!internalDocId && type === "quote") {
      try {
        const newId = await createQuote({
          projectId,
          organizationId: organizationId as Id<"organizations">,
        });
        setInternalDocId(newId);
        if (onDocIdChange) onDocIdChange(newId);
      } catch {
        toast({
          title: "Error",
          description: "Failed to create draft quote.",
          variant: "error",
        });
        setIsOpen(false);
      }
    }
    if (!internalDocId && type === "invoice") {
      try {
        const newId = await createInvoice({
          projectId,
          organizationId: organizationId as Id<"organizations">,
        });
        setInternalDocId(newId);
        if (onDocIdChange) onDocIdChange(newId);
      } catch {
        toast({
          title: "Error",
          description: "Failed to create draft invoice.",
          variant: "error",
        });
        setIsOpen(false);
      }
    }
  };

  // Debounced Auto-Save
  const debouncedFormData = useDebounceValue(formData, 1000);

  useEffect(() => {
    if (!internalDocId || !isOpen) return;

    const save = async () => {
      try {
        if (type === "quote") {
          await updateQuote({
            quoteId: internalDocId as Id<"quotes">,
            quoteDate: debouncedFormData.quoteDate,
            quoteValidUntil: debouncedFormData.quoteValidUntil,
            language: language,
            quoteItems: debouncedFormData.quoteItems,
          });
        }

        if (type === "invoice") {
          await updateInvoice({
            invoiceId: internalDocId as Id<"invoices">,
            invoiceDate: debouncedFormData.invoiceDate,
            invoiceDueDate: debouncedFormData.invoiceDueDate,
            language: language,
            invoiceItems: debouncedFormData.quoteItems,
          });
        }
      } catch (error) {
        console.error("Auto-save failed", error);
      }
    };
    save();
  }, [
    debouncedFormData,
    internalDocId,
    isOpen,
    type,
    updateQuote,
    updateInvoice,
    language,
  ]);

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      quoteItems: [
        ...prev.quoteItems,
        {
          name: "New Item",
          description: "",
          quantity: 1,
          priceExclTax: 0,
          tax: 21,
        },
      ],
    }));
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    setFormData((prev) => {
      const newItems = [...prev.quoteItems];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, quoteItems: newItems };
    });
  };

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      quoteItems: prev.quoteItems.filter((_, i) => i !== index),
    }));
  };

  return (
    <>
      {!docId ? (
        <button
          onClick={handleOpen}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add {type === "quote" ? "Quote" : "Invoice"}
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
            {type === "quote"
              ? quote?.quoteIdentifiefier || "Loading..."
              : invoice?.invoiceIdentifiefier || "Loading..."}
          </span>
          <button
            onClick={() => {
              setInternalDocId(docId as string);
              setDataLoaded(false);
              setIsOpen(true);
            }}
            className="p-1 hover:bg-gray-100 rounded text-gray-500"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-[95vw] h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">
                {type === "quote" ? "Edit Quote" : "Edit Invoice"}
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 border border-gray-200">
                  <Languages className="w-4 h-4 text-gray-500 ml-2" />
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    className="bg-transparent border-none text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer"
                  >
                    <option value="en">English</option>
                    <option value="nl">Nederlands</option>
                  </select>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left: Form */}
              <div className="w-1/3 border-r border-gray-200 p-6 overflow-y-auto bg-gray-50 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                    Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={
                          (
                            type === "quote"
                              ? formData.quoteDate
                              : formData.invoiceDate
                          )
                            ? new Date(
                                type === "quote"
                                  ? formData.quoteDate!
                                  : formData.invoiceDate!
                              )
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        onChange={(e) => {
                          const date = e.target.value
                            ? new Date(e.target.value).getTime()
                            : undefined;
                          if (type === "quote") {
                            setFormData({ ...formData, quoteDate: date });
                          } else {
                            setFormData({ ...formData, invoiceDate: date });
                          }
                        }}
                        // Simple handler for date input to timestamp
                        onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const date = e.target.value
                            ? new Date(e.target.value).getTime()
                            : undefined;
                          if (type === "quote") {
                            setFormData({ ...formData, quoteDate: date });
                          } else {
                            setFormData({ ...formData, invoiceDate: date });
                          }
                        }}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {type === "quote" ? "Valid Until" : "Due Date"}
                      </label>
                      <input
                        type="date"
                        value={
                          (
                            type === "quote"
                              ? formData.quoteValidUntil
                              : formData.invoiceDueDate
                          )
                            ? new Date(
                                type === "quote"
                                  ? formData.quoteValidUntil!
                                  : formData.invoiceDueDate!
                              )
                                .toISOString()
                                .split("T")[0]
                            : ""
                        }
                        onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const date = e.target.value
                            ? new Date(e.target.value).getTime()
                            : undefined;
                          if (type === "quote") {
                            setFormData({ ...formData, quoteValidUntil: date });
                          } else {
                            setFormData({ ...formData, invoiceDueDate: date });
                          }
                        }}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                      Items
                    </h3>
                    <button
                      onClick={addItem}
                      className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 font-medium"
                    >
                      + Add Item
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.quoteItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-3 relative group"
                      >
                        <button
                          onClick={() => removeItem(idx)}
                          className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <div>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) =>
                              updateItem(idx, "name", e.target.value)
                            }
                            className="w-full font-medium border-0 border-b border-transparent focus:border-blue-500 focus:ring-0 px-0 py-1 text-sm placeholder-gray-400"
                            placeholder="Item Name"
                          />
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) =>
                              updateItem(idx, "description", e.target.value)
                            }
                            className="w-full text-xs text-gray-500 border-0 border-b border-transparent focus:border-blue-500 focus:ring-0 px-0 py-1 placeholder-gray-300"
                            placeholder="Description"
                          />
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="text-[10px] text-gray-500">
                              Qty
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(
                                  idx,
                                  "quantity",
                                  parseFloat(e.target.value)
                                )
                              }
                              className="w-full rounded border-gray-200 text-sm px-2 py-1"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-[10px] text-gray-500">
                              Price
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.priceExclTax}
                              onChange={(e) =>
                                updateItem(
                                  idx,
                                  "priceExclTax",
                                  parseFloat(e.target.value)
                                )
                              }
                              className="w-full rounded border-gray-200 text-sm px-2 py-1"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-[10px] text-gray-500">
                              Tax %
                            </label>
                            <select
                              value={item.tax}
                              onChange={(e) =>
                                updateItem(idx, "tax", parseInt(e.target.value))
                              }
                              className="w-full rounded border-gray-200 text-sm px-2 py-1"
                            >
                              <option value={0}>0%</option>
                              <option value={9}>9%</option>
                              <option value={21}>21%</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Preview */}
              <div className="flex-1 bg-gray-100 p-8 overflow-y-auto overflow-x-auto flex justify-center items-start">
                {/* Live Preview logic passing current form data merged with base quote/invoice data */}
                <DocumentPreview
                  type={type}
                  quoteId={
                    type === "quote"
                      ? (internalDocId as Id<"quotes"> | null)
                      : null
                  }
                  invoiceId={
                    type === "invoice"
                      ? (internalDocId as Id<"invoices"> | null)
                      : null
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
