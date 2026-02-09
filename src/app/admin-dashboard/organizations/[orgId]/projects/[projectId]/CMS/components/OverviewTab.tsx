"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../../../convex/_generated/dataModel";
import {
  Loader2,
  Key,
  Copy,
  Check,
  Database,
  FileText,
  Settings,
  Radio,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/app/hooks/useToast";

interface OverviewTabProps {
  projectId: Id<"projects">;
  orgId: Id<"organizations">;
  project: {
    _id: Id<"projects">;
    cmsKey: string | null | undefined;
    cmsIsListening: boolean | null | undefined;
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
  const [isTogglingListening, setIsTogglingListening] = useState(false);

  const createCMSKey = useMutation(api.cms.createCMSKey);
  const toggleListeningMode = useMutation(api.cms.toggleListeningMode);

  const handleCopyKey = async () => {
    if (!project?.cmsKey) return;

    try {
      await navigator.clipboard.writeText(project.cmsKey);
      setCopiedKey(true);
      toast({
        title: "Key copied",
        description: "CMS key has been copied to clipboard.",
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
    setIsGenerating(true);
    try {
      await createCMSKey({
        projectId,
        organizationId: orgId,
      });
      toast({
        title: "CMS key generated",
        description: "CMS key has been generated.",
        variant: "success",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to generate CMS key.",
        variant: "error",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleListeningMode = async () => {
    const newListeningMode = !project.cmsIsListening;
    setIsTogglingListening(true);
    try {
      await toggleListeningMode({
        projectId,
        listeningMode: newListeningMode,
      });
      toast({
        title: "Listening mode updated",
        description: `Listening mode has been ${newListeningMode ? "enabled" : "disabled"}.`,
        variant: "success",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update listening mode.",
        variant: "error",
      });
    } finally {
      setIsTogglingListening(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* CMS Overview */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                CMS Overview
              </h3>
              <p className="text-sm text-gray-500">
                Content Management System is enabled for this project
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Project ID Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-5 h-5 text-gray-400" />
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
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Use this project ID to identify your project in CMS operations.
            </p>
          </div>

          {/* API Key Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-gray-400" />
                <label className="text-sm font-medium text-gray-700">
                  Sleads CMS API Key
                </label>
              </div>
              {!project.cmsKey && (
                <button
                  onClick={handleGenerateKey}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              )}
            </div>

            {project.cmsKey ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <code className="flex-1 text-sm font-mono text-gray-900 break-all">
                    {project.cmsKey}
                  </code>
                  <button
                    onClick={handleCopyKey}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  >
                    {copiedKey ? (
                      <>
                        <Check className="w-4 h-4 text-green-600" />
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
                  Sleads CMS API.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  No API key generated yet. Click &quot;Generate Key&quot; to
                  create a new Sleads CMS API key for this project.
                </p>
              </div>
            )}
          </div>

          {/* Listening Mode Toggle */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Radio className="w-5 h-5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900">
                    Listening Mode
                  </label>
                  <p className="text-xs text-gray-500 mt-0.5">
                    When enabled, the CMS will automatically detect and register
                    new fields
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={project.cmsIsListening || false}
                  onChange={handleToggleListeningMode}
                  disabled={isTogglingListening}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"></div>
                {isTogglingListening && (
                  <Loader2 className="ml-2 w-4 h-4 animate-spin text-gray-400" />
                )}
              </label>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-500">
                  CMS Pages
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-xs text-gray-500 mt-1">Active pages</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-500">
                  Status
                </span>
              </div>
              <p className="text-2xl font-bold text-green-600">Active</p>
              <p className="text-xs text-gray-500 mt-1">CMS enabled</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-500">
                  API Status
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {project.cmsKey ? "Ready" : "Pending"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {project.cmsKey ? "Key generated" : "No key yet"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Documentation Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Getting Started
        </h3>
        <div className="space-y-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">
              1. Generate your API Key
            </h4>
            <p>
              Click the &quot;Generate Key&quot; button above to create a unique
              API key for this project. This key will be used to authenticate
              all CMS API requests.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">
              2. Use the Sleads CMS Hook
            </h4>
            <p>
              Import and use the{" "}
              <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">
                useSleadsCMS
              </code>{" "}
              hook in your React components to access CMS functionality.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">
              3. Manage Content
            </h4>
            <p>
              Use the CMS API to create, update, and manage content pages for
              your project. All changes are synced in real-time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
