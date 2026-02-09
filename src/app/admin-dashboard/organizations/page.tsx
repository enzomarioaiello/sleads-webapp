"use client";

import Link from "next/link";
import React, { useState } from "react";
import {
  Plus,
  Building,
  Image as ImageIcon,
  X,
  Loader2,
  Pencil,
} from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { useQuery, useAction, useMutation } from "convex/react";
import { Id } from "../../../../convex/_generated/dataModel";
import { useToast } from "@/app/hooks/useToast";

type Organization = {
  _id: Id<"organizations">;
  _creationTime: number;
  name: string;
  slug: string;
  logo?: string | null | undefined;
  createdAt: number;
  updatedAt: number;
};

export default function OrganizationsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const generateUploadUrl = useMutation(api.organizations.generateUploadUrl);
  const getLogoUrl = useAction(api.organizations.getLogoUrl);
  const createOrganization = useMutation(api.organizations.createOrganization);
  const updateOrganization = useMutation(api.organizations.updateOrganization);

  const organizations = useQuery(api.organizations.getOrganizations);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    image: null as File | null,
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({
        ...prev,
        image: e.target.files![0],
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateError(null);

    try {
      let logoUrl: string | null | undefined = undefined;

      if (formData.image) {
        // 1. Generate upload URL
        const uploadUrl = await generateUploadUrl();

        // 2. Upload file to Convex storage
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": formData.image.type },
          body: formData.image,
        });

        if (!result.ok) {
          throw new Error(`Upload failed: ${result.statusText}`);
        }

        const { storageId } = await result.json();

        // 3. Get the public URL for the uploaded file
        const url = await getLogoUrl({ logoUrl: storageId as Id<"_storage"> });

        if (url) {
          logoUrl = url;
        }
      } else if (editingOrg && !formData.image) {
        // Keep existing logo if editing and no new image
        logoUrl = editingOrg.logo;
      }

      if (editingOrg) {
        await updateOrganization({
          organizationId: editingOrg._id,
          name: formData.name,
          slug: formData.slug,
          logo: logoUrl,
        });
        toast({
          title: "Organization updated",
          description: "The organization has been updated successfully.",
          variant: "success",
        });
        setIsModalOpen(false);
        setFormData({ name: "", slug: "", image: null });
        setEditingOrg(null);
      } else {
        await createOrganization({
          name: formData.name,
          slug: formData.slug,
          logo: logoUrl,
        });
        toast({
          title: "Organization created",
          description: "The organization has been created successfully.",
          variant: "success",
        });
        setIsModalOpen(false);
        setFormData({ name: "", slug: "", image: null });
      }
    } catch (err: unknown) {
      console.error(err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save organization";
      setCreateError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Organizations
        </h1>
        <button
          onClick={() => {
            setEditingOrg(null);
            setFormData({ name: "", slug: "", image: null });
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 dark:bg-sleads-blue px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 dark:hover:bg-sleads-blue/90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Organization
        </button>
      </div>

      {organizations === undefined ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {organizations?.map((org) => (
            <Link
              href={`/admin-dashboard/organizations/${org._id}`}
              key={org._id}
              className="overflow-hidden rounded-lg border border-gray-200 dark:border-sleads-slate800 bg-white dark:bg-sleads-slate900 shadow hover:shadow-md transition-shadow block relative group"
            >
              <div className="p-5">
                <div className="flex items-center space-x-4">
                  <div className="shrink-0">
                    {org.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={org.logo}
                        alt={org.name}
                        className="h-12 w-12 rounded-full object-cover border border-gray-100 dark:border-sleads-slate800"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-sleads-slate800 text-gray-400 dark:text-sleads-slate400">
                        <Building className="h-6 w-6" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-lg font-medium text-gray-900 dark:text-white">
                      {org.name}
                    </p>
                    <p className="truncate text-sm text-gray-500 dark:text-sleads-slate400">
                      /{org.slug}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setEditingOrg(org);
                      setFormData({
                        name: org.name,
                        slug: org.slug,
                        image: null,
                      });
                      setIsModalOpen(true);
                    }}
                    className="p-2 text-gray-400 dark:text-sleads-slate500 hover:text-blue-600 dark:hover:text-sleads-blue hover:bg-blue-50 dark:hover:bg-sleads-blue/10 rounded-full transition-colors relative z-10"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-sleads-slate800 px-5 py-3">
                <div className="text-sm">
                  <span className="font-medium text-gray-500 dark:text-sleads-slate400">
                    ID: {org._id}
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {(!organizations || organizations.length === 0) && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-300 dark:border-sleads-slate700 rounded-lg">
              <Building className="h-12 w-12 text-gray-400 dark:text-sleads-slate600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                No organizations
              </h3>
              <p className="text-gray-500 dark:text-sleads-slate400 mt-1">
                Get started by creating a new organization.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white dark:bg-sleads-slate900 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-sleads-slate800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingOrg ? "Edit Organization" : "Create Organization"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-sleads-slate300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {createError && (
                <div className="rounded-md bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
                  {createError}
                </div>
              )}

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-sleads-slate300 mb-1"
                >
                  Organization Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 dark:border-sleads-slate700 dark:bg-sleads-slate800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-sleads-slate500 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. Acme Corp"
                />
              </div>

              <div>
                <label
                  htmlFor="slug"
                  className="block text-sm font-medium text-gray-700 dark:text-sleads-slate300 mb-1"
                >
                  Slug
                </label>
                <div className="flex rounded-md shadow-sm">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 dark:border-sleads-slate700 bg-gray-50 dark:bg-sleads-slate800 px-3 text-sm text-gray-500 dark:text-sleads-slate400">
                    /
                  </span>
                  <input
                    type="text"
                    id="slug"
                    name="slug"
                    required
                    value={formData.slug}
                    onChange={handleInputChange}
                    className="block w-full min-w-0 flex-1 rounded-none rounded-r-md border border-gray-300 dark:border-sleads-slate700 dark:bg-sleads-slate800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-sleads-slate500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="acme-corp"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-sleads-slate400">
                  Unique identifier for the organization URL.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-sleads-slate300 mb-1">
                  Profile Image
                </label>
                <div className="mt-1 flex justify-center rounded-lg border border-dashed border-gray-300 dark:border-sleads-slate700 px-6 py-10 hover:bg-gray-50 dark:hover:bg-sleads-slate800 transition-colors cursor-pointer relative">
                  <div className="text-center">
                    {formData.image || (editingOrg && editingOrg.logo) ? (
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={
                            formData.image
                              ? URL.createObjectURL(formData.image)
                              : editingOrg?.logo || ""
                          }
                          alt="Preview"
                          className="mx-auto h-24 w-24 object-cover rounded-full"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setFormData((prev) => ({ ...prev, image: null }));
                          }}
                          className="absolute -top-2 -right-2 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full p-1 hover:bg-red-200 dark:hover:bg-red-500/30"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <ImageIcon
                          className="mx-auto h-12 w-12 text-gray-300 dark:text-sleads-slate600"
                          aria-hidden="true"
                        />
                        <div className="mt-4 flex text-sm leading-6 text-gray-600 dark:text-sleads-slate400">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer rounded-md bg-white dark:bg-sleads-slate900 font-semibold text-blue-600 dark:text-sleads-blue focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500 dark:hover:text-sleads-blue/80"
                          >
                            <span>Upload a file</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleImageChange}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs leading-5 text-gray-500 dark:text-sleads-slate400">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isCreating}
                  className="rounded-md bg-white dark:bg-sleads-slate800 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-sleads-slate700 hover:bg-gray-50 dark:hover:bg-sleads-slate700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="rounded-md bg-blue-600 dark:bg-sleads-blue px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 dark:hover:bg-sleads-blue/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 flex items-center"
                >
                  {isCreating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isCreating
                    ? editingOrg
                      ? "Saving..."
                      : "Creating..."
                    : editingOrg
                      ? "Save Changes"
                      : "Create Organization"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
