import { query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { authMutation, authQuery } from "./helpers";

// Admin query to get all blog posts (for admin dashboard)
export const getAllBlogPostsAdmin = authQuery("admin")({
  args: {},
  handler: async (ctx) => {
    const blogPosts = await ctx.db.query("blog_posts").order("desc").collect();
    return blogPosts;
  },
});

// Admin mutation to delete a blog post
export const deleteBlogPost = authMutation(
  "admin",
  null
)({
  args: {
    blogId: v.id("blog_posts"),
  },
  handler: async (ctx, args) => {
    const blog = await ctx.db.get(args.blogId);
    if (!blog) {
      throw new Error("Blog post not found");
    }
    await ctx.db.delete(args.blogId);
    return { success: true };
  },
});

// Admin mutation to update a blog post
export const updateBlogPost = authMutation(
  "admin",
  null
)({
  args: {
    blogId: v.id("blog_posts"),
    title: v.optional(v.string()),
    titleNL: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    excerptNL: v.optional(v.string()),
    category: v.optional(v.string()),
    categoryNL: v.optional(v.string()),
    content: v.optional(v.string()),
    contentNL: v.optional(v.string()),
    image: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    keywords: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { blogId, ...updates } = args;
    const blog = await ctx.db.get(blogId);
    if (!blog) {
      throw new Error("Blog post not found");
    }

    // Filter out undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );

    await ctx.db.patch(blogId, filteredUpdates);
    return { success: true };
  },
});

// Get blog count for dashboard
export const getBlogCount = query({
  args: {},
  handler: async (ctx) => {
    const blogs = await ctx.db.query("blog_posts").collect();
    return blogs.length;
  },
});

export const getBlogPosts = query({
  args: {
    category: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const { category, paginationOpts } = args;

    const blogPosts = category
      ? await ctx.db
          .query("blog_posts")
          .withIndex("by_category", (q) => q.eq("category", category))
          .paginate(paginationOpts)
      : await ctx.db.query("blog_posts").paginate(paginationOpts);
    return blogPosts;
  },
});

export const getBlogPostBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const { slug } = args;
    const blogPost = await ctx.db
      .query("blog_posts")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();
    return blogPost;
  },
});
