import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { authComponent } from "./auth";
import { internal } from "./_generated/api";

export const sendContactForm = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    let user = null;
    try {
      user = await authComponent.getAuthUser(ctx);
    } catch {
      // User is not signed in, proceed without user
    }

    const { name, email, subject, message } = args;
    const contactMessageId = await ctx.db.insert("contact_regular_form", {
      name,
      email,
      subject,
      message,
      read: false,
      userId: user?._id ?? null,
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.actions.sendContactEmail, {
      name,
      email,
      subject,
      message,
    });

    return contactMessageId;
  },
});

export const sendProjectContactForm = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    companyName: v.string(),
    phone: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    let user = null;
    try {
      user = await authComponent.getAuthUser(ctx);
    } catch {
      // User is not signed in, proceed without user
    }

    const { name, email, subject, companyName, phone, message } = args;
    const contactProjectMessageId = await ctx.db.insert(
      "contact_project_form",
      {
        name,
        email,
        subject,
        companyName,
        phone,
        message,
        read: false,
        userId: user?._id ?? null,
        createdAt: Date.now(),
      }
    );

    await ctx.scheduler.runAfter(0, internal.actions.sendProjectContactEmail, {
      name,
      email,
      subject,
      companyName,
      phone,
      message,
    });

    return contactProjectMessageId;
  },
});

export const markContactFormAsRead = mutation({
  args: {
    contactFormId: v.union(
      v.id("contact_regular_form"),
      v.id("contact_project_form")
    ),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    if (user.role !== "admin") {
      throw new Error("Unauthorized");
    }

    const { contactFormId } = args;

    await ctx.db.patch(contactFormId, {
      read: true,
    });
    return { success: true };
  },
});

export const getContactForms = query({
  args: {},
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    if (user.role !== "admin") {
      throw new Error("Unauthorized");
    }

    const regularForms = await ctx.db.query("contact_regular_form").collect();
    const projectForms = await ctx.db.query("contact_project_form").collect();
    return {
      regularForms,
      projectForms,
    };
  },
});
