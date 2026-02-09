"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../../../../../../convex/_generated/api";
import { Id, Doc } from "../../../../../../../../convex/_generated/dataModel";
import {
  Loader2,
  Trash2,
  Repeat,
  Calendar,
  DollarSign,
  Plus,
  Edit,
  Play,
  TestTube,
} from "lucide-react";
import { useToast } from "@/app/hooks/useToast";
import { Modal } from "@/app/admin-dashboard/components/ui/Modal";
import { Input } from "@/app/admin-dashboard/components/ui/Input";
import { Button } from "@/app/admin-dashboard/components/ui/Button";
import { TestSuiteModal } from "./components/TestSuiteModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Subscription = Doc<"monthly_subscriptions">;

export default function ProjectMonthlySubscriptionsPage() {
  const params = useParams();
  const projectId = params.projectId as Id<"projects">;
  const orgId = params.orgId as string;
  const { toast } = useToast();

  const subscriptions = useQuery(api.monthlysubscriptions.getSubscriptions, {
    projectId,
  });
  const project = useQuery(api.project.getProject, {
    projectId,
    organizationId: orgId as Id<"organizations">,
  });

  const createSubscription = useMutation(
    api.monthlysubscriptions.createSubscription
  );
  const updateSubscription = useMutation(
    api.monthlysubscriptions.updateSubscription
  );
  const deleteSubscription = useMutation(
    api.monthlysubscriptions.deleteSubscription
  );
  const updateProject = useMutation(api.project.updateProject);
  const manuallyTriggerInvoiceGeneration = useAction(
    api.monthlysubscriptions.manuallyTriggerInvoiceGeneration
  );
  const resetLastInvoiceDate = useMutation(
    api.monthlysubscriptions.resetLastInvoiceDate
  );

  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = React.useState(false);
  const [editingSubscription, setEditingSubscription] =
    React.useState<Subscription | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form state
  const [formData, setFormData] = React.useState({
    title: "",
    description: "",
    subscriptionAmount: "",
    tax: "21" as "0" | "9" | "21",
    language: "en" as "en" | "nl",
    subscriptionStartDate: "",
    subscriptionEndDate: "",
    discount: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountPeriodInMonths: "",
    internalNotes: "",
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      subscriptionAmount: "",
      tax: "21",
      language: "en",
      subscriptionStartDate: "",
      subscriptionEndDate: "",
      discount: "",
      discountType: "percentage",
      discountPeriodInMonths: "",
      internalNotes: "",
    });
    setEditingSubscription(null);
  };

  const handleOpenForm = (subscription?: Subscription) => {
    if (subscription) {
      setEditingSubscription(subscription);
      setFormData({
        title: subscription.title,
        description: subscription.description,
        subscriptionAmount: subscription.subscriptionAmount.toString(),
        tax: subscription.tax.toString() as "0" | "9" | "21",
        language: subscription.language,
        subscriptionStartDate: new Date(subscription.subscriptionStartDate)
          .toISOString()
          .split("T")[0],
        subscriptionEndDate: subscription.subscriptionEndDate
          ? new Date(subscription.subscriptionEndDate)
              .toISOString()
              .split("T")[0]
          : "",
        discount: subscription.discount?.toString() || "",
        discountType: subscription.discountType,
        discountPeriodInMonths:
          subscription.discountPeriodInMonths?.toString() || "",
        internalNotes: subscription.internalNotes || "",
      });
    } else {
      resetForm();
      // Set default start date to today
      const today = new Date().toISOString().split("T")[0];
      setFormData((prev) => ({ ...prev, subscriptionStartDate: today }));
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
      const subscriptionStartDate = new Date(
        formData.subscriptionStartDate
      ).getTime();
      const subscriptionEndDate = formData.subscriptionEndDate
        ? new Date(formData.subscriptionEndDate).getTime()
        : null;

      if (editingSubscription) {
        await updateSubscription({
          subscriptionId: editingSubscription._id,
          title: formData.title,
          description: formData.description,
          subscriptionAmount: parseFloat(formData.subscriptionAmount),
          tax: parseInt(formData.tax) as 0 | 9 | 21,
          language: formData.language,
          subscriptionStartDate: subscriptionStartDate,
          subscriptionEndDate: subscriptionEndDate,
          discount: formData.discount ? parseFloat(formData.discount) : null,
          discountType: formData.discountType,
          discountPeriodInMonths: formData.discountPeriodInMonths
            ? parseFloat(formData.discountPeriodInMonths)
            : null,
          internalNotes: formData.internalNotes || null,
        });
        toast({
          title: "Subscription updated",
          description: "Subscription has been updated successfully.",
          variant: "success",
        });
      } else {
        await createSubscription({
          projectId,
          organizationId: orgId as Id<"organizations">,
          title: formData.title,
          description: formData.description,
          subscriptionAmount: parseFloat(formData.subscriptionAmount),
          tax: parseInt(formData.tax) as 0 | 9 | 21,
          language: formData.language,
          subscriptionStartDate: subscriptionStartDate,
          subscriptionEndDate: subscriptionEndDate,
          discount: formData.discount ? parseFloat(formData.discount) : null,
          discountType: formData.discountType,
          discountPeriodInMonths: formData.discountPeriodInMonths
            ? parseFloat(formData.discountPeriodInMonths)
            : null,
          internalNotes: formData.internalNotes || null,
        });
        toast({
          title: "Subscription created",
          description: "Subscription has been created successfully.",
          variant: "success",
        });
      }
      handleCloseForm();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save subscription.",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (subscriptionId: Id<"monthly_subscriptions">) => {
    if (
      !confirm(
        "Are you sure you want to delete this subscription? This action cannot be undone."
      )
    )
      return;

    try {
      await deleteSubscription({ subscriptionId });
      toast({
        title: "Subscription deleted",
        description: "Subscription has been deleted successfully.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete subscription.",
        variant: "error",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-yellow-100 text-yellow-700";
      case "inactive":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Monthly Subscriptions
            </h2>
            <p className="text-sm text-gray-500">
              Manage recurring subscriptions for this project.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsTestModalOpen(true)}
              variant="secondary"
              title="Run comprehensive test suite to validate all edge cases"
            >
              <TestTube className="h-4 w-4 mr-2" />
              Run Test Suite
            </Button>
            <Button
              onClick={async () => {
                try {
                  const result = await manuallyTriggerInvoiceGeneration({
                    projectId,
                  });
                  toast({
                    title: result.success ? "Success" : "No Action Needed",
                    description: result.message,
                    variant: result.success ? "success" : "info",
                  });
                } catch (error) {
                  toast({
                    title: "Error",
                    description:
                      error instanceof Error
                        ? error.message
                        : "Failed to trigger invoice generation",
                    variant: "error",
                  });
                }
              }}
              variant="secondary"
              title="Test: Manually trigger invoice generation for this project"
            >
              <Play className="h-4 w-4 mr-2" />
              Test Invoice Generation
            </Button>
            <Button onClick={() => handleOpenForm()} variant="primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Subscription
            </Button>
          </div>
        </div>

        {/* Billing Period Setting */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subscription Billing Period
              </label>
              <p className="text-sm text-gray-500">
                Set the billing frequency for all subscriptions in this project.
                All subscriptions will be invoiced according to this period.
              </p>
            </div>
            <div className="ml-4">
              <Select
                value={
                  project?.monthlySubscriptionType
                    ? project.monthlySubscriptionType
                    : "none"
                }
                onValueChange={async (value) => {
                  try {
                    await updateProject({
                      projectId,
                      monthlySubscriptionType:
                        value === "none"
                          ? null
                          : (value as
                              | "monthly"
                              | "quarterly"
                              | "semiannually"
                              | "yearly"),
                    });
                    toast({
                      title: "Billing period updated",
                      description:
                        "Billing period has been updated successfully.",
                      variant: "success",
                    });
                  } catch (error) {
                    toast({
                      title: "Error",
                      description:
                        error instanceof Error
                          ? error.message
                          : "Failed to update billing period",
                      variant: "error",
                    });
                  }
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select billing period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    None (disable auto-invoicing)
                  </SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="semiannually">Semi-annually</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {!subscriptions ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {subscriptions.map((subscription) => (
            <div
              key={subscription._id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                      <Repeat className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {subscription.title}
                      </h3>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full uppercase tracking-wide ${getStatusColor(
                          subscription.subscriptionStatus
                        )}`}
                      >
                        {subscription.subscriptionStatus}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Start:{" "}
                      {new Date(
                        subscription.subscriptionStartDate
                      ).toLocaleDateString("nl-NL")}
                    </span>
                  </div>
                  {subscription.subscriptionEndDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        End:{" "}
                        {new Date(
                          subscription.subscriptionEndDate
                        ).toLocaleDateString("nl-NL")}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span>
                      €{subscription.subscriptionAmount.toFixed(2)}/month
                    </span>
                  </div>
                  {subscription.discount && (
                    <div className="text-xs text-gray-400">
                      Discount:{" "}
                      {subscription.discountType === "percentage"
                        ? `${subscription.discount}%`
                        : `€${subscription.discount.toFixed(2)}`}
                      {subscription.discountPeriodInMonths &&
                        ` for ${subscription.discountPeriodInMonths} months`}
                    </div>
                  )}
                  <div className="flex justify-between font-medium text-gray-900 pt-2 border-t border-gray-50">
                    <span>Tax:</span>
                    <span>{subscription.tax}%</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={async () => {
                      try {
                        await resetLastInvoiceDate({
                          subscriptionId: subscription._id,
                        });
                        toast({
                          title: "Success",
                          description: "Last invoice date has been reset",
                          variant: "success",
                        });
                      } catch (error) {
                        toast({
                          title: "Error",
                          description:
                            error instanceof Error
                              ? error.message
                              : "Failed to reset last invoice date",
                          variant: "error",
                        });
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
                    title="Test: Reset last invoice date"
                  >
                    <Repeat className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleOpenForm(subscription)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title="Edit Subscription"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(subscription._id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Delete Subscription"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {subscriptions.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-300 rounded-lg">
              <div className="h-12 w-12 text-gray-400 mb-4 flex items-center justify-center bg-gray-100 rounded-full">
                <Repeat className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                No subscriptions yet
              </h3>
              <p className="text-gray-500 mt-1">
                Create a new subscription to get started.
              </p>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={isFormModalOpen}
        onClose={handleCloseForm}
        title={
          editingSubscription ? "Edit Subscription" : "Create New Subscription"
        }
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
              placeholder="e.g., Hosting Service"
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
              placeholder="Description of the subscription service"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (€) *
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.subscriptionAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    subscriptionAmount: e.target.value,
                  })
                }
                required
                placeholder="0.00"
              />
            </div>

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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Language *
              </label>
              <Select
                value={formData.language}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    language: value as "en" | "nl",
                  })
                }
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="nl">Nederlands</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <Input
                type="date"
                value={formData.subscriptionStartDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    subscriptionStartDate: e.target.value,
                  })
                }
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date (optional - sets status to cancelled)
            </label>
            <Input
              type="date"
              value={formData.subscriptionEndDate || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  subscriptionEndDate: e.target.value || "",
                })
              }
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Discount (optional)
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Type
                </label>
                <Select
                  value={formData.discountType}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      discountType: value as "percentage" | "fixed",
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select discount type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Value
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.discount}
                  onChange={(e) =>
                    setFormData({ ...formData, discount: e.target.value })
                  }
                  placeholder={
                    formData.discountType === "percentage" ? "0-100" : "0.00"
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Period (months)
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.discountPeriodInMonths}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discountPeriodInMonths: e.target.value,
                    })
                  }
                  placeholder="e.g., 3"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Internal Notes (admin only)
            </label>
            <textarea
              value={formData.internalNotes}
              onChange={(e) =>
                setFormData({ ...formData, internalNotes: e.target.value })
              }
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Internal notes visible only to admins"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseForm}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {editingSubscription ? "Update" : "Create"} Subscription
            </Button>
          </div>
        </form>
      </Modal>

      <TestSuiteModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        projectId={projectId}
        organizationId={orgId as Id<"organizations">}
      />
    </div>
  );
}
