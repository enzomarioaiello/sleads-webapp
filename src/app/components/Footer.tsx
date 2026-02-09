"use client";

import React, { useState, useEffect } from "react";
import { Section } from "./ui/Section";
import { useApp } from "../contexts/AppContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import Image from "next/image";

export const Footer: React.FC = () => {
  const subscribeToNewsletter = useMutation(
    api.newsletter.subscribeToNewsletter
  );
  const { t } = useApp();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">(
    "idle"
  );

  // Helper to generate section hrefs
  const sectionHref = (id: string) => (isHome ? `#${id}` : `/#${id}`);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const subscriptionId = localStorage.getItem("newsletter_subscription");
      if (subscriptionId) {
        // Defer setStatus to avoid state update synchronously in effect body
        setTimeout(() => setStatus("success"), 0);
      }
    }
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("submitting");
    const { subscriptionId } = await subscribeToNewsletter({ email });
    if (subscriptionId) {
      setStatus("success");
      localStorage.setItem("newsletter_subscription", subscriptionId);
      setEmail("");
    } else {
      setStatus("idle");
    }
    setStatus("success");
    setEmail("");
  };

  return (
    <footer className="relative pt-20 pb-10 overflow-hidden">
      <div
        className="absolute inset-0 bg-slate-50 dark:bg-sleads-midnight transition-colors duration-300 -z-20"
        style={{
          maskImage: "linear-gradient(to bottom, transparent, black 200px)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 200px)",
        }}
      />
      <div className="absolute top-0 left-0 w-full h-32 bg-linear-to-b from-sleads-blue/5 to-transparent pointer-events-none" />
      <Section className="py-0 ">
        {/* Newsletter Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-32 max-w-4xl mx-auto text-center relative z-10"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[radial-gradient(closest-side,rgba(59,130,246,0.3)_0%,transparent_100%)] rounded-full blur-[120px] -z-10" />

          <h3 className="text-4xl md:text-6xl font-bold font-display bg-clip-text text-transparent bg-linear-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white mb-6 tracking-tight">
            {t("footer.newsletter.title")}
          </h3>
          <p className="text-lg text-slate-500 dark:text-sleads-slate500 mb-10 max-w-xl mx-auto">
            {t("footer.newsletter.desc")}
          </p>

          <form
            onSubmit={handleSubscribe}
            className="max-w-lg mx-auto relative group h-16"
          >
            <div className="absolute inset-0 bg-linear-to-r from-sleads-blue/30 to-blue-500/30 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <AnimatePresence mode="wait">
              {status === "success" ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full h-full flex items-center justify-center bg-sleads-blue/10 border border-sleads-blue/20 rounded-2xl backdrop-blur-md"
                >
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, type: "spring" }}
                    className="flex items-center gap-2 text-sleads-blue font-bold"
                  >
                    <div className="w-8 h-8 rounded-full bg-sleads-blue flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    {t("footer.newsletter.success")}
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="relative flex items-center bg-white/80 dark:bg-white/5 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl p-2 transition-all duration-300 focus-within:ring-2 focus-within:ring-sleads-blue/50 focus-within:border-sleads-blue shadow-2xl shadow-slate-200/50 dark:shadow-sleads-blue/5"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("footer.newsletter.placeholder")}
                    className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 font-medium min-w-0"
                    disabled={status === "submitting"}
                  />
                  <button
                    type="submit"
                    disabled={status === "submitting" || !email}
                    className="px-6 py-3 bg-sleads-blue text-white rounded-xl font-bold hover:bg-blue-600 transition-all duration-300 flex items-center gap-2 disabled:opacity-80 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-sleads-blue/25 min-w-[140px] justify-center"
                  >
                    {status === "submitting" ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span className="hidden sm:inline">
                          {t("footer.newsletter.button")}
                        </span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </motion.div>

        {/* Main CTA */}

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative mb-32 rounded-[2.5rem] overflow-hidden bg-slate-900 dark:bg-sleads-slate900 text-white px-8 py-24 md:py-32 text-center shadow-2xl"
        >
          <div className="absolute inset-0 bg-linear-to-br from-sleads-blue/30 via-blue-900/20 to-sleads-midnight" />
          <div className="absolute inset-0 bg-[url('/globe.svg')] opacity-20 bg-center bg-no-repeat bg-cover mix-blend-overlay" />

          {/* Animated Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sleads-blue/20 rounded-full blur-[120px]" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-10">
            <h2 className="text-5xl md:text-7xl font-bold font-display tracking-tight leading-[0.9]">
              {t("footer.cta_title")}
            </h2>
            <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto">
              {t("footer.cta_desc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
              <Link
                href="/contact-us"
                className="inline-flex items-center justify-center px-10 py-5 bg-sleads-blue hover:bg-blue-600 text-white rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-sleads-blue/30"
              >
                {t("footer.btn_primary")}
                <ArrowRight className="ml-2 w-6 h-6" />
              </Link>
              <Link
                href="/contact-us"
                className="inline-flex items-center justify-center px-10 py-5 bg-white/5 hover:bg-white/10 backdrop-blur-md text-white border border-white/10 hover:border-white/30 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105"
              >
                {t("footer.btn_secondary")}
              </Link>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 border-b border-slate-200 dark:border-sleads-slate900 pb-12 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2 mb-6 cursor-pointer"
            >
              <Image
                src="/images/logo.png"
                alt="Sleads"
                width={32}
                height={32}
              />
              <span className="font-heading font-bold text-xl text-slate-900 dark:text-white">
                Sleads
              </span>
            </Link>
            <p className="text-slate-500 dark:text-sleads-slate500 text-sm">
              {t("footer.est")} <br />
              {t("footer.made")}
            </p>
          </div>
          <div>
            <h4 className="text-slate-900 dark:text-white font-bold mb-4">
              {t("footer.col1")}
            </h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-sleads-slate500">
              <li>
                <Link
                  href={sectionHref("services")}
                  scroll
                  className="hover:text-sleads-blue transition-colors"
                >
                  {t("footer.links.custom_websites")}
                </Link>
              </li>
              <li>
                <Link
                  href={sectionHref("services")}
                  scroll
                  className="hover:text-sleads-blue transition-colors"
                >
                  {t("footer.links.internal_tools")}
                </Link>
              </li>
              <li>
                <Link
                  href={sectionHref("services")}
                  scroll
                  className="hover:text-sleads-blue transition-colors"
                >
                  {t("footer.links.design_systems")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-slate-900 dark:text-white font-bold mb-4">
              {t("footer.col2")}
            </h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-sleads-slate500">
              <li>
                <Link
                  href={sectionHref("platform")}
                  scroll
                  className="hover:text-sleads-blue transition-colors"
                >
                  {t("footer.links.platform")}
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="hover:text-sleads-blue transition-colors"
                >
                  {t("footer.links.updates")}
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="hover:text-sleads-blue transition-colors"
                >
                  {t("footer.links.roadmap")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-slate-900 dark:text-white font-bold mb-4">
              {t("footer.col3")}
            </h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-sleads-slate500">
              <li>
                <a
                  href="https://linkedin.com/company/sleads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sleads-blue transition-colors"
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com/sleads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sleads-blue transition-colors"
                >
                  Twitter
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com/sleads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-sleads-blue transition-colors"
                >
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 dark:text-sleads-slate500">
          <p>{t("footer.copyright")}</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link
              href="/privacy-policy"
              className="hover:text-sleads-blue transition-colors"
            >
              {t("footer.privacy")}
            </Link>
            <Link
              href="/terms-of-service"
              className="hover:text-sleads-blue transition-colors"
            >
              {t("footer.terms")}
            </Link>
          </div>
        </div>
      </Section>
    </footer>
  );
};
