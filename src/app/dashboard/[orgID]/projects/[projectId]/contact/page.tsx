"use client";
import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { useApp } from "@/app/contexts/AppContext";
import { Mail, Phone, MapPin, User } from "lucide-react";
import { Id } from "../../../../../../../convex/_generated/dataModel";
import { useParams } from "next/navigation";

export default function ProjectContactPage() {
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

  // Get contact information
  const contacts = useQuery(
    api.organizations.getOrganizationContactInformation,
    organizationId
      ? { organizationId: organizationId as Id<"organizations"> }
      : ("skip" as "skip" | { organizationId: Id<"organizations"> })
  );

  const currentContact = contacts?.find(
    (c) => c._id === project?.contactInformation
  );

  if (!currentContact) {
    return (
      <div className="bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 rounded-2xl p-12 shadow-sm">
        <div className="flex flex-col items-center justify-center text-center">
          <User className="w-16 h-16 text-slate-300 dark:text-sleads-slate700 mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {t("dashboard_internal.project_detail.no_contact")}
          </h3>
          <p className="text-slate-500 dark:text-sleads-slate400">
            {t("dashboard_internal.project_detail.no_contact")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <User className="w-5 h-5 text-sleads-blue" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {t("dashboard_internal.project_detail.contact_person")}
        </h2>
      </div>

      <div className="space-y-6">
        {/* Contact Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-slate-200 dark:border-sleads-slate800">
          <div className="h-16 w-16 rounded-full bg-linear-to-br from-sleads-blue to-blue-700 flex items-center justify-center text-white text-2xl font-bold">
            {currentContact.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {currentContact.name}
            </h3>
            <p className="text-sm text-slate-500 dark:text-sleads-slate400">
              {t("dashboard_internal.project_detail.contact_person")}
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          {currentContact.organizationName && (
            <div className="flex items-start gap-3">
              <div className="p-2 bg-slate-50 dark:bg-sleads-slate800 rounded-lg text-slate-500 dark:text-sleads-slate400 mt-0.5">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-sleads-slate400 mb-1">
                  {t("dashboard_internal.project_detail.organization_name")}
                </p>
                <p className="text-slate-900 dark:text-white">
                  {currentContact.organizationName}
                </p>
              </div>
            </div>
          )}

          {currentContact.email && (
            <div className="flex items-start gap-3">
              <div className="p-2 bg-slate-50 dark:bg-sleads-slate800 rounded-lg text-slate-500 dark:text-sleads-slate400 mt-0.5">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-sleads-slate400 mb-1">
                  {t("dashboard_internal.project_detail.email")}
                </p>
                <a
                  href={`mailto:${currentContact.email}`}
                  className="text-sleads-blue hover:underline"
                >
                  {currentContact.email}
                </a>
              </div>
            </div>
          )}

          {currentContact.phone && (
            <div className="flex items-start gap-3">
              <div className="p-2 bg-slate-50 dark:bg-sleads-slate800 rounded-lg text-slate-500 dark:text-sleads-slate400 mt-0.5">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-sleads-slate400 mb-1">
                  {t("dashboard_internal.project_detail.phone")}
                </p>
                <a
                  href={`tel:${currentContact.phone}`}
                  className="text-sleads-blue hover:underline"
                >
                  {currentContact.phone}
                </a>
              </div>
            </div>
          )}

          {currentContact.address && (
            <div className="flex items-start gap-3">
              <div className="p-2 bg-slate-50 dark:bg-sleads-slate800 rounded-lg text-slate-500 dark:text-sleads-slate400 mt-0.5">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-sleads-slate400 mb-1">
                  {t("dashboard_internal.project_detail.address")}
                </p>
                <p className="text-slate-900 dark:text-white">
                  {currentContact.address}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
