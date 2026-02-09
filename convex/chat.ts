import { v } from "convex/values";
import { internalMutation, query, mutation } from "./_generated/server";
import { authComponent } from "./auth";

export const getMessages = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("chat_messages")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .order("asc")
      .collect();
  },
});

export const saveMessage = internalMutation({
  args: {
    sessionId: v.string(),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system")
    ),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Upsert session to ensure it exists
    const existingSession = await ctx.db
      .query("chat_sessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!existingSession) {
      // We don't have user context easily here if called from action without passing it?
      // `ctx.auth` in internalMutation might work if the action was authenticated?
      // Actually, `saveMessage` is called from `sendMessage` action.
      // `sendMessage` action is called by client.
      // If client is auth'd, action is auth'd?
      // Convex Actions preserve auth context? Yes.
      // So `ctx.auth` in mutation called by action should work?
      // Let's try to get user.
      const user = await authComponent.getAuthUser(ctx);
      await ctx.db.insert("chat_sessions", {
        sessionId: args.sessionId,
        userId: user?._id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.patch(existingSession._id, { updatedAt: Date.now() });
    }

    await ctx.db.insert("chat_messages", {
      sessionId: args.sessionId,
      role: args.role,
      content: args.content,
      createdAt: Date.now(),
    });
  },
});

// New functionalities

export const getUserSessions = query({
  args: {},
  handler: async (ctx) => {
    let user = null;
    try {
      user = await authComponent.getAuthUser(ctx);
    } catch (error) {
      console.error("Error getting user sessions:", error);
    }
    if (!user) return [];
    // We can't index by userId directly in chat_sessions easily if it's not defined in schema as index?
    // Looking at schema: chat_sessions has .index("by_sessionId", ["sessionId"])
    // I should add an index for userId or use filter (might be slow if many sessions)
    // Schema update is recommended. For now, full scan or filter.
    // Let's check schema again.
    // Schema: userId is v.optional(v.string())

    // I will add index in schema update next step. For now code it assuming index or filter.
    // Let's do filter for now to avoid breaking changes immediately if index missing,
    // but TODO: add index.

    // Actually, I can't filter effectively without index on large datasets.
    // I'll assume I'll add the index.

    return await ctx.db
      .query("chat_sessions")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

export const createSession = mutation({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    const existing = await ctx.db
      .query("chat_sessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (existing) {
      // update userId if now logged in and previously wasn't?
      // Or just return existing ID.
      if (user && !existing.userId) {
        await ctx.db.patch(existing._id, { userId: user._id });
      }
      return existing._id;
    }

    return await ctx.db.insert("chat_sessions", {
      sessionId: args.sessionId,
      userId: user ? user._id : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const deleteSession = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const session = await ctx.db
      .query("chat_sessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!session || session.userId !== user._id) {
      throw new Error("Session not found or unauthorized");
    }

    await ctx.db.delete(session._id);
    // Optionally delete messages too
    const messages = await ctx.db
      .query("chat_messages")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }
  },
});
