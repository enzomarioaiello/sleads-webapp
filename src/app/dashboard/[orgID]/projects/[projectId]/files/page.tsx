"use client";

import React from "react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../convex/_generated/dataModel";
import { FileText } from "lucide-react";
import { useApp } from "@/app/contexts/AppContext";
import { FileExplorer } from "@/components/FileExplorer/FileExplorer";

export default function ProjectFilesPage() {
  const params = useParams();
  const orgID = params.orgID as string;
  const projectId = params.projectId as string;
  const { t } = useApp();

  const files = useQuery(api.file.getFilesForCustomers, {
    organizationId: orgID as Id<"organizations">,
    projectId: projectId as Id<"projects">,
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

      {/* File Explorer */}
      <motion.div variants={item}>
        <FileExplorer
          files={files}
          organizationId={orgID}
          projectId={projectId}
          basePath="/dashboard"
        />
      </motion.div>
    </motion.div>
  );
}
