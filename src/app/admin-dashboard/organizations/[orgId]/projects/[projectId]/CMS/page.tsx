"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../../convex/_generated/dataModel";
import {
  Loader2,
  Database,
  FileText,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/app/utils/cn";
import OverviewTab from "./components/OverviewTab";
import ContentTab from "./components/ContentTab";
import SettingsTab from "./components/SettingsTab";

export default function ProjectCMSPage() {
  const params = useParams();
  const projectId = params.projectId as Id<"projects">;
  const orgId = params.orgId as string;

  const project = useQuery(api.project.getProject, {
    projectId,
    organizationId: orgId as Id<"organizations">,
  });

  const cmsPages = useQuery(api.cms.getCMSPages, {
    projectId,
    organizationId: orgId as Id<"organizations">,
  });

  const [activeTab, setActiveTab] = useState<
    "overview" | "content" | "settings"
  >("overview");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  // Top 30 most spoken languages with their country codes for flags
  const languages = [
    { code: "en", name: "English", flag: "🇬🇧" },
    { code: "zh", name: "Mandarin Chinese", flag: "🇨🇳" },
    { code: "hi", name: "Hindi", flag: "🇮🇳" },
    { code: "es", name: "Spanish", flag: "🇪🇸" },
    { code: "fr", name: "French", flag: "🇫🇷" },
    { code: "ar", name: "Arabic", flag: "🇸🇦" },
    { code: "bn", name: "Bengali", flag: "🇧🇩" },
    { code: "pt", name: "Portuguese", flag: "🇵🇹" },
    { code: "ru", name: "Russian", flag: "🇷🇺" },
    { code: "ja", name: "Japanese", flag: "🇯🇵" },
    { code: "de", name: "German", flag: "🇩🇪" },
    { code: "ko", name: "Korean", flag: "🇰🇷" },
    { code: "vi", name: "Vietnamese", flag: "🇻🇳" },
    { code: "it", name: "Italian", flag: "🇮🇹" },
    { code: "tr", name: "Turkish", flag: "🇹🇷" },
    { code: "pl", name: "Polish", flag: "🇵🇱" },
    { code: "uk", name: "Ukrainian", flag: "🇺🇦" },
    { code: "nl", name: "Dutch", flag: "🇳🇱" },
    { code: "th", name: "Thai", flag: "🇹🇭" },
    { code: "id", name: "Indonesian", flag: "🇮🇩" },
    { code: "cs", name: "Czech", flag: "🇨🇿" },
    { code: "sv", name: "Swedish", flag: "🇸🇪" },
    { code: "ro", name: "Romanian", flag: "🇷🇴" },
    { code: "hu", name: "Hungarian", flag: "🇭🇺" },
    { code: "fi", name: "Finnish", flag: "🇫🇮" },
    { code: "da", name: "Danish", flag: "🇩🇰" },
    { code: "no", name: "Norwegian", flag: "🇳🇴" },
    { code: "he", name: "Hebrew", flag: "🇮🇱" },
    { code: "el", name: "Greek", flag: "🇬🇷" },
    { code: "sk", name: "Slovak", flag: "🇸🇰" },
  ];

  // Initialize selectedLanguages from project
  useEffect(() => {
    if (project?.selectedLanguages) {
      setTimeout(() => {
        setSelectedLanguages(project.selectedLanguages || []);
      }, 0);
    }
  }, [project?.selectedLanguages]);

  if (!project) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!project.enableCMS) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">CMS</h2>
          <p className="text-sm text-gray-500">
            Content Management System for this project.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Database className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              CMS is not enabled
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Enable CMS in the project settings to access the Content
              Management System features.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">CMS</h2>
          <p className="text-sm text-gray-500">
            Manage your Content Management System settings and API keys.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("overview")}
            className={cn(
              activeTab === "overview"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
              "group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium"
            )}
          >
            <LayoutDashboard
              className={cn(
                activeTab === "overview"
                  ? "text-blue-500"
                  : "text-gray-400 group-hover:text-gray-500",
                "mr-2 -ml-0.5 h-5 w-5"
              )}
            />
            Overview
          </button>
          <button
            onClick={() => setActiveTab("content")}
            className={cn(
              activeTab === "content"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
              "group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium"
            )}
          >
            <FileText
              className={cn(
                activeTab === "content"
                  ? "text-blue-500"
                  : "text-gray-400 group-hover:text-gray-500",
                "mr-2 -ml-0.5 h-5 w-5"
              )}
            />
            Content
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={cn(
              activeTab === "settings"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
              "group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium"
            )}
          >
            <Settings
              className={cn(
                activeTab === "settings"
                  ? "text-blue-500"
                  : "text-gray-400 group-hover:text-gray-500",
                "mr-2 -ml-0.5 h-5 w-5"
              )}
            />
            Settings
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && project && (
        <OverviewTab
          projectId={projectId}
          orgId={orgId as Id<"organizations">}
          project={
            project as {
              _id: Id<"projects">;
              cmsKey: string | null | undefined;
              cmsIsListening: boolean | null | undefined;
            }
          }
        />
      )}

      {activeTab === "content" && project && (
        <ContentTab
          projectId={projectId}
          orgId={orgId as Id<"organizations">}
          cmsPages={cmsPages}
          project={project}
          languages={languages}
        />
      )}

      {activeTab === "settings" && project && (
        <SettingsTab
          projectId={projectId}
          orgId={orgId as Id<"organizations">}
          project={project}
          selectedLanguages={selectedLanguages}
          setSelectedLanguages={setSelectedLanguages}
          languages={languages}
        />
      )}
    </div>
  );
}
