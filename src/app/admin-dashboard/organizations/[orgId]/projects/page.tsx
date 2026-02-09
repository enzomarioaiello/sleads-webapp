"use client";

import Link from "next/link";
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
  FolderKanban,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { useToast } from "@/app/hooks/useToast";
import { Doc, Id } from "../../../../../../convex/_generated/dataModel";
import { cn } from "@/app/utils/cn";

export default function OrganizationProjectsPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const { toast } = useToast();

  const projects = useQuery(api.project.getProjects, {
    organizationId: orgId as Id<"organizations">,
  });

  const contacts = useQuery(
    api.organizations.getOrganizationContactInformation,
    {
      organizationId: orgId as Id<"organizations">,
    }
  );

  const createProject = useMutation(api.project.createProject);
  const updateProject = useMutation(api.project.updateProject);
  const deleteProject = useMutation(api.project.deleteProject);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] =
    useState<Id<"projects"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    url: "",
    enableSmartObjects: false,
    enableCMS: false,
    contactInformation: "" as Id<"organizationContactInformation"> | "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dropdown state for contact info
  const [contactOpen, setContactOpen] = useState(false);

  const handleEdit = (project: Doc<"projects">) => {
    setEditingProjectId(project._id);
    setFormData({
      name: project.name,
      description: project.description,
      url: project.url || "",
      enableSmartObjects: project.enableSmartObjects,
      enableCMS: project.enableCMS,
      contactInformation: project.contactInformation,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (projectId: Id<"projects">) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await deleteProject({ projectId });
      toast({
        title: "Project deleted",
        description: "Project has been deleted successfully.",
        variant: "success",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: "Failed to delete project.",
        variant: "error",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.contactInformation) {
      toast({
        title: "Error",
        description: "Please select contact information.",
        variant: "error",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingProjectId) {
        await updateProject({
          projectId: editingProjectId,
          name: formData.name,
          description: formData.description,
          url: formData.url || undefined,
          enableSmartObjects: formData.enableSmartObjects,
          enableCMS: formData.enableCMS,
          contactInformation:
            formData.contactInformation as Id<"organizationContactInformation">,
        });
        toast({
          title: "Project updated",
          description: "Project has been updated successfully.",
          variant: "success",
        });
      } else {
        await createProject({
          organizationId: orgId as Id<"organizations">,
          name: formData.name,
          description: formData.description,
          url: formData.url || undefined,
          enableSmartObjects: formData.enableSmartObjects,
          enableCMS: formData.enableCMS,
          contactInformation:
            formData.contactInformation as Id<"organizationContactInformation">,
        });
        toast({
          title: "Project created",
          description: "New project has been created successfully.",
          variant: "success",
        });
      }
      setIsModalOpen(false);
      setFormData({
        name: "",
        description: "",
        url: "",
        enableSmartObjects: false,
        enableCMS: false,
        contactInformation: "",
      });
      setEditingProjectId(null);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save project.",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProjects = projects?.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Projects</h2>
          <p className="text-sm text-gray-500">
            Manage projects for this organization.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingProjectId(null);
            setFormData({
              name: "",
              description: "",
              url: "",
              enableSmartObjects: false,
              enableCMS: false,
              contactInformation: "",
            });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Project
        </button>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 rounded-md border border-gray-300 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {!projects ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects?.map((project) => (
            <Link
              href={`/admin-dashboard/organizations/${orgId}/projects/${project._id}`}
              key={project._id}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow block relative group"
            >
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-medium text-gray-900 mb-2 truncate pr-4">
                    {project.name}
                  </h3>
                  <div className="flex gap-1">
                    {project.enableSmartObjects && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        SO
                      </span>
                    )}
                    {project.enableCMS && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        CMS
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4 h-10">
                  {project.description}
                </p>
                {project.url && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(project.url || "", "_blank");
                    }}
                    className="text-xs text-blue-600 hover:underline mb-2 block truncate cursor-pointer relative z-10"
                  >
                    {project.url}
                  </span>
                )}
              </div>
              <div className="bg-gray-50 px-5 py-3 flex justify-end gap-2 border-t border-gray-100">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleEdit(project);
                  }}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative z-10"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete(project._id);
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors relative z-10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Link>
          ))}
          {filteredProjects?.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-300 rounded-lg">
              <div className="h-12 w-12 text-gray-400 mb-4 flex items-center justify-center bg-gray-100 rounded-full">
                <FolderKanban className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                No projects found
              </h3>
              <p className="text-gray-500 mt-1">
                {searchQuery
                  ? "Try adjusting your search."
                  : "Create a new project to get started."}
              </p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingProjectId ? "Edit Project" : "Create Project"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-4 overflow-y-auto"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Information
                </label>
                <div className="relative">
                  <button
                    type="button"
                    className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6"
                    onClick={() => setContactOpen(!contactOpen)}
                  >
                    <span className="block truncate">
                      {formData.contactInformation
                        ? contacts?.find(
                            (c) => c._id === formData.contactInformation
                          )?.name || "Select Contact Info"
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
                            "relative cursor-default select-none py-2 pl-3 pr-9 hover:bg-blue-50",
                            formData.contactInformation === contact._id
                              ? "bg-blue-50 text-blue-900"
                              : "text-gray-900"
                          )}
                          onClick={() => {
                            setFormData({
                              ...formData,
                              contactInformation: contact._id,
                            });
                            setContactOpen(false);
                          }}
                        >
                          <span
                            className={cn(
                              "block truncate",
                              formData.contactInformation === contact._id &&
                                "font-semibold"
                            )}
                          >
                            {contact.name}
                          </span>
                          {formData.contactInformation === contact._id && (
                            <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                              <Check className="h-5 w-5" aria-hidden="true" />
                            </span>
                          )}
                        </div>
                      ))}
                      {contacts?.length === 0 && (
                        <div className="relative cursor-default select-none py-2 pl-3 pr-9 text-gray-500">
                          No contact info available.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex items-center">
                  <input
                    id="enableSmartObjects"
                    name="enableSmartObjects"
                    type="checkbox"
                    checked={formData.enableSmartObjects}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        enableSmartObjects: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="enableSmartObjects"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Enable Smart Objects
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="enableCMS"
                    name="enableCMS"
                    type="checkbox"
                    checked={formData.enableCMS}
                    onChange={(e) =>
                      setFormData({ ...formData, enableCMS: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="enableCMS"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Enable CMS
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 flex items-center"
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingProjectId ? "Save Changes" : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
