"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { FileText, Key, Hash } from "lucide-react";
import { TableInfo } from "./types";

interface SchemaViewProps {
  table: TableInfo;
}

export default function SchemaView({ table }: SchemaViewProps) {
  return (
    <div className="space-y-6">
      {/* Fields Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-sleads-blue" />
          <h4 className="text-sm font-semibold text-gray-900">Fields</h4>
        </div>
        <div className="space-y-2">
          {table.fields.map((field) => (
            <div
              key={field.name}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm font-semibold text-gray-900">
                      {field.name}
                    </code>
                    {field.optional && (
                      <span className="text-xs px-2 py-0.5 bg-sleads-blue/10 text-sleads-blue rounded">
                        optional
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Hash className="w-3 h-3 text-gray-400" />
                    <code className="text-xs text-gray-600 font-mono">
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
            <Key className="w-5 h-5 text-sleads-blue" />
            <h4 className="text-sm font-semibold text-gray-900">
              Indexes ({table.indexes.length})
            </h4>
          </div>
          <div className="space-y-2">
            {table.indexes.map((index, idx) => (
              <div
                key={idx}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Key className="w-4 h-4 text-sleads-blue" />
                  <code className="text-sm font-semibold text-gray-900">
                    {index.indexDescriptor}
                  </code>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-500">Fields:</span>
                  {index.fields.map((field, fieldIdx) => (
                    <span
                      key={fieldIdx}
                      className="text-xs px-2 py-1 bg-sleads-blue/10 text-sleads-blue rounded"
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





