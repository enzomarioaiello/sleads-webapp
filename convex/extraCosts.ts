import { v } from "convex/values";
import { authMutation, authQuery, authOrganizationQuery } from "./helpers";
import { internalMutation, MutationCtx } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { Id, Doc } from "./_generated/dataModel";

// ==================== CRUD Operations ====================

export const createExtraCost = authMutation(
  "admin",
  null
)({
  args: {
    projectId: v.id("projects"),
    organizationId: v.id("organizations"),
    name: v.string(),
    description: v.string(),
    amount: v.number(),
    priceExclTax: v.number(),
    tax: v.union(v.literal(0), v.literal(9), v.literal(21)),
    showSeparatelyOnInvoice: v.optional(v.union(v.null(), v.boolean())),
  },
  handler: async (ctx, args) => {
    // Allow negative values for reimbursements - no validation needed

    return await ctx.db.insert("extra_costs", {
      projectId: args.projectId,
      organizationId: args.organizationId,
      name: args.name,
      description: args.description,
      amount: args.amount,
      priceExclTax: args.priceExclTax,
      tax: args.tax,
      invoicedDate: null,
      invoiceId: null,
      voided: false,
      showSeparatelyOnInvoice: args.showSeparatelyOnInvoice ?? false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateExtraCost = authMutation(
  "admin",
  null
)({
  args: {
    extraCostId: v.id("extra_costs"),
    name: v.optional(v.union(v.null(), v.string())),
    description: v.optional(v.union(v.null(), v.string())),
    amount: v.optional(v.union(v.null(), v.number())),
    priceExclTax: v.optional(v.union(v.null(), v.number())),
    tax: v.optional(
      v.union(v.null(), v.union(v.literal(0), v.literal(9), v.literal(21)))
    ),
    showSeparatelyOnInvoice: v.optional(v.union(v.null(), v.boolean())),
  },
  handler: async (ctx, args) => {
    const extraCost = await ctx.db.get(args.extraCostId);
    if (!extraCost) {
      throw new Error("Extra cost not found");
    }

    // Prevent editing of invoiced extra costs
    if (extraCost.invoicedDate !== null || extraCost.invoiceId !== null) {
      throw new Error("Cannot update extra cost that has been invoiced");
    }

    // Allow negative values for reimbursements - no validation needed

    return await ctx.db.patch(args.extraCostId, {
      name: args.name ?? extraCost.name,
      description: args.description ?? extraCost.description,
      amount: args.amount ?? extraCost.amount,
      priceExclTax: args.priceExclTax ?? extraCost.priceExclTax,
      tax: args.tax ?? extraCost.tax,
      showSeparatelyOnInvoice:
        args.showSeparatelyOnInvoice ??
        extraCost.showSeparatelyOnInvoice ??
        false,
      updatedAt: Date.now(),
    });
  },
});

export const deleteExtraCost = authMutation(
  "admin",
  null
)({
  args: {
    extraCostId: v.id("extra_costs"),
  },
  handler: async (ctx, args) => {
    const extraCost = await ctx.db.get(args.extraCostId);
    if (!extraCost) {
      throw new Error("Extra cost not found");
    }

    // Prevent deletion of invoiced extra costs
    if (extraCost.invoicedDate !== null || extraCost.invoiceId !== null) {
      throw new Error(
        "Cannot delete extra cost that has been invoiced. Contact support if you need to make changes."
      );
    }

    return await ctx.db.delete(args.extraCostId);
  },
});

export const getExtraCosts = authQuery("admin")({
  args: {
    projectId: v.optional(v.union(v.null(), v.id("projects"))),
    organizationId: v.optional(v.union(v.null(), v.id("organizations"))),
  },
  handler: async (ctx, args) => {
    const extraCosts = await ctx.db
      .query("extra_costs")
      .filter((q) => {
        if (args.projectId) {
          return q.eq(q.field("projectId"), args.projectId);
        }
        if (args.organizationId) {
          return q.eq(q.field("organizationId"), args.organizationId);
        }
        return true;
      })
      .collect();

    return extraCosts;
  },
});

export const getExtraCost = authQuery("admin")({
  args: {
    extraCostId: v.id("extra_costs"),
  },
  handler: async (ctx, args) => {
    const extraCost = await ctx.db.get(args.extraCostId);
    if (!extraCost) {
      return null;
    }

    return extraCost;
  },
});

export const voidExtraCost = authMutation(
  "admin",
  null
)({
  args: {
    extraCostId: v.id("extra_costs"),
  },
  handler: async (ctx, args) => {
    const extraCost = await ctx.db.get(args.extraCostId);
    if (!extraCost) {
      throw new Error("Extra cost not found");
    }

    // Only allow voiding uninvoiced extra costs
    if (extraCost.invoicedDate !== null || extraCost.invoiceId !== null) {
      throw new Error("Cannot void extra cost that has been invoiced");
    }

    return await ctx.db.patch(args.extraCostId, {
      voided: true,
      updatedAt: Date.now(),
    });
  },
});

export const unvoidExtraCost = authMutation(
  "admin",
  null
)({
  args: {
    extraCostId: v.id("extra_costs"),
  },
  handler: async (ctx, args) => {
    const extraCost = await ctx.db.get(args.extraCostId);
    if (!extraCost) {
      throw new Error("Extra cost not found");
    }

    // Only allow unvoiding uninvoiced extra costs
    if (extraCost.invoicedDate !== null || extraCost.invoiceId !== null) {
      throw new Error("Cannot unvoid extra cost that has been invoiced");
    }

    return await ctx.db.patch(args.extraCostId, {
      voided: false,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Get extra costs for organization members (client dashboard)
 * Supports pagination for efficient loading of large datasets
 */
export const getExtraCostsForOrganization = authOrganizationQuery(null)({
  args: {
    projectId: v.optional(v.union(v.null(), v.id("projects"))),
    invoiceId: v.optional(v.union(v.null(), v.id("invoices"))),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const query = ctx.db.query("extra_costs").filter((q) => {
      const orgFilter = q.eq(q.field("organizationId"), args.organizationId);

      if (args.projectId) {
        const projectFilter = q.eq(q.field("projectId"), args.projectId);
        if (args.invoiceId) {
          const invoiceFilter = q.eq(q.field("invoiceId"), args.invoiceId);
          return q.and(orgFilter, projectFilter, invoiceFilter);
        }
        return q.and(orgFilter, projectFilter);
      }

      if (args.invoiceId) {
        const invoiceFilter = q.eq(q.field("invoiceId"), args.invoiceId);
        return q.and(orgFilter, invoiceFilter);
      }

      return orgFilter;
    });

    return await query.paginate(args.paginationOpts);
  },
});

// ==================== Internal Mutation ====================

/**
 * Internal mutation to create extra cost (can be called from actions/mutations)
 * This is the primary way to add extra costs when services are used
 */
export const createExtraCostInternal = internalMutation({
  args: {
    projectId: v.id("projects"),
    organizationId: v.id("organizations"),
    name: v.string(),
    description: v.string(),
    amount: v.number(),
    priceExclTax: v.number(),
    tax: v.union(v.literal(0), v.literal(9), v.literal(21)),
    showSeparatelyOnInvoice: v.optional(v.union(v.null(), v.boolean())),
  },
  handler: async (ctx, args) => {
    // Allow negative values for reimbursements - no validation needed

    return await ctx.db.insert("extra_costs", {
      projectId: args.projectId,
      organizationId: args.organizationId,
      name: args.name,
      description: args.description,
      amount: args.amount,
      priceExclTax: args.priceExclTax,
      tax: args.tax,
      invoicedDate: null,
      invoiceId: null,
      voided: false,
      showSeparatelyOnInvoice: args.showSeparatelyOnInvoice ?? false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// ==================== Invoice Generation Helper ====================

/**
 * Generate invoice items from uninvoiced extra costs
 * Groups extra costs by tax rate and creates one invoice item per tax group
 */
export async function generateInvoiceItemsFromExtraCosts(
  ctx: MutationCtx,
  projectId: Id<"projects">,
  organizationId: Id<"organizations">,
  invoiceId: Id<"invoices">,
  language: "en" | "nl"
): Promise<{
  items: Array<{
    name: string;
    description: string;
    quantity: number;
    priceExclTax: number;
    tax: 0 | 9 | 21;
  }>;
  extraCostIds: Id<"extra_costs">[];
}> {
  const items: Array<{
    name: string;
    description: string;
    quantity: number;
    priceExclTax: number;
    tax: 0 | 9 | 21;
  }> = [];
  const extraCostIds: Id<"extra_costs">[] = [];

  // Find all uninvoiced, non-voided extra costs for this project and organization
  // Uninvoiced means both invoicedDate and invoiceId are null
  // Non-voided means voided is false or null
  const uninvoicedExtraCosts = await ctx.db
    .query("extra_costs")
    .withIndex("by_projectId", (q) => q.eq("projectId", projectId))
    .filter((q) => {
      return q.and(
        q.eq(q.field("organizationId"), organizationId),
        q.eq(q.field("invoicedDate"), null),
        q.eq(q.field("invoiceId"), null),
        q.or(q.eq(q.field("voided"), false), q.eq(q.field("voided"), null))
      );
    })
    .collect();

  if (uninvoicedExtraCosts.length === 0) {
    return { items, extraCostIds };
  }

  // Separate costs into two groups: separate items and grouped items
  const separateItems: Doc<"extra_costs">[] = [];
  const groupedItems: Doc<"extra_costs">[] = [];

  for (const extraCost of uninvoicedExtraCosts) {
    if (extraCost.showSeparatelyOnInvoice === true) {
      separateItems.push(extraCost);
    } else {
      groupedItems.push(extraCost);
    }
    extraCostIds.push(extraCost._id);
  }

  // Create separate line items for costs that should be shown separately
  for (const extraCost of separateItems) {
    items.push({
      name: extraCost.name,
      description: extraCost.description,
      quantity: extraCost.amount, // amount is quantity when showSeparatelyOnInvoice is true
      priceExclTax: extraCost.priceExclTax, // priceExclTax is price per unit when showSeparatelyOnInvoice is true
      tax: extraCost.tax,
    });
  }

  // Group remaining costs by tax rate
  const groupedByTax: Record<"0" | "9" | "21", Array<Doc<"extra_costs">>> = {
    "0": [],
    "9": [],
    "21": [],
  };

  for (const extraCost of groupedItems) {
    const taxKey = String(extraCost.tax) as "0" | "9" | "21";
    groupedByTax[taxKey].push(extraCost);
  }

  // Create invoice item for each tax group
  const itemName = language === "nl" ? "Extra kosten" : "Extra costs";
  const baseUrl = "https://sleads.nl";
  const linkUrl = `${baseUrl}/dashboard/${organizationId}/projects/${projectId}/extra-costs?invoiceId=${invoiceId}`;
  const linkText =
    language === "nl" ? "Klik hier voor overzicht" : "Click here for overview";

  for (const [taxRateStr, costs] of Object.entries(groupedByTax)) {
    if (costs.length === 0) continue;

    const taxRate = Number(taxRateStr) as 0 | 9 | 21;

    // For grouped items, treat amount as quantity and priceExclTax as price per unit
    // Calculate total price as sum of (quantity × price per unit) for each cost
    // On the invoice, show quantity = 1 and total price
    const totalPriceExclTax = costs.reduce(
      (sum, cost) => sum + cost.amount * cost.priceExclTax,
      0
    );

    // Create description with clickable link
    const description = `<a style="color: blue;" href="${linkUrl}">${linkText}</a>`;

    items.push({
      name: itemName,
      description: description,
      quantity: 1, // Always 1 for grouped items on invoice
      priceExclTax: totalPriceExclTax, // Total price for the tax group
      tax: taxRate,
    });
  }

  return { items, extraCostIds };
}

/**
 * Update extra costs with invoice information after invoice is created
 * This is a helper function that can be called from within mutations
 */
export async function updateExtraCostsWithInvoice(
  ctx: MutationCtx,
  extraCostIds: Id<"extra_costs">[],
  invoiceId: Id<"invoices">,
  invoiceDate: number
): Promise<void> {
  for (const extraCostId of extraCostIds) {
    await ctx.db.patch(extraCostId, {
      invoiceId: invoiceId,
      invoicedDate: invoiceDate,
      updatedAt: Date.now(),
    });
  }
}
