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
import { Id } from "./_generated/dataModel";

export const createInvoice = authMutation(
  "admin",
  null
)({
  args: {
    projectId: v.id("projects"),
    organizationId: v.id("organizations"),
    subscriptionIds: v.optional(
      v.union(v.null(), v.array(v.id("monthly_subscriptions")))
    ),
  },
  handler: async (ctx, args) => {
    // Get the quote with the highest quoteNumber, efficiently
    // Only fetch the quote with the greatest quoteNumber (not all)
    const [maxInvoice] = await ctx.db.query("invoices").order("desc").take(1);
    const invoiceNumber = maxInvoice ? maxInvoice.invoiceNumber + 1 : 1;

    return await ctx.db.insert("invoices", {
      projectId: args.projectId,
      organizationId: args.organizationId,
      invoiceNumber: invoiceNumber,
      invoiceIdentifiefier: `I-${new Date().getFullYear()}-${String(invoiceNumber).padStart(6, "0")}`,
      invoiceItems: [],
      invoiceStatus: "draft",
      language: "en",
      subscriptionIds: args.subscriptionIds || null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const duplicateInvoice = authMutation(
  "admin",
  null
)({
  args: {
    invoiceId: v.id("invoices"),
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    const [maxInvoice] = await ctx.db.query("invoices").order("desc").take(1);
    const invoiceNumber = maxInvoice ? maxInvoice.invoiceNumber + 1 : 1;

    return await ctx.db.insert("invoices", {
      projectId: invoice.projectId,
      organizationId: invoice.organizationId,
      invoiceNumber: invoiceNumber + 1,
      invoiceIdentifiefier: `I-${new Date().getFullYear()}-${String(invoiceNumber).padStart(6, "0")}`,
      invoiceItems: invoice.invoiceItems,
      invoiceStatus: "draft",
      language: invoice.language,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateInvoice = authMutation(
  "admin",
  null
)({
  args: {
    invoiceId: v.id("invoices"),
    invoiceDate: v.optional(v.union(v.null(), v.number())),
    invoiceDueDate: v.optional(v.union(v.null(), v.number())),
    language: v.optional(v.union(v.null(), v.literal("en"), v.literal("nl"))),
    invoiceItems: v.optional(
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
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    if (invoice.invoiceStatus !== "draft") {
      throw new Error("Only draft invoices can be updated");
    }

    const newInvoiceDate = args.invoiceDate || invoice.invoiceDate;
    const newInvoiceDueDate = args.invoiceDueDate || invoice.invoiceDueDate;

    if (newInvoiceDate) {
      if (newInvoiceDate < Date.now() - 1000 * 60 * 60 * 24) {
        throw new Error("Invoice date cannot be in the past");
      }
    }

    if (args.invoiceDate) {
      if (args.invoiceDate < Date.now() - 1000 * 60 * 60 * 24) {
        throw new Error("Quote date cannot be in the past");
      }
    }

    if (args.invoiceDueDate) {
      if (args.invoiceDueDate) {
        if (args.invoiceDueDate < Date.now()) {
          throw new Error("Quote valid until cannot be in the past");
        }
      }

      if (
        newInvoiceDate &&
        newInvoiceDueDate &&
        newInvoiceDueDate < newInvoiceDate
      ) {
        throw new Error("Invoice due date cannot be before the invoice date");
      }
    }

    return await ctx.db.patch(args.invoiceId, {
      invoiceDate: args.invoiceDate || invoice.invoiceDate,
      invoiceDueDate: args.invoiceDueDate || invoice.invoiceDueDate,
      invoiceItems: args.invoiceItems || invoice.invoiceItems,
      language: args.language || invoice.language,
      updatedAt: Date.now(),
    });
  },
});

export const deleteInvoice = authMutation(
  "admin",
  null
)({
  args: {
    invoiceId: v.id("invoices"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.invoiceId);
  },
});

export const getInvoice = authQuery("admin")({
  args: {
    invoiceId: v.optional(v.union(v.null(), v.id("invoices"))),
  },
  handler: async (ctx, args) => {
    if (args.invoiceId && args.invoiceId !== null) {
      return await ctx.db.get(args.invoiceId);
    }
    return null;
  },
});

export const getInvoices = authQuery("admin")({
  args: {
    projectId: v.optional(v.union(v.null(), v.id("projects"))),
    organizationId: v.optional(v.union(v.null(), v.string())),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("invoices")
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

export const getInvoicesForOrganization = authOrganizationQuery("admin")({
  args: {
    projectId: v.optional(v.union(v.null(), v.id("projects"))),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("invoices")
      .filter((q) => {
        const statusFilter = q.or(
          q.eq(q.field("invoiceStatus"), "sent"),
          q.eq(q.field("invoiceStatus"), "paid"),
          q.eq(q.field("invoiceStatus"), "overdue"),
          q.eq(q.field("invoiceStatus"), "cancelled")
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

export const getInformationForInvoice = query({
  args: {
    invoiceId: v.optional(v.union(v.null(), v.id("invoices"))),
  },
  handler: async (ctx, args) => {
    if (!args.invoiceId || args.invoiceId === null) {
      return null;
    }

    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    const project = await ctx.db.get(invoice.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const contactInfo = await ctx.db.get(project.contactInformation);
    if (!contactInfo) {
      throw new Error("Contact information not found");
    }

    return {
      invoice,
      project,
      contactInfo,
    };
  },
});

// // Customer-facing mutation to accept a quote
// export const acceptQuote = authOrganizationMutation("admin")({
//   args: {
//     invoiceId: v.id("invoices"),
//   },
//   handler: async (ctx, args) => {
//     const invoice = await ctx.db.get(args.invoiceId);
//     if (!invoice) {
//       throw new Error("Invoice not found");
//     }

//     // Verify the quote belongs to the organization
//     if (invoice.organizationId !== args.organizationId) {
//       throw new Error("Unauthorized");
//     }

//     // Only allow accepting quotes with status "sent"
//     if (invoice.invoiceStatus !== "sent") {
//       throw new Error("Only sent invoices can be accepted");
//     }

//     return await ctx.db.patch(args.invoiceId, {
//       invoiceStatus: "accepted",
//       updatedAt: Date.now(),
//     });
//   },
// });

// // Customer-facing mutation to reject a quote
// export const rejectQuote = authOrganizationMutation("admin")({
//   args: {
//     quoteId: v.id("quotes"),
//   },
//   handler: async (ctx, args) => {
//     const quote = await ctx.db.get(args.quoteId);
//     if (!quote) {
//       throw new Error("Quote not found");
//     }

//     // Verify the quote belongs to the organization
//     if (quote.organizationId !== args.organizationId) {
//       throw new Error("Unauthorized");
//     }

//     // Only allow rejecting quotes with status "sent"
//     if (quote.quoteStatus !== "sent") {
//       throw new Error("Only sent quotes can be rejected");
//     }

//     return await ctx.db.patch(args.quoteId, {
//       quoteStatus: "rejected",
//       updatedAt: Date.now(),
//     });
//   },
// });

export const sendInvoice = authMutation(
  "admin",
  null
)({
  args: {
    invoiceId: v.id("invoices"),
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    const uploadUrl = await ctx.storage.generateUploadUrl();

    await ctx.scheduler.runAfter(0, internal.invoice.generatePdfAndUpload, {
      invoiceId: args.invoiceId,
      uploadUrl: uploadUrl,
    });

    return await ctx.db.patch(args.invoiceId, {
      invoiceStatus: "draft",
    });
  },
});

export const setFileUrl = internalMutation({
  args: {
    invoiceId: v.id("invoices"),
    storegeId: v.id("_storage"),
    projectId: v.id("projects"),
    organizationId: v.id("organizations"),
    invoiceName: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("files", {
      name: "/invoices/" + args.invoiceName + ".pdf",
      contentType: "file",
      userCanEdit: false,
      url: await ctx.storage.getUrl(args.storegeId),
      userCanDelete: false,
      projectId: args.projectId,
      organizationId: args.organizationId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return await ctx.db.patch(args.invoiceId, {
      invoiceFileUrl: await ctx.storage.getUrl(args.storegeId),
    });
  },
});

export const setInvoiceStatus = internalMutation({
  args: {
    invoiceId: v.id("invoices"),
    status: v.union(
      v.literal("draft"),
      v.literal("paid"),
      v.literal("overdue"),
      v.literal("cancelled"),
      v.literal("sent")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.invoiceId, {
      invoiceStatus: args.status,
    });
  },
});

export const generatePdfAndUpload = internalAction({
  args: {
    invoiceId: v.id("invoices"),
    uploadUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const result = await fetch(
      process.env.NEXT_PUBLIC_BASE_URL +
        "/api/documents/" +
        args.invoiceId +
        "/pdf?type=invoice&uploadUrl=" +
        args.uploadUrl
    );
    if (!result.ok) {
      throw new Error("Failed to generate PDF");
    }

    const { url, storageId } = await result.json();

    console.log("Storage ID: " + storageId);

    const invoice = await ctx.runQuery(api.invoice.getInformationForInvoice, {
      invoiceId: args.invoiceId,
    });
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    await ctx.runMutation(internal.invoice.setFileUrl, {
      invoiceId: args.invoiceId,
      storegeId: storageId,
      projectId: invoice.project._id,
      organizationId: invoice.project.organizationId,
      invoiceName:
        invoice.invoice.invoiceIdentifiefier || args.invoiceId.toString(),
    });

    // Update the invoice status and send the file
    // Use the URL from PDF generation response, not the old invoice data
    await ctx.runAction(internal.actions.sendInvoiceEmail, {
      invoice: {
        invoiceIdentifiefier: invoice.invoice.invoiceIdentifiefier || null,
        invoiceDate: invoice.invoice.invoiceDate || null,
        invoiceDueDate: invoice.invoice.invoiceDueDate || null,
        invoiceItems: invoice.invoice.invoiceItems || [],
        language: invoice.invoice.language || "en",
        subscriptionIds: invoice.invoice.subscriptionIds || null,
      },
      contactPerson: {
        name: invoice.contactInfo.name,
        email: invoice.contactInfo.email,
        organizationName: invoice.contactInfo.organizationName,
      },
      portalUrl:
        "https://sleads.nl/dashboard/" +
        invoice.project.organizationId +
        "/projects/" +
        invoice.project._id +
        "/invoices/" +
        invoice.invoice._id,
      invoiceFileUrl: url, // Use the URL from PDF generation, not the old invoice data
    });

    await ctx.runMutation(internal.invoice.setInvoiceStatus, {
      invoiceId: args.invoiceId,
      status: "sent",
    });

    return url;
  },
});

export const updateInvoiceStatus = authMutation(
  "admin",
  null
)({
  args: {
    invoiceId: v.id("invoices"),
    status: v.union(
      v.literal("paid"),
      v.literal("overdue"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.db.get(args.invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    const project = await ctx.db.get(invoice.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const contactInfo = await ctx.db.get(project.contactInformation);
    if (!contactInfo) {
      throw new Error("Contact information not found");
    }

    if (args.status === "paid") {
      await ctx.scheduler.runAfter(0, internal.actions.sendInvoicePaidEmail, {
        invoice: {
          invoiceIdentifiefier: invoice.invoiceIdentifiefier || null,
          invoiceDate: invoice.invoiceDate || null,
          invoiceDueDate: invoice.invoiceDueDate || null,
          invoiceItems: invoice.invoiceItems || [],
          language: invoice.language || "en",
        },
        contactPerson: {
          name: contactInfo.name,
          email: contactInfo.email,
          organizationName: contactInfo.organizationName,
        },
        portalUrl:
          "https://sleads.nl/dashboard/" +
          invoice.organizationId +
          "/projects/" +
          invoice.projectId +
          "/invoices/" +
          invoice._id,
        invoiceFileUrl: invoice.invoiceFileUrl,
      });
    }

    if (args.status === "overdue") {
      await ctx.scheduler.runAfter(
        0,
        internal.actions.sendInvoiceOverdueEmail,
        {
          invoice: {
            invoiceIdentifiefier: invoice.invoiceIdentifiefier || null,
            invoiceDate: invoice.invoiceDate || null,
            invoiceDueDate: invoice.invoiceDueDate || null,
            invoiceItems: invoice.invoiceItems || [],
            language: invoice.language || "en",
          },
          contactPerson: {
            name: contactInfo.name,
            email: contactInfo.email,
            organizationName: contactInfo.organizationName,
          },
          portalUrl:
            "https://sleads.nl/dashboard/" +
            invoice.organizationId +
            "/projects/" +
            invoice.projectId +
            "/invoices/" +
            invoice._id,
          invoiceFileUrl: invoice.invoiceFileUrl,
        }
      );
    }

    if (args.status === "cancelled") {
      await ctx.scheduler.runAfter(
        0,
        internal.actions.sendInvoiceCancelledEmail,
        {
          invoice: {
            invoiceIdentifiefier: invoice.invoiceIdentifiefier || null,
            invoiceDate: invoice.invoiceDate || null,
            invoiceDueDate: invoice.invoiceDueDate || null,
            invoiceItems: invoice.invoiceItems || [],
            language: invoice.language || "en",
          },
          contactPerson: {
            name: contactInfo.name,
            email: contactInfo.email,
            organizationName: contactInfo.organizationName,
          },
          portalUrl:
            "https://sleads.nl/dashboard/" +
            invoice.organizationId +
            "/projects/" +
            invoice.projectId +
            "/invoices/" +
            invoice._id,
          invoiceFileUrl: invoice.invoiceFileUrl,
        }
      );
    }

    return await ctx.db.patch(args.invoiceId, {
      invoiceStatus: args.status,
    });
  },
});

export const addInvoicesBasedOnQuote = authMutation(
  "admin",
  null
)({
  args: {
    quoteId: v.id("quotes"),
    invoiceSplit: v.array(v.number()),
  },
  handler: async (ctx, args) => {
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

    const totalSplit = args.invoiceSplit.reduce((acc, curr) => acc + curr, 0);
    if (totalSplit !== 100) {
      throw new Error("Invoice split must add up to 100");
    }
    const invoices: Id<"invoices">[] = [];

    for (let i = 0; i < args.invoiceSplit.length; i++) {
      const [maxInvoice] = await ctx.db.query("invoices").order("desc").take(1);
      const invoiceNumber = maxInvoice ? maxInvoice.invoiceNumber + 1 : 1;
      const invoiceItems = quote.quoteItems.map((item) => {
        return {
          name: item.name,
          description: item.description,
          quantity: item.quantity * (args.invoiceSplit[i] / 100),
          priceExclTax: item.priceExclTax,
          tax: item.tax,
        };
      });

      const invoice = await ctx.db.insert("invoices", {
        projectId: quote.projectId,
        organizationId: quote.organizationId,
        invoiceNumber: invoiceNumber,
        invoiceIdentifiefier: `I-${new Date().getFullYear()}-${String(invoiceNumber).padStart(6, "0")}`,
        invoiceItems: invoiceItems,
        invoiceStatus: "draft",
        language: quote.language || "en",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      invoices.push(invoice);
    }

    return invoices;
  },
});
