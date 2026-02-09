"use client";

import React, { useRef, useEffect } from "react";
import { useApp } from "../contexts/AppContext";
import { motion, useTransform, useSpring, useMotionValue } from "framer-motion";
import { Section } from "../components/ui/Section";
import { Code2, Heart, Lightbulb, Users, Zap } from "lucide-react";
import Image from "next/image";

export default function AboutPageClient() {
  const { t } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);

  // Parallax Mouse Effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    // Only enable parallax on non-touch devices
    if (window.matchMedia("(hover: none)").matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Use requestAnimationFrame for smoother updates if needed,
      // but useMotionValue is already optimized.
      // Adding a simple guard for performance.
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

  const stats = [
    { label: t("about_page.stats.projects"), value: "50+", icon: Code2 },
    { label: t("about_page.stats.clients"), value: "30+", icon: Users },
    { label: t("about_page.stats.years"), value: "4+", icon: Zap },
    { label: t("about_page.stats.coffee"), value: "∞", icon: Heart },
  ];

  const teamMembers = [
    {
      name: "Sem de Jong",
      role: "Founder Sleads Netherlands / International",
      image: "/images/people/sem.png",
      country: "🇳🇱",
      css: "text-7xl mb-1 ml-5 leading-none",
    },
    {
      name: "Johan Tunc",
      role: "Founder Sleads Germany",
      image: "/images/people/sem.png",
      country: "🇩🇪",
      css: "text-7xl mb-1  ml-5 leading-none",
    },

    {
      name: "Jayden Oonk",
      role: "Consultant Sleads Spain",
      image: "/images/people/sem.png",
      country: "🇪🇸",
      css: "text-7xl mb-1  ml-5 leading-none",
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
                Est. 2020
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter mb-6 font-display leading-[0.9]">
              <span className="block text-slate-900 dark:text-sleads-white">
                {t("about_page.hero.title_1")}
              </span>
              <span className="block text-transparent bg-clip-text bg-linear-to-r from-sleads-blue via-blue-400 to-sleads-blue animate-gradient bg-size-[200%_auto]">
                {t("about_page.hero.title_2")}
              </span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            {t("about_page.hero.subtitle")}
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

      {/* Stats Section with Cards */}
      <Section className="py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="relative p-6 rounded-2xl bg-white dark:bg-sleads-slate900 border border-slate-100 dark:border-slate-800 overflow-hidden group hover:border-sleads-blue/30 transition-colors"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <stat.icon className="w-12 h-12 text-sleads-blue" />
              </div>
              <h3 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-sleads-white mb-2 font-display">
                {stat.value}
              </h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* About Us - Stunning Text Section */}
      <Section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-sleads-blue/5 skew-y-3 transform origin-top-left scale-110 pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl md:text-7xl font-bold font-display tracking-tight text-slate-900 dark:text-sleads-white leading-tight">
              {t("about_page.about_us.title_1")}
              <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-sleads-blue to-blue-400">
                {t("about_page.about_us.title_2")}
              </span>
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="prose prose-lg dark:prose-invert mx-auto"
          >
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 leading-relaxed font-light">
              {t("about_page.about_us.desc")}
            </p>
          </motion.div>
        </div>
      </Section>

      {/* Mission & Vision - Split Layout */}
      <Section className="overflow-visible">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8 relative z-10"
          >
            <div className="inline-block px-3 py-1 rounded bg-sleads-blue/10 text-sleads-blue text-sm font-bold tracking-wide uppercase">
              {t("about_page.mission.title")}
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-sleads-white leading-[1.1] font-display">
              Building the future, <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-slate-400 to-slate-200 dark:from-slate-600 dark:to-slate-400">
                one pixel at a time.
              </span>
            </h2>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg">
              {t("about_page.mission.desc")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, rotate: 5, scale: 0.9 }}
            whileInView={{ opacity: 1, rotate: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, type: "spring", bounce: 0.4 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-linear-to-br from-sleads-blue to-blue-600 rounded-4xl blur-3xl opacity-20 dark:opacity-30 -rotate-6 scale-105" />
            <div className="relative bg-white dark:bg-sleads-slate900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 p-10 md:p-14 rounded-4xl shadow-2xl overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-br from-sleads-blue/20 to-transparent rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700" />

              <Lightbulb className="w-16 h-16 text-sleads-blue mb-8 relative z-10" />
              <h3 className="text-3xl font-bold text-slate-900 dark:text-sleads-white mb-6 relative z-10">
                {t("about_page.vision.title")}
              </h3>
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed relative z-10">
                {t("about_page.vision.desc")}
              </p>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* Team Section Placeholder */}
      <Section className="bg-slate-50 dark:bg-sleads-midnight">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-sleads-white mb-6 font-display"
          >
            {t("about_page.team.title")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-slate-600 dark:text-slate-400 text-lg"
          >
            {t("about_page.team.desc")}
          </motion.p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {teamMembers.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="group text-center"
            >
              <div className="relative w-full aspect-square mb-4">
                {/* Floating card container with gradient background */}
                <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl group-hover:shadow-sleads-blue/20 transition-all duration-500">
                  {/* Animated gradient background */}
                  <div className="absolute inset-0 bg-linear-to-br from-sleads-blue/20 via-blue-400/15 to-blue-600/20 dark:from-sleads-blue/30 dark:via-blue-400/25 dark:to-blue-600/30 group-hover:from-sleads-blue/30 group-hover:via-blue-400/25 group-hover:to-blue-600/30 dark:group-hover:from-sleads-blue/40 dark:group-hover:via-blue-400/35 dark:group-hover:to-blue-600/40 transition-all duration-500" />

                  {/* Decorative pattern overlay */}
                  <div className="absolute inset-0 opacity-10 dark:opacity-5">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.3),transparent_50%)]" />
                    <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(37,99,235,0.3),transparent_50%)]" />
                  </div>

                  {/* Sleads logo on left side behind person */}
                  <div className="absolute  left-4 top-2/5 -translate-y-1/2 z-0 opacity-20 dark:opacity-15 group-hover:opacity-30 dark:group-hover:opacity-25 transition-opacity duration-500">
                    <Image
                      src="/images/logo.png"
                      alt="Sleads"
                      width={120}
                      height={120}
                      style={{ transform: "rotate(-15deg)" }}
                      className="w-24 h-24  md:w-32 md:h-32 object-contain"
                    />
                  </div>

                  {/* Image container anchored to bottom */}
                  <div className="absolute inset-0 flex items-end justify-center px-4 z-10">
                    <motion.div
                      className="relative w-full h-full flex items-end justify-center"
                      whileHover={{ scale: 1.05 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 20,
                      }}
                    >
                      <Image
                        src={member.image}
                        alt={member.name}
                        height={600}
                        width={600}
                        className="object-contain object-bottom w-full h-full drop-shadow-2xl"
                        style={{
                          filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.15))",
                        }}
                      />
                    </motion.div>
                  </div>

                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-sleads-blue/0 group-hover:bg-sleads-blue/5 transition-colors duration-500 rounded-3xl" />

                  {/* Shine effect on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </div>
                </div>

                {/* Country flag icon - top right */}
                <div className="absolute top-3 overflow-hidden right-3 z-20 w-8 h-8 rounded-full bg-white dark:bg-sleads-slate900  border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className={member.css}>{member.country}</span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-sleads-white mb-1">
                {member.name}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {member.role}
              </p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Values Grid with Tilt Effect */}
      <Section className="relative">
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-sleads-white mb-6 font-display"
          >
            Our Values
          </motion.h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -10 }}
              className="p-8 rounded-2xl bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-slate-800 hover:border-sleads-blue/50 dark:hover:border-sleads-blue/50 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-sleads-blue/5 group"
            >
              <div className="w-14 h-14 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6 group-hover:bg-sleads-blue group-hover:text-white transition-colors duration-300">
                <span className="font-bold font-mono text-xl">0{i}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-sleads-white mb-3">
                {t(`values.v${i}_title`)}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                {t(`values.v${i}_desc`)}
              </p>
            </motion.div>
          ))}
        </div>
      </Section>
    </div>
  );
}
