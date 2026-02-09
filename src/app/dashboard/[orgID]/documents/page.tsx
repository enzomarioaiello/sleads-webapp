"use client";

import React from "react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { FileText } from "lucide-react";
import { useApp } from "@/app/contexts/AppContext";
import { FileExplorer } from "@/components/FileExplorer/FileExplorer";

export default function DocumentsPage() {
  const params = useParams();
  const orgID = params.orgID as string;
  const { t } = useApp();

  const files = useQuery(api.file.getFilesForCustomers, {
    organizationId: orgID as Id<"organizations">,
    projectId: undefined,
  });

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
              <FileText className="w-8 h-8 text-sleads-blue" />
              {t("dashboard_internal.documents.title") || "Documents"}
            </h2>
            <p className="text-slate-500 dark:text-sleads-slate400 text-lg max-w-2xl mt-2">
              {t("dashboard_internal.documents.subtitle") ||
                "Browse and access all your project documents"}
            </p>
          </div>
        </div>
      </motion.div>

      {/* File Explorer */}
      <motion.div variants={item}>
        <FileExplorer
          files={files}
          organizationId={orgID}
          basePath="/dashboard"
        />
      </motion.div>
    </motion.div>
  );
}
