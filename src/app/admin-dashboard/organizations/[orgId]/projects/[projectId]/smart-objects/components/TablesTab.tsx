"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "../../../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../../../convex/_generated/dataModel";
import { Loader2, Table, RefreshCw, AlertCircle } from "lucide-react";
import { useToast } from "@/app/hooks/useToast";
import { SchemaResponse, TableInfo } from "./types";
import TableList from "./TableList";
import SchemaView from "./SchemaView";
import DataView from "./DataView";
import CreateModal from "./CreateModal";

interface TablesTabProps {
  projectId: Id<"projects">;
  orgId: Id<"organizations">;
  project: {
    _id: Id<"projects">;
    smartObjectsKey: string | null | undefined;
    smartObjectsUrl: string | null | undefined;
  };
}

export default function TablesTab({
  projectId,
  orgId,
  project,
}: TablesTabProps) {
  const { toast } = useToast();
  const [schema, setSchema] = useState<SchemaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<"schema" | "data">(
    "schema"
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [referencedData, setReferencedData] = useState<Record<string, any[]>>(
    {}
  );
  const [loadingReferences, setLoadingReferences] = useState<
    Record<string, boolean>
  >({});
  const [dateTimeValues, setDateTimeValues] = useState<
    Record<string, { date: Date | undefined; time: string }>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  // Nested modal state for creating referenced items
  const [nestedModal, setNestedModal] = useState<{
    tableName: string;
    fieldName: string;
  } | null>(null);
  const [nestedFormData, setNestedFormData] = useState<Record<string, any>>({});
  const [nestedDateTimeValues, setNestedDateTimeValues] = useState<
    Record<string, { date: Date | undefined; time: string }>
  >({});
  const [isNestedSubmitting, setIsNestedSubmitting] = useState(false);
  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<any>(null);

  const getSchema = useAction(api.smartObjects.getSchema);
  const getTableData = useAction(api.smartObjects.getTableData);
  const createTableData = useAction(api.smartObjects.createTableData);
  const updateTableData = useAction(api.smartObjects.updateTableData);

  // Fetch referenced table data for id fields
  const fetchReferencedData = async (tableName: string) => {
    if (referencedData[tableName]) return; // Already loaded

    setLoadingReferences((prev) => ({ ...prev, [tableName]: true }));
    try {
      const data = await getTableData({
        projectId: projectId,
        organizationId: orgId,
        tableName: tableName,
        cursor: null,
        numItems: 100, // Get first 100 items for dropdown
      });

      const response = data as {
        continueCursor?: string | null;
        isDone?: boolean;
        page?: any[];
      };

      setReferencedData((prev) => ({
        ...prev,
        [tableName]: response.page || [],
      }));
    } catch (err) {
      console.error(`Failed to fetch ${tableName}:`, err);
    } finally {
      setLoadingReferences((prev) => ({ ...prev, [tableName]: false }));
    }
  };

  // Open create modal and initialize form
  const handleOpenCreateModal = () => {
    if (!selectedTable || !schema) return;

    const table = schema.schema.tables[selectedTable];
    if (!table?.validator?.fields) return;

    // Initialize form data with default values
    const initialData: Record<string, any> = {};
    const initialDateTimeValues: Record<
      string,
      { date: Date | undefined; time: string }
    > = {};

    Object.entries(table.validator.fields).forEach(
      ([fieldName, fieldDef]: [string, any]) => {
        const fieldNameLower = fieldName.toLowerCase();
        const isDateTimeField =
          fieldDef.kind === "float64" &&
          (fieldNameLower.includes("date") ||
            fieldNameLower.includes("time") ||
            fieldNameLower.includes("at") ||
            fieldNameLower === "createdat" ||
            fieldNameLower === "updatedat");

        if (fieldDef.isOptional === "optional") {
          initialData[fieldName] = null;
          if (isDateTimeField) {
            initialDateTimeValues[fieldName] = {
              date: undefined,
              time: "00:00",
            };
          }
        } else if (fieldDef.kind === "boolean") {
          initialData[fieldName] = false;
        } else if (fieldDef.kind === "array") {
          initialData[fieldName] = [];
        } else if (fieldDef.kind === "object") {
          initialData[fieldName] = {};
        } else if (isDateTimeField) {
          // For date/time fields, initialize with current date/time
          const now = new Date();
          initialData[fieldName] = now.getTime();
          initialDateTimeValues[fieldName] = {
            date: now,
            time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
          };
        } else if (fieldDef.kind === "float64") {
          initialData[fieldName] = 0;
        } else {
          initialData[fieldName] = "";
        }
      }
    );

    setFormData(initialData);
    setDateTimeValues(initialDateTimeValues);
    setIsCreateModalOpen(true);
  };

  // Prepare data to match schema requirements
  const prepareDataForSchema = (
    data: Record<string, any>,
    tableName: string
  ): Record<string, any> => {
    if (!schema) return data;

    const table = schema.schema.tables[tableName];
    if (!table?.validator?.fields) return data;

    const prepared: Record<string, any> = {};

    Object.entries(table.validator.fields).forEach(
      ([fieldName, fieldDef]: [string, any]) => {
        // Skip _id and _creationTime as they're auto-generated
        if (fieldName === "_id" || fieldName === "_creationTime") {
          return;
        }

        const value = data[fieldName];
        const isOptional = fieldDef.isOptional === "optional";

        // Skip null values for required fields (they shouldn't be sent)
        if (value === null && !isOptional) {
          return; // Don't include required null fields
        }

        // Handle union types - if it's optional and null, keep it as null
        if (fieldDef.kind === "union" && fieldDef.members) {
          const hasNull = fieldDef.members.some((m: any) => m.kind === "null");
          if (hasNull && value === null && isOptional) {
            prepared[fieldName] = null;
            return;
          }
          // Otherwise, use the value as-is (it should match one of the members)
          if (value !== null && value !== undefined) {
            prepared[fieldName] = value;
          }
          return;
        }

        // Handle different field types
        if (fieldDef.kind === "float64") {
          // Ensure it's a number
          if (value !== null && value !== undefined) {
            prepared[fieldName] =
              typeof value === "number" ? value : Number(value);
          } else if (isOptional) {
            prepared[fieldName] = null;
          }
        } else if (fieldDef.kind === "boolean") {
          // Ensure it's a boolean
          prepared[fieldName] = Boolean(value);
        } else if (fieldDef.kind === "string") {
          // Ensure it's a string
          if (value !== null && value !== undefined) {
            prepared[fieldName] = String(value);
          } else if (isOptional) {
            prepared[fieldName] = null;
          }
        } else if (fieldDef.kind === "id") {
          // ID fields should be strings
          if (value !== null && value !== undefined) {
            prepared[fieldName] = String(value);
          } else if (isOptional) {
            prepared[fieldName] = null;
          }
        } else {
          // For arrays, objects, literals, etc., use as-is
          if (value !== null && value !== undefined) {
            prepared[fieldName] = value;
          } else if (isOptional) {
            prepared[fieldName] = null;
          }
        }
      }
    );

    return prepared;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTable) return;

    setIsSubmitting(true);
    try {
      // Prepare data to match schema
      const preparedData = prepareDataForSchema(formData, selectedTable);

      // Call the create action
      const result = await createTableData({
        projectId: projectId,
        organizationId: orgId,
        tableName: selectedTable,
        data: preparedData,
      });

      toast({
        title: "Success",
        description: `Successfully created ${selectedTable} with ID: ${result.id}`,
        variant: "success",
      });

      // Close modal and reset form
      handleCloseModal();

      // Trigger refresh in DataView
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create item";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setFormData({});
    setDateTimeValues({});
  };

  // Handle edit modal open
  const handleOpenEditModal = (rowData: any) => {
    if (!selectedTable || !schema) return;

    const table = schema.schema.tables[selectedTable];
    if (!table?.validator?.fields) return;

    // Initialize form data with row data
    const initialData: Record<string, any> = {};
    const initialDateTimeValues: Record<
      string,
      { date: Date | undefined; time: string }
    > = {};

    Object.entries(table.validator.fields).forEach(
      ([fieldName, fieldDef]: [string, any]) => {
        // Skip _id and _creationTime as they're auto-generated
        if (fieldName === "_id" || fieldName === "_creationTime") {
          return;
        }

        const value = rowData[fieldName];
        const fieldNameLower = fieldName.toLowerCase();
        const isDateTimeField =
          fieldDef.kind === "float64" &&
          (fieldNameLower.includes("date") ||
            fieldNameLower.includes("time") ||
            fieldNameLower.includes("at") ||
            fieldNameLower === "createdat" ||
            fieldNameLower === "updatedat");

        if (isDateTimeField && value && typeof value === "number") {
          // Convert timestamp to Date
          const timestamp = value > 10000000000 ? value : value * 1000;
          const date = new Date(timestamp);
          if (!isNaN(date.getTime())) {
            initialData[fieldName] = value;
            initialDateTimeValues[fieldName] = {
              date: date,
              time: `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`,
            };
          } else {
            initialData[fieldName] = value;
            initialDateTimeValues[fieldName] = {
              date: undefined,
              time: "00:00",
            };
          }
        } else {
          initialData[fieldName] = value ?? null;
          if (isDateTimeField) {
            initialDateTimeValues[fieldName] = {
              date: undefined,
              time: "00:00",
            };
          }
        }
      }
    );

    setFormData(initialData);
    setDateTimeValues(initialDateTimeValues);
    setEditingRow(rowData);
    setIsEditModalOpen(true);
  };

  // Handle edit modal close
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setFormData({});
    setDateTimeValues({});
    setEditingRow(null);
  };

  // Handle edit form submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTable || !editingRow) return;

    setIsSubmitting(true);
    try {
      // Prepare data to match schema
      const preparedData = prepareDataForSchema(formData, selectedTable);

      // Call the update action
      await updateTableData({
        projectId: projectId,
        organizationId: orgId,
        objectId: editingRow._id,
        data: preparedData,
      });

      toast({
        title: "Success",
        description: `Successfully updated ${selectedTable}`,
        variant: "success",
      });

      // Close modal and reset form
      handleCloseEditModal();

      // Trigger refresh in DataView
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update item";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle opening nested modal for creating referenced items
  const handleOpenNestedModal = (refTableName: string, fieldName: string) => {
    if (!schema) return;

    const table = schema.schema.tables[refTableName];
    if (!table?.validator?.fields) return;

    // Initialize nested form data
    const initialData: Record<string, any> = {};
    const initialDateTimeValues: Record<
      string,
      { date: Date | undefined; time: string }
    > = {};

    Object.entries(table.validator.fields).forEach(
      ([fieldName, fieldDef]: [string, any]) => {
        const fieldNameLower = fieldName.toLowerCase();
        const isDateTimeField =
          fieldDef.kind === "float64" &&
          (fieldNameLower.includes("date") ||
            fieldNameLower.includes("time") ||
            fieldNameLower.includes("at") ||
            fieldNameLower === "createdat" ||
            fieldNameLower === "updatedat");

        if (fieldDef.isOptional === "optional") {
          initialData[fieldName] = null;
          if (isDateTimeField) {
            initialDateTimeValues[fieldName] = {
              date: undefined,
              time: "00:00",
            };
          }
        } else if (fieldDef.kind === "boolean") {
          initialData[fieldName] = false;
        } else if (fieldDef.kind === "array") {
          initialData[fieldName] = [];
        } else if (fieldDef.kind === "object") {
          initialData[fieldName] = {};
        } else if (isDateTimeField) {
          const now = new Date();
          initialData[fieldName] = now.getTime();
          initialDateTimeValues[fieldName] = {
            date: now,
            time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
          };
        } else if (fieldDef.kind === "float64") {
          initialData[fieldName] = 0;
        } else {
          initialData[fieldName] = "";
        }
      }
    );

    setNestedFormData(initialData);
    setNestedDateTimeValues(initialDateTimeValues);
    setNestedModal({ tableName: refTableName, fieldName });
  };

  // Handle nested modal close
  const handleCloseNestedModal = () => {
    setNestedModal(null);
    setNestedFormData({});
    setNestedDateTimeValues({});
  };

  // Handle nested form submission (create referenced item)
  const handleNestedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nestedModal) return;

    setIsNestedSubmitting(true);
    try {
      // Prepare data to match schema
      const preparedData = prepareDataForSchema(
        nestedFormData,
        nestedModal.tableName
      );

      // Call the create action
      const result = await createTableData({
        projectId: projectId,
        organizationId: orgId,
        tableName: nestedModal.tableName,
        data: preparedData,
      });

      toast({
        title: "Success",
        description: `Successfully created ${nestedModal.tableName} with ID: ${result.id}`,
        variant: "success",
      });

      // Refresh referenced data by fetching it again
      await fetchReferencedData(nestedModal.tableName);

      // Auto-select the newly created item in the parent form
      setFormData((prev) => ({
        ...prev,
        [nestedModal.fieldName]: result.id,
      }));

      // Close nested modal
      handleCloseNestedModal();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create item";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "error",
      });
    } finally {
      setIsNestedSubmitting(false);
    }
  };

  const fetchSchema = async () => {
    if (!project.smartObjectsUrl || !project.smartObjectsKey) {
      setError("Smart Objects URL and API key are required");
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
        err instanceof Error ? err.message : "Failed to fetch schema";
      setError(errorMessage);
      toast({
        title: "Error",
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
              } else if (nonNullMember?.kind === "array") {
                type = "array | null";
              } else if (nonNullMember?.kind === "object") {
                type = "object | null";
              } else if (nonNullMember?.kind === "literal") {
                type = `"${nonNullMember.value}" | null`;
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

  if (!project.smartObjectsUrl || !project.smartObjectsKey) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-sleads-blue/10 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-sleads-blue" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Configuration Required
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Please configure your Smart Objects URL and generate an API key in
            the Overview tab to view tables.
          </p>
        </div>
      </div>
    );
  }

  const selectedTableInfo = tables.find((t) => t.name === selectedTable);

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Database Tables
          </h3>
          <p className="text-sm text-gray-500">
            View and explore your Smart Objects database schema
          </p>
        </div>
        <button
          onClick={fetchSchema}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading && !schema && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-sleads-blue" />
        </div>
      )}

      {error && !schema && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {schema && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tables List */}
          <div className="lg:col-span-1">
            <TableList
              tables={tables}
              selectedTable={selectedTable}
              onTableSelect={(tableName) =>
                setSelectedTable(selectedTable === tableName ? null : tableName)
              }
            />
          </div>

          {/* Table Details */}
          <div className="lg:col-span-2">
            {selectedTableInfo ? (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-sleads-blue/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-sleads-blue text-white flex items-center justify-center">
                      <Table className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedTableInfo.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {selectedTableInfo.fields.length} fields,{" "}
                        {selectedTableInfo.indexes.length} indexes
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
                    <button
                      onClick={() => setActiveDetailTab("schema")}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeDetailTab === "schema"
                          ? "border-sleads-blue text-sleads-blue"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Schema
                    </button>
                    <button
                      onClick={() => setActiveDetailTab("data")}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeDetailTab === "data"
                          ? "border-sleads-blue text-sleads-blue"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      Data
                    </button>
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeDetailTab === "schema" && (
                    <SchemaView table={selectedTableInfo} />
                  )}

                  {activeDetailTab === "data" && selectedTable && (
                    <DataView
                      projectId={projectId}
                      orgId={orgId}
                      project={project}
                      tableName={selectedTable}
                      onOpenCreateModal={handleOpenCreateModal}
                      onDataCreated={refreshTrigger > 0 ? () => {} : undefined}
                      schema={schema}
                      onOpenEditModal={handleOpenEditModal}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Table className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Select a table
                  </h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    Choose a table from the list to view its structure, fields,
                    and indexes.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Modal */}
      <CreateModal
        isOpen={isCreateModalOpen}
        tableName={selectedTable}
        schema={schema}
        formData={formData}
        setFormData={setFormData}
        referencedData={referencedData}
        loadingReferences={loadingReferences}
        dateTimeValues={dateTimeValues}
        setDateTimeValues={setDateTimeValues}
        isSubmitting={isSubmitting}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        onFetchReferencedData={fetchReferencedData}
        onCreateReferencedItem={handleOpenNestedModal}
        organizationId={orgId}
        projectId={projectId}
      />

      {/* Nested Create Modal for Referenced Items */}
      {nestedModal && (
        <CreateModal
          isOpen={!!nestedModal}
          tableName={nestedModal.tableName}
          schema={schema}
          formData={nestedFormData}
          setFormData={setNestedFormData}
          referencedData={referencedData}
          loadingReferences={loadingReferences}
          dateTimeValues={nestedDateTimeValues}
          setDateTimeValues={setNestedDateTimeValues}
          isSubmitting={isNestedSubmitting}
          onClose={handleCloseNestedModal}
          onSubmit={handleNestedSubmit}
          onFetchReferencedData={fetchReferencedData}
          onCreateReferencedItem={handleOpenNestedModal}
          isNested={true}
          organizationId={orgId}
          projectId={projectId}
        />
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedTable && schema && editingRow && (
        <CreateModal
          isOpen={isEditModalOpen}
          tableName={selectedTable}
          schema={schema}
          formData={formData}
          setFormData={setFormData}
          referencedData={referencedData}
          loadingReferences={loadingReferences}
          dateTimeValues={dateTimeValues}
          setDateTimeValues={setDateTimeValues}
          isSubmitting={isSubmitting}
          onClose={handleCloseEditModal}
          onSubmit={handleEditSubmit}
          onFetchReferencedData={fetchReferencedData}
          onCreateReferencedItem={handleOpenNestedModal}
          isEdit={true}
          organizationId={orgId}
          projectId={projectId}
        />
      )}
    </div>
  );
}
