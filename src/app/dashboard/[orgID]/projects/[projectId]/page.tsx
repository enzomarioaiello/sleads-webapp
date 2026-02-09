"use client";
import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useApp } from "@/app/contexts/AppContext";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Sparkles,
  Database,
  ExternalLink,
  Info,
} from "lucide-react";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { useParams } from "next/navigation";
import { cn } from "@/app/utils/cn";

export default function ProjectOverviewPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const organizationId = params.orgID as string;
  const { t } = useApp();

  const project = useQuery(
    api.project.getProject,
    projectId
      ? {
          projectId: projectId as Id<"projects">,
          organizationId: organizationId as Id<"organizations">,
        }
      : ("skip" as
          | "skip"
          | { projectId: Id<"projects">; organizationId: Id<"organizations"> })
  );

  if (!project) {
    return null;
  }

  const createdDate = project.createdAt
    ? new Date(project.createdAt).toLocaleDateString("nl-NL", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;
  const updatedDate = project.updatedAt
    ? new Date(project.updatedAt).toLocaleDateString("nl-NL", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="space-y-6">
      {/* General Information */}
      <div className="bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Info className="w-5 h-5 text-sleads-blue" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {t("dashboard_internal.project_detail.general_info")}
          </h2>
        </div>

        <div className="space-y-6">
          {/* Project Name */}
          <div>
            <label className="text-sm font-semibold text-slate-600 dark:text-sleads-slate400 mb-2 block">
              {t("dashboard_internal.project_detail.project_name")}
            </label>
            <p className="text-lg text-slate-900 dark:text-white font-medium">
              {project.name}
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-semibold text-slate-600 dark:text-sleads-slate400 mb-2 block">
              {t("dashboard_internal.project_detail.project_description")}
            </label>
            <p className="text-slate-700 dark:text-sleads-slate300 leading-relaxed">
              {project.description ||
                t("dashboard_internal.project_detail.no_description")}
            </p>
          </div>

          {/* Website URL */}
          {project.url && (
            <div>
              <label className="text-sm font-semibold text-slate-600 dark:text-sleads-slate400 mb-2 block">
                {t("dashboard_internal.project_detail.website_url")}
              </label>
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sleads-blue hover:underline font-medium"
              >
                {project.url}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-sleads-slate800">
            {createdDate && (
              <div>
                <label className="text-sm font-semibold text-slate-600 dark:text-sleads-slate400 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {t("dashboard_internal.project_detail.created_at")}
                </label>
                <p className="text-slate-900 dark:text-white">{createdDate}</p>
              </div>
            )}
            {updatedDate && (
              <div>
                <label className="text-sm font-semibold text-slate-600 dark:text-sleads-slate400 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {t("dashboard_internal.project_detail.last_updated")}
                </label>
                <p className="text-slate-900 dark:text-white">{updatedDate}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
          {t("dashboard_internal.project_detail.features_enabled")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Smart Objects */}
          <div
            className={cn(
              "p-4 rounded-xl border-2 transition-all",
              project.enableSmartObjects
                ? "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20"
                : "bg-slate-50 dark:bg-sleads-slate800 border-slate-200 dark:border-sleads-slate700"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    project.enableSmartObjects
                      ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400"
                      : "bg-slate-200 dark:bg-sleads-slate700 text-slate-500 dark:text-sleads-slate500"
                  )}
                >
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {t("dashboard_internal.project_detail.smart_objects")}
                </h3>
              </div>
              {project.enableSmartObjects ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-slate-400 dark:text-sleads-slate600" />
              )}
            </div>
            <p
              className={cn(
                "text-sm",
                project.enableSmartObjects
                  ? "text-green-700 dark:text-green-400"
                  : "text-slate-500 dark:text-sleads-slate500"
              )}
            >
              {project.enableSmartObjects
                ? t("dashboard_internal.project_detail.enabled")
                : t("dashboard_internal.project_detail.disabled")}
            </p>
          </div>

          {/* CMS */}
          <div
            className={cn(
              "p-4 rounded-xl border-2 transition-all",
              project.enableCMS
                ? "bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20"
                : "bg-slate-50 dark:bg-sleads-slate800 border-slate-200 dark:border-sleads-slate700"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    project.enableCMS
                      ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400"
                      : "bg-slate-200 dark:bg-sleads-slate700 text-slate-500 dark:text-sleads-slate500"
                  )}
                >
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {t("dashboard_internal.project_detail.cms_label")}
                </h3>
              </div>
              {project.enableCMS ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="w-5 h-5 text-slate-400 dark:text-sleads-slate600" />
              )}
            </div>
            <p
              className={cn(
                "text-sm",
                project.enableCMS
                  ? "text-green-700 dark:text-green-400"
                  : "text-slate-500 dark:text-sleads-slate500"
              )}
            >
              {project.enableCMS
                ? t("dashboard_internal.project_detail.enabled")
                : t("dashboard_internal.project_detail.disabled")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
