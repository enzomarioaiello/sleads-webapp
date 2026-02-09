"use client";
import React from "react";
import { useApp } from "@/app/contexts/AppContext";
import { UserMenu } from "@/app/components/UserMenu";
import { authClient } from "@/lib/auth-client";
import { Sun, Moon, Bell, Search, Menu } from "lucide-react";
import { useParams, usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { Id } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Image from "next/image";

interface DashboardHeaderProps {
  onMenuClick: () => void;
}

export const DashboardHeader = ({ onMenuClick }: DashboardHeaderProps) => {
  const { theme, toggleTheme, language, setLanguage, t } = useApp();
  const params = useParams();
  const organizationId = params.orgID as string;
  const { data: session } = authClient.useSession();

  const organization = useQuery(api.organizations.getOrganization, {
    organizationId: organizationId as Id<"organizations">,
  });

  const pathname = usePathname();

  // Simple title generator based on path
  const getPageTitle = () => {
    if (organization) {
      return organization.name;
    }

    const path = pathname.split("/").pop();
    if (!path || path === "dashboard")
      return t("dashboard_internal.header.overview");

    // Check if translation exists for path, otherwise capitalize
    const translationKey = `dashboard_internal.sidebar.${path}`;
    const translated = t(translationKey);

    if (translated !== translationKey) {
      return translated;
    }

    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <header className="h-20 bg-white dark:bg-sleads-slate900 border-b border-slate-200 dark:border-sleads-slate800 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 transition-colors duration-300">
      {/* Left: Page Title & Mobile Menu */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:text-sleads-slate400 dark:hover:bg-sleads-slate800 rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl flex items-center gap-2 md:text-2xl font-display font-bold text-slate-900 dark:text-white truncate">
          {organization?.logo && (
            <Image
              src={organization?.logo}
              alt={getPageTitle()}
              height={100}
              width={100}
              className="h-10 w-10 lg:h-12 lg:w-12 "
            />
          )}{" "}
          {getPageTitle()}
        </h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Search (Placeholder) */}
        <div className="hidden md:flex items-center bg-slate-100 dark:bg-sleads-slate800 rounded-lg px-3 py-2 mr-2 border border-transparent focus-within:border-sleads-blue transition-colors">
          <Search className="w-4 h-4 text-slate-400 dark:text-sleads-slate500 mr-2" />
          <input
            type="text"
            placeholder={t("dashboard_internal.header.search_placeholder")}
            className="bg-transparent border-none outline-none text-sm text-slate-700 dark:text-sleads-white placeholder-slate-400 w-32 lg:w-48"
          />
        </div>

        <div className="hidden md:block h-8 w-px bg-slate-200 dark:bg-sleads-slate800 mx-1"></div>

        {/* Language Toggle - Hidden on very small screens if needed, or compact */}
        <div className="hidden sm:flex items-center bg-slate-100 dark:bg-sleads-slate900 rounded-lg p-1 border border-slate-200 dark:border-sleads-slate700">
          <button
            onClick={() => setLanguage("en")}
            className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${
              language === "en"
                ? "bg-white dark:bg-sleads-slate700 text-sleads-blue dark:text-white shadow-sm"
                : "text-slate-400 dark:text-sleads-slate500 hover:text-slate-600"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage("nl")}
            className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${
              language === "nl"
                ? "bg-white dark:bg-sleads-slate700 text-sleads-blue dark:text-white shadow-sm"
                : "text-slate-400 dark:text-sleads-slate500 hover:text-slate-600"
            }`}
          >
            NL
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 dark:text-sleads-slate400 hover:bg-slate-100 dark:hover:bg-sleads-slate800 hover:text-sleads-blue dark:hover:text-white transition-colors"
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger>
            <button className="p-2 rounded-lg text-slate-500 dark:text-sleads-slate400 hover:bg-slate-100 dark:hover:bg-sleads-slate800 hover:text-sleads-blue dark:hover:text-white transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-sleads-blue rounded-full border border-white dark:border-sleads-midnight"></span>
            </button>
          </PopoverTrigger>
          <PopoverContent>
            <div>Coming soon...</div>
          </PopoverContent>
        </Popover>

        {/* User Menu */}
        {session?.user && (
          <div className="pl-2 border-l border-slate-200 dark:border-sleads-slate800 ml-1">
            <UserMenu user={session.user} isDashboard={true} />
          </div>
        )}
      </div>
    </header>
  );
};
