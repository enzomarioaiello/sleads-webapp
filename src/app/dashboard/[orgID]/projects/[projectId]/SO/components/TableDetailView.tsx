"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, Database } from "lucide-react";
import { Id } from "../../../../../../../../convex/_generated/dataModel";
import { useApp } from "@/app/contexts/AppContext";
import {
  TableInfo,
  SchemaResponse,
} from "../../../../../../admin-dashboard/organizations/[orgId]/projects/[projectId]/smart-objects/components/types";
import SchemaView from "./SchemaView";
import DataTableView from "./DataTableView";

interface TableDetailViewProps {
  projectId: Id<"projects">;
  orgId: Id<"organizations">;
  project: {
    _id: Id<"projects">;
    smartObjectsKey: string | null | undefined;
    smartObjectsUrl: string | null | undefined;
  };
  tableName: string;
  tableInfo: TableInfo | undefined;
  schema: SchemaResponse | null;
  onBack: () => void;
}

export default function TableDetailView({
  projectId,
  orgId,
  project,
  tableName,
  tableInfo,
  schema,
  onBack,
}: TableDetailViewProps) {
  const { t } = useApp();
  const [activeTab, setActiveTab] = useState<"schema" | "data">("data");

  if (!tableInfo) {
    return (
      <div className="bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 rounded-xl p-8 text-center">
        <p className="text-slate-500 dark:text-sleads-slate400">
          {t(
            "dashboard_internal.project_detail.cms.smart_objects.tables.table_not_found"
          )}
        </p>
      </div>
    );
  }

  const tabs = [
    {
      id: "data" as const,
      label: t(
        "dashboard_internal.project_detail.cms.smart_objects.tables.tabs.data"
      ),
      icon: Database,
      description: t(
        "dashboard_internal.project_detail.cms.smart_objects.tables.tabs.data_desc"
      ),
    },
    {
      id: "schema" as const,
      label: t(
        "dashboard_internal.project_detail.cms.smart_objects.tables.tabs.schema"
      ),
      icon: FileText,
      description: t(
        "dashboard_internal.project_detail.cms.smart_objects.tables.tabs.schema_desc"
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-slate-100 dark:hover:bg-sleads-slate800 rounded-lg transition-colors"
          aria-label={t(
            "dashboard_internal.project_detail.cms.smart_objects.tables.back"
          )}
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-sleads-slate400" />
        </button>
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            {tableName}
          </h3>
          <p className="text-sm text-slate-500 dark:text-sleads-slate400 mt-1">
            {tableInfo.fields.length}{" "}
            {t(
              "dashboard_internal.project_detail.cms.smart_objects.tables.fields"
            )}
            , {tableInfo.indexes.length}{" "}
            {t(
              "dashboard_internal.project_detail.cms.smart_objects.tables.indexes"
            )}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 rounded-xl p-1 flex gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all
                ${
                  isActive
                    ? "bg-sleads-blue text-white shadow-sm"
                    : "text-slate-600 dark:text-sleads-slate400 hover:bg-slate-50 dark:hover:bg-sleads-slate800"
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 rounded-xl p-6">
        {activeTab === "schema" && <SchemaView table={tableInfo} />}
        {activeTab === "data" && (
          <DataTableView
            projectId={projectId}
            orgId={orgId}
            project={project}
            tableName={tableName}
            schema={schema}
          />
        )}
      </div>
    </motion.div>
  );
}
