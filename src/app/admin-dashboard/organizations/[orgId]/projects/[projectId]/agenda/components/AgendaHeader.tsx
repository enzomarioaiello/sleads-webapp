"use client";

import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/app/admin-dashboard/components/ui/Button";

interface AgendaHeaderProps {
  onCreateClick: () => void;
}

export function AgendaHeader({ onCreateClick }: AgendaHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Project Agenda</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage meetings, deliverables, and important dates
        </p>
      </div>
      <Button onClick={onCreateClick} variant="primary">
        <Plus className="h-4 w-4 mr-2" />
        Add Agenda Item
      </Button>
    </div>
  );
}

