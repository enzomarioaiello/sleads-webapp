"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  FolderKanban,
  Calendar,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  X,
  Search,
} from "lucide-react";
import { useApp } from "@/app/contexts/AppContext";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DashboardSidebar = ({
  isOpen,
  onClose,
}: DashboardSidebarProps) => {
  const params = useParams();
  const orgID = params.orgID as string;

  const { t, language, setLanguage } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const navItems = [
    {
      name: t("dashboard_internal.sidebar.overview"),
      href: `/dashboard/${orgID}`,
      icon: LayoutDashboard,
    },
    {
      name: t("dashboard_internal.sidebar.projects"),
      href: `/dashboard/${orgID}/projects`,
      icon: FolderKanban,
    },
    {
      name: t("dashboard_internal.sidebar.calendar"),
      href: `/dashboard/${orgID}/calendar`,
      icon: Calendar,
    },
    {
      name: t("dashboard_internal.sidebar.documents"),
      href: `/dashboard/${orgID}/documents`,
      icon: FileText,
    },
    // {
    //   name: t("dashboard_internal.sidebar.messages"),
    //   href: `/dashboard/${orgID}/messages`,
    //   icon: MessageSquare,
    // },
    // {
    //   name: t("dashboard_internal.sidebar.settings"),
    //   href: `/dashboard/${orgID}/settings`,
    //   icon: Settings,
    // },
  ];

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen w-64 bg-white dark:bg-sleads-slate900 border-r border-slate-200 dark:border-sleads-slate800 flex flex-col z-40 transition-transform duration-300 md:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Logo Area */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100 dark:border-sleads-slate800">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <Image
              src="/images/logo.png"
              alt="Sleads"
              width={32}
              height={32}
              className="group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <span className="font-heading font-bold text-xl tracking-tight text-slate-900 dark:text-sleads-white">
            Sleads
          </span>
        </Link>
        <button
          onClick={onClose}
          className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-sleads-slate800 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {/* Mobile Search */}
        <div className="md:hidden mb-6 px-3">
          <div className="flex items-center bg-slate-100 dark:bg-sleads-slate800 rounded-lg px-3 py-2 border border-transparent focus-within:border-sleads-blue transition-colors">
            <Search className="w-4 h-4 text-slate-400 dark:text-sleads-slate500 mr-2" />
            <input
              type="text"
              placeholder={t("dashboard_internal.header.search_placeholder")}
              className="bg-transparent border-none outline-none text-sm text-slate-700 dark:text-sleads-white placeholder-slate-400 w-full"
            />
          </div>
        </div>

        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (window.innerWidth < 768) {
                  onClose();
                }
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                isActive
                  ? "text-sleads-blue bg-blue-50 dark:bg-sleads-blue/10 dark:text-blue-400"
                  : "text-slate-600 dark:text-sleads-slate400 hover:text-slate-900 dark:hover:text-sleads-white hover:bg-slate-50 dark:hover:bg-sleads-slate800"
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isActive
                    ? "text-sleads-blue dark:text-blue-400"
                    : "text-slate-400 dark:text-sleads-slate500 group-hover:text-slate-600 dark:group-hover:text-sleads-slate300"
                }`}
              />
              <span>{item.name}</span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute left-0 w-1 h-6 bg-sleads-blue rounded-r-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Area */}
      <div className="p-4 border-t border-slate-100 dark:border-sleads-slate800 space-y-4">
        {/* Mobile Language Switcher */}
        <div className="md:hidden flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-sleads-slate800/50 rounded-xl">
          <span className="text-sm font-medium text-slate-600 dark:text-sleads-slate400">
            Language
          </span>
          <div className="flex bg-slate-200 dark:bg-sleads-slate800 rounded-lg p-1">
            <button
              onClick={() => setLanguage("en")}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                language === "en"
                  ? "bg-white dark:bg-sleads-slate700 text-sleads-blue dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-sleads-slate500"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage("nl")}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                language === "nl"
                  ? "bg-white dark:bg-sleads-slate700 text-sleads-blue dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-sleads-slate500"
              }`}
            >
              NL
            </button>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-sleads-slate400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all duration-200 group"
        >
          <LogOut className="w-5 h-5 group-hover:text-rose-500 transition-colors" />
          <span>{t("dashboard_internal.sidebar.signout")}</span>
        </button>
      </div>
    </aside>
  );
};
