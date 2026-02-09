"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../../convex/_generated/dataModel";
import {
  Loader2,
  Trash2,
  FileText,
  Calendar,
  Send,
  Download,
  Copy,
  ArrowUp,
  Plus,
  Minus,
} from "lucide-react";
import { useToast } from "@/app/hooks/useToast";
import { QuoteInvoiceBuilder } from "@/components/QuoteInvoiceBuilder/QuoteInvoiceBuilder";
import { Modal } from "@/app/admin-dashboard/components/ui/Modal";
import { Input } from "@/app/admin-dashboard/components/ui/Input";
import { Button } from "@/app/admin-dashboard/components/ui/Button";

export default function ProjectQuotesPage() {
  const params = useParams();
  const projectId = params.projectId as Id<"projects">;
  const orgId = params.orgId as string;
  const { toast } = useToast();

  const quotes = useQuery(api.quote.getQuotes, {
    projectId,
  });

  const duplicateQuote = useMutation(api.quote.duplicateQuote);
  const deleteQuote = useMutation(api.quote.deleteQuote);
  const sendQuote = useMutation(api.quote.sendQuote);
  const addInvoicesBasedOnQuote = useMutation(
    api.invoice.addInvoicesBasedOnQuote
  );

  const [isDivisionModalOpen, setIsDivisionModalOpen] = React.useState(false);
  const [selectedQuoteId, setSelectedQuoteId] =
    React.useState<Id<"quotes"> | null>(null);
  const [divisions, setDivisions] = React.useState<number[]>([100]);
  const [isCreatingInvoices, setIsCreatingInvoices] = React.useState(false);

  const handleDuplicate = async (quoteId: Id<"quotes">) => {
    await duplicateQuote({ quoteId });
    toast({
      title: "Quote duplicated",
      description: "Quote has been duplicated successfully.",
      variant: "success",
    });
  };

  const [sendingQuoteId, setSendingQuoteId] =
    React.useState<Id<"quotes"> | null>(null);

  const handleSend = async (quoteId: Id<"quotes">) => {
    if (
      !confirm(
        "Are you sure you want to send this quote? This will generate a PDF and send it to the client."
      )
    )
      return;

    setSendingQuoteId(quoteId);
    try {
      await sendQuote({ quoteId });
      toast({
        title: "Quote sent",
        description: "Quote is being generated and will be sent shortly.",
        variant: "success",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to send quote.",
        variant: "error",
      });
    } finally {
      setSendingQuoteId(null);
    }
  };

  const handleDelete = async (quoteId: Id<"quotes">) => {
    if (!confirm("Are you sure you want to delete this quote?")) return;
    try {
      await deleteQuote({ quoteId });
      toast({
        title: "Quote deleted",
        description: "Quote has been deleted successfully.",
        variant: "success",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete quote.",
        variant: "error",
      });
    }
  };

  const handleOpenDivisionModal = (quoteId: Id<"quotes">) => {
    setSelectedQuoteId(quoteId);
    setDivisions([100]);
    setIsDivisionModalOpen(true);
  };

  const handleCloseDivisionModal = () => {
    setIsDivisionModalOpen(false);
    setSelectedQuoteId(null);
    setDivisions([100]);
  };

  const handleAddDivision = () => {
    if (divisions.length < 5) {
      setDivisions([...divisions, 0]);
    }
  };

  const handleRemoveDivision = (index: number) => {
    if (divisions.length > 1) {
      setDivisions(divisions.filter((_, i) => i !== index));
    }
  };

  const handleDivisionChange = (index: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newDivisions = [...divisions];
    newDivisions[index] = Math.max(0, Math.min(100, numValue));
    setDivisions(newDivisions);
  };

  const totalPercentage = divisions.reduce((sum, val) => sum + val, 0);
  const isValid = Math.abs(totalPercentage - 100) < 0.01; // Allow small floating point differences

  const handleCreateInvoices = async () => {
    if (!selectedQuoteId || !isValid) return;

    setIsCreatingInvoices(true);
    try {
      await addInvoicesBasedOnQuote({
        quoteId: selectedQuoteId,
        invoiceSplit: divisions,
      });
      toast({
        title: "Invoices created",
        description: `Successfully created ${divisions.length} invoice(s) from this quote.`,
        variant: "success",
      });
      handleCloseDivisionModal();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create invoices from quote.",
        variant: "error",
      });
    } finally {
      setIsCreatingInvoices(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Quotes</h2>
          <p className="text-sm text-gray-500">
            Manage quotes for this project.
          </p>
        </div>
        <QuoteInvoiceBuilder
          type="quote"
          projectId={projectId}
          organizationId={orgId}
        />
      </div>

      {!quotes ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {quotes.map((quote) => (
            <div
              key={quote._id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {quote.quoteIdentifiefier}
                      </h3>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 uppercase tracking-wide">
                        {quote.quoteStatus}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenDivisionModal(quote._id)}
                    className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                    title="Create Invoices from Quote"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {quote.quoteDate
                        ? new Date(quote.quoteDate).toLocaleDateString("nl-NL")
                        : "No Date"}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium text-gray-900 pt-2 border-t border-gray-50">
                    <span>Total:</span>
                    <span>
                      €
                      {quote.quoteItems
                        ?.reduce(
                          (acc, item) =>
                            acc +
                            item.quantity *
                              item.priceExclTax *
                              (1 + item.tax / 100),
                          0
                        )
                        .toFixed(2) || "0.00"}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  {quote.quoteStatus === "draft" && (
                    <QuoteInvoiceBuilder
                      type="quote"
                      docId={quote._id}
                      projectId={projectId}
                      organizationId={orgId}
                    />
                  )}
                  {quote.quoteFileUrl && (
                    <a
                      href={quote.quoteFileUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                      title="Download Quote PDF"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    onClick={() => handleSend(quote._id)}
                    disabled={sendingQuoteId === quote._id}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Send Quote"
                  >
                    {sendingQuoteId === quote._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDuplicate(quote._id)}
                    className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-full transition-colors"
                    title="Duplicate Quote"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(quote._id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Delete Quote"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {quotes.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-300 rounded-lg">
              <div className="h-12 w-12 text-gray-400 mb-4 flex items-center justify-center bg-gray-100 rounded-full">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                No quotes yet
              </h3>
              <p className="text-gray-500 mt-1">
                Create a new quote to get started.
              </p>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isDivisionModalOpen}
        onClose={handleCloseDivisionModal}
        title="Create Invoices from Quote"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Divide this quote into multiple invoices. Each division represents a
            percentage of the total quote amount. The percentages must add up to
            100%.
          </p>

          <div className="space-y-3">
            {divisions.map((division, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Invoice {index + 1} (%)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={division === 0 ? "" : division}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleDivisionChange(index, e.target.value)
                    }
                    placeholder="0"
                    className="w-full"
                  />
                </div>
                {divisions.length > 1 && (
                  <button
                    onClick={() => handleRemoveDivision(index)}
                    className="mt-6 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Remove division"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {divisions.length < 5 && (
            <button
              onClick={handleAddDivision}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Another Invoice
            </button>
          )}

          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-700">Total:</span>
              <span
                className={`text-sm font-bold ${
                  isValid ? "text-green-600" : "text-red-600"
                }`}
              >
                {totalPercentage.toFixed(2)}%
              </span>
            </div>
            {!isValid && (
              <p className="text-xs text-red-600 mb-4">
                The percentages must add up to exactly 100%
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={handleCloseDivisionModal}
              disabled={isCreatingInvoices}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateInvoices}
              disabled={!isValid || isCreatingInvoices}
              isLoading={isCreatingInvoices}
            >
              Create Invoices
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
