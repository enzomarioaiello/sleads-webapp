"use client";

import React, { useRef, useEffect } from "react";
import { useApp } from "../contexts/AppContext";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
} from "framer-motion";
import { Section } from "../components/ui/Section";
import {
  Search,
  PenTool,
  Code2,
  ShieldCheck,
  Rocket,
  CheckCircle2,
  LayoutDashboard,
  MessageSquare,
  FileText,
  TrendingUp,
} from "lucide-react";

export default function ProcessPageClient() {
  const { t } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Parallax Mouse Effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    // Only enable parallax on non-touch devices
    if (window.matchMedia("(hover: none)").matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mouseX.set((e.clientX - innerWidth / 2) / innerWidth);
      mouseY.set((e.clientY - innerHeight / 2) / innerHeight);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const springConfig = { damping: 25, stiffness: 120 };
  const moveX = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-20, 20]),
    springConfig
  );
  const moveY = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [-20, 20]),
    springConfig
  );
  const moveXReverse = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [20, -20]),
    springConfig
  );
  const moveYReverse = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [20, -20]),
    springConfig
  );

  const steps = [
    {
      icon: Search,
      title: t("process_page.steps.step1_title"),
      desc: t("process_page.steps.step1_desc"),
      color: "from-sleads-blue to-blue-600",
    },
    {
      icon: PenTool,
      title: t("process_page.steps.step2_title"),
      desc: t("process_page.steps.step2_desc"),
      color: "from-sleads-blue to-blue-500",
    },
    {
      icon: Code2,
      title: t("process_page.steps.step3_title"),
      desc: t("process_page.steps.step3_desc"),
      color: "from-blue-600 to-sleads-blue",
    },
    {
      icon: ShieldCheck,
      title: t("process_page.steps.step4_title"),
      desc: t("process_page.steps.step4_desc"),
      color: "from-sleads-blue to-blue-700",
    },
    {
      icon: Rocket,
      title: t("process_page.steps.step5_title"),
      desc: t("process_page.steps.step5_desc"),
      color: "from-blue-500 to-sleads-blue",
    },
  ];

  return (
    <div
      ref={containerRef}
      className="bg-slate-50 dark:bg-sleads-midnight transition-colors duration-300 min-h-screen overflow-hidden"
    >
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Interactive Background Blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            style={{ x: moveX, y: moveY }}
            className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-sleads-blue/20 rounded-full blur-3xl opacity-50 dark:opacity-30 will-change-transform"
          />
          <motion.div
            style={{ x: moveXReverse, y: moveYReverse }}
            className="absolute bottom-[20%] right-[20%] w-[600px] h-[600px] bg-sleads-blue/15 rounded-full blur-3xl opacity-50 dark:opacity-30 will-change-transform"
          />
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 dark:bg-sleads-slate900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 mb-8">
              <span className="w-2 h-2 rounded-full bg-sleads-blue animate-pulse" />
              <span className="text-xs font-bold font-heading tracking-widest text-slate-500 dark:text-sleads-slate300 uppercase">
                Proven Workflow
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter mb-6 font-display leading-[0.95]">
              <span className="block text-slate-900 dark:text-sleads-white">
                {t("process_page.hero.title_1")}
              </span>
              <span className="block text-sleads-blue pb-2">
                {t("process_page.hero.title_2")}
              </span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            {t("process_page.hero.subtitle")}
          </motion.p>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-600">
            Scroll
          </span>
          <div className="w-px h-12 bg-linear-to-b from-slate-400 to-transparent dark:from-slate-600" />
        </motion.div>
      </section>

      {/* Timeline Steps */}
      <Section className="py-20 relative">
        {/* Connecting Line */}
        <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800 -translate-x-1/2 hidden md:block" />

        <div className="space-y-20 md:space-y-32">
          {steps.map((step, index) => {
            const isEven = index % 2 === 0;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`flex flex-col md:flex-row items-center gap-8 md:gap-16 ${
                  isEven ? "md:flex-row-reverse" : ""
                }`}
              >
                {/* Content Side */}
                <div className="flex-1 text-left md:text-right">
                  <div
                    className={`flex flex-col ${
                      isEven
                        ? "md:items-start md:text-left"
                        : "md:items-end md:text-right"
                    }`}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-6xl font-bold font-display text-slate-200 dark:text-slate-800">
                        0{index + 1}
                      </span>
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${step.color} shadow-lg text-white`}
                      >
                        <step.icon className="w-6 h-6" />
                      </div>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900 dark:text-sleads-white mb-4">
                      {step.title}
                    </h3>
                    <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-md">
                      {step.desc}
                    </p>
                  </div>
                </div>

                {/* Center Point (Desktop) */}
                <div className="hidden md:flex items-center justify-center w-16 relative z-10">
                  <div className="w-4 h-4 rounded-full bg-slate-900 dark:bg-sleads-white border-4 border-slate-100 dark:border-sleads-midnight shadow-xl" />
                </div>

                {/* Visual Side (Placeholder for now, could be an image/graphic) */}
                <div className="flex-1 w-full">
                  <div
                    className={`relative aspect-video rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm ${
                      isEven ? "origin-left" : "origin-right"
                    }`}
                  >
                    {/* Abstract Decorative Elements representing the step */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-10`}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      {/* You can replace this with specific images later */}
                      <step.icon
                        className={`w-20 h-20 text-slate-300 dark:text-slate-700 opacity-20`}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* Custom Dashboard Feature */}
      <Section className="py-32 bg-white dark:bg-sleads-slate900 border-y border-slate-200 dark:border-slate-800">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-sleads-blue/10 text-sleads-blue text-sm font-bold tracking-wide uppercase">
              <LayoutDashboard className="w-4 h-4" />
              {t("process_page.dashboard.subtitle")}
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-sleads-white leading-tight">
              {t("process_page.dashboard.title")}
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              {t("process_page.dashboard.desc")}
            </p>

            <div className="grid sm:grid-cols-2 gap-6 pt-4">
              {[
                { icon: TrendingUp, label: "f1" },
                { icon: MessageSquare, label: "f2" },
                { icon: FileText, label: "f3" },
                { icon: CheckCircle2, label: "f4" },
              ].map((feat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sleads-blue">
                    <feat.icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {t(`process_page.dashboard.features.${feat.label}`)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 50, rotateY: -10 }}
            whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative perspective-1000"
          >
            <div className="relative bg-slate-900 rounded-xl border border-slate-800 shadow-2xl overflow-hidden aspect-[16/10]">
              {/* Mock UI Header */}
              <div className="h-10 bg-slate-800 border-b border-slate-700 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-slate-600" />
                  <div className="w-3 h-3 rounded-full bg-slate-600" />
                  <div className="w-3 h-3 rounded-full bg-slate-600" />
                </div>
              </div>
              {/* Mock UI Body */}
              <div className="p-6 grid grid-cols-12 gap-4 h-full">
                {/* Sidebar */}
                <div className="col-span-3 space-y-3 border-r border-slate-800 pr-4">
                  <div className="h-8 w-full bg-slate-800 rounded mb-6" />
                  <div className="h-4 w-3/4 bg-slate-800/50 rounded" />
                  <div className="h-4 w-full bg-slate-800/50 rounded" />
                  <div className="h-4 w-5/6 bg-slate-800/50 rounded" />
                </div>
                {/* Main Content */}
                <div className="col-span-9 space-y-4">
                  <div className="flex justify-between">
                    <div className="h-8 w-1/3 bg-slate-800 rounded" />
                    <div className="h-8 w-20 bg-sleads-blue rounded" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-24 bg-slate-800/30 rounded border border-slate-800" />
                    <div className="h-24 bg-slate-800/30 rounded border border-slate-800" />
                    <div className="h-24 bg-slate-800/30 rounded border border-slate-800" />
                  </div>
                  <div className="h-40 bg-slate-800/30 rounded border border-slate-800 mt-4" />
                </div>
              </div>

              {/* Floating Badge */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute bottom-8 left-8 bg-sleads-blue text-white px-4 py-2 rounded-lg shadow-lg font-bold text-sm flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Project On Track
              </motion.div>
            </div>
          </motion.div>
        </div>
      </Section>
    </div>
  );
}




