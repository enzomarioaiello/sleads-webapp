"use client";

import React, { useRef, useEffect } from "react";
import { useApp } from "../../contexts/AppContext";
import { motion, useTransform, useSpring, useMotionValue } from "framer-motion";
import { Section } from "../../components/ui/Section";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Calendar,
  Tag,
  Share2,
  User,
  ChevronRight,
} from "lucide-react";

interface BlogPost {
  _id: string;
  title: string;
  titleNL: string;
  excerpt: string;
  excerptNL: string;
  category: string;
  categoryNL: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  slug: string;
  content: string;
  contentNL: string;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
}

interface BlogPostClientProps {
  post: BlogPost;
}

export default function BlogPostClient({ post }: BlogPostClientProps) {
  // Generate absolute URL for sharing
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_BASE_URL || "https://www.sleads.nl";
  const articleUrl = `${baseUrl}/blog/${post.slug}`;
  const { t, language } = useApp();
  const containerRef = useRef<HTMLDivElement>(null);

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

  const title = language === "nl" ? post.titleNL : post.title;
  const excerpt = language === "nl" ? post.excerptNL : post.excerpt;
  const category =
    language === "nl" && post.categoryNL ? post.categoryNL : post.category;
  const content = language === "nl" ? post.contentNL : post.content;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: excerpt,
          url: window.location.href,
        });
      } catch {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      // You could add a toast notification here
    }
  };

  return (
    <div
      ref={containerRef}
      className="bg-slate-50 dark:bg-sleads-midnight transition-colors duration-300 min-h-screen"
      itemScope
      itemType="https://schema.org/Article"
    >
      {/* Hidden microdata for SEO */}
      <meta itemProp="headline" content={title} />
      <meta itemProp="description" content={excerpt} />
      <meta itemProp="datePublished" content={post.date} />
      <meta itemProp="dateModified" content={post.date} />
      <meta itemProp="mainEntityOfPage" content={articleUrl} />
      {post.author && (
        <span
          itemProp="author"
          itemScope
          itemType="https://schema.org/Person"
          hidden
        >
          <meta itemProp="name" content={post.author} />
        </span>
      )}
      <span
        itemProp="publisher"
        itemScope
        itemType="https://schema.org/Organization"
        hidden
      >
        <meta itemProp="name" content="Sleads" />
        <meta itemProp="url" content="https://www.sleads.nl" />
      </span>
      {/* Hero Section */}
      <section className="relative pt-24 pb-12 md:pt-32 md:pb-16 px-4 md:px-6">
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

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-sleads-blue dark:hover:text-sleads-blue transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t("blog_page.post.back_to_blog")}</span>
            </Link>
          </motion.div>

          {/* Category Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sleads-blue/10 text-sleads-blue text-sm font-bold">
              <Tag className="w-4 h-4" />
              {category}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-sleads-white leading-tight mb-6 font-display wrap-break-word"
          >
            {title}
          </motion.h1>

          {/* Excerpt */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 leading-relaxed mb-8"
          >
            {excerpt}
          </motion.p>

          {/* Meta Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap items-center gap-6 pb-8 border-b border-slate-200 dark:border-slate-800"
          >
            {post.author && (
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <User className="w-4 h-4" />
                <span className="font-medium">
                  {t("blog_page.post.by")} {post.author}
                </span>
              </div>
            )}
            {post.date && (
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Calendar className="w-4 h-4" />
                <span>{post.date}</span>
              </div>
            )}
            {post.readTime && (
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Clock className="w-4 h-4" />
                <span>{post.readTime}</span>
              </div>
            )}
            <button
              onClick={handleShare}
              className="ml-auto flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-sleads-slate900 text-slate-600 dark:text-slate-400 hover:bg-sleads-blue hover:text-white transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>{t("blog_page.post.share")}</span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Featured Image */}
      {post.image && (
        <Section className="py-8 !pt-0">
          <motion.figure
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="relative w-full max-w-5xl mx-auto aspect-video rounded-3xl overflow-hidden shadow-2xl"
            itemProp="image"
            itemScope
            itemType="https://schema.org/ImageObject"
          >
            <Image
              src={post.image}
              alt={`Featured image for article: ${title}`}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1024px"
            />
            <meta itemProp="url" content={post.image} />
            <meta itemProp="width" content="1792" />
            <meta itemProp="height" content="1024" />
          </motion.figure>
        </Section>
      )}

      {/* Content */}
      <Section className="py-12">
        <article className="max-w-4xl mx-auto" role="main">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="ProseMirror prose prose-lg dark:prose-invert prose-slate max-w-none
              prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-sleads-white prose-headings:mt-8 prose-headings:mb-4
              prose-h1:text-4xl prose-h1:font-bold prose-h1:leading-tight
              prose-h2:text-3xl prose-h2:font-bold prose-h2:leading-tight
              prose-h3:text-2xl prose-h3:font-bold prose-h3:leading-tight
              prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-6
              prose-a:text-sleads-blue dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
              prose-strong:text-slate-900 dark:prose-strong:text-sleads-white prose-strong:font-bold
              prose-code:text-sleads-blue dark:prose-code:text-blue-400 prose-code:bg-slate-100 dark:prose-code:bg-sleads-slate900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono
              prose-pre:bg-slate-900 dark:prose-pre:bg-sleads-slate900 prose-pre:text-slate-100 prose-pre:rounded-xl prose-pre:p-4 prose-pre:overflow-x-auto
              prose-blockquote:border-l-4 prose-blockquote:border-sleads-blue prose-blockquote:bg-slate-50 dark:prose-blockquote:bg-sleads-slate900 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-blockquote:my-6 prose-blockquote:italic
              prose-ul:list-disc prose-ul:my-6 prose-ul:pl-6
              prose-ol:list-decimal prose-ol:my-6 prose-ol:pl-6
              prose-li:my-2 prose-li:text-slate-700 dark:prose-li:text-slate-300
              prose-img:rounded-xl prose-img:shadow-lg prose-img:my-8 prose-img:w-full prose-img:h-auto
              prose-hr:border-slate-200 dark:prose-hr:border-slate-800 prose-hr:my-8
              prose-table:w-full prose-table:my-6
              prose-th:bg-slate-100 dark:prose-th:bg-sleads-slate900 prose-th:font-semibold prose-th:p-3
              prose-td:p-3 prose-td:border-t prose-td:border-slate-200 dark:prose-td:border-slate-800"
            itemProp="articleBody"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </article>
      </Section>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <Section className="py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                {t("blog_page.post.tags")}
              </span>
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full bg-slate-100 dark:bg-sleads-slate900 text-slate-600 dark:text-slate-400 text-sm border border-slate-200 dark:border-slate-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* Back to Blog CTA */}
      <Section className="py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-sleads-blue text-white font-semibold hover:bg-blue-600 transition-colors shadow-lg shadow-sleads-blue/20"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t("blog_page.post.back_to_all")}</span>
            <ChevronRight className="w-4 h-4 ml-auto" />
          </Link>
        </motion.div>
      </Section>
    </div>
  );
}
