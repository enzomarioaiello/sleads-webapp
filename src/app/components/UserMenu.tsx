"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authClient } from "@/lib/auth-client";
import {
  LogOut,
  User,
  Settings,
  ChevronDown,
  Crown,
  CrownIcon,
  LayoutDashboard,
  Home,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useApp } from "@/app/contexts/AppContext";

interface UserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  };
  isDashboard?: boolean;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  user,
  isDashboard = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingSignOut, setIsLoadingSignOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { t } = useApp();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    setIsLoadingSignOut(true);
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          // Keep loading state for a moment for smooth transition
          setTimeout(() => {
            setIsLoadingSignOut(false);
            router.push("/");
            router.refresh();
          }, 500);
        },
      },
    });
  };

  // Get initials for avatar fallback
  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return (
      name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 1) + name.split(" ").slice(-1)[0]?.[0]?.toUpperCase() || ""
    );
  };

  return (
    <>
      <AnimatePresence>
        {isLoadingSignOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/90 dark:bg-sleads-midnight/95 backdrop-blur-md"
            style={{ pointerEvents: "all" }}
          >
            <div className="relative flex flex-col items-center justify-center p-12 text-center">
              {/* Background decorative glow */}
              <div className="absolute -z-10 w-96 h-96 bg-sleads-blue/10 dark:bg-sleads-blue/5 rounded-full blur-[128px] animate-pulse" />
              <div className="absolute -z-10 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[96px] animate-pulse delay-75 translate-x-20 translate-y-20" />

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                className="relative"
              >
                {/* Logo or Avatar */}
                <div className="relative w-24 h-24 mb-8 rounded-full bg-white dark:bg-sleads-slate900 p-1 shadow-2xl shadow-sleads-blue/20 ring-1 ring-slate-100 dark:ring-sleads-slate800 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-linear-to-tr from-sleads-blue/10 to-transparent" />
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name || "User"}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="text-3xl font-bold text-sleads-blue">
                      {getInitials(user.name)}
                    </div>
                  )}

                  {/* Spinner Ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-sleads-blue/20 border-t-sleads-blue animate-spin" />
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
                  Signing Out
                </h2>
                <p className="text-slate-500 dark:text-sleads-slate400 text-lg">
                  See you soon,{" "}
                  <span className="text-sleads-blue font-medium">
                    {user.name?.split(" ")[0]}
                  </span>
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 focus:outline-none group"
        >
          <div className="hidden sm:flex flex-col items-end text-right mr-1">
            <span className="text-sm font-bold text-slate-700 dark:text-sleads-white leading-tight group-hover:text-sleads-blue dark:group-hover:text-white transition-colors">
              {user.name || "User"}
            </span>
          </div>

          <div className="relative">
            <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-transparent group-hover:border-sleads-blue transition-all duration-200 shadow-sm">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || "User"}
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-sleads-blue to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                  {getInitials(user.name)}
                </div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-sleads-midnight rounded-full"></div>
          </div>

          <ChevronDown
            className={`w-4 h-4 text-slate-400 dark:text-sleads-slate500 transition-transform duration-200 group-hover:text-sleads-blue dark:group-hover:text-white ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute right-0 mt-3 w-72 bg-white dark:bg-sleads-midnight border border-slate-200 dark:border-sleads-slate700 rounded-2xl shadow-2xl shadow-slate-200/50 dark:shadow-sleads-blue/10 overflow-hidden z-50 ring-1 ring-black/5 dark:ring-white/10"
            >
              {/* Gradient Header */}
              <div className="relative p-5 border-b border-slate-100 dark:border-sleads-slate700 bg-slate-50 dark:bg-sleads-midnight overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-sleads-blue via-blue-400 to-sleads-blue animate-gradient bg-size-[200%_auto]"></div>
                {/* Blue glow effect */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-sleads-blue/20 blur-3xl rounded-full pointer-events-none mix-blend-screen dark:hidden"></div>
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-sleads-blue/40 blur-3xl rounded-full pointer-events-none mix-blend-screen hidden dark:block"></div>

                <div className="flex items-center gap-4 relative z-10">
                  <div className="h-12 w-12 rounded-xl overflow-hidden shadow-lg shadow-sleads-blue/20 ring-2 ring-white dark:ring-sleads-slate700">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name || "User"}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-linear-to-br from-sleads-blue to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                        {getInitials(user.name)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-sleads-blue dark:text-blue-400 font-medium truncate">
                      {user.email}
                    </p>
                  </div>
                  <div className="text-xs text-sleads-blue dark:text-blue-400 font-medium truncate">
                    {user.role === "admin" && (
                      <CrownIcon
                        onClick={() => router.push("/admin-dashboard")}
                        className="w-4 h-4 cursor-pointer"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="p-2">
                {!isDashboard && (
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="w-full cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-sleads-slate300 hover:bg-blue-50 dark:hover:bg-sleads-blue/10 hover:text-sleads-blue dark:hover:text-blue-400 transition-all group"
                  >
                    <div className="p-1.5 rounded-lg text-slate-500 dark:text-sleads-slate400 group-hover:text-sleads-blue dark:group-hover:text-blue-400 transition-colors">
                      <LayoutDashboard className="w-4 h-4" />
                    </div>
                    {t("user_menu.dashboard")}
                  </button>
                )}
                {isDashboard && (
                  <button
                    onClick={() => router.push("/")}
                    className="w-full cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-sleads-slate300 hover:bg-blue-50 dark:hover:bg-sleads-blue/10 hover:text-sleads-blue dark:hover:text-blue-400 transition-all group"
                  >
                    <div className="p-1.5 rounded-lg text-slate-500 dark:text-sleads-slate400 group-hover:text-sleads-blue dark:group-hover:text-blue-400 transition-colors">
                      <Home className="w-4 h-4" />
                    </div>
                    {t("user_menu.home")}
                  </button>
                )}
                <button className="w-full cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-sleads-slate300 hover:bg-blue-50 dark:hover:bg-sleads-blue/10 hover:text-sleads-blue dark:hover:text-blue-400 transition-all group">
                  <div className="p-1.5 rounded-lg text-slate-500 dark:text-sleads-slate400 group-hover:text-sleads-blue dark:group-hover:text-blue-400 transition-colors">
                    <User className="w-4 h-4" />
                  </div>
                  {t("user_menu.profile")}
                </button>
                <button className="w-full cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-sleads-slate300 hover:bg-blue-50 dark:hover:bg-sleads-blue/10 hover:text-sleads-blue dark:hover:text-blue-400 transition-all group">
                  <div className="p-1.5 rounded-lg text-slate-500 dark:text-sleads-slate400 group-hover:text-sleads-blue dark:group-hover:text-blue-400 transition-colors">
                    <Settings className="w-4 h-4" />
                  </div>
                  {t("user_menu.settings")}
                </button>
              </div>

              <div className="p-2 border-t border-slate-100 dark:border-sleads-slate700 bg-slate-50/30 dark:bg-sleads-slate900/30">
                <button
                  onClick={handleSignOut}
                  className="w-full cursor-pointer flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all group"
                >
                  <div className="p-1.5 rounded-lg text-rose-500 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </div>
                  {t("user_menu.signout")}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
