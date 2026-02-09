"use client";

import React, { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Database,
  Table,
  Filter,
  Edit3,
  FileText,
  Play,
  ArrowRight,
  Zap,
  Layout,
} from "lucide-react";
import { useApp } from "../../contexts/AppContext";
import { Section } from "../../components/ui/Section";
import { smartObjectsTranslations } from "./smart-objects-translations";
import { VideoModal } from "../cms/VideoModal";
import Image from "next/image";
import Link from "next/link";

export default function SmartObjectsClient() {
  const { language, theme } = useApp();
  const t =
    smartObjectsTranslations[language as "en" | "nl"] ||
    smartObjectsTranslations.en;

  // Helper function to get Smart Objects image path
  const getSmartObjectsImage = (feature: "overview" | "data" | "schema") => {
    const lang = language === "nl" ? "nl" : "en";
    const themeMode = theme === "dark" ? "dark" : "light";
    // If schema image doesn't exist, fallback to data image
    if (feature === "schema") {
      // Check if schema exists, otherwise use data
      return `/images/smart-objects/so-${feature}-${lang}-${themeMode}.png`;
    }
    return `/images/smart-objects/so-${feature}-${lang}-${themeMode}.png`;
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedVideo, setSelectedVideo] = useState<{
    url: string;
    title: string;
    description: string;
    type: "youtube" | "vimeo" | "self-hosted";
    startTime?: number;
    endTime?: number;
  } | null>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  return (
    <div
      ref={containerRef}
      className="bg-white dark:bg-sleads-midnight transition-colors duration-300 min-h-screen"
    >
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32 pb-20">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-sleads-blue/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-sleads-blue/15 rounded-full blur-3xl"
          />
        </div>

        <motion.div
          style={{ opacity, scale }}
          className="relative z-10 max-w-7xl mx-auto px-6 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sleads-blue/10 dark:bg-sleads-blue/20 text-sleads-blue text-sm font-semibold mb-6"
            >
              <Table className="w-4 h-4" />
              Dynamic Data Structures
            </motion.span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-5xl md:text-7xl font-bold mb-6 text-slate-900 dark:text-white"
          >
            {t.hero.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-xl md:text-2xl text-slate-600 dark:text-sleads-slate300 mb-4 max-w-3xl mx-auto"
          >
            {t.hero.subtitle}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-lg text-slate-500 dark:text-sleads-slate400 mb-12 max-w-2xl mx-auto"
          >
            {t.hero.description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              href="/contact-us"
              className="px-8 py-4 bg-sleads-blue text-white rounded-lg font-bold text-lg hover:bg-sleads-blue/90 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-sleads-blue/20"
            >
              {t.hero.cta_primary}
            </Link>
            <button
              onClick={() => {
                const videosSection = document.getElementById("videos-section");
                if (videosSection) {
                  videosSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }
              }}
              className="px-8 py-4 bg-white dark:bg-sleads-slate900 border-2 border-slate-200 dark:border-sleads-slate700 text-slate-900 dark:text-white rounded-lg font-bold text-lg hover:border-sleads-blue transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              {t.hero.cta_secondary}
            </button>
          </motion.div>

          {/* Hero Image/Demo */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="mt-20 relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-sleads-slate700 bg-white dark:bg-sleads-slate900 p-8 max-w-5xl mx-auto">
              <div className="relative aspect-video rounded-lg overflow-hidden">
                <Image
                  src={getSmartObjectsImage("overview")}
                  alt="Smart Objects Overview"
                  fill
                  className="object-contain rounded-lg"
                  priority
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <Section className="bg-slate-50 dark:bg-sleads-midnight">
        <div className="space-y-32">
          {/* Overview Feature */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sleads-blue/10 dark:bg-sleads-blue/20 text-sleads-blue text-sm font-semibold mb-6">
                <Layout className="w-4 h-4" />
                {t.features.overview_title}
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white">
                {t.features.overview_title}
              </h2>
              <p className="text-xl text-slate-600 dark:text-sleads-slate300 mb-8">
                {t.features.overview_description}
              </p>
              <div className="space-y-4">
                {[
                  {
                    icon: Table,
                    title: t.features.overview_feature1,
                    desc: t.features.overview_feature1_desc,
                  },
                  {
                    icon: Zap,
                    title: t.features.overview_feature2,
                    desc: t.features.overview_feature2_desc,
                  },
                  {
                    icon: Layout,
                    title: t.features.overview_feature3,
                    desc: t.features.overview_feature3_desc,
                  },
                ].map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1, duration: 0.4 }}
                    className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate700 hover:border-sleads-blue transition-colors"
                  >
                    <div className="p-3 rounded-lg bg-sleads-blue/10 dark:bg-sleads-blue/20">
                      <feature.icon className="w-6 h-6 text-sleads-blue" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-sleads-slate400">
                        {feature.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-sleads-slate700 bg-white dark:bg-sleads-slate900 p-6">
                <div className="relative aspect-video rounded-lg overflow-hidden">
                  <Image
                    src={getSmartObjectsImage("overview")}
                    alt="Database Overview"
                    fill
                    className="object-contain rounded-lg"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Data Management Feature */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative order-2 md:order-1"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-sleads-slate700 bg-white dark:bg-sleads-slate900 p-6">
                <div className="relative aspect-video rounded-lg overflow-hidden">
                  <Image
                    src={getSmartObjectsImage("data")}
                    alt="Data Management"
                    fill
                    className="object-contain rounded-lg"
                  />
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="order-1 md:order-2"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sleads-blue/10 dark:bg-sleads-blue/20 text-sleads-blue text-sm font-semibold mb-6">
                <Database className="w-4 h-4" />
                {t.features.data_title}
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white">
                {t.features.data_title}
              </h2>
              <p className="text-xl text-slate-600 dark:text-sleads-slate300 mb-8">
                {t.features.data_description}
              </p>
              <div className="space-y-4">
                {[
                  {
                    icon: FileText,
                    title: t.features.data_feature1,
                    desc: t.features.data_feature1_desc,
                  },
                  {
                    icon: Filter,
                    title: t.features.data_feature2,
                    desc: t.features.data_feature2_desc,
                  },
                  {
                    icon: Edit3,
                    title: t.features.data_feature3,
                    desc: t.features.data_feature3_desc,
                  },
                ].map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1, duration: 0.4 }}
                    className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate700 hover:border-sleads-blue transition-colors"
                  >
                    <div className="p-3 rounded-lg bg-sleads-blue/10 dark:bg-sleads-blue/20">
                      <feature.icon className="w-6 h-6 text-sleads-blue" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-sleads-slate400">
                        {feature.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Schema Feature */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sleads-blue/10 dark:bg-sleads-blue/20 text-sleads-blue text-sm font-semibold mb-6">
                <Database className="w-4 h-4" />
                {t.features.schema_title}
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white">
                {t.features.schema_title}
              </h2>
              <p className="text-xl text-slate-600 dark:text-sleads-slate300 mb-8">
                {t.features.schema_description}
              </p>
              <div className="space-y-4">
                {[
                  {
                    icon: Layout,
                    title: t.features.schema_feature1,
                    desc: t.features.schema_feature1_desc,
                  },
                  {
                    icon: FileText,
                    title: t.features.schema_feature2,
                    desc: t.features.schema_feature2_desc,
                  },
                  {
                    icon: Database,
                    title: t.features.schema_feature3,
                    desc: t.features.schema_feature3_desc,
                  },
                ].map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1, duration: 0.4 }}
                    className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate700 hover:border-sleads-blue transition-colors"
                  >
                    <div className="p-3 rounded-lg bg-sleads-blue/10 dark:bg-sleads-blue/20">
                      <feature.icon className="w-6 h-6 text-sleads-blue" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-sleads-slate400">
                        {feature.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-sleads-slate700 bg-white dark:bg-sleads-slate900 p-6">
                <div className="relative aspect-video rounded-lg overflow-hidden">
                  <Image
                    src={getSmartObjectsImage("schema")}
                    alt="Schema View"
                    fill
                    className="object-contain rounded-lg"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </Section>

      {/* How It Works Section */}
      <Section className="bg-white dark:bg-sleads-slate900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
            {t.how_it_works.title}
          </h2>
          <p className="text-xl text-slate-600 dark:text-sleads-slate300 max-w-2xl mx-auto">
            Get started in minutes. No plugins or integrations required.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              step: "01",
              icon: Table,
              title: t.how_it_works.step1_title,
              description: t.how_it_works.step1_description,
            },
            {
              step: "02",
              icon: Database,
              title: t.how_it_works.step2_title,
              description: t.how_it_works.step2_description,
            },
            {
              step: "03",
              icon: Filter,
              title: t.how_it_works.step3_title,
              description: t.how_it_works.step3_description,
            },
            {
              step: "04",
              icon: Edit3,
              title: t.how_it_works.step4_title,
              description: t.how_it_works.step4_description,
            },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="relative p-8 rounded-2xl bg-slate-50 dark:bg-sleads-midnight border border-slate-200 dark:border-sleads-slate700 hover:border-sleads-blue transition-colors group"
            >
              <div className="absolute top-4 right-4 text-6xl font-bold text-sleads-blue/10 dark:text-sleads-blue/20">
                {item.step}
              </div>
              <div className="p-4 rounded-xl bg-sleads-blue/10 dark:bg-sleads-blue/20 w-fit mb-6 group-hover:bg-sleads-blue/20 dark:group-hover:bg-sleads-blue/30 transition-colors">
                <item.icon className="w-8 h-8 text-sleads-blue" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                {item.title}
              </h3>
              <p className="text-slate-600 dark:text-sleads-slate400">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Videos Section */}
      <Section
        id="videos-section"
        className="bg-slate-50 dark:bg-sleads-midnight"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
            {t.videos.title}
          </h2>
          <p className="text-xl text-slate-600 dark:text-sleads-slate300 max-w-2xl mx-auto">
            {t.videos.subtitle}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: t.videos.video1_title,
              description: t.videos.video1_description,
              url: t.videos.video1_url,
              type: t.videos.video1_type,
              startTime: t.videos.video1_startTime,
              endTime: t.videos.video1_endTime,
              image: "overview",
            },
            {
              title: t.videos.video2_title,
              description: t.videos.video2_description,
              url: t.videos.video2_url,
              type: t.videos.video2_type,
              startTime: t.videos.video2_startTime,
              endTime: t.videos.video2_endTime,
              image: "data",
            },
            {
              title: t.videos.video3_title,
              description: t.videos.video3_description,
              url: t.videos.video3_url,
              type: t.videos.video3_type,
              startTime: t.videos.video3_startTime,
              endTime: t.videos.video3_endTime,
              image: "schema",
            },
          ].map((video, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="group relative rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-sleads-slate700 bg-white dark:bg-sleads-slate900 hover:border-sleads-blue transition-all hover:scale-[1.02] cursor-pointer"
              onClick={() => {
                if (video.url) {
                  setSelectedVideo({
                    url: video.url,
                    title: video.title,
                    description: video.description,
                    type: video.type,
                    startTime: video.startTime,
                    endTime: video.endTime,
                  });
                }
              }}
            >
              <div className="aspect-video relative overflow-hidden">
                {video.url ? (
                  <>
                    {/* Thumbnail Image */}
                    <div className="absolute inset-0">
                      <Image
                        src={getSmartObjectsImage(
                          video.image as "overview" | "data" | "schema"
                        )}
                        alt={video.title}
                        fill
                        className="object-cover rounded-lg"
                        onError={(e) => {
                          // Fallback to overview if image doesn't exist
                          const target = e.target as HTMLImageElement;
                          if (target.src !== getSmartObjectsImage("overview")) {
                            target.src = getSmartObjectsImage("overview");
                          }
                        }}
                      />
                    </div>
                    {/* Gray Overlay */}
                    <div className="absolute inset-0 bg-slate-900/60 dark:bg-slate-900/70 group-hover:bg-slate-900/50 dark:group-hover:bg-slate-900/60 transition-colors" />
                    {/* Play Button */}
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="absolute z-10 inset-0 flex items-center justify-center"
                    >
                      <div className="w-16 h-16 rounded-full bg-sleads-blue text-white flex items-center justify-center shadow-lg group-hover:bg-sleads-blue/90 transition-colors">
                        <Play className="w-8 h-8 ml-1" />
                      </div>
                    </motion.div>
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-sleads-slate800 dark:to-sleads-slate900 flex items-center justify-center">
                    <div className="text-center">
                      <Play className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">
                        Video coming soon
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {video.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-sleads-slate400">
                  {video.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Video Modal */}
        {selectedVideo && (
          <VideoModal
            isOpen={!!selectedVideo}
            onClose={() => setSelectedVideo(null)}
            videoUrl={selectedVideo.url}
            title={selectedVideo.title}
            description={selectedVideo.description}
            type={selectedVideo.type}
            startTime={selectedVideo.startTime}
            endTime={selectedVideo.endTime}
          />
        )}
      </Section>

      {/* CTA Section */}
      <Section className="bg-gradient-to-br from-sleads-blue to-sleads-blue/80 text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">{t.cta.title}</h2>
          <p className="text-xl mb-8 text-white/90">{t.cta.description}</p>
          <Link
            href="/contact-us"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-sleads-blue rounded-lg font-bold text-lg hover:bg-slate-100 transition-all hover:scale-105 active:scale-95 shadow-lg"
          >
            {t.cta.button}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </Section>
    </div>
  );
}
