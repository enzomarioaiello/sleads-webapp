"use client";

import React, { useRef, useState, useMemo, useEffect } from "react";
import { useApp } from "../contexts/AppContext";
import {
  motion,
  useTransform,
  useSpring,
  useMotionValue,
  AnimatePresence,
} from "framer-motion";
import { Section } from "../components/ui/Section";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowUpRight,
  Clock,
  Calendar,
  Tag,
  Search,
  Filter,
  BookOpen,
  X,
  Sparkles,
} from "lucide-react";

export default function BlogPageClient() {
  const { t, language } = useApp();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Parallax Mouse Effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
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

  // Fetch all blog posts to get categories
  const allPostsResult = useQuery(api.blog.getBlogPosts, {
    paginationOpts: { numItems: 100, cursor: null as string | null },
  });

  // Fetch filtered blog posts
  const blogPostsResult = useQuery(api.blog.getBlogPosts, {
    category: selectedCategory || undefined,
    paginationOpts: { numItems: 100, cursor: null as string | null },
  });

  const allPosts = allPostsResult?.page || [];
  const blogPosts = blogPostsResult?.page || [];

  // Get unique categories with translations
  const categories = useMemo(() => {
    const categoryMap = new Map<string, { en: string; nl?: string }>();

    allPosts.forEach((post) => {
      if (post.category && !categoryMap.has(post.category)) {
        categoryMap.set(post.category, {
          en: post.category,
          nl: post.categoryNL || post.category,
        });
      }
    });

    return Array.from(categoryMap.entries())
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => a.en.localeCompare(b.en));
  }, [allPosts]);

  // Filter posts by search query
  const filteredPosts = useMemo(() => {
    if (!searchQuery.trim()) return blogPosts;

    const query = searchQuery.toLowerCase();
    return blogPosts.filter((post) => {
      const title = language === "nl" ? post.titleNL : post.title;
      const excerpt = language === "nl" ? post.excerptNL : post.excerpt;
      const category =
        language === "nl" && post.categoryNL ? post.categoryNL : post.category;

      return (
        title.toLowerCase().includes(query) ||
        excerpt.toLowerCase().includes(query) ||
        category.toLowerCase().includes(query) ||
        post.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    });
  }, [blogPosts, searchQuery, language]);

  const variants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.05,
        duration: 0.5,
        ease: [0.215, 0.61, 0.355, 1.0] as [number, number, number, number],
      },
    }),
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.3 },
    },
  };

  const hasActiveFilters =
    selectedCategory !== null || searchQuery.trim() !== "";

  return (
    <div
      ref={containerRef}
      className="bg-slate-50 dark:bg-sleads-midnight transition-colors duration-300 min-h-screen"
    >
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4 md:px-6">
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

        <div className=" z-10 max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 dark:bg-sleads-slate900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
              <Sparkles className="w-4 h-4 text-sleads-blue" />
              <span className="text-xs font-bold font-heading tracking-widest text-slate-500 dark:text-sleads-slate300 uppercase">
                {t("blog_page.hero.badge")}
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-20 mb-4"
          >
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter mb-6 font-display leading-[0.9] wrap-break-word">
              <span className="block text-slate-900 dark:text-sleads-white">
                {t("blog_page.hero.title_1")}
              </span>
              <span className="block text-transparent bg-clip-text bg-linear-to-r from-sleads-blue via-blue-400 to-sleads-blue animate-gradient bg-size-[200%_auto]">
                {t("blog_page.hero.title_2")}
              </span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed px-4"
          >
            {t("blog_page.hero.subtitle")}
          </motion.p>
        </div>
      </section>

      {/* Search and Filter Section */}
      <Section className="py-8 !pt-0">
        <div className="space-y-8 mb-12">
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder={t("blog_page.search.placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-12 py-4 rounded-2xl bg-white dark:bg-sleads-slate900 border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-sleads-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sleads-blue focus:border-sleads-blue transition-all text-lg shadow-sm hover:shadow-md"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filters */}
          {categories.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  {t("blog_page.filters.label")}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <motion.button
                  onClick={() => setSelectedCategory(null)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 ${
                    selectedCategory === null
                      ? "bg-sleads-blue text-white shadow-lg shadow-sleads-blue/30 scale-105"
                      : "bg-white dark:bg-sleads-slate900 text-slate-600 dark:text-slate-400 border-2 border-slate-200 dark:border-slate-800 hover:border-sleads-blue/50 hover:text-sleads-blue dark:hover:text-sleads-blue"
                  }`}
                >
                  {t("blog_page.filters.all_posts")}
                </motion.button>

                {categories.map((cat) => {
                  const categoryName = language === "nl" ? cat.nl : cat.en;
                  const isSelected = selectedCategory === cat.key;

                  return (
                    <motion.button
                      key={cat.key}
                      onClick={() =>
                        setSelectedCategory(isSelected ? null : cat.key)
                      }
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 relative overflow-hidden ${
                        isSelected
                          ? "bg-sleads-blue text-white shadow-lg shadow-sleads-blue/30 scale-105"
                          : "bg-white dark:bg-sleads-slate900 text-slate-600 dark:text-slate-400 border-2 border-slate-200 dark:border-slate-800 hover:border-sleads-blue/50 hover:text-sleads-blue dark:hover:text-sleads-blue"
                      }`}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="activeCategory"
                          className="absolute inset-0 bg-sleads-blue rounded-full"
                          transition={{
                            type: "spring",
                            bounce: 0.2,
                            duration: 0.6,
                          }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        <Tag
                          className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-sleads-blue"}`}
                        />
                        {categoryName}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Active Filters Indicator */}
              {hasActiveFilters && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-center gap-2 pt-2"
                >
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {filteredPosts.length}{" "}
                    {filteredPosts.length === 1
                      ? t("blog_page.filters.article_found")
                      : t("blog_page.filters.articles_found")}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedCategory(null);
                      setSearchQuery("");
                    }}
                    className="text-xs text-sleads-blue hover:text-blue-600 font-semibold underline"
                  >
                    {t("blog_page.filters.clear_filters")}
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Blog Posts Grid */}
        {blogPostsResult === undefined ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-sleads-blue/20 border-t-sleads-blue rounded-full mx-auto mb-6"
              />
              <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
                {t("blog_page.loading")}
              </p>
            </div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-32"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="mb-6"
            >
              <BookOpen className="w-20 h-20 text-slate-300 dark:text-slate-700 mx-auto" />
            </motion.div>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-sleads-white mb-3">
              {t("blog_page.empty.title")}
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-lg mb-6">
              {searchQuery || selectedCategory
                ? t("blog_page.empty.no_results")
                : t("blog_page.empty.no_content")}
            </p>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSearchQuery("");
                }}
                className="px-6 py-3 bg-sleads-blue text-white rounded-full font-semibold hover:bg-blue-600 transition-colors"
              >
                {t("blog_page.empty.clear_all")}
              </button>
            )}
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredPosts.map((post, index) => {
                const title = language === "nl" ? post.titleNL : post.title;
                const excerpt =
                  language === "nl" ? post.excerptNL : post.excerpt;
                const category =
                  language === "nl" && post.categoryNL
                    ? post.categoryNL
                    : post.category;

                return (
                  <motion.article
                    key={post._id}
                    layout
                    custom={index}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={variants}
                    whileHover={{ y: -12, scale: 1.02 }}
                    className="group relative cursor-pointer"
                    onClick={() => router.push(`/blog/${post.slug}`)}
                  >
                    <div className="relative h-full rounded-3xl bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-sleads-blue/20 transition-all duration-500">
                      {/* Image */}
                      {post.image && (
                        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
                          <Image
                            src={post.image}
                            alt={title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                          {/* Category Badge on Image */}
                          <div className="absolute top-4 left-4 z-10">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-sleads-slate900/90 backdrop-blur-sm text-sleads-blue text-xs font-bold shadow-lg">
                              <Tag className="w-3 h-3" />
                              {category}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-6 space-y-4">
                        {/* Category Badge (if no image) */}
                        {!post.image && (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sleads-blue/10 text-sleads-blue text-xs font-bold">
                              <Tag className="w-3 h-3" />
                              {category}
                            </span>
                          </div>
                        )}

                        {/* Title */}
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-sleads-white leading-tight group-hover:text-sleads-blue transition-colors duration-300 line-clamp-2">
                          {title}
                        </h2>

                        {/* Excerpt */}
                        <p className="text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed text-sm">
                          {excerpt}
                        </p>

                        {/* Meta Info */}
                        <div className="flex items-center gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{post.date}</span>
                          </div>
                          {post.readTime && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{post.readTime}</span>
                            </div>
                          )}
                        </div>

                        {/* Author */}
                        {post.author && (
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <span className="font-medium">
                              {t("blog_page.card.by")} {post.author}
                            </span>
                          </div>
                        )}

                        {/* Read More */}
                        <div className="flex items-center gap-2 text-sleads-blue font-bold text-sm pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <span>{t("blog_page.card.read_article")}</span>
                          <ArrowUpRight className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Hover Glow Effect */}
                      <div className="absolute inset-0 bg-sleads-blue/0 group-hover:bg-sleads-blue/5 transition-colors duration-500 rounded-3xl pointer-events-none" />

                      {/* Shine Effect */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-3xl" />
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </Section>

      {/* CTA Section */}
      {filteredPosts.length > 0 && (
        <Section className="py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-[2.5rem] overflow-hidden bg-slate-900 dark:bg-sleads-slate900 text-white px-8 py-20 text-center shadow-2xl"
          >
            <div className="absolute inset-0 bg-linear-to-br from-sleads-blue/20 via-blue-900/10 to-sleads-midnight" />
            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
              <h2 className="text-4xl md:text-6xl font-bold font-display tracking-tight">
                {t("blog_page.cta.title")}
              </h2>
              <p className="text-xl text-slate-300">
                {t("blog_page.cta.description")}
              </p>
              <div className="pt-4">
                <a
                  href="/contact"
                  className="inline-flex items-center justify-center px-8 py-4 bg-sleads-blue hover:bg-blue-600 text-white rounded-full font-bold transition-all duration-300 hover:scale-105 shadow-lg shadow-sleads-blue/20"
                >
                  {t("blog_page.cta.button")}
                  <ArrowUpRight className="ml-2 w-5 h-5" />
                </a>
              </div>
            </div>
          </motion.div>
        </Section>
      )}
    </div>
  );
}
