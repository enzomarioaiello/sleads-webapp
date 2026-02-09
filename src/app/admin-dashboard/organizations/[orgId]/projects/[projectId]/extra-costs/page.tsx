"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../../../convex/_generated/api";
import { Id, Doc } from "../../../../../../../../convex/_generated/dataModel";
import {
  Loader2,
  Trash2,
  DollarSign,
  Plus,
  Edit,
  X,
  Check,
  Calendar,
  Receipt,
} from "lucide-react";
import { useToast } from "@/app/hooks/useToast";
import { Modal } from "@/app/admin-dashboard/components/ui/Modal";
import { Input } from "@/app/admin-dashboard/components/ui/Input";
import { Button } from "@/app/admin-dashboard/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ExtraCost = Doc<"extra_costs">;

export default function ProjectExtraCostsPage() {
  const params = useParams();
  const projectId = params.projectId as Id<"projects">;
  const orgId = params.orgId as string;
  const { toast } = useToast();

  const extraCosts = useQuery(api.extraCosts.getExtraCosts, {
    projectId,
  });

  const createExtraCost = useMutation(api.extraCosts.createExtraCost);
  const updateExtraCost = useMutation(api.extraCosts.updateExtraCost);
  const deleteExtraCost = useMutation(api.extraCosts.deleteExtraCost);
  const voidExtraCost = useMutation(api.extraCosts.voidExtraCost);
  const unvoidExtraCost = useMutation(api.extraCosts.unvoidExtraCost);

  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);
  const [editingExtraCost, setEditingExtraCost] =
    React.useState<ExtraCost | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form state
  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    amount: "",
    priceExclTax: "",
    tax: "21" as "0" | "9" | "21",
    showSeparatelyOnInvoice: false,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      amount: "",
      priceExclTax: "",
      tax: "21",
      showSeparatelyOnInvoice: false,
    });
    setEditingExtraCost(null);
  };

  const handleOpenForm = (extraCost?: ExtraCost) => {
    if (extraCost) {
      setEditingExtraCost(extraCost);
      setFormData({
        name: extraCost.name,
        description: extraCost.description,
        amount: extraCost.amount.toString(),
        priceExclTax: extraCost.priceExclTax.toString(),
        tax: extraCost.tax.toString() as "0" | "9" | "21",
        showSeparatelyOnInvoice: extraCost.showSeparatelyOnInvoice ?? false,
      });
    } else {
      resetForm();
    }
    setIsFormModalOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingExtraCost) {
        await updateExtraCost({
          extraCostId: editingExtraCost._id,
          name: formData.name,
          description: formData.description,
          amount: parseFloat(formData.amount),
          priceExclTax: parseFloat(formData.priceExclTax),
          tax: parseInt(formData.tax) as 0 | 9 | 21,
          showSeparatelyOnInvoice: formData.showSeparatelyOnInvoice,
        });
        toast({
          title: "Extra cost updated",
          description: "Extra cost has been updated successfully.",
          variant: "success",
        });
      } else {
        await createExtraCost({
          projectId,
          organizationId: orgId as Id<"organizations">,
          name: formData.name,
          description: formData.description,
          amount: parseFloat(formData.amount),
          priceExclTax: parseFloat(formData.priceExclTax),
          tax: parseInt(formData.tax) as 0 | 9 | 21,
          showSeparatelyOnInvoice: formData.showSeparatelyOnInvoice,
        });
        toast({
          title: "Extra cost created",
          description: "Extra cost has been created successfully.",
          variant: "success",
        });
      }
      handleCloseForm();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save extra cost.",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (extraCostId: Id<"extra_costs">) => {
    if (
      !confirm(
        "Are you sure you want to delete this extra cost? This action cannot be undone."
      )
    )
      return;

    try {
      await deleteExtraCost({ extraCostId });
      toast({
        title: "Extra cost deleted",
        description: "Extra cost has been deleted successfully.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete extra cost.",
        variant: "error",
      });
    }
  };

  const handleVoid = async (extraCostId: Id<"extra_costs">) => {
    try {
      await voidExtraCost({ extraCostId });
      toast({
        title: "Extra cost voided",
        description:
          "Extra cost has been voided and will not be included in invoices.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to void extra cost.",
        variant: "error",
      });
    }
  };

  const handleUnvoid = async (extraCostId: Id<"extra_costs">) => {
    try {
      await unvoidExtraCost({ extraCostId });
      toast({
        title: "Extra cost unvoided",
        description: "Extra cost will now be included in invoices.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to unvoid extra cost.",
        variant: "error",
      });
    }
  };

  const getStatusBadges = (extraCost: ExtraCost) => {
    const badges = [];
    const isInvoiced =
      extraCost.invoicedDate !== null || extraCost.invoiceId !== null;
    const isVoided = extraCost.voided === true;
    const isSeparate = extraCost.showSeparatelyOnInvoice === true;

    if (isInvoiced) {
      badges.push(
        <span
          key="invoiced"
          className="text-xs font-medium px-2 py-0.5 rounded-full uppercase tracking-wide bg-blue-100 text-blue-700"
        >
          Invoiced
        </span>
      );
    } else if (isVoided) {
      badges.push(
        <span
          key="voided"
          className="text-xs font-medium px-2 py-0.5 rounded-full uppercase tracking-wide bg-gray-100 text-gray-700"
        >
          Voided
        </span>
      );
    } else {
      badges.push(
        <span
          key="uninvoiced"
          className="text-xs font-medium px-2 py-0.5 rounded-full uppercase tracking-wide bg-green-100 text-green-700"
        >
          Uninvoiced
        </span>
      );
    }

    if (isSeparate) {
      badges.push(
        <span
          key="separate"
          className="text-xs font-medium px-2 py-0.5 rounded-full uppercase tracking-wide bg-purple-100 text-purple-700"
        >
          Separate
        </span>
      );
    } else {
      badges.push(
        <span
          key="grouped"
          className="text-xs font-medium px-2 py-0.5 rounded-full uppercase tracking-wide bg-yellow-100 text-yellow-700"
        >
          Grouped
        </span>
      );
    }

    return badges;
  };

  const calculateTotal = (amount: number, priceExclTax: number) => {
    return amount * priceExclTax;
  };

  const calculateTax = (priceExclTax: number, tax: 0 | 9 | 21) => {
    return priceExclTax * (tax / 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Extra Costs</h2>
          <p className="text-sm text-gray-500">
            Manage one-time costs and reimbursements for this project.
          </p>
        </div>
        <Button onClick={() => handleOpenForm()} variant="primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Extra Cost
        </Button>
      </div>

      {!extraCosts ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {extraCosts.map((extraCost) => {
            const isInvoiced =
              extraCost.invoicedDate !== null || extraCost.invoiceId !== null;
            const isVoided = extraCost.voided === true;
            const isSeparate = extraCost.showSeparatelyOnInvoice === true;
            // For both separate and grouped items, amount is quantity and priceExclTax is price per unit
            // Total is always quantity × price per unit
            const total = calculateTotal(
              extraCost.amount,
              extraCost.priceExclTax
            );
            const taxAmount = calculateTax(total, extraCost.tax);
            const totalWithTax = total + taxAmount;

            return (
              <div
                key={extraCost._id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm truncate">
                          {extraCost.name}
                        </h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {getStatusBadges(extraCost)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                    {extraCost.description}
                  </p>

                  <div className="space-y-1.5 text-xs text-gray-600 mb-3">
                    {isSeparate ? (
                      <>
                        <div className="flex justify-between">
                          <span>Quantity:</span>
                          <span className="font-medium">
                            {extraCost.amount}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Price per unit:</span>
                          <span className="font-medium">
                            €{extraCost.priceExclTax.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between font-medium text-gray-900 pt-1 border-t border-gray-100">
                          <span>Subtotal:</span>
                          <span>€{total.toFixed(2)}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span>Quantity:</span>
                          <span className="font-medium">
                            {extraCost.amount}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Price per unit:</span>
                          <span className="font-medium">
                            {extraCost.priceExclTax < 0 ? "-" : ""}€
                            {Math.abs(extraCost.priceExclTax).toFixed(3)}
                          </span>
                        </div>
                        <div className="flex justify-between font-medium text-gray-900 pt-1 border-t border-gray-100">
                          <span>Subtotal:</span>
                          <span>
                            {total < 0 ? "-" : ""}€{Math.abs(total).toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span>Tax ({extraCost.tax}%):</span>
                      <span className="font-medium">
                        {taxAmount < 0 ? "-" : ""}€
                        {Math.abs(taxAmount).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-200">
                      <span>Total:</span>
                      <span>
                        {totalWithTax < 0 ? "-" : ""}€
                        {Math.abs(totalWithTax).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-gray-500 mb-3">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Created:{" "}
                        {new Date(extraCost.createdAt).toLocaleDateString(
                          "nl-NL"
                        )}
                      </span>
                    </div>
                    {isInvoiced && extraCost.invoiceId && (
                      <div className="flex items-center gap-1.5">
                        <Receipt className="w-3 h-3" />
                        <span>Invoice ID: {extraCost.invoiceId.slice(-8)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-1.5 pt-2 border-t border-gray-100">
                    {!isInvoiced && (
                      <>
                        {isVoided ? (
                          <button
                            onClick={() => handleUnvoid(extraCost._id)}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Unvoid Extra Cost"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleVoid(extraCost._id)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
                            title="Void Extra Cost"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenForm(extraCost)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit Extra Cost"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                    {!isInvoiced && (
                      <button
                        onClick={() => handleDelete(extraCost._id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete Extra Cost"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {extraCosts.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-300 rounded-lg">
              <div className="h-12 w-12 text-gray-400 mb-4 flex items-center justify-center bg-gray-100 rounded-full">
                <DollarSign className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                No extra costs yet
              </h3>
              <p className="text-gray-500 mt-1">
                Create a new extra cost to get started.
              </p>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isFormModalOpen}
        onClose={handleCloseForm}
        title={editingExtraCost ? "Edit Extra Cost" : "Create New Extra Cost"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              placeholder="e.g., AI Translation Service"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Description of the extra cost"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.showSeparatelyOnInvoice ? "Quantity *" : "Amount *"}
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                required
                placeholder={formData.showSeparatelyOnInvoice ? "2" : "0.00"}
                title="Can be negative for reimbursements"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.showSeparatelyOnInvoice
                  ? "Quantity (e.g., hours, units)"
                  : "Total amount (can be negative for reimbursements)"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.showSeparatelyOnInvoice
                  ? "Price per unit (excl. tax) *"
                  : "Price (excl. tax) *"}
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.priceExclTax}
                onChange={(e) =>
                  setFormData({ ...formData, priceExclTax: e.target.value })
                }
                required
                placeholder="0.00"
                title="Can be negative for reimbursements"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.showSeparatelyOnInvoice
                  ? "Price per unit (can be negative)"
                  : "Total price excluding tax (can be negative)"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax Rate *
              </label>
              <Select
                value={formData.tax}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    tax: value as "0" | "9" | "21",
                  })
                }
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select tax rate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0%</SelectItem>
                  <SelectItem value="9">9%</SelectItem>
                  <SelectItem value="21">21%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showSeparatelyOnInvoice}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      showSeparatelyOnInvoice: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Show as separate line item on invoice
                </span>
              </label>
            </div>
          </div>

          {formData.showSeparatelyOnInvoice && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> When checked, this will appear as a
                separate line item on the invoice with quantity × price per
                unit. When unchecked, it will be grouped with other extra costs
                by tax rate.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseForm}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : editingExtraCost
                  ? "Update"
                  : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
