"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../../convex/_generated/dataModel";
import { Loader2, LayoutDashboard, Sparkles, Table } from "lucide-react";
import { cn } from "@/app/utils/cn";
import OverviewTab from "./components/OverviewTab";
import TablesTab from "./components/TablesTab";

export default function ProjectSmartObjectsPage() {
  const params = useParams();
  const projectId = params.projectId as Id<"projects">;
  const orgId = params.orgId as string;

  const project = useQuery(api.project.getProject, {
    projectId,
    organizationId: orgId as Id<"organizations">,
  });

  const [activeTab, setActiveTab] = useState<"overview" | "tables">("overview");

  if (!project) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!project.enableSmartObjects) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Smart Objects</h2>
          <p className="text-sm text-gray-500">
            Smart Objects integration for this project.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Smart Objects is not enabled
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Enable Smart Objects in the project settings to access the Smart
              Objects integration features.
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
          <h2 className="text-xl font-bold text-gray-900">Smart Objects</h2>
          <p className="text-sm text-gray-500">
            Manage your Smart Objects integration settings and API keys.
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
                ? "border-sleads-blue text-sleads-blue"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
              "group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium"
            )}
          >
            <LayoutDashboard
              className={cn(
                activeTab === "overview"
                  ? "text-sleads-blue"
                  : "text-gray-400 group-hover:text-gray-500",
                "mr-2 -ml-0.5 h-5 w-5"
              )}
            />
            Overview
          </button>
          <button
            onClick={() => setActiveTab("tables")}
            className={cn(
              activeTab === "tables"
                ? "border-sleads-blue text-sleads-blue"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
              "group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium"
            )}
          >
            <Table
              className={cn(
                activeTab === "tables"
                  ? "text-sleads-blue"
                  : "text-gray-400 group-hover:text-gray-500",
                "mr-2 -ml-0.5 h-5 w-5"
              )}
            />
            Tables
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
              smartObjectsKey: string | null | undefined;
              smartObjectsUrl: string | null | undefined;
            }
          }
        />
      )}

      {activeTab === "tables" && project && (
        <TablesTab
          projectId={projectId}
          orgId={orgId as Id<"organizations">}
          project={
            project as {
              _id: Id<"projects">;
              smartObjectsKey: string | null | undefined;
              smartObjectsUrl: string | null | undefined;
            }
          }
        />
      )}
    </div>
  );
}
