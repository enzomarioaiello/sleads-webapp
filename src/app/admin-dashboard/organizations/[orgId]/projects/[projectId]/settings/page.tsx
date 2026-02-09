"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../../convex/_generated/dataModel";
import { Loader2, Save, Trash2, Check, ChevronsUpDown } from "lucide-react";
import { useToast } from "@/app/hooks/useToast";
import { cn } from "@/app/utils/cn";

export default function ProjectSettingsPage() {
  const params = useParams();
  const projectId = params.projectId as Id<"projects">;
  const orgId = params.orgId as string;
  const { toast } = useToast();
  const router = useRouter();

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

  const updateProject = useMutation(api.project.updateProject);
  const updateProjectProgress = useMutation(api.project.updateProjectProgress);
  const deleteProject = useMutation(api.project.deleteProject);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    url: "",
    enableSmartObjects: false,
    enableCMS: false,
    contactInformation: "" as Id<"organizationContactInformation"> | "",
  });
  const [progress, setProgress] = useState<number>(0);
  const [originalProgress, setOriginalProgress] = useState<number>(0);
  const [phase, setPhase] = useState<string>("");
  const [originalPhase, setOriginalPhase] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  // Phase presets with their corresponding progress values
  const phasePresets = [
    { name: "Planning", progress: 5 },
    { name: "Orientation", progress: 10 },
    { name: "Requirements", progress: 20 },
    { name: "Design", progress: 35 },
    { name: "Development", progress: 60 },
    { name: "Testing", progress: 80 },
    { name: "Review", progress: 90 },
    { name: "Completion", progress: 100 },
  ];

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description,
        url: project.url || "",
        enableSmartObjects: project.enableSmartObjects,
        enableCMS: project.enableCMS,
        contactInformation: project.contactInformation,
      });
      const projectProgress = project.progress || 0;
      setProgress(projectProgress);
      setOriginalProgress(projectProgress);
      const projectPhase = project.phase || "";
      setPhase(projectPhase);
      setOriginalPhase(projectPhase);
    }
  }, [project]);

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
      await updateProject({
        projectId,
        name: formData.name,
        description: formData.description,
        url: formData.url || undefined,
        enableSmartObjects: formData.enableSmartObjects,
        enableCMS: formData.enableCMS,
        contactInformation:
          formData.contactInformation as Id<"organizationContactInformation">,
      });
      toast({
        title: "Settings updated",
        description: "Project settings have been updated successfully.",
        variant: "success",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update settings.",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProgressChange = (newProgress: number) => {
    // Clamp progress between 0 and 100
    const clampedProgress = Math.max(0, Math.min(100, newProgress));
    setProgress(clampedProgress);
  };

  const handleSaveProgress = async () => {
    setIsSavingProgress(true);
    try {
      await updateProjectProgress({
        projectId,
        progress: progress,
        phase: phase || undefined,
      });
      setOriginalProgress(progress);
      setOriginalPhase(phase);
      toast({
        title: "Progress updated",
        description:
          "Project progress and phase have been updated successfully.",
        variant: "success",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update progress.",
        variant: "error",
      });
      // Revert to original values on error
      setProgress(originalProgress);
      setPhase(originalPhase);
    } finally {
      setIsSavingProgress(false);
    }
  };

  const handlePhasePresetClick = (preset: {
    name: string;
    progress: number;
  }) => {
    setPhase(preset.name);
    setProgress(preset.progress);
  };

  const hasProgressChanges =
    progress !== originalProgress || phase !== originalPhase;

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this project? This action cannot be undone."
      )
    )
      return;

    try {
      await deleteProject({ projectId });
      toast({
        title: "Project deleted",
        description: "Project has been deleted successfully.",
        variant: "success",
      });
      router.push(`/admin-dashboard/organizations/${orgId}/projects`);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: "Failed to delete project.",
        variant: "error",
      });
    }
  };

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Project Settings</h2>
        <p className="text-sm text-gray-500">
          Update your project details and configurations.
        </p>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Name
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
              Project URL
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Progress
            </label>
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => {
                    const newProgress = parseInt(e.target.value);
                    handleProgressChange(newProgress);
                  }}
                  disabled={isSavingProgress}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
                />
                <div className="flex items-center gap-2 min-w-[80px]">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => {
                      const newProgress = parseInt(e.target.value) || 0;
                      handleProgressChange(newProgress);
                    }}
                    disabled={isSavingProgress}
                    className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 text-center focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
                <button
                  type="button"
                  onClick={handleSaveProgress}
                  disabled={!hasProgressChanges || isSavingProgress}
                  className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingProgress ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Set the completion percentage of this project (0-100%). Click
                save to apply changes.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Phase
            </label>
            <div className="space-y-3">
              <input
                type="text"
                value={phase}
                onChange={(e) => setPhase(e.target.value)}
                disabled={isSavingProgress}
                placeholder="Enter project phase (e.g., Planning, Design, Development)"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              />
              <div className="flex flex-wrap gap-2">
                {phasePresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handlePhasePresetClick(preset)}
                    disabled={isSavingProgress}
                    className="inline-flex items-center rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {preset.name}
                    <span className="ml-1.5 text-gray-500">
                      ({preset.progress}%)
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Click a phase badge to quickly set both phase and progress, or
                enter a custom phase manually.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Information
            </label>
            <div className="relative">
              <button
                type="button"
                className="relative w-full cursor-default rounded-md bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6 border border-gray-300"
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
                        "relative cursor-default select-none py-2 pl-3 pr-9 hover:bg-blue-50 cursor-pointer",
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

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Enable Smart Objects
                </h3>
                <p className="text-sm text-gray-500">
                  Allow using Smart Objects features in this project.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.enableSmartObjects}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      enableSmartObjects: e.target.checked,
                    })
                  }
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Enable CMS
                </h3>
                <p className="text-sm text-gray-500">
                  Enable Content Management System features.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.enableCMS}
                  onChange={(e) =>
                    setFormData({ ...formData, enableCMS: e.target.checked })
                  }
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>


          <div className="pt-4 flex items-center justify-between border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm ring-1 ring-inset ring-red-300 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Project
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
