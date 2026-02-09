"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../../convex/_generated/dataModel";
import {
  Loader2,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Pencil,
  Save,
  X,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import { useToast } from "@/app/hooks/useToast";
import { cn } from "@/app/utils/cn";

export default function ProjectContactPage() {
  const params = useParams();
  const projectId = params.projectId as Id<"projects">;
  const orgId = params.orgId as string;
  const { toast } = useToast();

  const project = useQuery(api.project.getProject, {
    projectId,
    organizationId: orgId as Id<"organizations">,
  });
  const contacts = useQuery(
    api.organizations.getOrganizationContactInformation,
    {
      organizationId: orgId as Id<"organizations">,
    }
  );

  const contactInfo = useQuery(
    api.organizations.getOrganizationContactInformation,
    {
      organizationId: orgId as Id<"organizations">,
    }
  );

  const currentContact = contactInfo?.find(
    (c) => c._id === project?.contactInformation
  );

  const updateProject = useMutation(api.project.updateProject);

  const [isEditing, setIsEditing] = useState(false);
  const [selectedContactId, setSelectedContactId] =
    useState<Id<"organizationContactInformation"> | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (project?.contactInformation) {
      setSelectedContactId(project.contactInformation);
    }
  }, [project]);

  const handleSave = async () => {
    if (!selectedContactId) return;
    setIsSubmitting(true);
    try {
      await updateProject({
        projectId,
        contactInformation: selectedContactId,
      });
      toast({
        title: "Contact updated",
        description: "Project contact information has been updated.",
        variant: "success",
      });
      setIsEditing(false);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update contact info.",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!project || !contacts) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Contact Information
          </h2>
          <p className="text-sm text-gray-500">
            Contact details associated with this project.
          </p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Pencil className="w-4 h-4" />
            Change Contact
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Contact Information
            </label>
            <div className="relative">
              <button
                type="button"
                className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6 border border-gray-300"
                onClick={() => setContactOpen(!contactOpen)}
              >
                <span className="block truncate">
                  {selectedContactId
                    ? contacts?.find((c) => c._id === selectedContactId)
                        ?.name || "Select Contact Info"
                    : "Select Contact Info"}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronsUpDown
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </span>
              </button>

              {contactOpen && (
                <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                  {contacts?.map((contact) => (
                    <div
                      key={contact._id}
                      className={cn(
                        "relative cursor-default select-none py-2 pl-3 pr-9 hover:bg-blue-50 cursor-pointer",
                        selectedContactId === contact._id
                          ? "bg-blue-50 text-blue-900"
                          : "text-gray-900"
                      )}
                      onClick={() => {
                        setSelectedContactId(contact._id);
                        setContactOpen(false);
                      }}
                    >
                      <span
                        className={cn(
                          "block truncate",
                          selectedContactId === contact._id && "font-semibold"
                        )}
                      >
                        {contact.name}
                      </span>
                      {selectedContactId === contact._id && (
                        <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                          <Check className="h-5 w-5" aria-hidden="true" />
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setIsEditing(false);
                setSelectedContactId(project.contactInformation);
              }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          {currentContact ? (
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold">
                  {currentContact.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {currentContact.name}
                  </h3>
                  <p className="text-sm text-gray-500">Contact Person</p>
                </div>
              </div>

              <div className="grid gap-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg text-gray-500 mt-0.5">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Email Address
                    </p>
                    <a
                      href={`mailto:${currentContact.email}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {currentContact.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg text-gray-500 mt-0.5">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Phone Number
                    </p>
                    <a
                      href={`tel:${currentContact.phone}`}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      {currentContact.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg text-gray-500 mt-0.5">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Address</p>
                    <p className="text-sm text-gray-600 whitespace-pre-line">
                      {currentContact.address}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="inline-flex p-4 rounded-full bg-gray-100 text-gray-400 mb-4">
                <Loader2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                No contact information linked
              </h3>
              <p className="text-gray-500 mt-1 mb-6">
                Link a contact to this project to see details here.
              </p>
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Pencil className="w-4 h-4" />
                Link Contact
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
