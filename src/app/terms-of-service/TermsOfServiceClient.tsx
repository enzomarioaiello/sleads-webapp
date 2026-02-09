"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useApp } from "../contexts/AppContext";
import { Section } from "../components/ui/Section";
import { Footer } from "../components/Footer";
import { Navbar } from "../components/Navbar";
import { cn } from "../utils/cn";
import { ChevronRight } from "lucide-react";

export const TermsOfServiceClient = () => {
  const { t } = useApp();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const sections = React.useMemo(
    () => [
      {
        id: "introduction",
        title: t("terms_of_service.intro_title"),
        content: t("terms_of_service.intro_desc"),
      },
      {
        id: "acceptance",
        title: t("terms_of_service.acceptance_title"),
        content: t("terms_of_service.acceptance_desc"),
      },
      {
        id: "access",
        title: t("terms_of_service.access_title"),
        content: t("terms_of_service.access_desc"),
      },
      {
        id: "account",
        title: t("terms_of_service.account_title"),
        content: t("terms_of_service.account_desc"),
      },
      {
        id: "intellectual-property",
        title: t("terms_of_service.intellectual_property_title"),
        content: t("terms_of_service.intellectual_property_desc"),
      },
      {
        id: "user-content",
        title: t("terms_of_service.user_content_title"),
        content: t("terms_of_service.user_content_desc"),
      },
      {
        id: "prohibited-uses",
        title: t("terms_of_service.prohibited_uses_title"),
        content: t("terms_of_service.prohibited_uses_desc"),
      },
      {
        id: "termination",
        title: t("terms_of_service.termination_title"),
        content: t("terms_of_service.termination_desc"),
      },
      {
        id: "limitation-liability",
        title: t("terms_of_service.limitation_liability_title"),
        content: t("terms_of_service.limitation_liability_desc"),
      },
      {
        id: "disclaimer",
        title: t("terms_of_service.disclaimer_title"),
        content: t("terms_of_service.disclaimer_desc"),
      },
      {
        id: "indemnification",
        title: t("terms_of_service.indemnification_title"),
        content: t("terms_of_service.indemnification_desc"),
      },
      {
        id: "severability",
        title: t("terms_of_service.severability_title"),
        content: t("terms_of_service.severability_desc"),
      },
      {
        id: "waiver",
        title: t("terms_of_service.waiver_title"),
        content: t("terms_of_service.waiver_desc"),
      },
      {
        id: "entire-agreement",
        title: t("terms_of_service.entire_agreement_title"),
        content: t("terms_of_service.entire_agreement_desc"),
      },
      {
        id: "governing-law",
        title: t("terms_of_service.governing_law_title"),
        content: t("terms_of_service.governing_law_desc"),
      },
      {
        id: "changes",
        title: t("terms_of_service.changes_title"),
        content: t("terms_of_service.changes_desc"),
      },
      {
        id: "contact",
        title: t("terms_of_service.contact_title"),
        content: t("terms_of_service.contact_desc"),
      },
    ],
    [t]
  );

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 150; // Offset for header

      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          const offsetTop = rect.top + window.scrollY;
          const offsetBottom = offsetTop + rect.height;

          if (scrollPosition >= offsetTop && scrollPosition < offsetBottom) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Check initial position
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Offset for sticky header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 dark:bg-sleads-midnight pt-20">
        <Section className="pb-0 pt-32 md:pt-40">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-4xl md:text-6xl font-bold font-space-grotesk mb-6 text-slate-900 dark:text-white">
              {t("terms_of_service.title")}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg md:text-xl font-medium">
              {t("terms_of_service.last_updated")}
            </p>
          </motion.div>
        </Section>

        <Section className="pt-12 md:pt-20 relative overflow-visible!">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Table of Contents - Sticky Sidebar (Desktop) */}
            <div className="hidden lg:block lg:col-span-4 relative">
              <div className="sticky top-32 max-h-[calc(100vh-8rem)] overflow-y-auto pr-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-6">
                  Table of Contents
                </h3>
                <nav className="flex flex-col space-y-1">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={cn(
                        "text-left py-2 px-4 rounded-lg text-sm transition-all duration-200 flex items-center justify-between group",
                        activeSection === section.id
                          ? "bg-sleads-blue/10 text-sleads-blue font-semibold"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50"
                      )}
                    >
                      <span className="truncate mr-2">{section.title}</span>
                      {activeSection === section.id && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="text-sleads-blue"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Content Area */}
            <div className="lg:col-span-8 space-y-16">
              {sections.map((section, index) => (
                <motion.div
                  key={section.id}
                  id={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="scroll-mt-32"
                >
                  <h2 className="text-2xl md:text-3xl font-bold font-space-grotesk mb-6 text-slate-900 dark:text-white flex items-center gap-3">
                    <span className="text-sleads-blue opacity-50 text-xl">
                      #
                    </span>
                    {section.title}
                  </h2>
                  <div className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line text-lg">
                    {section.content}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Section>
      </main>

      {/* Mobile Sticky Navigation */}
      <div className="lg:hidden fixed bottom-6 left-6 right-6 z-40 pointer-events-none">
        <div className="bg-white/90 dark:bg-sleads-slate900/90 backdrop-blur-xl border border-slate-200 dark:border-sleads-slate700 shadow-2xl rounded-2xl p-3 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full pb-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  "whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 border border-transparent",
                  activeSection === section.id
                    ? "bg-sleads-blue text-white shadow-lg shadow-sleads-blue/20"
                    : "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-100 dark:border-slate-700"
                )}
              >
                {section.title.split(".")[0] +
                  (section.title.includes(".") ? "." : "")}{" "}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
