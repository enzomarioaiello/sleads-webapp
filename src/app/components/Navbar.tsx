"use client";
import React, { useState, useEffect } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import {
  Menu,
  X,
  Sun,
  Moon,
  Globe,
  ArrowRight,
  ChevronDown,
  Database,
  Sparkles,
} from "lucide-react";
import { useApp } from "../contexts/AppContext";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

import { UserMenu } from "./UserMenu";
import { authClient } from "@/lib/auth-client";

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSolutionsOpen, setIsSolutionsOpen] = useState(false);
  const [solutionsCloseTimeout, setSolutionsCloseTimeout] =
    useState<NodeJS.Timeout | null>(null);
  const { scrollY } = useScroll();

  const { theme, toggleTheme, language, setLanguage, t } = useApp();

  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = authClient.useSession();

  const isHome = pathname === "/";

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 20);
  });

  // Close mobile menu on route change
  useEffect(() => {
    setTimeout(() => {
      setIsOpen(false);
      setIsSolutionsOpen(false);
    }, 1);
  }, [pathname]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (solutionsCloseTimeout) {
        clearTimeout(solutionsCloseTimeout);
      }
    };
  }, [solutionsCloseTimeout]);

  // Helper to generate section hrefs
  const sectionHref = (id: string) => (isHome ? `#${id}` : `/#${id}`);

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/80 dark:bg-sleads-midnight/80 backdrop-blur-md border-b border-slate-200 dark:border-sleads-slate900 py-3 shadow-sm dark:shadow-none"
          : "bg-transparent py-5"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-[1440px] mx-auto px-6 grid grid-cols-2 md:grid-cols-12 items-center">
        {/* LOGO (Left - Col Span 2) */}
        <div className="md:col-span-2 flex items-center justify-start">
          <Link href="/" className="flex items-center gap-2.5 cursor-pointer">
            {/* Custom Geometric Logo Icon */}
            <div className="flex flex-row w-6 h-6 -mr-1 items-center justify-center">
              <Image
                src="/images/logo.png"
                alt="Sleads"
                width={64}
                height={64}
              />
            </div>
            <span className="font-heading font-bold text-xl tracking-tight text-slate-900 dark:text-sleads-white">
              Sleads
            </span>
          </Link>
        </div>

        {/* CENTER NAVIGATION (Middle - Col Span 6) */}
        <div className="hidden md:flex md:col-span-6 items-center justify-center gap-8">
          {/* Solutions with Mega Menu */}
          <div
            className="relative"
            onMouseEnter={() => {
              if (solutionsCloseTimeout) {
                clearTimeout(solutionsCloseTimeout);
                setSolutionsCloseTimeout(null);
              }
              setIsSolutionsOpen(true);
            }}
            onMouseLeave={() => {
              const timeout = setTimeout(() => {
                setIsSolutionsOpen(false);
              }, 150); // Small delay to allow moving to menu
              setSolutionsCloseTimeout(timeout);
            }}
          >
            <button className="text-[15px] font-medium text-slate-600 dark:text-sleads-slate300 hover:text-sleads-blue dark:hover:text-white transition-colors flex items-center gap-1">
              {t("nav.solutions")}
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-300 ${
                  isSolutionsOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isSolutionsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="fixed top-[73px] left-0 right-0 pt-2 z-50"
                onMouseEnter={() => {
                  if (solutionsCloseTimeout) {
                    clearTimeout(solutionsCloseTimeout);
                    setSolutionsCloseTimeout(null);
                  }
                  setIsSolutionsOpen(true);
                }}
                onMouseLeave={() => {
                  const timeout = setTimeout(() => {
                    setIsSolutionsOpen(false);
                  }, 150);
                  setSolutionsCloseTimeout(timeout);
                }}
              >
                {/* Hover bridge - invisible area to prevent menu from closing */}
                <div className="absolute top-0 left-0 right-0 h-4 -translate-y-4"></div>

                {/* Menu container - VIVIDWORKS inspired design */}
                <div className="bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate700 rounded-lg shadow-xl dark:shadow-black/50 overflow-hidden mx-auto max-w-7xl">
                  <div className="px-8 py-8">
                    {/* Section Header */}
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mb-6"
                    >
                      <h3 className="text-xs font-bold text-sleads-blue uppercase tracking-wider mb-6">
                        {t("nav.solutions").toUpperCase()}
                      </h3>
                    </motion.div>

                    {/* Solutions Grid */}
                    <div className="grid grid-cols-2 gap-8 max-w-3xl">
                      {/* CMS Solution */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1, duration: 0.3 }}
                      >
                        <Link
                          href="/solutions/cms"
                          className="group flex items-start gap-4 p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-sleads-slate800 transition-colors duration-200"
                        >
                          {/* Icon */}
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{ duration: 0.2 }}
                            className="flex-shrink-0 p-3 rounded-lg bg-sleads-blue/10 dark:bg-sleads-blue/20 group-hover:bg-sleads-blue/20 dark:group-hover:bg-sleads-blue/30 transition-colors"
                          >
                            <Database className="w-6 h-6 text-sleads-blue" />
                          </motion.div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-1.5 group-hover:text-sleads-blue transition-colors">
                              {t("nav.cms")}
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-sleads-slate400 leading-relaxed">
                              {t("nav.cms_desc")}
                            </p>
                          </div>
                        </Link>
                      </motion.div>

                      {/* Smart Objects Solution */}
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15, duration: 0.3 }}
                      >
                        <Link
                          href="/solutions/smart-objects"
                          onClick={() => setIsSolutionsOpen(false)}
                          className="group flex items-start gap-4 p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-sleads-slate800 transition-colors duration-200"
                        >
                          {/* Icon */}
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: -5 }}
                            transition={{ duration: 0.2 }}
                            className="flex-shrink-0 p-3 rounded-lg bg-sleads-blue/10 dark:bg-sleads-blue/20 group-hover:bg-sleads-blue/20 dark:group-hover:bg-sleads-blue/30 transition-colors"
                          >
                            <Sparkles className="w-6 h-6 text-sleads-blue" />
                          </motion.div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base font-semibold text-slate-900 dark:text-white mb-1.5 group-hover:text-sleads-blue transition-colors">
                              {t("nav.smart_objects")}
                            </h4>
                            <p className="text-sm text-slate-600 dark:text-sleads-slate400 leading-relaxed">
                              {t("nav.smart_objects_desc")}
                            </p>
                          </div>
                        </Link>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
          <Link
            href={sectionHref("platform")}
            scroll
            className="text-[15px] font-medium text-slate-600 dark:text-sleads-slate300 hover:text-sleads-blue dark:hover:text-white transition-colors"
          >
            {t("nav.platforms")}
          </Link>
          <Link
            href={sectionHref("work")}
            scroll
            className="text-[15px] font-medium text-slate-600 dark:text-sleads-slate300 hover:text-sleads-blue dark:hover:text-white transition-colors"
          >
            {t("nav.work")}
          </Link>
          <Link
            href="/process"
            className="text-[15px] font-medium text-slate-600 dark:text-sleads-slate300 hover:text-sleads-blue dark:hover:text-white transition-colors"
          >
            {t("nav.process")}
          </Link>
          <Link
            href="/about"
            className="text-[15px] font-medium text-slate-600 dark:text-sleads-slate300 hover:text-sleads-blue dark:hover:text-white transition-colors"
          >
            {t("nav.about")}
          </Link>
          <Link
            href="/blog"
            className="text-[15px] font-medium text-slate-600 dark:text-sleads-slate300 hover:text-sleads-blue dark:hover:text-white transition-colors"
          >
            Blog
          </Link>
          <Link
            href="/contact-us"
            className="text-[15px] font-medium text-slate-600 dark:text-sleads-slate300 hover:text-sleads-blue dark:hover:text-white transition-colors"
          >
            Contact
          </Link>
        </div>

        {/* RIGHT ACTIONS (Right - Col Span 4) */}
        <div className="hidden md:flex md:col-span-4 items-center justify-end gap-5">
          {/* Language Pill */}
          <div className="flex items-center bg-slate-100 dark:bg-sleads-slate900 rounded-full px-1 py-1 border border-slate-200 dark:border-sleads-slate700">
            <Globe className="w-3.5 h-3.5 text-slate-400 dark:text-sleads-slate500 ml-2 mr-1" />
            <button
              onClick={() => setLanguage("en")}
              className={`px-2 py-0.5 text-xs font-bold rounded-full transition-colors ${
                language === "en"
                  ? "text-slate-900 dark:text-white"
                  : "text-slate-400 dark:text-sleads-slate500 hover:text-slate-600"
              }`}
            >
              EN
            </button>
            <span className="text-slate-300 dark:text-sleads-slate700 text-[10px]">
              |
            </span>
            <button
              onClick={() => setLanguage("nl")}
              className={`px-2 py-0.5 text-xs font-bold rounded-full transition-colors ${
                language === "nl"
                  ? "text-slate-900 dark:text-white"
                  : "text-slate-400 dark:text-sleads-slate500 hover:text-slate-600"
              }`}
            >
              NL
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="text-slate-500 dark:text-sleads-slate300 hover:text-sleads-blue dark:hover:text-white transition-colors"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-slate-200 dark:bg-sleads-slate700"></div>

          {/* Auth Buttons / User Menu */}
          {session ? (
            <UserMenu user={session.user} />
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/auth/signin"
                className="text-sm font-semibold text-slate-700 dark:text-sleads-white hover:text-sleads-blue transition-colors"
              >
                {t("nav.signin")}
              </Link>
              <Link
                href="/auth/signup"
                className="bg-sleads-blue hover:bg-sleads-blue/90 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-md shadow-sleads-blue/20"
              >
                {t("nav.signup")}
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle (Right aligned in grid) */}
        <div className="flex md:hidden justify-end items-center gap-4">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-lg text-slate-600 dark:text-sleads-slate300"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
          <button
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
            className="text-slate-900 dark:text-sleads-white"
            onClick={() => {
              setIsOpen(!isOpen);
              if (isOpen) {
                setIsSolutionsOpen(false);
              }
            }}
          >
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="md:hidden bg-white dark:bg-sleads-midnight border-b border-slate-200 dark:border-sleads-slate900 overflow-hidden absolute top-full left-0 right-0 shadow-xl"
        >
          <div className="px-6 py-8 flex flex-col gap-5">
            {/* Solutions with Mobile Submenu */}
            <div>
              <button
                onClick={() => setIsSolutionsOpen(!isSolutionsOpen)}
                className="w-full text-left text-lg font-medium text-slate-900 dark:text-sleads-white flex items-center justify-between"
              >
                <span>{t("nav.solutions")}</span>
                <ChevronDown
                  className={`w-5 h-5 transition-transform duration-300 ${
                    isSolutionsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isSolutionsOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-3 flex flex-col gap-3"
                >
                  {/* CMS Card */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                  >
                    <Link
                      href="/solutions/cms"
                      onClick={() => setIsOpen(false)}
                      className="group relative block p-5 rounded-xl bg-gradient-to-br from-sleads-blue/5 via-sleads-blue/10 to-sleads-blue/5 dark:from-sleads-blue/10 dark:via-sleads-blue/15 dark:to-sleads-blue/10 border-2 border-sleads-blue/20 dark:border-sleads-blue/30 hover:border-sleads-blue dark:hover:border-sleads-blue transition-all duration-300 overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-15 transition-all duration-500 transform group-hover:scale-110 group-hover:rotate-6">
                        <Database className="w-20 h-20 text-sleads-blue" />
                      </div>
                      <div className="relative z-10 flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-sleads-blue/10 dark:bg-sleads-blue/20 border-2 border-sleads-blue/30 group-hover:bg-sleads-blue/20 dark:group-hover:bg-sleads-blue/30 group-hover:border-sleads-blue/50 transition-all duration-300">
                          <Database className="w-6 h-6 text-sleads-blue" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-sleads-blue transition-colors">
                            {t("nav.cms")}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-sleads-slate300 mt-0.5">
                            {t("nav.cms_desc")}
                          </p>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 h-1 w-0 bg-sleads-blue group-hover:w-full transition-all duration-500 ease-out" />
                    </Link>
                  </motion.div>

                  {/* Smart Objects Card */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15, duration: 0.3 }}
                  >
                    <Link
                      href="/solutions/smart-objects"
                      onClick={() => setIsOpen(false)}
                      className="group relative block p-5 rounded-xl bg-gradient-to-br from-sleads-blue/5 via-sleads-blue/10 to-sleads-blue/5 dark:from-sleads-blue/10 dark:via-sleads-blue/15 dark:to-sleads-blue/10 border-2 border-sleads-blue/20 dark:border-sleads-blue/30 hover:border-sleads-blue dark:hover:border-sleads-blue transition-all duration-300 overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 p-3 opacity-5 group-hover:opacity-15 transition-all duration-500 transform group-hover:scale-110 group-hover:-rotate-6">
                        <Sparkles className="w-20 h-20 text-sleads-blue" />
                      </div>
                      <div className="relative z-10 flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-sleads-blue/10 dark:bg-sleads-blue/20 border-2 border-sleads-blue/30 group-hover:bg-sleads-blue/20 dark:group-hover:bg-sleads-blue/30 group-hover:border-sleads-blue/50 transition-all duration-300">
                          <Sparkles className="w-6 h-6 text-sleads-blue" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-sleads-blue transition-colors">
                            {t("nav.smart_objects")}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-sleads-slate300 mt-0.5">
                            {t("nav.smart_objects_desc")}
                          </p>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 h-1 w-0 bg-sleads-blue group-hover:w-full transition-all duration-500 ease-out" />
                    </Link>
                  </motion.div>
                </motion.div>
              )}
            </div>
            <Link
              href={sectionHref("platform")}
              scroll
              className="text-left text-lg font-medium text-slate-900 dark:text-sleads-white"
            >
              {t("nav.platforms")}
            </Link>
            <Link
              href={sectionHref("work")}
              scroll
              className="text-left text-lg font-medium text-slate-900 dark:text-sleads-white"
            >
              {t("nav.work")}
            </Link>
            <Link
              href="/process"
              className="text-left text-lg font-medium text-slate-900 dark:text-sleads-white"
            >
              {t("nav.process")}
            </Link>
            <Link
              href="/about"
              className="text-left text-lg font-medium text-slate-900 dark:text-sleads-white"
            >
              {t("nav.about")}
            </Link>
            <Link
              href="/blog"
              className="text-left text-lg font-medium text-slate-900 dark:text-sleads-white"
            >
              Blog
            </Link>
            <Link
              href="/contact-us"
              className="text-left text-lg font-medium text-slate-900 dark:text-sleads-white"
            >
              Contact
            </Link>

            <div className="flex items-center justify-between py-4 border-t border-slate-100 dark:border-sleads-slate900 mt-2">
              <span className="text-slate-600 dark:text-sleads-slate300">
                Language
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setLanguage("en")}
                  className={`px-3 py-1 rounded text-sm ${
                    language === "en"
                      ? "bg-sleads-blue text-white"
                      : "text-slate-500 dark:text-sleads-slate500"
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage("nl")}
                  className={`px-3 py-1 rounded text-sm ${
                    language === "nl"
                      ? "bg-sleads-blue text-white"
                      : "text-slate-500 dark:text-sleads-slate500"
                  }`}
                >
                  NL
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {session ? (
                <>
                  <div className="flex items-center justify-between px-2 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full overflow-hidden border border-slate-200 dark:border-sleads-slate700">
                        {session.user.image ? (
                          <Image
                            src={session.user.image}
                            alt={session.user.name || "User"}
                            width={40}
                            height={40}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full bg-sleads-blue flex items-center justify-center text-white font-bold">
                            {session.user.name?.charAt(0) || "U"}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {session.user.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-sleads-slate400">
                          {session.user.email}
                        </p>
                      </div>
                    </div>
                    <div>
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-1 text-sm font-semibold text-sleads-blue hover:text-sleads-blue/80 transition-colors"
                      >
                        <p>Open dashboard</p>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      await authClient.signOut();
                      router.push("/");
                      setIsOpen(false);
                    }}
                    className="w-full py-3 text-rose-500 font-semibold border border-slate-200 dark:border-sleads-slate700 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/signin"
                    className="w-full py-3 text-slate-700 dark:text-white font-semibold border border-slate-200 dark:border-sleads-slate700 rounded-lg text-center"
                  >
                    {t("nav.signin")}
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="bg-sleads-blue text-white w-full py-3 rounded-lg text-base font-semibold shadow-lg shadow-sleads-blue/20 text-center"
                  >
                    {t("nav.signup")}
                  </Link>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};
