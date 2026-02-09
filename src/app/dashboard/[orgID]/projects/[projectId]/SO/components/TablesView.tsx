"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAction } from "convex/react";
import { api } from "../../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../../convex/_generated/dataModel";
import {
  Loader2,
  Table,
  RefreshCw,
  AlertCircle,
  Database,
  Info,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/app/hooks/useToast";
import { useApp } from "@/app/contexts/AppContext";
import {
  SchemaResponse,
  TableInfo,
} from "../../../../../../admin-dashboard/organizations/[orgId]/projects/[projectId]/smart-objects/components/types";
import TableDetailView from "./TableDetailView";

interface TablesViewProps {
  projectId: Id<"projects">;
  orgId: Id<"organizations">;
  project: {
    _id: Id<"projects">;
    smartObjectsKey: string | null | undefined;
    smartObjectsUrl: string | null | undefined;
  };
}

export default function TablesView({
  projectId,
  orgId,
  project,
}: TablesViewProps) {
  const { toast } = useToast();
  const { t } = useApp();
  const [schema, setSchema] = useState<SchemaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const getSchema = useAction(api.smartObjects.getSchema);

  const fetchSchema = async () => {
    if (!project.smartObjectsUrl || !project.smartObjectsKey) {
      setError(
        t(
          "dashboard_internal.project_detail.cms.smart_objects.tables.config_error"
        )
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getSchema({
        projectId: projectId,
        organizationId: orgId,
      });
      setSchema(data as SchemaResponse);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : t(
              "dashboard_internal.project_detail.cms.smart_objects.tables.fetch_error"
            );
      setError(errorMessage);
      toast({
        title: t(
          "dashboard_internal.project_detail.cms.smart_objects.tables.error_title"
        ),
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (project.smartObjectsUrl && project.smartObjectsKey) {
      fetchSchema();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.smartObjectsUrl, project.smartObjectsKey]);

  const parseTableInfo = (tableName: string, tableData: any): TableInfo => {
    const fields: Array<{
      name: string;
      type: string;
      optional: boolean;
      details?: any;
    }> = [];

    if (tableData.validator?.fields) {
      Object.entries(tableData.validator.fields).forEach(
        ([fieldName, fieldData]: [string, any]) => {
          const isOptional = fieldData.isOptional === "optional";
          let type = "unknown";

          if (fieldData.kind === "string") {
            type = "string";
          } else if (fieldData.kind === "float64") {
            type = "number";
          } else if (fieldData.kind === "boolean") {
            type = "boolean";
          } else if (fieldData.kind === "id") {
            type = `id<"${fieldData.tableName || "unknown"}">`;
          } else if (fieldData.kind === "union") {
            const members = fieldData.members || [];
            if (
              members.length === 2 &&
              members.some((m: any) => m.kind === "null")
            ) {
              const nonNullMember = members.find((m: any) => m.kind !== "null");
              if (nonNullMember?.kind === "string") {
                type = "string | null";
              } else if (nonNullMember?.kind === "float64") {
                type = "number | null";
              } else if (nonNullMember?.kind === "boolean") {
                type = "boolean | null";
              } else if (nonNullMember?.kind === "id") {
                type = `id<"${nonNullMember.tableName || "unknown"}"> | null`;
              } else {
                type = "union | null";
              }
            } else if (members.every((m: any) => m.kind === "literal")) {
              type = members.map((m: any) => `"${m.value}"`).join(" | ");
            } else {
              type = "union";
            }
          } else if (fieldData.kind === "array") {
            type = "array";
          } else if (fieldData.kind === "object") {
            type = "object";
          } else if (fieldData.kind === "literal") {
            type = `"${fieldData.value}"`;
          } else if (fieldData.kind === "any") {
            type = "any";
          }

          fields.push({
            name: fieldName,
            type,
            optional: isOptional,
            details: fieldData,
          });
        }
      );
    }

    return {
      name: tableName,
      indexes: tableData.indexes || [],
      fields,
    };
  };

  const tables: TableInfo[] = schema
    ? Object.entries(schema.schema.tables).map(([name, data]) =>
        parseTableInfo(name, data)
      )
    : [];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  if (loading && !schema) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-sleads-blue" />
      </div>
    );
  }

  if (error && !schema) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              {error}
            </p>
            <button
              onClick={fetchSchema}
              className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              {t(
                "dashboard_internal.project_detail.cms.smart_objects.tables.retry"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedTable) {
    const selectedTableInfo = tables.find((t) => t.name === selectedTable);
    return (
      <TableDetailView
        projectId={projectId}
        orgId={orgId}
        project={project}
        tableName={selectedTable}
        tableInfo={selectedTableInfo}
        schema={schema}
        onBack={() => setSelectedTable(null)}
      />
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header with refresh and info */}
      <motion.div
        variants={item}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="space-y-1">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
            {t(
              "dashboard_internal.project_detail.cms.smart_objects.tables.title"
            )}
          </h3>
          <p className="text-sm text-slate-500 dark:text-sleads-slate400">
            {t(
              "dashboard_internal.project_detail.cms.smart_objects.tables.subtitle"
            )}
          </p>
        </div>
        <button
          onClick={fetchSchema}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-sleads-slate300 bg-white dark:bg-sleads-slate900 border border-slate-300 dark:border-sleads-slate700 rounded-lg hover:bg-slate-50 dark:hover:bg-sleads-slate800 focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {t(
            "dashboard_internal.project_detail.cms.smart_objects.tables.refresh"
          )}
        </button>
      </motion.div>

      {/* Info Card */}
      {schema && (
        <motion.div
          variants={item}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3"
        >
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">
              {t(
                "dashboard_internal.project_detail.cms.smart_objects.tables.info_title"
              )}
            </p>
            <p>
              {t(
                "dashboard_internal.project_detail.cms.smart_objects.tables.info_desc"
              )}
            </p>
          </div>
        </motion.div>
      )}

      {/* Tables Grid */}
      {schema && (
        <motion.div variants={item}>
          {tables.length === 0 ? (
            <div className="bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 rounded-xl p-12 text-center">
              <Database className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {t(
                  "dashboard_internal.project_detail.cms.smart_objects.tables.no_tables"
                )}
              </h3>
              <p className="text-sm text-slate-500 dark:text-sleads-slate400 max-w-md mx-auto">
                {t(
                  "dashboard_internal.project_detail.cms.smart_objects.tables.no_tables_desc"
                )}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tables.map((table) => (
                <motion.button
                  key={table.name}
                  variants={item}
                  onClick={() => setSelectedTable(table.name)}
                  className="text-left p-5 bg-white dark:bg-sleads-slate900 border-2 border-slate-200 dark:border-sleads-slate800 rounded-xl hover:border-sleads-blue dark:hover:border-blue-500 hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-sleads-blue/10 dark:bg-sleads-blue/20 rounded-lg group-hover:bg-sleads-blue/20 dark:group-hover:bg-sleads-blue/30 transition-colors">
                      <Table className="w-5 h-5 text-sleads-blue dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900 dark:text-white truncate group-hover:text-sleads-blue dark:group-hover:text-blue-400 transition-colors">
                        {table.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-sleads-slate400 mt-1">
                        {table.fields.length}{" "}
                        {t(
                          "dashboard_internal.project_detail.cms.smart_objects.tables.fields"
                        )}
                        , {table.indexes.length}{" "}
                        {t(
                          "dashboard_internal.project_detail.cms.smart_objects.tables.indexes"
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-sleads-blue dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>
                      {t(
                        "dashboard_internal.project_detail.cms.smart_objects.tables.view_details"
                      )}
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
