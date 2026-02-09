"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React from "react";
import { Table, ChevronRight, Database } from "lucide-react";
import { TableInfo } from "./types";

interface TableListProps {
  tables: TableInfo[];
  selectedTable: string | null;
  onTableSelect: (tableName: string) => void;
}

export default function TableList({
  tables,
  selectedTable,
  onTableSelect,
}: TableListProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-sleads-blue/10">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-sleads-blue" />
          <h4 className="text-sm font-semibold text-gray-900">
            Tables ({tables.length})
          </h4>
        </div>
      </div>
      <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
        {tables.map((table) => (
          <button
            key={table.name}
            onClick={() =>
              onTableSelect(selectedTable === table.name ? "" : table.name)
            }
            className={`
              w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors
              ${
                selectedTable === table.name
                  ? "bg-sleads-blue/5 border-l-4 border-sleads-blue"
                  : ""
              }
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Table className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-sm font-medium text-gray-900 truncate">
                  {table.name}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-gray-500">
                  {table.fields.length} fields
                </span>
                <ChevronRight
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    selectedTable === table.name ? "rotate-90" : ""
                  }`}
                />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}





