import React from "react";
import { motion } from "framer-motion";
import { Section } from "./ui/Section";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import Image from "next/image";

export const Portfolio: React.FC = () => {
  const { t } = useApp();

  /*
  const projects = [
    { name: "FinTech Global", category: t('portfolio.c1'), image: "https://picsum.photos/800/600?random=1" },
    { name: "Apex Architecture", category: t('portfolio.c2'), image: "https://picsum.photos/800/600?random=2" },
    { name: "Nexus Systems", category: t('portfolio.c3'), image: "https://picsum.photos/800/600?random=3" }
  ];
  */

  return (
    <Section
      id="work"
      className="bg-slate-50 dark:bg-sleads-midnight transition-colors duration-300"
    >
      <div className="flex justify-between items-end mb-12">
        <h2 className="font-heading text-4xl font-bold text-slate-900 dark:text-white">
          {t("portfolio.title")}
        </h2>
        {/*
            <a href="#" className="text-sleads-blue hover:text-sleads-aqua transition-colors flex items-center gap-1 font-medium">
                {t('portfolio.view_all')} <ArrowUpRight className="w-4 h-4" />
            </a>
            */}
      </div>

      {/* Existing Grid - Commented Out
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="group cursor-pointer"
                >
                    <div className="relative overflow-hidden rounded-xl aspect-[4/3] mb-4 shadow-md dark:shadow-none">
                        <div className="absolute inset-0 bg-sleads-blue/0 group-hover:bg-sleads-blue/20 transition-colors z-10" />
                        <img 
                            src={project.image} 
                            alt={project.name} 
                            className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-700"
                        />
                    </div>
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-sleads-blue transition-colors">{project.name}</h3>
                            <p className="text-slate-500 dark:text-sleads-slate500 text-sm">{project.category}</p>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
        */}

      {/* New "Coming Soon" Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="w-full h-[400px] rounded-3xl relative overflow-hidden flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate700 shadow-sm"
      >
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-sleads-blue/5 rounded-full blur-[100px]" />

        <div className="relative z-10 flex flex-col items-center max-w-md mx-auto">
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="mb-8 relative"
          >
            <div className="w-20 h-20 rounded-full border-2 border-slate-200 dark:border-sleads-slate700 border-t-sleads-blue border-r-sleads-blue" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src="/images/logo.png"
                alt="Sleads"
                width={32}
                height={32}
              />
            </div>
          </motion.div>

          <h3 className="text-3xl font-heading font-bold text-slate-900 dark:text-white mb-4">
            {t("portfolio.coming_soon_title")}
          </h3>
          <p className="text-slate-600 dark:text-sleads-slate300 mb-8 leading-relaxed">
            {t("portfolio.coming_soon_desc")}
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sleads-blue/10 border border-sleads-blue/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sleads-blue opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sleads-blue"></span>
            </span>
            <span className="text-xs font-bold text-sleads-blue tracking-wider uppercase">
              {t("portfolio.loading_badge")}
            </span>
          </div>
        </div>
      </motion.div>
    </Section>
  );
};
