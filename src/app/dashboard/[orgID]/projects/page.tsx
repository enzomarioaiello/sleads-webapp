"use client";
import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useApp } from "@/app/contexts/AppContext";
import {
  FolderKanban,
  Search,
  ExternalLink,
  Calendar,
  Globe,
  CheckCircle2,
  XCircle,
  Sparkles,
  Database,
} from "lucide-react";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ProjectsPage() {
  const params = useParams();
  const organizationId = params.orgID as string;
  const { t } = useApp();
  const [searchQuery, setSearchQuery] = useState("");

  const projects = useQuery(
    api.project.getProjects,
    organizationId
      ? { organizationId: organizationId as Id<"organizations"> }
      : ("skip" as "skip" | { organizationId: Id<"organizations"> })
  );

  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    if (!searchQuery.trim()) return projects;

    const query = searchQuery.toLowerCase();
    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(query) ||
        (project.description &&
          project.description.toLowerCase().includes(query))
    );
  }, [projects, searchQuery]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  if (!organizationId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <FolderKanban className="w-16 h-16 text-slate-300 dark:text-sleads-slate700 mx-auto mb-4" />
          <p className="text-slate-500 dark:text-sleads-slate400">
            {t("dashboard_internal.projects.no_projects")}
          </p>
        </div>
      </div>
    );
  }

  if (projects === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sleads-blue mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-sleads-slate400">
            {t("dashboard_internal.projects.loading")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-10"
    >
      {/* Header Section */}
      <motion.div variants={item} className="flex flex-col gap-2">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <FolderKanban className="w-8 h-8 text-sleads-blue" />
              {t("dashboard_internal.projects.title")}
            </h2>
            <p className="text-slate-500 dark:text-sleads-slate400 text-lg max-w-2xl mt-2">
              {t("dashboard_internal.projects.subtitle")}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Search Bar */}
      {projects.length > 0 && (
        <motion.div variants={item}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-sleads-slate500" />
            <input
              type="text"
              placeholder={t("dashboard_internal.projects.search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-sleads-slate500 focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:border-transparent transition-all"
            />
          </div>
        </motion.div>
      )}

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <motion.div
          variants={item}
          className="flex flex-col items-center justify-center min-h-[400px] bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 rounded-2xl p-12"
        >
          <FolderKanban className="w-16 h-16 text-slate-300 dark:text-sleads-slate700 mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {t("dashboard_internal.projects.no_projects")}
          </h3>
          <p className="text-slate-500 dark:text-sleads-slate400 text-center max-w-md">
            {t("dashboard_internal.projects.no_projects_desc")}
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={item}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {filteredProjects.map((project, index) => {
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

            // Generate gradient colors based on index
            const gradients = [
              "from-sleads-blue to-blue-700",
              "from-blue-500 to-sleads-blue",
              "from-purple-500 to-pink-600",
              "from-green-500 to-emerald-600",
              "from-orange-500 to-red-600",
              "from-indigo-500 to-purple-600",
            ];
            const gradient = gradients[index % gradients.length];

            return (
              <motion.div
                key={project._id}
                variants={item}
                className="bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group"
              >
                {/* Header with Gradient */}
                <div
                  className={`h-32 bg-linear-to-r ${gradient} relative overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute bottom-4 left-6 right-6">
                    <h3 className="text-white font-bold text-xl mb-1">
                      {project.name}
                    </h3>
                    {project.description && (
                      <p className="text-white/80 text-sm line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Metadata */}
                  <div className="space-y-3 mb-6">
                    {createdDate && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-sleads-slate400">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {t("dashboard_internal.projects.created")}:{" "}
                          <span className="font-medium text-slate-900 dark:text-white">
                            {createdDate}
                          </span>
                        </span>
                      </div>
                    )}
                    {updatedDate && createdDate !== updatedDate && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-sleads-slate400">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {t("dashboard_internal.projects.updated")}:{" "}
                          <span className="font-medium text-slate-900 dark:text-white">
                            {updatedDate}
                          </span>
                        </span>
                      </div>
                    )}
                    {project.url && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="w-4 h-4 text-sleads-blue" />
                        <a
                          href={project.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sleads-blue hover:underline flex items-center gap-1 font-medium"
                        >
                          {t("dashboard_internal.projects.url")}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-wider">
                      {t("dashboard_internal.projects.features")}
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      <div
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                          project.enableSmartObjects
                            ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400"
                            : "bg-slate-100 dark:bg-sleads-slate800 text-slate-500 dark:text-sleads-slate500"
                        }`}
                      >
                        {project.enableSmartObjects ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        <Sparkles className="w-3 h-3" />
                        {t("dashboard_internal.projects.smart_objects")}
                      </div>
                      <div
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                          project.enableCMS
                            ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400"
                            : "bg-slate-100 dark:bg-sleads-slate800 text-slate-500 dark:text-sleads-slate500"
                        }`}
                      >
                        {project.enableCMS ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        <Database className="w-3 h-3" />
                        {t("dashboard_internal.projects.cms")}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link
                    href={`/dashboard/${organizationId}/projects/${project._id}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-sleads-blue text-white text-sm font-semibold hover:bg-sleads-blue/90 transition-colors shadow-lg shadow-sleads-blue/20 flex items-center justify-center gap-2"
                  >
                    {t("dashboard_internal.projects.view_details")}
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
