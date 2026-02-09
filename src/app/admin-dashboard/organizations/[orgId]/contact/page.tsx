"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  User as UserIcon,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { useToast } from "@/app/hooks/useToast";
import { Doc, Id } from "../../../../../../convex/_generated/dataModel";

type Member = {
  id: Id<"members">;
  organizationId: string;
  userId: string;
  role: string;
  createdAt: number;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  } | null;
};

export default function OrganizationContactPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const { toast } = useToast();

  const members = useQuery(
    api.organizations.getMembers,
    orgId ? { organizationId: orgId as Id<"organizations"> } : "skip"
  );

  const contacts = useQuery(
    api.organizations.getOrganizationContactInformation,
    orgId ? { organizationId: orgId as Id<"organizations"> } : "skip"
  );

  const createContact = useMutation(
    api.organizations.createOrganizationContactInformation
  );
  const updateContact = useMutation(
    api.organizations.updateOrganizationContactInformation
  );
  const deleteContact = useMutation(
    api.organizations.deleteOrganizationContactInformation
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContactId, setEditingContactId] =
    useState<Id<"organizationContactInformation"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    organizationName: "",
    userId: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSetDefault = async (
    contactId: Id<"organizationContactInformation">,
    isDefault: boolean
  ) => {
    if (isDefault) return; // Already default
    try {
      await updateContact({
        organizationContactInformationId: contactId,
        organizationId: orgId,
        isDefault: true,
      });
      toast({
        title: "Default contact updated",
        description: "The default contact has been set successfully.",
        variant: "success",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to set default contact.",
        variant: "error",
      });
    }
  };

  const handleEdit = (contact: Doc<"organizationContactInformation">) => {
    setEditingContactId(contact._id);
    setFormData({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      address: contact.address,
      organizationName: contact.organizationName,
      userId: contact.userId || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (
    contactId: Id<"organizationContactInformation">
  ) => {
    if (!confirm("Are you sure you want to delete this contact information?"))
      return;
    try {
      await deleteContact({ organizationContactInformationId: contactId });
      toast({
        title: "Contact deleted",
        description: "Contact information has been deleted successfully.",
        variant: "success",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete contact information.",
        variant: "error",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingContactId) {
        await updateContact({
          organizationContactInformationId: editingContactId,
          organizationId: orgId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          organizationName: formData.organizationName,
        });
        toast({
          title: "Contact updated",
          description: "Contact information has been updated successfully.",
          variant: "success",
        });
      } else {
        await createContact({
          organizationId: orgId as Id<"organizations">,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          organizationName: formData.organizationName,
          userId: formData.userId || undefined,
        });
        toast({
          title: "Contact created",
          description: "New contact information has been created successfully.",
          variant: "success",
        });
      }
      setIsModalOpen(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        organizationName: "",
        userId: "",
      });
      setEditingContactId(null);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save contact information.",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter members based on search query
  const availableUsers = members?.filter(
    (member: Member) =>
      member.user &&
      (member.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.user.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Contact Information
          </h2>
          <p className="text-sm text-gray-500 dark:text-sleads-slate400">
            Manage contact details for this organization.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingContactId(null);
            setFormData({
              name: "",
              email: "",
              phone: "",
              address: "",
              organizationName: "",
              userId: "",
            });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 dark:bg-sleads-blue px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 dark:hover:bg-sleads-blue/90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </button>
      </div>

      {contacts === undefined ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {contacts.map((contact) => (
            <div
              key={contact._id}
              className={`overflow-hidden rounded-lg border transition-all duration-200 ${
                contact.isDefault
                  ? "border-blue-500 dark:border-sleads-blue bg-blue-50/30 dark:bg-sleads-blue/10 shadow-md ring-1 ring-blue-500/20 dark:ring-sleads-blue/20"
                  : "border-gray-200 dark:border-sleads-slate800 bg-white dark:bg-sleads-slate900 shadow-sm hover:shadow-md"
              }`}
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {contact.name}
                    </h3>
                    {contact.organizationName && (
                      <p className="text-sm text-gray-500 dark:text-sleads-slate400 mt-0.5">
                        {contact.organizationName}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() =>
                      handleSetDefault(contact._id, contact.isDefault)
                    }
                    className={`p-1.5 rounded-full transition-colors ${
                      contact.isDefault
                        ? "text-blue-600 dark:text-sleads-blue bg-blue-100 dark:bg-sleads-blue/20 hover:bg-blue-200 dark:hover:bg-sleads-blue/30"
                        : "text-gray-400 dark:text-sleads-slate500 hover:text-blue-600 dark:hover:text-sleads-blue hover:bg-gray-100 dark:hover:bg-sleads-slate800"
                    }`}
                    title={
                      contact.isDefault ? "Default Contact" : "Set as Default"
                    }
                  >
                    {contact.isDefault ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <div className="space-y-1 text-sm text-gray-500 dark:text-sleads-slate400">
                  <p>{contact.email}</p>
                  <p>{contact.phone}</p>
                  <p>{contact.address}</p>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-sleads-slate800 px-5 py-3 flex justify-end gap-2">
                <button
                  onClick={() => handleEdit(contact)}
                  className="p-2 text-gray-400 dark:text-sleads-slate500 hover:text-blue-600 dark:hover:text-sleads-blue hover:bg-blue-50 dark:hover:bg-sleads-blue/10 rounded-full transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(contact._id)}
                  className="p-2 text-gray-400 dark:text-sleads-slate500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {contacts.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-300 dark:border-sleads-slate700 rounded-lg">
              <div className="h-12 w-12 text-gray-400 dark:text-sleads-slate600 mb-4 flex items-center justify-center bg-gray-100 dark:bg-sleads-slate800 rounded-full">
                <UserIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                No contact information
              </h3>
              <p className="text-gray-500 dark:text-sleads-slate400 mt-1">
                Add contact details to display here.
              </p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white dark:bg-sleads-slate900 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-sleads-slate800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingContactId ? "Edit Contact" : "Add Contact"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-sleads-slate300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-sleads-slate300 mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.organizationName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      organizationName: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-gray-300 dark:border-sleads-slate700 dark:bg-sleads-slate800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-sleads-slate500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-sleads-slate300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 dark:border-sleads-slate700 dark:bg-sleads-slate800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-sleads-slate500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-sleads-slate300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 dark:border-sleads-slate700 dark:bg-sleads-slate800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-sleads-slate500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-sleads-slate300 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 dark:border-sleads-slate700 dark:bg-sleads-slate800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-sleads-slate500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-sleads-slate300 mb-1">
                  Address
                </label>
                <textarea
                  required
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 dark:border-sleads-slate700 dark:bg-sleads-slate800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-sleads-slate500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              {!editingContactId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-sleads-slate300 mb-1">
                    Link User (Optional)
                  </label>
                  <div className="mb-2 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 rounded-md border border-gray-300 dark:border-sleads-slate700 dark:bg-sleads-slate800 py-2 text-sm placeholder-gray-400 dark:placeholder-sleads-slate500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="mt-1 max-h-40 overflow-y-auto border border-gray-200 dark:border-sleads-slate800 rounded-md">
                    {availableUsers && availableUsers.length > 0 ? (
                      <div className="divide-y divide-gray-100 dark:divide-sleads-slate800">
                        {availableUsers.map((member: Member) => {
                          if (!member.user) return null;
                          return (
                            <div
                              key={member.id}
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  userId:
                                    member.user!.id === prev.userId
                                      ? ""
                                      : member.user!.id,
                                  // Auto-fill details if linking user
                                  name:
                                    member.user!.id === prev.userId
                                      ? prev.name
                                      : member.user!.name || prev.name,
                                  email:
                                    member.user!.id === prev.userId
                                      ? prev.email
                                      : member.user!.email || prev.email,
                                }));
                              }}
                              className={`p-3 flex items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-sleads-slate800 transition-colors ${
                                formData.userId === member.user!.id
                                  ? "bg-blue-50 dark:bg-sleads-blue/10"
                                  : ""
                              }`}
                            >
                              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-sleads-slate700 flex items-center justify-center shrink-0 overflow-hidden">
                                {member.user.image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={member.user.image}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <UserIcon className="h-4 w-4 text-gray-500 dark:text-sleads-slate400" />
                                )}
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {member.user.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-sleads-slate400">
                                  {member.user.email}
                                </p>
                              </div>
                              {formData.userId === member.user.id && (
                                <div className="ml-auto">
                                  <div className="h-4 w-4 rounded-full bg-blue-600 dark:bg-sleads-blue flex items-center justify-center">
                                    <div className="h-2 w-2 rounded-full bg-white" />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-sm text-gray-500 dark:text-sleads-slate400">
                        {members === undefined
                          ? "Loading users..."
                          : "No users found."}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="rounded-md bg-white dark:bg-sleads-slate800 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-sleads-slate700 hover:bg-gray-50 dark:hover:bg-sleads-slate700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-blue-600 dark:bg-sleads-blue px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 dark:hover:bg-sleads-blue/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 flex items-center"
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingContactId ? "Save Changes" : "Create Contact"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
