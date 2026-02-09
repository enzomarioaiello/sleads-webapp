"use client";

import React from "react";
import { FileText, Key, Hash, Info } from "lucide-react";
import { useApp } from "@/app/contexts/AppContext";
import { TableInfo } from "../../../../../../admin-dashboard/organizations/[orgId]/projects/[projectId]/smart-objects/components/types";

interface SchemaViewProps {
  table: TableInfo;
}

export default function SchemaView({ table }: SchemaViewProps) {
  const { t } = useApp();

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-800 dark:text-blue-200">
          <p>
            {t(
              "dashboard_internal.project_detail.cms.smart_objects.tables.schema_info"
            )}
          </p>
        </div>
      </div>

      {/* Fields Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-sleads-blue dark:text-blue-400" />
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
            {t(
              "dashboard_internal.project_detail.cms.smart_objects.tables.fields"
            )}{" "}
            ({table.fields.length})
          </h4>
        </div>
        <div className="space-y-2">
          {table.fields.map((field) => (
            <div
              key={field.name}
              className="p-4 bg-slate-50 dark:bg-sleads-slate800 rounded-lg border border-slate-200 dark:border-sleads-slate700 hover:border-sleads-blue dark:hover:border-blue-500 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <code className="text-sm font-semibold text-slate-900 dark:text-white">
                      {field.name}
                    </code>
                    {field.optional && (
                      <span className="text-xs px-2 py-0.5 bg-sleads-blue/10 dark:bg-sleads-blue/20 text-sleads-blue dark:text-blue-400 rounded">
                        {t(
                          "dashboard_internal.project_detail.cms.smart_objects.tables.optional"
                        )}
                      </span>
                    )}
                    {!field.optional && (
                      <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">
                        {t(
                          "dashboard_internal.project_detail.cms.smart_objects.tables.required"
                        )}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Hash className="w-3 h-3 text-slate-400" />
                    <code className="text-xs text-slate-600 dark:text-sleads-slate400 font-mono">
                      {field.type}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Indexes Section */}
      {table.indexes.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-sleads-blue dark:text-blue-400" />
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
              {t(
                "dashboard_internal.project_detail.cms.smart_objects.tables.indexes"
              )}{" "}
              ({table.indexes.length})
            </h4>
          </div>
          <div className="space-y-2">
            {table.indexes.map((index, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50 dark:bg-sleads-slate800 rounded-lg border border-slate-200 dark:border-sleads-slate700"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Key className="w-4 h-4 text-sleads-blue dark:text-blue-400" />
                  <code className="text-sm font-semibold text-slate-900 dark:text-white">
                    {index.indexDescriptor}
                  </code>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-500 dark:text-sleads-slate400">
                    {t(
                      "dashboard_internal.project_detail.cms.smart_objects.tables.index_fields"
                    )}
                    :
                  </span>
                  {index.fields.map((field, fieldIdx) => (
                    <span
                      key={fieldIdx}
                      className="text-xs px-2 py-1 bg-sleads-blue/10 dark:bg-sleads-blue/20 text-sleads-blue dark:text-blue-400 rounded"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
