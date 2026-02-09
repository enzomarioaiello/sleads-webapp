import { v } from "convex/values";
import {
  authMutation,
  authQuery,
  authAction,
  authOrganizationQuery,
  checkOrganizationMembership,
  authOrganizationMutation,
} from "./helpers";
import { internalAction, internalMutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";

export const createQuote = authMutation(
  "admin",
  null
)({
  args: {
    projectId: v.id("projects"),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    // Get the quote with the highest quoteNumber, efficiently
    // Only fetch the quote with the greatest quoteNumber (not all)
    const [maxQuote] = await ctx.db.query("quotes").order("desc").take(1);
    const quoteNumber = maxQuote ? maxQuote.quoteNumber + 1 : 1;

    return await ctx.db.insert("quotes", {
      projectId: args.projectId,
      organizationId: args.organizationId,
      quoteNumber: quoteNumber,
      quoteIdentifiefier: `Q-${new Date().getFullYear()}-${String(quoteNumber).padStart(6, "0")}`,
      quoteItems: [],
      quoteStatus: "draft",
      language: "en",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const duplicateQuote = authMutation(
  "admin",
  null
)({
  args: {
    quoteId: v.id("quotes"),
  },
  handler: async (ctx, args) => {
    const quote = await ctx.db.get(args.quoteId);
    if (!quote) {
      throw new Error("Quote not found");
    }

    const [maxQuote] = await ctx.db.query("quotes").order("desc").take(1);
    const quoteNumber = maxQuote ? maxQuote.quoteNumber + 1 : 1;

    return await ctx.db.insert("quotes", {
      projectId: quote.projectId,
      organizationId: quote.organizationId,
      quoteNumber: quoteNumber + 1,
      quoteIdentifiefier: `Q-${new Date().getFullYear()}-${String(quoteNumber).padStart(6, "0")}`,
      quoteItems: quote.quoteItems,
      quoteStatus: "draft",
      language: quote.language,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateQuote = authMutation(
  "admin",
  null
)({
  args: {
    quoteId: v.id("quotes"),
    quoteDate: v.optional(v.union(v.null(), v.number())),
    quoteValidUntil: v.optional(v.union(v.null(), v.number())),
    language: v.optional(v.union(v.null(), v.literal("en"), v.literal("nl"))),
    quoteItems: v.optional(
      v.union(
        v.null(),
        v.array(
          v.object({
            name: v.string(),
            description: v.string(),
            quantity: v.number(),
            priceExclTax: v.number(),
            tax: v.union(v.literal(0), v.literal(9), v.literal(21)),
          })
        )
      )
    ),
  },
  handler: async (ctx, args) => {
    const quote = await ctx.db.get(args.quoteId);
    if (!quote) {
      throw new Error("Quote not found");
    }

    if (quote.quoteStatus !== "draft") {
      throw new Error("Only draft quotes can be updated");
    }

    const newQuoteDate = args.quoteDate || quote.quoteDate;
    const newQuoteValidUntil = args.quoteValidUntil || quote.quoteValidUntil;

    if (newQuoteDate) {
      if (newQuoteDate < Date.now() - 1000 * 60 * 60 * 24) {
        throw new Error("Quote date cannot be in the past");
      }
    }

    if (args.quoteDate) {
      if (args.quoteDate < Date.now() - 1000 * 60 * 60 * 24) {
        throw new Error("Quote date cannot be in the past");
      }
    }

    if (args.quoteValidUntil) {
      if (args.quoteValidUntil) {
        if (args.quoteValidUntil < Date.now()) {
          throw new Error("Quote valid until cannot be in the past");
        }
      }

      if (
        newQuoteDate &&
        newQuoteValidUntil &&
        newQuoteValidUntil < newQuoteDate
      ) {
        throw new Error("Quote valid until cannot be before the quote date");
      }
    }

    return await ctx.db.patch(args.quoteId, {
      quoteDate: args.quoteDate || quote.quoteDate,
      quoteValidUntil: args.quoteValidUntil || quote.quoteValidUntil,
      quoteItems: args.quoteItems || quote.quoteItems,
      language: args.language || quote.language,
      updatedAt: Date.now(),
    });
  },
});

export const deleteQuote = authMutation(
  "admin",
  null
)({
  args: {
    quoteId: v.id("quotes"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.quoteId);
  },
});

export const getQuote = authQuery("admin")({
  args: {
    quoteId: v.optional(v.union(v.null(), v.id("quotes"))),
  },
  handler: async (ctx, args) => {
    if (args.quoteId && args.quoteId !== null) {
      return await ctx.db.get(args.quoteId);
    }
    return null;
  },
});

export const getQuotes = authQuery("admin")({
  args: {
    projectId: v.optional(v.union(v.null(), v.id("projects"))),
    organizationId: v.optional(v.union(v.null(), v.string())),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("quotes")
      .filter((q) => {
        if (args.projectId) {
          return q.eq(q.field("projectId"), args.projectId);
        }
        if (args.organizationId) {
          return q.eq(q.field("organizationId"), args.organizationId);
        }
        return q.eq(q.field("organizationId"), args.organizationId);
      })
      .collect();
  },
});

export const getQuotesForOrganization = authOrganizationQuery("admin")({
  args: {
    projectId: v.optional(v.union(v.null(), v.id("projects"))),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("quotes")
      .filter((q) => {
        const statusFilter = q.or(
          q.eq(q.field("quoteStatus"), "sent"),
          q.eq(q.field("quoteStatus"), "accepted"),
          q.eq(q.field("quoteStatus"), "rejected")
        );
        if (args.projectId) {
          return q.and(
            q.eq(q.field("projectId"), args.projectId),
            statusFilter
          );
        }
        if (args.organizationId) {
          return q.and(
            q.eq(q.field("organizationId"), args.organizationId),
            statusFilter
          );
        }
        // If neither projectId nor organizationId provided, still filter by status
        return statusFilter;
      })
      .collect();
  },
});

export const getInformationForQuote = query({
  args: {
    quoteId: v.optional(v.union(v.null(), v.id("quotes"))),
  },
  handler: async (ctx, args) => {
    if (!args.quoteId || args.quoteId === null) {
      return null;
    }

    const quote = await ctx.db.get(args.quoteId);
    if (!quote) {
      throw new Error("Quote not found");
    }

    const project = await ctx.db.get(quote.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const contactInfo = await ctx.db.get(project.contactInformation);
    if (!contactInfo) {
      throw new Error("Contact information not found");
    }

    return {
      quote,
      project,
      contactInfo,
    };
  },
});

// Customer-facing mutation to accept a quote
export const acceptQuote = authOrganizationMutation("admin")({
  args: {
    quoteId: v.id("quotes"),
  },
  handler: async (ctx, args) => {
    const quote = await ctx.db.get(args.quoteId);
    if (!quote) {
      throw new Error("Quote not found");
    }

    // Verify the quote belongs to the organization
    if (quote.organizationId !== args.organizationId) {
      throw new Error("Unauthorized");
    }

    // Only allow accepting quotes with status "sent"
    if (quote.quoteStatus !== "sent") {
      throw new Error("Only sent quotes can be accepted");
    }

    return await ctx.db.patch(args.quoteId, {
      quoteStatus: "accepted",
      updatedAt: Date.now(),
    });
  },
});

// Customer-facing mutation to reject a quote
export const rejectQuote = authOrganizationMutation("admin")({
  args: {
    quoteId: v.id("quotes"),
  },
  handler: async (ctx, args) => {
    const quote = await ctx.db.get(args.quoteId);
    if (!quote) {
      throw new Error("Quote not found");
    }

    // Verify the quote belongs to the organization
    if (quote.organizationId !== args.organizationId) {
      throw new Error("Unauthorized");
    }

    // Only allow rejecting quotes with status "sent"
    if (quote.quoteStatus !== "sent") {
      throw new Error("Only sent quotes can be rejected");
    }

    return await ctx.db.patch(args.quoteId, {
      quoteStatus: "rejected",
      updatedAt: Date.now(),
    });
  },
});

export const sendQuote = authMutation(
  "admin",
  null
)({
  args: {
    quoteId: v.id("quotes"),
  },
  handler: async (ctx, args) => {
    const quote = await ctx.db.get(args.quoteId);
    if (!quote) {
      throw new Error("Quote not found");
    }

    const uploadUrl = await ctx.storage.generateUploadUrl();

    await ctx.scheduler.runAfter(0, internal.quote.generatePdfAndUpload, {
      quoteId: args.quoteId,
      uploadUrl: uploadUrl,
    });

    return await ctx.db.patch(args.quoteId, {
      quoteStatus: "draft",
    });
  },
});

export const setFileUrl = internalMutation({
  args: {
    quoteId: v.id("quotes"),
    quoteName: v.string(),
    storegeId: v.id("_storage"),
    projectId: v.id("projects"),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("files", {
      name: "/quotes/" + args.quoteName + ".pdf",
      contentType: "file",
      userCanEdit: false,
      url: await ctx.storage.getUrl(args.storegeId),
      userCanDelete: false,
      projectId: args.projectId,
      organizationId: args.organizationId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return await ctx.db.patch(args.quoteId, {
      quoteFileUrl: await ctx.storage.getUrl(args.storegeId),
    });
  },
});

export const setQuoteStatus = internalMutation({
  args: {
    quoteId: v.id("quotes"),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("expired")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.quoteId, {
      quoteStatus: args.status,
    });
  },
});

export const generatePdfAndUpload = internalAction({
  args: {
    quoteId: v.id("quotes"),
    uploadUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const result = await fetch(
      process.env.NEXT_PUBLIC_BASE_URL +
        "/api/documents/" +
        args.quoteId +
        "/pdf?type=quote&uploadUrl=" +
        args.uploadUrl
    );
    if (!result.ok) {
      throw new Error("Failed to generate PDF");
    }

    const { url, storageId } = await result.json();

    console.log("Storage ID: " + storageId);
    const quote = await ctx.runQuery(api.quote.getInformationForQuote, {
      quoteId: args.quoteId,
    });
    if (!quote) {
      throw new Error("Quote not found");
    }

    await ctx.runMutation(internal.quote.setFileUrl, {
      quoteId: args.quoteId,
      storegeId: storageId,
      projectId: quote.project._id,
      organizationId: quote.project.organizationId,
      quoteName: quote.quote.quoteIdentifiefier || args.quoteId.toString(),
    });

    // Update the quote status and send the file
    await ctx.runAction(internal.actions.sendQuoteEmail, {
      quote: {
        quoteIdentifiefier: quote.quote.quoteIdentifiefier || "",
        quoteDate: quote.quote.quoteDate || 0,
        quoteValidUntil: quote.quote.quoteValidUntil || 0,
        quoteItems: quote.quote.quoteItems || [],
        language: quote.quote.language || "en",
      },
      contactPerson: {
        name: quote.contactInfo.name,
        email: quote.contactInfo.email,
        organizationName: quote.contactInfo.organizationName,
      },
      portalUrl:
        "https://sleads.nl/dashboard/" +
        quote.project.organizationId +
        "/projects/" +
        quote.project._id +
        "/quotes/" +
        quote.quote._id,
      quoteFileUrl: quote.quote.quoteFileUrl,
    });

    await ctx.runMutation(internal.quote.setQuoteStatus, {
      quoteId: args.quoteId,
      status: "sent",
    });

    return url;
  },
});
