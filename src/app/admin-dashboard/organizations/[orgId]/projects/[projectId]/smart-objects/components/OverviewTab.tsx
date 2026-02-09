"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../../../convex/_generated/dataModel";
import {
  Loader2,
  Key,
  Copy,
  Check,
  Sparkles,
  Globe,
  Edit,
  Save,
  X,
} from "lucide-react";
import { useToast } from "@/app/hooks/useToast";

interface OverviewTabProps {
  projectId: Id<"projects">;
  orgId: Id<"organizations">;
  project: {
    _id: Id<"projects">;
    smartObjectsKey: string | null | undefined;
    smartObjectsUrl: string | null | undefined;
  };
}

export default function OverviewTab({
  projectId,
  orgId,
  project,
}: OverviewTabProps) {
  const { toast } = useToast();
  const [copiedKey, setCopiedKey] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpdatingUrl, setIsUpdatingUrl] = useState(false);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [smartObjectsUrl, setSmartObjectsUrl] = useState(
    project.smartObjectsUrl || ""
  );
  const [newSmartObjectsUrl, setNewSmartObjectsUrl] = useState("");

  const createSmartObjectsKey = useMutation(api.project.createSmartObjectsKey);
  const updateSmartObjectsUrl = useMutation(api.project.updateSmartObjectsUrl);

  const handleCopyKey = async () => {
    if (!project?.smartObjectsKey) return;

    try {
      await navigator.clipboard.writeText(project.smartObjectsKey);
      setCopiedKey(true);
      toast({
        title: "Key copied",
        description: "Smart Objects key has been copied to clipboard.",
        variant: "success",
      });
      setTimeout(() => setCopiedKey(false), 2000);
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy key to clipboard.",
        variant: "error",
      });
    }
  };

  const handleGenerateKey = async () => {
    if (!newSmartObjectsUrl.trim()) {
      toast({
        title: "URL required",
        description:
          "Please enter a Smart Objects URL before generating a key.",
        variant: "error",
      });
      return;
    }

    setIsGenerating(true);
    try {
      await createSmartObjectsKey({
        projectId,
        smartObjectsUrl: newSmartObjectsUrl.trim(),
      });
      toast({
        title: "Smart Objects key generated",
        description: "Smart Objects key has been generated successfully.",
        variant: "success",
      });
      setSmartObjectsUrl(newSmartObjectsUrl.trim());
      setNewSmartObjectsUrl("");
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to generate Smart Objects key.",
        variant: "error",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateUrl = async () => {
    if (!newSmartObjectsUrl.trim()) {
      toast({
        title: "URL required",
        description: "Please enter a valid Smart Objects URL.",
        variant: "error",
      });
      return;
    }

    setIsUpdatingUrl(true);
    try {
      await updateSmartObjectsUrl({
        projectId,
        smartObjectsUrl: newSmartObjectsUrl.trim(),
      });
      setSmartObjectsUrl(newSmartObjectsUrl.trim());
      setNewSmartObjectsUrl("");
      setIsEditingUrl(false);
      toast({
        title: "URL updated",
        description: "Smart Objects URL has been updated successfully.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update Smart Objects URL.",
        variant: "error",
      });
    } finally {
      setIsUpdatingUrl(false);
    }
  };

  const handleCancelEdit = () => {
    setNewSmartObjectsUrl("");
    setIsEditingUrl(false);
  };

  return (
    <div className="space-y-6">
      {/* Smart Objects Overview */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-sleads-blue/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sleads-blue text-white flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Smart Objects Overview
              </h3>
              <p className="text-sm text-gray-500">
                Smart Objects integration is enabled for this project
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Project ID Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-gray-400" />
              <label className="text-sm font-medium text-gray-700">
                Project ID
              </label>
            </div>
            <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <code className="flex-1 text-sm font-mono text-gray-900 break-all">
                {projectId}
              </code>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(projectId);
                    toast({
                      title: "Project ID copied",
                      description: "Project ID has been copied to clipboard.",
                      variant: "success",
                    });
                  } catch {
                    toast({
                      title: "Error",
                      description: "Failed to copy project ID to clipboard.",
                      variant: "error",
                    });
                  }
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:ring-offset-2 transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Use this project ID to identify your project in Smart Objects
              operations.
            </p>
          </div>

          {/* Smart Objects URL Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-gray-400" />
                <label className="text-sm font-medium text-gray-700">
                  Smart Objects URL
                </label>
              </div>
              {project.smartObjectsKey && !isEditingUrl && (
                <button
                  onClick={() => {
                    setNewSmartObjectsUrl(project.smartObjectsUrl || "");
                    setIsEditingUrl(true);
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:ring-offset-2 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>

            {isEditingUrl ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={newSmartObjectsUrl}
                    onChange={(e) => setNewSmartObjectsUrl(e.target.value)}
                    placeholder="https://example.com/smart-objects"
                    className="flex-1 px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:border-transparent"
                  />
                  <button
                    onClick={handleUpdateUrl}
                    disabled={isUpdatingUrl || !newSmartObjectsUrl.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-sleads-blue text-white text-sm font-medium rounded-lg hover:bg-sleads-blue/90 focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isUpdatingUrl ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isUpdatingUrl}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : project.smartObjectsUrl ? (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <code className="flex-1 text-sm font-mono text-gray-900 break-all">
                    {project.smartObjectsUrl}
                  </code>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-sleads-blue/10 border border-sleads-blue/20 rounded-lg">
                <p className="text-sm text-sleads-blue">
                  No Smart Objects URL configured yet. Enter a URL when creating
                  your API key.
                </p>
              </div>
            )}
          </div>

          {/* API Key Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-gray-400" />
                <label className="text-sm font-medium text-gray-700">
                  Sleads Smart Objects API Key
                </label>
              </div>
            </div>

            {!project.smartObjectsKey ? (
              <div className="space-y-4">
                <div className="p-4 bg-sleads-blue/10 border border-sleads-blue/20 rounded-lg">
                  <p className="text-sm text-sleads-blue mb-3">
                    No API key generated yet. Enter your Smart Objects URL and
                    click &quot;Generate Key&quot; to create a new Sleads Smart
                    Objects API key for this project.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Smart Objects URL
                      </label>
                      <input
                        type="url"
                        value={newSmartObjectsUrl}
                        onChange={(e) => setNewSmartObjectsUrl(e.target.value)}
                        placeholder="https://example.com/smart-objects"
                        className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={handleGenerateKey}
                      disabled={isGenerating || !newSmartObjectsUrl.trim()}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-sleads-blue text-white text-sm font-medium rounded-lg hover:bg-sleads-blue/90 focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Generate Key
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <code className="flex-1 text-sm font-mono text-gray-900 break-all">
                    {project.smartObjectsKey}
                  </code>
                  <button
                    onClick={handleCopyKey}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:ring-offset-2 transition-colors"
                  >
                    {copiedKey ? (
                      <>
                        <Check className="w-4 h-4 text-sleads-blue" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Keep this key secure. Use it to authenticate requests to the
                  Sleads Smart Objects API.
                </p>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div className="p-4 bg-sleads-blue/10 rounded-lg border border-sleads-blue/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-sleads-blue" />
                <span className="text-xs font-medium text-gray-700">
                  Integration Status
                </span>
              </div>
              <p className="text-2xl font-bold text-sleads-blue">Active</p>
              <p className="text-xs text-gray-500 mt-1">
                Smart Objects enabled
              </p>
            </div>

            <div className="p-4 bg-sleads-blue/10 rounded-lg border border-sleads-blue/20">
              <div className="flex items-center gap-2 mb-2">
                <Key className="w-4 h-4 text-sleads-blue" />
                <span className="text-xs font-medium text-gray-700">
                  API Status
                </span>
              </div>
              <p className="text-2xl font-bold text-sleads-blue">
                {project.smartObjectsKey ? "Ready" : "Pending"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {project.smartObjectsKey ? "Key generated" : "No key yet"}
              </p>
            </div>

            <div className="p-4 bg-sleads-blue/10 rounded-lg border border-sleads-blue/20">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-sleads-blue" />
                <span className="text-xs font-medium text-gray-700">
                  URL Status
                </span>
              </div>
              <p className="text-2xl font-bold text-sleads-blue">
                {project.smartObjectsUrl ? "Configured" : "Not set"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {project.smartObjectsUrl ? "URL configured" : "URL required"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Documentation Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Getting Started with Smart Objects
        </h3>
        <div className="space-y-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">
              1. Configure your Smart Objects URL
            </h4>
            <p>
              Enter the URL where your Smart Objects integration is hosted. This
              URL will be used to communicate with your Smart Objects system.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">
              2. Generate your API Key
            </h4>
            <p>
              Once you&apos;ve entered your Smart Objects URL, click the
              &quot;Generate Key&quot; button to create a unique API key for
              this project. This key will be used to authenticate all Smart
              Objects API requests.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">
              3. Use the Smart Objects API
            </h4>
            <p>
              Use the generated API key to authenticate requests to the Sleads
              Smart Objects API. You can update your Smart Objects URL at any
              time by clicking the &quot;Edit&quot; button.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
