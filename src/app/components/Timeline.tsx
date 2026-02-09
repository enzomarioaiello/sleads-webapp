"use client";
import React from "react";
import { motion } from "framer-motion";
import { Section } from "./ui/Section";
import { useApp } from "../contexts/AppContext";

export const Timeline: React.FC = () => {
  const { t } = useApp();

  const items = [
    {
      year: "2020 — 2024",
      title: t("timeline.card1_title"),
      desc: t("timeline.card1_desc"),
      stats: { value: "250+", label: t("timeline.card1_stat") },
    },
    {
      year: "2025",
      title: t("timeline.card2_title"),
      desc: t("timeline.card2_desc"),
      active: true,
    },
    {
      year: t("timeline.card3_subtitle"),
      title: t("timeline.card3_title"),
      desc: t("timeline.card3_desc"),
      future: true,
    },
  ];

  return (
    <Section className="py-24 border-t border-slate-200 dark:border-sleads-slate900 bg-slate-50 dark:bg-sleads-midnight transition-colors duration-300 overflow-hidden relative">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-[0.15]" />

        {/* Center Glow Beam */}
        <div className="absolute left-[28px] md:left-1/2 top-0 w-[2px] h-full bg-linear-to-b from-transparent via-sleads-blue/50 to-transparent blur-[10px] -translate-x-1/2 opacity-50" />

        {/* Ambient Gradient */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-sleads-blue/5 dark:bg-sleads-blue/10 blur-[120px] rounded-full pointer-events-none" />
      </div>

      <div className="mb-20 md:text-center max-w-3xl mx-auto relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="font-heading text-4xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white"
        >
          {t("timeline.title")}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="text-slate-600 dark:text-sleads-slate300 text-lg"
        >
          {t("timeline.desc")}
        </motion.p>
      </div>

      <div className="relative max-w-4xl mx-auto z-10">
        {/* Center Line */}
        <div className="absolute left-[28px] md:left-1/2 top-0 bottom-0 w-px bg-slate-200 dark:bg-sleads-slate800 -translate-x-1/2" />
        {/* Center Beam Highligh */}
        <div className="absolute left-[28px] md:left-1/2 top-0 bottom-0 w-px bg-linear-to-b from-transparent via-sleads-blue/50 to-transparent -translate-x-1/2" />

        {items.map((item, index) => (
          <div
            key={index}
            className={`relative flex flex-col md:flex-row gap-8 md:gap-0 mb-16 last:mb-0 ${
              index % 2 === 0 ? "md:flex-row-reverse" : ""
            }`}
          >
            {/* Timeline Dot */}
            <div className="absolute left-[28px] md:left-1/2 top-0 w-14 h-14 -translate-x-1/2 flex items-center justify-center z-10">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: 0.1, ease: "backOut" }}
                className={`w-4 h-4 rounded-full border-[3px] ${
                  item.active || item.future
                    ? "bg-sleads-blue border-sleads-blue dark:border-sleads-blue shadow-[0_0_0_4px_rgba(31,111,235,0.2)]"
                    : "bg-white dark:bg-sleads-midnight border-slate-300 dark:border-sleads-slate600"
                }`}
              />
              {item.future && (
                <span className="absolute w-full h-full animate-ping rounded-full bg-sleads-blue/20" />
              )}
            </div>

            {/* Content Side */}
            <div
              className={`w-full md:w-1/2 pl-20 md:pl-0 ${
                index % 2 === 0 ? "md:pl-16" : "md:pr-16"
              }`}
            >
              <motion.div
                initial={{ opacity: 0, x: index % 2 === 0 ? 20 : -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="group relative p-8 rounded-3xl bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate700 hover:border-sleads-blue/30 dark:hover:border-sleads-blue/30 transition-all duration-500 shadow-sm hover:shadow-xl dark:shadow-none"
              >
                <div
                  className={`text-sm font-mono mb-3 ${
                    item.active || item.future
                      ? "text-sleads-blue font-bold"
                      : "text-slate-500 dark:text-sleads-slate500"
                  }`}
                >
                  {item.year}
                </div>

                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-sleads-blue transition-colors">
                  {item.title}
                </h3>

                <p className="text-slate-600 dark:text-sleads-slate300 leading-relaxed">
                  {item.desc}
                </p>

                {/* Stats for first item */}
                {item.stats && (
                  <div className="mt-6 flex items-baseline gap-2 border-t border-slate-100 dark:border-sleads-slate800 pt-4">
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">
                      {item.stats.value}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-sleads-slate500">
                      {item.stats.label}
                    </span>
                  </div>
                )}

                {/* Progress bar for active item */}
                {item.active && (
                  <div className="mt-6 h-1.5 w-full bg-slate-100 dark:bg-sleads-slate800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-sleads-blue origin-left"
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 1.5,
                        delay: 0.5,
                        ease: "circOut",
                      }}
                    />
                  </div>
                )}

                {/* Badge for future item */}
                {item.future && (
                  <div className="absolute -top-3 -right-3 bg-sleads-blue text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-sleads-blue/20 animate-bounce">
                    SOON
                  </div>
                )}
              </motion.div>
            </div>

            {/* Empty side for spacing */}
            <div className="w-full md:w-1/2 hidden md:block" />
          </div>
        ))}
      </div>
    </Section>
  );
};
