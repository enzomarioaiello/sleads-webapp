"use client";

import React, { useRef, useState } from "react";
import { useApp } from "../contexts/AppContext";
import { motion, useScroll, AnimatePresence } from "framer-motion";
import { Section } from "../components/ui/Section";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

export default function WorkPageClient() {
  const { t } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", "Web", "Mobile", "SaaS"];

  const projects = [
    {
      id: 1,
      titleKey: "work_page.projects.p1_title",
      descKey: "work_page.projects.p1_desc",
      category: "Mobile",
      image: "https://picsum.photos/seed/fintech/800/600",
      color: "from-blue-500 to-cyan-400",
    },
    {
      id: 2,
      titleKey: "work_page.projects.p2_title",
      descKey: "work_page.projects.p2_desc",
      category: "Web",
      image: "https://picsum.photos/seed/arch/800/600",
      color: "from-emerald-500 to-teal-400",
    },
    {
      id: 3,
      titleKey: "work_page.projects.p3_title",
      descKey: "work_page.projects.p3_desc",
      category: "SaaS",
      image: "https://picsum.photos/seed/nexus/800/600",
      color: "from-violet-500 to-purple-400",
    },
    {
      id: 4,
      titleKey: "work_page.projects.p4_title",
      descKey: "work_page.projects.p4_desc",
      category: "Mobile",
      image: "https://picsum.photos/seed/eco/800/600",
      color: "from-green-500 to-lime-400",
    },
    {
      id: 5,
      titleKey: "work_page.projects.p5_title",
      descKey: "work_page.projects.p5_desc",
      category: "SaaS",
      image: "https://picsum.photos/seed/stream/800/600",
      color: "from-orange-500 to-amber-400",
    },
    {
      id: 6,
      titleKey: "work_page.projects.p6_title",
      descKey: "work_page.projects.p6_desc",
      category: "Web",
      image: "https://picsum.photos/seed/lumina/800/600",
      color: "from-pink-500 to-rose-400",
    },
  ];

  const filteredProjects =
    activeCategory === "All"
      ? projects
      : projects.filter((p) => p.category === activeCategory);

  return (
    <div
      ref={containerRef}
      className="bg-slate-50 dark:bg-sleads-midnight transition-colors duration-300 min-h-screen"
    >
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-sleads-blue/5 skew-y-3 transform origin-top-left scale-110 pointer-events-none" />
        
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6"
          >
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter font-display leading-[0.9]">
              <span className="block text-slate-900 dark:text-sleads-white">
                {t("work_page.hero.title_1")}
              </span>
              <span className="block text-transparent bg-clip-text bg-linear-to-r from-sleads-blue to-blue-400">
                {t("work_page.hero.title_2")}
              </span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            {t("work_page.hero.subtitle")}
          </motion.p>
        </div>
      </section>

      {/* Filter Categories */}
      <Section className="py-8 !pt-0">
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((cat, index) => (
            <motion.button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`px-6 py-2 rounded-full text-sm font-bold tracking-wide transition-all duration-300 border ${
                activeCategory === cat
                  ? "bg-sleads-blue text-white border-sleads-blue shadow-lg shadow-sleads-blue/20"
                  : "bg-white dark:bg-sleads-slate900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-sleads-blue/50"
              }`}
            >
              {t(`work_page.categories.${cat.toLowerCase()}`)}
            </motion.button>
          ))}
        </div>

        {/* Projects Grid */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project) => (
              <motion.div
                layout
                key={project.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="group relative cursor-pointer"
              >
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 shadow-sm transition-shadow duration-300 hover:shadow-xl hover:shadow-sleads-blue/10">
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500 z-10" />
                  
                  {/* Hover Color Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${project.color} opacity-0 group-hover:opacity-20 transition-opacity duration-500 z-10 mix-blend-overlay`} />

                  <Image
                    src={project.image}
                    alt={t(project.titleKey)}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* Content */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-end z-20">
                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <span className="inline-block px-3 py-1 mb-3 text-xs font-bold text-white bg-white/20 backdrop-blur-md rounded-full border border-white/10">
                        {t(`work_page.categories.${project.category.toLowerCase()}`)}
                      </span>
                      <h3 className="text-2xl font-bold text-white mb-2 leading-tight">
                        {t(project.titleKey)}
                      </h3>
                      <p className="text-slate-200 text-sm line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                        {t(project.descKey)}
                      </p>
                    </div>
                  </div>

                  {/* Arrow Icon */}
                  <div className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0 transition-all duration-300 border border-white/20">
                    <ArrowUpRight className="w-5 h-5 text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </Section>

      {/* CTA Section */}
      <Section className="py-20 md:py-32">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-[2.5rem] overflow-hidden bg-slate-900 dark:bg-sleads-slate900 text-white px-8 py-20 text-center shadow-2xl"
        >
          <div className="absolute inset-0 bg-linear-to-br from-sleads-blue/20 via-blue-900/10 to-sleads-midnight" />
          <div className="absolute inset-0 bg-[url('/globe.svg')] opacity-10 bg-center bg-no-repeat bg-cover mix-blend-overlay" />
          
          <div className="relative z-10 max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-6xl font-bold font-display tracking-tight">
              {t("footer.cta_title")}
            </h2>
            <p className="text-xl text-slate-300">
              {t("footer.cta_desc")}
            </p>
            <div className="pt-4">
              <a
                href="/contact"
                className="inline-flex items-center justify-center px-8 py-4 bg-sleads-blue hover:bg-blue-600 text-white rounded-full font-bold transition-all duration-300 hover:scale-105 shadow-lg shadow-sleads-blue/20"
              >
                {t("footer.btn_primary")}
                <ArrowUpRight className="ml-2 w-5 h-5" />
              </a>
            </div>
          </div>
        </motion.div>
      </Section>
    </div>
  );
}




