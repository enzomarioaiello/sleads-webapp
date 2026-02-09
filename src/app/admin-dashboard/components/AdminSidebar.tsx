"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/app/utils/cn";
import { LayoutDashboard, Users, LogOut, Settings, MessageSquare, Building, FileText, Sun, Moon } from "lucide-react";
import { useApp } from "@/app/contexts/AppContext";

const navigation = [
  { name: "Dashboard", href: "/admin-dashboard", icon: LayoutDashboard },
  { name: "Users", href: "/admin-dashboard/users", icon: Users },
  { name: "Organizations", href: "/admin-dashboard/organizations", icon: Building },
  { name: "Blog", href: "/admin-dashboard/blog", icon: FileText },
  { name: "Contact", href: "/admin-dashboard/contact", icon: MessageSquare },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useApp();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
  };

  return (
    <div className="flex h-full w-64 flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-800">
      <div className="flex h-16 items-center px-6 font-bold text-xl">
        Admin Panel
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-md px-2 py-2 text-sm font-medium",
                isActive
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-6 w-6 flex-shrink-0",
                  isActive
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-300"
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gray-200 dark:border-gray-800 p-4 space-y-2">
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
        >
          {theme === "dark" ? (
            <Sun className="mr-3 h-6 w-6 flex-shrink-0 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-300" aria-hidden="true" />
          ) : (
            <Moon className="mr-3 h-6 w-6 flex-shrink-0 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-300" aria-hidden="true" />
          )}
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
        <button
          onClick={handleSignOut}
          className="group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
        >
          <LogOut
            className="mr-3 h-6 w-6 flex-shrink-0 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-300"
            aria-hidden="true"
          />
          Sign Out
        </button>
      </div>
    </div>
  );
}
