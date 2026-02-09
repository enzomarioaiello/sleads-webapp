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
  DollarSign,
  Clock,
  X,
  Repeat,
} from "lucide-react";
import { useToast } from "@/app/hooks/useToast";
import { QuoteInvoiceBuilder } from "@/components/QuoteInvoiceBuilder/QuoteInvoiceBuilder";

export default function ProjectInvoicesPage() {
  const params = useParams();
  const projectId = params.projectId as Id<"projects">;
  const orgId = params.orgId as string;
  const { toast } = useToast();

  const invoices = useQuery(api.invoice.getInvoices, {
    projectId,
  });

  // Get subscription titles for all invoices that have subscriptions
  const subscriptionIdsForAllInvoices =
    invoices
      ?.flatMap((invoice) => invoice.subscriptionIds || [])
      .filter((id, index, self) => self.indexOf(id) === index) || [];

  const subscriptionTitles = useQuery(
    api.monthlysubscriptions.getSubscriptionTitles,
    subscriptionIdsForAllInvoices.length > 0
      ? { subscriptionIds: subscriptionIdsForAllInvoices }
      : "skip"
  );

  // Create a map of subscription ID to title for quick lookup
  const subscriptionTitleMap = React.useMemo(() => {
    if (!subscriptionTitles) return new Map();
    return new Map(subscriptionTitles.map((sub) => [sub._id, sub.title]));
  }, [subscriptionTitles]);

  const duplicateInvoice = useMutation(api.invoice.duplicateInvoice);
  const deleteInvoice = useMutation(api.invoice.deleteInvoice);
  const sendInvoice = useMutation(api.invoice.sendInvoice);
  const updateInvoiceStatus = useMutation(api.invoice.updateInvoiceStatus);

  const handleDuplicate = async (invoiceId: Id<"invoices">) => {
    await duplicateInvoice({ invoiceId });
    toast({
      title: "Invoice duplicated",
      description: "Invoice has been duplicated successfully.",
      variant: "success",
    });
  };

  const [sendingInvoiceId, setSendingInvoiceId] =
    React.useState<Id<"invoices"> | null>(null);

  const handleSend = async (invoiceId: Id<"invoices">) => {
    if (
      !confirm(
        "Are you sure you want to send this invoice? This will generate a PDF and send it to the client."
      )
    )
      return;

    setSendingInvoiceId(invoiceId);
    try {
      await sendInvoice({ invoiceId });
      toast({
        title: "Invoice sent",
        description: "Invoice is being generated and will be sent shortly.",
        variant: "success",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to send invoice.",
        variant: "error",
      });
    } finally {
      setSendingInvoiceId(null);
    }
  };

  const handleDelete = async (invoiceId: Id<"invoices">) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      await deleteInvoice({ invoiceId });
      toast({
        title: "Invoice deleted",
        description: "Invoice has been deleted successfully.",
        variant: "success",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete invoice.",
        variant: "error",
      });
    }
  };

  const handleStatusUpdate = async (
    invoiceId: Id<"invoices">,
    status: "paid" | "overdue" | "cancelled"
  ) => {
    const statusMessages = {
      paid: "Are you sure you want to mark this invoice as paid?",
      overdue: "Are you sure you want to mark this invoice as overdue?",
      cancelled: "Are you sure you want to cancel this invoice?",
    };

    if (!confirm(statusMessages[status])) return;

    try {
      await updateInvoiceStatus({ invoiceId, status });
      toast({
        title: "Invoice status updated",
        description: `Invoice has been marked as ${status} successfully.`,
        variant: "success",
      });
    } catch {
      toast({
        title: "Error",
        description: `Failed to update invoice status to ${status}.`,
        variant: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Invoices</h2>
          <p className="text-sm text-gray-500">
            Manage invoices for this project.
          </p>
        </div>
        <QuoteInvoiceBuilder
          type="invoice"
          projectId={projectId}
          organizationId={orgId}
        />
      </div>

      {!invoices ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {invoices.map((invoice) => (
            <div
              key={invoice._id}
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
                        {invoice.invoiceIdentifiefier}
                      </h3>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 uppercase tracking-wide">
                        {invoice.invoiceStatus}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleStatusUpdate(invoice._id, "paid")}
                      className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="Mark as Paid"
                    >
                      <DollarSign className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(invoice._id, "overdue")}
                      className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors"
                      title="Mark as Overdue"
                    >
                      <Clock className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() =>
                        handleStatusUpdate(invoice._id, "cancelled")
                      }
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Cancel Invoice"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-500 mb-4">
                  {invoice.subscriptionIds &&
                    invoice.subscriptionIds.length > 0 && (
                      <div className="flex items-start gap-2 pb-2 border-b border-gray-50">
                        <Repeat className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-700 mb-1">
                            Subscriptions:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {invoice.subscriptionIds.map((subId) => {
                              const title =
                                subscriptionTitleMap.get(subId) || "Unknown";
                              return (
                                <span
                                  key={subId}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                                >
                                  {title}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {invoice.invoiceDate
                        ? new Date(invoice.invoiceDate).toLocaleDateString(
                            "nl-NL"
                          )
                        : "No Date"}
                    </span>
                  </div>
                  {invoice.invoiceDueDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Due:{" "}
                        {new Date(invoice.invoiceDueDate).toLocaleDateString(
                          "nl-NL"
                        )}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium text-gray-900 pt-2 border-t border-gray-50">
                    <span>Total:</span>
                    <span>
                      €
                      {invoice.invoiceItems
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
                  {invoice.invoiceStatus === "draft" && (
                    <QuoteInvoiceBuilder
                      type="invoice"
                      docId={invoice._id}
                      projectId={projectId}
                      organizationId={orgId}
                    />
                  )}
                  {invoice.invoiceFileUrl && (
                    <a
                      href={invoice.invoiceFileUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                      title="Download Invoice PDF"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    onClick={() => handleSend(invoice._id)}
                    disabled={sendingInvoiceId === invoice._id}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Send Invoice"
                  >
                    {sendingInvoiceId === invoice._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDuplicate(invoice._id)}
                    className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-full transition-colors"
                    title="Duplicate Invoice"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(invoice._id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Delete Invoice"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {invoices.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-300 rounded-lg">
              <div className="h-12 w-12 text-gray-400 mb-4 flex items-center justify-center bg-gray-100 rounded-full">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                No invoices yet
              </h3>
              <p className="text-gray-500 mt-1">
                Create a new invoice to get started.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
