"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../convex/_generated/dataModel";
import { Globe, FileText, Sparkles, ChevronRight } from "lucide-react";
import { useToast } from "@/app/hooks/useToast";
import { useApp } from "@/app/contexts/AppContext";
import ContentManagement from "./components/ContentManagement";
import LanguageSettings from "./components/LanguageSettings";
import SplitsManagement from "./components/SplitManagement";

const LANGUAGE_METADATA: Record<string, { name: string; flag: string }> = {
  en: { name: "English", flag: "🇬🇧" },
  zh: { name: "Mandarin Chinese", flag: "🇨🇳" },
  hi: { name: "Hindi", flag: "🇮🇳" },
  es: { name: "Spanish", flag: "🇪🇸" },
  fr: { name: "French", flag: "🇫🇷" },
  ar: { name: "Arabic", flag: "🇸🇦" },
  bn: { name: "Bengali", flag: "🇧🇩" },
  pt: { name: "Portuguese", flag: "🇵🇹" },
  ru: { name: "Russian", flag: "🇷🇺" },
  ja: { name: "Japanese", flag: "🇯🇵" },
  de: { name: "German", flag: "🇩🇪" },
  ko: { name: "Korean", flag: "🇰🇷" },
  vi: { name: "Vietnamese", flag: "🇻🇳" },
  it: { name: "Italian", flag: "🇮🇹" },
  tr: { name: "Turkish", flag: "🇹🇷" },
  pl: { name: "Polish", flag: "🇵🇱" },
  uk: { name: "Ukrainian", flag: "🇺🇦" },
  nl: { name: "Dutch", flag: "🇳🇱" },
  th: { name: "Thai", flag: "🇹🇭" },
  id: { name: "Indonesian", flag: "🇮🇩" },
  cs: { name: "Czech", flag: "🇨🇿" },
  sv: { name: "Swedish", flag: "🇸🇪" },
  ro: { name: "Romanian", flag: "🇷🇴" },
  hu: { name: "Hungarian", flag: "🇭🇺" },
  fi: { name: "Finnish", flag: "🇫🇮" },
  da: { name: "Danish", flag: "🇩🇰" },
  no: { name: "Norwegian", flag: "🇳🇴" },
  he: { name: "Hebrew", flag: "🇮🇱" },
  el: { name: "Greek", flag: "🇬🇷" },
  sk: { name: "Slovak", flag: "🇸🇰" },
};

type Tab = "content" | "languages" | "splits";

export default function UserCMSPage() {
  const params = useParams();
  const projectId = params.projectId as Id<"projects">;
  const orgId = params.orgID as Id<"organizations">;
  const { toast } = useToast();
  const { t } = useApp();

  const [activeTab, setActiveTab] = useState<Tab>("content");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  // Fetch project data
  const project = useQuery(api.project.getProject, {
    projectId,
    organizationId: orgId,
  });

  // Fetch CMS pages
  const cmsPages = useQuery(api.cms.getCMSPages, {
    projectId,
    organizationId: orgId,
  });

  // Initialize selected languages from project
  useEffect(() => {
    if (project?.selectedLanguages) {
      setTimeout(() => {
        setSelectedLanguages(project.selectedLanguages || []);
      }, 0);
    }
  }, [project?.selectedLanguages]);

  // Prepare languages array
  const languages = Object.entries(LANGUAGE_METADATA).map(([code, data]) => ({
    code,
    ...data,
  }));

  const tabs = [
    {
      id: "content" as Tab,
      label: t("dashboard_internal.project_detail.cms.tabs.content"),
      icon: FileText,
      description: t("dashboard_internal.project_detail.cms.tabs.content_desc"),
    },
    {
      id: "languages" as Tab,
      label: t("dashboard_internal.project_detail.cms.tabs.languages"),
      icon: Globe,
      description: t(
        "dashboard_internal.project_detail.cms.tabs.languages_desc"
      ),
    },
    {
      id: "splits" as Tab,
      label: t("dashboard_internal.project_detail.cms.tabs.variants"),
      icon: Sparkles,
      description: t(
        "dashboard_internal.project_detail.cms.tabs.variants_desc"
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
            {t("dashboard_internal.project_detail.cms.loading")}
          </p>
        </div>
      </div>
    );
  }

  if (!project?.enableCMS) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[400px] p-6"
      >
        <div className="p-4 bg-slate-100 dark:bg-sleads-slate800 rounded-full mb-4">
          <Globe className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {t("dashboard_internal.project_detail.cms.not_enabled")}
        </h3>
        <p className="text-slate-500 dark:text-sleads-slate400 text-center max-w-md">
          {t("dashboard_internal.project_detail.cms.not_enabled_desc")}
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
      {/* Tab Navigation - Mobile Friendly */}
      <motion.div variants={item}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
        {activeTab === "content" && (
          <ContentManagement
            projectId={projectId}
            orgId={orgId}
            cmsPages={cmsPages}
            selectedLanguages={selectedLanguages}
            languages={languages}
          />
        )}

        {activeTab === "languages" && (
          <LanguageSettings
            projectId={projectId}
            orgId={orgId}
            project={project}
            selectedLanguages={selectedLanguages}
            setSelectedLanguages={setSelectedLanguages}
            languages={languages}
          />
        )}

        {activeTab === "splits" && (
          <SplitsManagement projectId={projectId} orgId={orgId} />
        )}
      </motion.div>
    </motion.div>
  );
}
