"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/app/utils/cn";
import {
  LayoutDashboard,
  Settings,
  ArrowLeft,
  FolderKanban,
  Contact,
  FileText,
  Receipt,
  FolderOpen,
  Database,
  Calendar,
  CurlyBraces,
  Repeat,
  DollarSign,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../convex/_generated/dataModel";
import { Loader2 } from "lucide-react";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const orgId = params.orgId as string;
  const projectId = params.projectId as string;
  const navRef = useRef<HTMLElement>(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  const project = useQuery(api.project.getProject, {
    projectId: projectId as Id<"projects">,
    organizationId: orgId as Id<"organizations">,
  });

  const checkScroll = useCallback(() => {
    if (navRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = navRef.current;
      setShowTopFade(scrollTop > 10);
      setShowBottomFade(scrollTop < scrollHeight - clientHeight - 10);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    const nav = navRef.current;
    if (nav) {
      nav.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
      return () => {
        nav.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [checkScroll]);

  const navigation = [
    {
      name: "Overview",
      href: `/admin-dashboard/organizations/${orgId}/projects/${projectId}`,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: "Contact",
      href: `/admin-dashboard/organizations/${orgId}/projects/${projectId}/contact`,
      icon: Contact,
      exact: false,
    },
    {
      name: "Quotes",
      href: `/admin-dashboard/organizations/${orgId}/projects/${projectId}/quotes`,
      icon: FileText,
      exact: false,
    },
    {
      name: "Invoices",
      href: `/admin-dashboard/organizations/${orgId}/projects/${projectId}/invoices`,
      icon: Receipt,
      exact: false,
    },
    {
      name: "Monthly Subscriptions",
      href: `/admin-dashboard/organizations/${orgId}/projects/${projectId}/monthly-subscriptions`,
      icon: Repeat,
      exact: false,
    },
    {
      name: "Extra Costs",
      href: `/admin-dashboard/organizations/${orgId}/projects/${projectId}/extra-costs`,
      icon: DollarSign,
      exact: false,
    },
    {
      name: "Files",
      href: `/admin-dashboard/organizations/${orgId}/projects/${projectId}/files`,
      icon: FolderOpen,
      exact: false,
    },
    {
      name: "Agenda",
      href: `/admin-dashboard/organizations/${orgId}/projects/${projectId}/agenda`,
      icon: Calendar,
      exact: false,
    },
    {
      name: "CMS",
      href: `/admin-dashboard/organizations/${orgId}/projects/${projectId}/CMS`,
      icon: Database,
      exact: false,
    },
    {
      name: "Smart Objects",
      href: `/admin-dashboard/organizations/${orgId}/projects/${projectId}/smart-objects`,
      icon: CurlyBraces,
      exact: false,
    },
    {
      name: "Settings",
      href: `/admin-dashboard/organizations/${orgId}/projects/${projectId}/settings`,
      icon: Settings,
      exact: false,
    },
  ];

  if (project === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (project === null) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold">Project not found</h2>
        <Link
          href={`/admin-dashboard/organizations/${orgId}/projects`}
          className="text-blue-600 hover:underline"
        >
          Back to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 bg-white min-h-full flex flex-col group/sidebar">
        <div className="p-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link
              href={`/admin-dashboard/organizations/${orgId}/projects`}
              className="hover:text-gray-900 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Projects
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-gray-900 truncate">
                {project.name}
              </h2>
              <p className="text-xs text-gray-500 truncate">Project Details</p>
            </div>
          </div>
        </div>
        <div className="flex-1 relative overflow-hidden">
          {/* Gradient fade indicators */}
          {showTopFade && (
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white to-transparent pointer-events-none z-10 transition-opacity duration-300" />
          )}
          {showBottomFade && (
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none z-10 transition-opacity duration-300" />
          )}
          <nav
            ref={navRef}
            className="h-full overflow-y-auto scrollbar-hover p-4 space-y-1 scroll-smooth"
          >
            {navigation.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-md"
                  )}
                >
                  <item.icon
                    className={cn(
                      isActive
                        ? "text-blue-500"
                        : "text-gray-400 group-hover:text-gray-500",
                      "mr-3 h-5 w-5 shrink-0"
                    )}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 overflow-y-auto bg-gray-50 p-8">
        {children}
      </div>
    </div>
  );
}
