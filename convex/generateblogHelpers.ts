import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

// Internal query to get all existing blog data for uniqueness check
export const getAllBlogTitles = internalQuery({
  args: {},
  handler: async (ctx) => {
    const blogs = await ctx.db.query("blog_posts").collect();
    return blogs.map((blog) => ({
      title: blog.title,
      titleNL: blog.titleNL,
      slug: blog.slug,
      category: blog.category,
      keywords: blog.keywords || "",
      excerpt: blog.excerpt,
      tags: blog.tags || [],
    }));
  },
});

// Internal mutation to create a new blog post
export const createBlogPost = internalMutation({
  args: {
    title: v.string(),
    titleNL: v.string(),
    excerpt: v.string(),
    excerptNL: v.string(),
    category: v.string(),
    categoryNL: v.string(),
    author: v.string(),
    date: v.string(),
    readTime: v.string(),
    image: v.string(),
    slug: v.string(),
    content: v.string(),
    contentNL: v.string(),
    tags: v.optional(v.array(v.string())),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    keywords: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if slug already exists
    const existingBlog = await ctx.db
      .query("blog_posts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (existingBlog) {
      throw new Error(`Blog post with slug "${args.slug}" already exists`);
    }

    return await ctx.db.insert("blog_posts", {
      title: args.title,
      titleNL: args.titleNL,
      excerpt: args.excerpt,
      excerptNL: args.excerptNL,
      category: args.category,
      categoryNL: args.categoryNL,
      author: args.author,
      date: args.date,
      readTime: args.readTime,
      image: args.image,
      slug: args.slug,
      content: args.content,
      contentNL: args.contentNL,
      tags: args.tags,
      metaTitle: args.metaTitle,
      metaDescription: args.metaDescription,
      keywords: args.keywords,
    });
  },
});

// Internal mutation to store image and get URL
export const storeImageAndGetUrl = internalMutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId);
    return url;
  },
});
