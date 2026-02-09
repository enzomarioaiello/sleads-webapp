"use client";
import React, { useEffect } from "react";
import {
  motion,
  useSpring,
  useMotionValue,
  useTransform,
  Variants,
} from "framer-motion";
import { ArrowUpRight, BarChart3, Code2, Layers } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { useRouter } from "next/navigation";

export const Hero: React.FC = () => {
  const { t } = useApp();
  const router = useRouter();
  // Mouse position state for parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Calculate mouse position relative to center of screen
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX - innerWidth / 2) / innerWidth;
      const y = (e.clientY - innerHeight / 2) / innerHeight;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  // Spring animations for smooth parallax
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
    useTransform(mouseX, [-0.5, 0.5], [40, -40]),
    springConfig
  );
  const moveYReverse = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [40, -40]),
    springConfig
  );

  const variants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.1 * i,
        duration: 0.8,
        ease: [0.215, 0.61, 0.355, 1.0] as [number, number, number, number], // Ease out cubic
      },
    }),
  };

  return (
    <div className="relative min-h-[90vh] md:min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-slate-50 dark:bg-sleads-midnight pt-20 transition-colors duration-300">
      {/* Background Decor Elements - Interactive */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top Right Gradient Blob */}
        <motion.div
          style={{ x: moveXReverse, y: moveYReverse }}
          className="will-change-transform absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(closest-side,rgba(31,111,235,0.15)_0%,transparent_100%)] dark:bg-[radial-gradient(closest-side,rgba(31,111,235,0.2)_0%,transparent_100%)]"
        />
        {/* Bottom Left Gradient Blob - Changed Aqua to Blue/15 */}
        <motion.div
          style={{ x: moveX, y: moveY }}
          className="will-change-transform absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(closest-side,rgba(96,165,250,0.15)_0%,transparent_100%)] dark:bg-[radial-gradient(closest-side,rgba(31,111,235,0.15)_0%,transparent_100%)]"
        />
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-6 w-full md:pl-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* LEFT COLUMN: TEXT */}
        <div className="flex flex-col items-start justify-center relative z-20">
          {/* Badge */}
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={variants}
            className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 md:mb-10 rounded-full bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate700 shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-sleads-blue animate-pulse" />
            <span className="text-[10px] md:text-xs font-bold font-heading tracking-widest text-slate-500 dark:text-sleads-slate300 uppercase">
              {t("hero.tag")}
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1 className="font-heading font-black text-6xl md:text-7xl xl:text-[6.5rem] leading-[0.95] tracking-tight text-slate-900 dark:text-white">
            <motion.span custom={1} variants={variants} className="block">
              {t("hero.headline_1")}
            </motion.span>
            <motion.span
              custom={2}
              variants={variants}
              // Gradient updated to blue tones
              className="block text-transparent bg-clip-text bg-linear-to-r from-sleads-blue via-[#3B82F6] to-blue-400 pb-2 pr-4 animate-gradient bg-size-[200%_auto]"
            >
              {t("hero.headline_2")},
            </motion.span>
            <motion.span custom={3} variants={variants} className="block">
              {t("hero.headline_3")}
            </motion.span>
          </motion.h1>

          {/* Description & Buttons */}
          <div className="mt-10 flex flex-col items-start gap-10 max-w-xl">
            <motion.div
              custom={5}
              variants={variants}
              initial="hidden"
              animate="visible"
              className="pl-6 border-l-2 border-slate-300 dark:border-sleads-slate700/60"
            >
              <p className="text-lg md:text-xl text-slate-600 dark:text-sleads-slate300 font-sans leading-relaxed">
                {t("hero.sub")}
              </p>
            </motion.div>

            {/* CTAs */}
            <motion.div
              custom={6}
              variants={variants}
              initial="hidden"
              animate="visible"
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto"
            >
              <button
                onClick={() => router.push("/contact")}
                className="w-full sm:w-auto px-8 py-4 bg-sleads-blue text-white rounded-lg font-bold text-sm tracking-wide transition-transform hover:-translate-y-1 hover:shadow-xl hover:shadow-sleads-blue/20 active:translate-y-0 flex items-center justify-center gap-2"
              >
                {t("hero.cta_primary")}
                <ArrowUpRight className="w-4 h-4 opacity-70" />
              </button>

              <button className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-slate-200 dark:border-sleads-slate700 text-slate-900 dark:text-white rounded-lg font-bold text-sm tracking-wide transition-colors hover:border-sleads-blue hover:text-sleads-blue dark:hover:text-sleads-blue dark:hover:border-sleads-blue">
                {t("hero.cta_secondary")}
              </button>
            </motion.div>
          </div>
        </div>

        {/* RIGHT COLUMN: 3D COMPOSITION (Desktop Only) */}
        <div className="hidden lg:block relative h-[600px] w-full perspective-[2000px]">
          <motion.div
            style={{ rotateX: moveYReverse, rotateY: moveXReverse }}
            className="relative w-full h-full preserve-3d"
          >
            {/* Center Main Card - Dashboard Interface */}
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[320px] bg-white dark:bg-sleads-slate900/80 backdrop-blur-xl border border-slate-200 dark:border-sleads-slate700/50 rounded-2xl shadow-2xl z-20 overflow-hidden"
            >
              {/* Mock UI Header */}
              <div className="h-10 border-b border-slate-100 dark:border-sleads-slate700 flex items-center px-4 justify-between bg-slate-50/50 dark:bg-sleads-midnight/50">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-sleads-slate700"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-sleads-slate700"></div>
                </div>
                <div className="h-1.5 w-20 rounded-full bg-slate-200 dark:bg-sleads-slate700"></div>
              </div>
              {/* Mock UI Content */}
              <div className="p-6 grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-3">
                  <div className="h-20 rounded-lg bg-linear-to-br from-sleads-blue/10 to-transparent border border-sleads-blue/10 flex items-center justify-center">
                    <BarChart3 className="text-sleads-blue w-8 h-8 opacity-50" />
                  </div>
                  <div className="h-4 w-3/4 rounded bg-slate-100 dark:bg-sleads-slate700/50"></div>
                  <div className="h-4 w-1/2 rounded bg-slate-100 dark:bg-sleads-slate700/50"></div>
                </div>
                <div className="col-span-1 space-y-3">
                  <div className="h-8 w-full rounded bg-slate-100 dark:bg-sleads-slate700/50"></div>
                  <div className="h-8 w-full rounded bg-slate-100 dark:bg-sleads-slate700/50"></div>
                  <div className="h-8 w-full rounded bg-slate-100 dark:bg-sleads-slate700/50"></div>
                </div>
              </div>
            </motion.div>

            {/* Floating Card 2 - Code Block (Top Right) */}
            <motion.div
              style={{ x: moveX, y: moveY }}
              className="absolute top-[20%] right-[5%] z-30 will-change-transform"
            >
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="w-[260px] p-4 bg-slate-900 dark:bg-black/60 border border-slate-700/50 dark:border-white/10 rounded-xl shadow-xl"
              >
                <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                  <Code2 className="w-4 h-4 text-sleads-blue" />
                  <span className="text-xs font-mono text-sleads-blue">
                    build_magic.ts
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="h-1.5 w-full bg-white/10 rounded-full"></div>
                  <div className="h-1.5 w-2/3 bg-sleads-blue/40 rounded-full"></div>
                  <div className="h-1.5 w-3/4 bg-white/10 rounded-full"></div>
                  <div className="h-1.5 w-1/2 bg-white/10 rounded-full"></div>
                </div>
              </motion.div>
            </motion.div>

            {/* Floating Card 3 - Stats/Abstract (Bottom Left) */}
            <motion.div
              style={{ x: moveXReverse, y: moveYReverse }}
              className="absolute bottom-[25%] left-[5%] z-30 will-change-transform"
            >
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="w-[220px] p-5 bg-white dark:bg-sleads-slate900/90 border border-slate-200 dark:border-sleads-slate700 rounded-xl shadow-xl flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <Layers className="w-5 h-5 text-sleads-blue" />
                  {/* Changed Green to Blue */}
                  <span className="text-xs font-bold bg-blue-100 dark:bg-sleads-blue/20 text-sleads-blue dark:text-blue-300 px-2 py-0.5 rounded-full">
                    +12%
                  </span>
                </div>
                <div>
                  <div className="text-2xl font-bold font-heading text-slate-900 dark:text-white">
                    ON 🚀
                  </div>
                  <div className="text-xs text-slate-500 dark:text-sleads-slate500">
                    Performance Mode
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Decorative Blobs moving in background of composition - Updated Gradient to Blue */}
            <motion.div
              style={{ x: moveX, y: moveY }}
              className="will-change-transform absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[radial-gradient(closest-side,rgba(31,111,235,0.2)_0%,transparent_100%)] rounded-full -z-10"
            />
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 md:left-auto md:right-10 flex items-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
      >
        <span className="text-xs font-mono text-slate-400 dark:text-sleads-slate500 uppercase tracking-widest writing-mode-vertical rotate-180 hidden md:block">
          Scroll to explore
        </span>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-px h-12 bg-slate-300 hidden md:block dark:bg-sleads-slate700"
        />
      </motion.div>
    </div>
  );
};
