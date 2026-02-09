"use client";

import React, { useEffect, useState } from "react";
import {
  motion,
  useSpring,
  useMotionValue,
  useTransform,
  Variants,
} from "framer-motion";
import { Home, ArrowLeft, Search, Compass, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "./contexts/AppContext";

// Generate random numbers helper function
const generateNumbers = () =>
  Array.from({ length: 20 }, (_, i) => ({
    id: i,
    value: Math.floor(Math.random() * 10),
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 4 + Math.random() * 2,
  }));

export default function NotFound() {
  const router = useRouter();
  const { t } = useApp();

  // Mouse position for parallax effects
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Generate random numbers once using useState lazy initializer
  const [numbers] = useState(() => generateNumbers());

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
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
    useTransform(mouseX, [-0.5, 0.5], [-30, 30]),
    springConfig
  );
  const moveY = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [-30, 30]),
    springConfig
  );
  const moveXReverse = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [50, -50]),
    springConfig
  );
  const moveYReverse = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [50, -50]),
    springConfig
  );

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.215, 0.61, 0.355, 1.0],
      },
    },
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-slate-50 dark:bg-sleads-midnight transition-colors duration-300">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Blobs */}
        <motion.div
          style={{ x: moveXReverse, y: moveYReverse }}
          className="will-change-transform absolute top-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(closest-side,rgba(59,130,246,0.2)_0%,transparent_70%)] dark:bg-[radial-gradient(closest-side,rgba(59,130,246,0.25)_0%,transparent_70%)] blur-3xl"
        />
        <motion.div
          style={{ x: moveX, y: moveY }}
          className="will-change-transform absolute bottom-[-15%] left-[-10%] w-[700px] h-[700px] rounded-full bg-[radial-gradient(closest-side,rgba(96,165,250,0.15)_0%,transparent_70%)] dark:bg-[radial-gradient(closest-side,rgba(31,111,235,0.2)_0%,transparent_70%)] blur-3xl"
        />
        <motion.div
          style={{ x: moveX, y: moveYReverse }}
          className="will-change-transform absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[radial-gradient(closest-side,rgba(59,130,246,0.1)_0%,transparent_70%)] dark:bg-[radial-gradient(closest-side,rgba(59,130,246,0.15)_0%,transparent_70%)] blur-3xl"
        />

        {/* Floating Number Particles */}
        {numbers.map((num) => (
          <motion.div
            key={num.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.3, 0.1, 0.3],
              scale: [0, 1, 0.8, 1],
              x: [0, moveX.get() * 2, 0],
              y: [0, moveY.get() * 2, 0],
            }}
            transition={{
              duration: num.duration,
              delay: num.delay,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
            style={{
              position: "absolute",
              left: `${num.x}%`,
              top: `${num.y}%`,
            }}
            className="text-6xl md:text-8xl font-black text-slate-200/20 dark:text-sleads-slate700/30 select-none pointer-events-none"
          >
            {num.value}
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-4xl mx-auto px-6 text-center"
      >
        {/* Large 404 with creative styling */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="relative inline-block">
            <motion.h1
              className="font-heading font-black text-8xl md:text-[12rem] lg:text-[16rem] leading-none tracking-tight"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: [0.215, 0.61, 0.355, 1.0] }}
            >
              <span className="text-slate-900 dark:text-white">4</span>
              <motion.span
                className="inline-block text-transparent bg-clip-text bg-linear-to-r from-sleads-blue via-blue-400 to-sleads-blue"
                animate={{
                  backgroundPosition: ["0%", "100%", "0%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{
                  backgroundSize: "200% auto",
                }}
              >
                0
              </motion.span>
              <span className="text-slate-900 dark:text-white">4</span>
            </motion.h1>

            {/* Floating decorative elements around 404 */}
            <motion.div
              style={{ x: moveX, y: moveY }}
              className="absolute -top-8 -right-8 md:-top-12 md:-right-12"
            >
              <Sparkles className="w-12 h-12 md:w-16 md:h-16 text-sleads-blue/50 dark:text-sleads-blue/70" />
            </motion.div>
            <motion.div
              style={{ x: moveXReverse, y: moveYReverse }}
              className="absolute -bottom-8 -left-8 md:-bottom-12 md:-left-12"
            >
              <Compass className="w-10 h-10 md:w-14 md:h-14 text-sleads-blue/50 dark:text-sleads-blue/70 rotate-45" />
            </motion.div>
          </div>
        </motion.div>

        {/* Main Message */}
        <motion.div variants={itemVariants} className="mb-6">
          <h2 className="text-3xl md:text-5xl font-bold font-heading text-slate-900 dark:text-white mb-4">
            {t("not_found.title")}
          </h2>
          <p className="text-lg md:text-xl text-slate-600 dark:text-sleads-slate300 max-w-2xl mx-auto leading-relaxed">
            {t("not_found.description")}
          </p>
        </motion.div>

        {/* Interactive Search Box */}
        <motion.div variants={itemVariants} className="mb-12 max-w-md mx-auto">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-linear-to-r from-sleads-blue/30 to-sleads-blue/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center gap-3 bg-white/80 dark:bg-sleads-slate900/80 backdrop-blur-xl border border-slate-200 dark:border-sleads-slate700 rounded-2xl px-6 py-4 shadow-xl">
              <Search className="w-5 h-5 text-slate-400 dark:text-sleads-slate500" />
              <input
                type="text"
                placeholder={t("not_found.search_placeholder")}
                className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-sleads-slate500"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    router.push("/");
                  }
                }}
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="group relative px-8 py-4 bg-sleads-blue text-white rounded-xl font-bold text-base tracking-wide transition-all duration-300 hover:shadow-xl hover:shadow-sleads-blue/30 flex items-center gap-2 overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-linear-to-r from-sleads-blue to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={false}
              />
              <Home className="w-5 h-5 relative z-10" />
              <span className="relative z-10">
                {t("not_found.return_home")}
              </span>
            </motion.button>
          </Link>

          <motion.button
            onClick={() => router.back()}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-transparent border-2 border-slate-200 dark:border-sleads-slate700 text-slate-900 dark:text-white rounded-xl font-bold text-base tracking-wide transition-all duration-300 hover:border-sleads-blue hover:text-sleads-blue dark:hover:text-sleads-blue dark:hover:border-sleads-blue flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            {t("not_found.go_back")}
          </motion.button>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          variants={itemVariants}
          className="mt-16 pt-8 border-t border-slate-200 dark:border-sleads-slate700"
        >
          <p className="text-sm text-slate-500 dark:text-sleads-slate500 mb-4">
            {t("not_found.explore_pages")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {[
              { href: "/", label: "Home" },
              { href: "/about", label: "About" },
              { href: "/work", label: "Work" },
              { href: "/blog", label: "Blog" },
              { href: "/contact-us", label: "Contact" },
            ].map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
              >
                <Link
                  href={link.href}
                  className="text-sm font-medium text-slate-600 dark:text-sleads-slate300 hover:text-sleads-blue dark:hover:text-sleads-blue transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-sleads-slate900"
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Bottom decorative element */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.8 }}
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2 text-slate-400 dark:text-sleads-slate500"
        >
          <Compass className="w-5 h-5" />
          <span className="text-xs font-mono uppercase tracking-widest">
            {t("not_found.navigation_lost")}
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}
