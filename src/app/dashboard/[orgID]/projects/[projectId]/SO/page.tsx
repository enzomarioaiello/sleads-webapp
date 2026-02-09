"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../convex/_generated/dataModel";
import { Table, Database, ChevronRight, Sparkles } from "lucide-react";
import { useApp } from "@/app/contexts/AppContext";
import TablesView from "./components/TablesView";

type Tab = "tables";

export default function UserSmartObjectsPage() {
  const params = useParams();
  const projectId = params.projectId as Id<"projects">;
  const orgId = params.orgID as Id<"organizations">;
  const { t } = useApp();

  const [activeTab, setActiveTab] = useState<Tab>("tables");

  // Fetch project data
  const project = useQuery(api.project.getProject, {
    projectId,
    organizationId: orgId,
  });

  const tabs = [
    {
      id: "tables" as Tab,
      label: t(
        "dashboard_internal.project_detail.cms.smart_objects.tabs.tables"
      ),
      icon: Table,
      description: t(
        "dashboard_internal.project_detail.cms.smart_objects.tabs.tables_desc"
      ),
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  if (project === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sleads-blue mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-sleads-slate400">
            {t("dashboard_internal.project_detail.cms.smart_objects.loading")}
          </p>
        </div>
      </div>
    );
  }

  if (!project?.enableSmartObjects) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[400px] p-6"
      >
        <div className="p-4 bg-slate-100 dark:bg-sleads-slate800 rounded-full mb-4">
          <Sparkles className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {t("dashboard_internal.project_detail.cms.smart_objects.not_enabled")}
        </h3>
        <p className="text-slate-500 dark:text-sleads-slate400 text-center max-w-md">
          {t(
            "dashboard_internal.project_detail.cms.smart_objects.not_enabled_desc"
          )}
        </p>
      </motion.div>
    );
  }

  if (!project.smartObjectsUrl || !project.smartObjectsKey) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[400px] p-6"
      >
        <div className="p-4 bg-slate-100 dark:bg-sleads-slate800 rounded-full mb-4">
          <Database className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {t(
            "dashboard_internal.project_detail.cms.smart_objects.config_required"
          )}
        </h3>
        <p className="text-slate-500 dark:text-sleads-slate400 text-center max-w-md">
          {t(
            "dashboard_internal.project_detail.cms.smart_objects.config_required_desc"
          )}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header with explanation */}
      <motion.div variants={item} className="space-y-2">
        <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white">
          {t("dashboard_internal.project_detail.cms.smart_objects.title")}
        </h2>
        <p className="text-slate-500 dark:text-sleads-slate400 text-lg max-w-3xl">
          {t("dashboard_internal.project_detail.cms.smart_objects.description")}
        </p>
      </motion.div>

      {/* Tab Navigation - Mobile Friendly */}
      <motion.div variants={item}>
        <div className="grid grid-cols-1 sm:grid-cols-1 gap-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all
                  ${
                    isActive
                      ? "border-sleads-blue bg-blue-50 dark:bg-sleads-blue/10 shadow-md"
                      : "border-slate-200 dark:border-sleads-slate800 bg-white dark:bg-sleads-slate900 hover:border-slate-300 dark:hover:border-sleads-slate700"
                  }
                `}
              >
                <div
                  className={`
                  p-2 rounded-lg
                  ${
                    isActive
                      ? "bg-sleads-blue text-white"
                      : "bg-slate-100 dark:bg-sleads-slate800 text-slate-600 dark:text-sleads-slate400"
                  }
                `}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <div
                    className={`
                    font-semibold text-sm
                    ${
                      isActive
                        ? "text-sleads-blue dark:text-blue-400"
                        : "text-slate-900 dark:text-white"
                    }
                  `}
                  >
                    {tab.label}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-sleads-slate400 mt-0.5">
                    {tab.description}
                  </div>
                </div>
                {isActive && (
                  <ChevronRight className="w-5 h-5 text-sleads-blue dark:text-blue-400" />
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div variants={item}>
        {activeTab === "tables" && project && (
          <TablesView
            projectId={projectId}
            orgId={orgId}
            project={{
              _id: project._id,
              smartObjectsKey: project.smartObjectsKey,
              smartObjectsUrl: project.smartObjectsUrl,
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );
}
