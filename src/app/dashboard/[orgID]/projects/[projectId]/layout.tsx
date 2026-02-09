"use client";
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useApp } from "@/app/contexts/AppContext";
import {
  ArrowLeft,
  FolderKanban,
  Info,
  User,
  FileText,
  Receipt,
  FolderOpen,
  Globe,
  Calendar,
  Sparkles,
  Repeat,
  Euro,
} from "lucide-react";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/app/utils/cn";

export default function ProjectDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const projectId = params.projectId as string;
  const organizationId = params.orgID as string;
  const { t } = useApp();

  const navRef = useRef<HTMLElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(true);

  const project = useQuery(
    api.project.getProject,
    projectId
      ? {
          projectId: projectId as Id<"projects">,
          organizationId: organizationId as Id<"organizations">,
        }
      : ("skip" as
          | "skip"
          | { projectId: Id<"projects">; organizationId: Id<"organizations"> })
  );

  const basePath = `/dashboard/${organizationId}/projects/${projectId}`;
  const tabs = React.useMemo(
    () => [
      {
        id: "overview",
        label: t("dashboard_internal.project_detail.tabs.overview"),
        icon: Info,
        href: basePath,
        exact: true,
      },
      {
        id: "contact",
        label: t("dashboard_internal.project_detail.tabs.contact"),
        icon: User,
        href: `${basePath}/contact`,
        exact: false,
      },
      {
        id: "calendar",
        label: t("dashboard_internal.project_detail.tabs.calendar"),
        icon: Calendar,
        href: `${basePath}/calendar`,
        exact: false,
      },
      {
        id: "quotes",
        label: t("dashboard_internal.project_detail.tabs.quotes"),
        icon: FileText,
        href: `${basePath}/quotes`,
        exact: false,
      },
      {
        id: "invoices",
        label: t("dashboard_internal.project_detail.tabs.invoices"),
        icon: Receipt,
        href: `${basePath}/invoices`,
        exact: false,
      },
      {
        id: "monthly-subscriptions",
        label: t("dashboard_internal.project_detail.tabs.monthly_subscriptions") || "Monthly Subscriptions",
        icon: Repeat,
        href: `${basePath}/monthly-subscriptions`,
        exact: false,
      },
      {
        id: "extra-costs",
        label: t("dashboard_internal.project_detail.tabs.extra_costs") || "Extra Costs",
        icon: Euro,
        href: `${basePath}/extra-costs`,
        exact: false,
      },
      {
        id: "files",
        label: t("dashboard_internal.project_detail.tabs.files"),
        icon: FolderOpen,
        href: `${basePath}/files`,
        exact: false,
      },
      {
        id: "cms",
        label: t("dashboard_internal.project_detail.tabs.cms"),
        icon: Globe,
        href: `${basePath}/cms`,
        exact: false,
      },
      {
        id: "smart_objects",
        label: t("dashboard_internal.project_detail.tabs.smart_objects"),
        icon: Sparkles,
        href: `${basePath}/SO`,
        exact: false,
      },
    ],
    [basePath, t]
  );

  const checkScroll = React.useCallback(() => {
    if (navRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = navRef.current;
      setShowLeftFade(scrollLeft > 10);
      setShowRightFade(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  React.useEffect(() => {
    checkScroll();
    const nav = navRef.current;
    if (nav) {
      nav.addEventListener("scroll", checkScroll);
      // Check on resize
      window.addEventListener("resize", checkScroll);
      return () => {
        nav.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [checkScroll]);

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

  // Loading state
  if (project === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sleads-blue mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-sleads-slate400">
            {t("dashboard_internal.project_detail.loading")}
          </p>
        </div>
      </div>
    );
  }

  // Not found state
  if (project === null) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[400px]"
      >
        <FolderKanban className="w-16 h-16 text-slate-300 dark:text-sleads-slate700 mb-4" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {t("dashboard_internal.project_detail.not_found")}
        </h3>
        <p className="text-slate-500 dark:text-sleads-slate400 text-center max-w-md mb-6">
          {t("dashboard_internal.project_detail.not_found_desc")}
        </p>
        <Link
          href={`/dashboard/${organizationId}/projects`}
          className="px-4 py-2 rounded-xl bg-sleads-blue text-white text-sm font-semibold hover:bg-sleads-blue/90 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("dashboard_internal.project_detail.back_to_projects")}
        </Link>
      </motion.div>
    );
  }

  const activeTab = tabs.find((tab) => {
    if (tab.exact) {
      return pathname === tab.href;
    }
    return pathname?.startsWith(tab.href);
  });

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-10 overflow-x-hidden"
    >
      {/* Header Section */}
      <motion.div variants={item} className="flex flex-col gap-4">
        <Link
          href={`/dashboard/${organizationId}/projects`}
          className="inline-flex items-center gap-2 text-slate-600 dark:text-sleads-slate400 hover:text-sleads-blue dark:hover:text-sleads-blue transition-colors text-sm font-medium mb-2 w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("dashboard_internal.project_detail.back_to_projects")}
        </Link>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-linear-to-br from-sleads-blue to-blue-700 rounded-xl">
            <FolderKanban className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">
              {project.name}
            </h1>
            <p className="text-slate-500 dark:text-sleads-slate400">
              {activeTab?.label ||
                t("dashboard_internal.project_detail.overview")}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div variants={item}>
        <div className="border-b border-slate-200 dark:border-sleads-slate800 relative">
          {/* Gradient fade indicators */}
          {showRightFade && (
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-linear-to-l from-white dark:from-sleads-slate900 to-transparent pointer-events-none z-10 transition-opacity duration-300" />
          )}
          {showLeftFade && (
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-linear-to-r from-white dark:from-sleads-slate900 to-transparent pointer-events-none z-10 transition-opacity duration-300" />
          )}

          <nav
            ref={navRef}
            className="flex space-x-1 overflow-x-auto scrollbar-hover relative"
            aria-label="Tabs"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.exact
                ? pathname === tab.href
                : pathname?.startsWith(tab.href);

              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0",
                    isActive
                      ? "border-sleads-blue text-sleads-blue dark:text-sleads-blue"
                      : "border-transparent text-slate-500 dark:text-sleads-slate400 hover:text-slate-700 dark:hover:text-sleads-slate300 hover:border-slate-300 dark:hover:border-sleads-slate700"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </motion.div>

      {/* Tab Content */}
      <motion.div variants={item}>{children}</motion.div>
    </motion.div>
  );
}
