import { v } from "convex/values";
import {
  authMutation,
  authQuery,
  authAction,
  authOrganizationQuery,
  authOrganizationMutation,
} from "./helpers";
import {
  internalAction,
  internalMutation,
  internalQuery,
  MutationCtx,
  query,
  QueryCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { Id, Doc } from "./_generated/dataModel";
import {
  generateInvoiceItemsFromExtraCosts,
  updateExtraCostsWithInvoice,
} from "./extraCosts";

// ==================== CRUD Operations ====================

export const createSubscription = authMutation(
  "admin",
  null
)({
  args: {
    projectId: v.id("projects"),
    organizationId: v.id("organizations"),
    title: v.string(),
    description: v.string(),
    subscriptionAmount: v.number(),
    tax: v.union(v.literal(0), v.literal(9), v.literal(21)),
    language: v.union(v.literal("en"), v.literal("nl")),
    subscriptionStartDate: v.number(),
    subscriptionEndDate: v.optional(v.union(v.null(), v.number())),
    discount: v.optional(v.union(v.null(), v.number())),
    discountType: v.union(v.literal("percentage"), v.literal("fixed")),
    discountPeriodInMonths: v.optional(v.union(v.null(), v.number())),
    internalNotes: v.optional(v.union(v.null(), v.string())),
  },
  handler: async (ctx, args) => {
    // Validate start date is not in past
    if (args.subscriptionStartDate < Date.now() - 1000 * 60 * 60 * 24) {
      throw new Error("Subscription start date cannot be in the past");
    }

    // Validate end date if provided
    if (args.subscriptionEndDate) {
      if (args.subscriptionEndDate <= args.subscriptionStartDate) {
        throw new Error("End date must be after start date");
      }
    }

    // Validate discount
    if (args.discount) {
      if (args.discountType === "percentage") {
        if (args.discount < 0 || args.discount > 100) {
          throw new Error("Discount percentage must be between 0 and 100");
        }
      } else {
        if (args.discount < 0 || args.discount >= args.subscriptionAmount) {
          throw new Error(
            "Fixed discount must be between 0 and subscription amount"
          );
        }
      }
    }

    // Determine status based on end date
    const status = args.subscriptionEndDate ? "cancelled" : "active";

    // Set discountStartDate to subscriptionStartDate if discount is provided at creation
    // This ensures discounts added at creation start from the subscription start date
    const discountStartDate =
      args.discount && args.discountPeriodInMonths
        ? args.subscriptionStartDate
        : null;

    return await ctx.db.insert("monthly_subscriptions", {
      organizationId: args.organizationId,
      projectId: args.projectId,
      title: args.title,
      description: args.description,
      subscriptionAmount: args.subscriptionAmount,
      tax: args.tax,
      language: args.language,
      subscriptionStartDate: args.subscriptionStartDate,
      subscriptionEndDate: args.subscriptionEndDate || null,
      discount: args.discount || null,
      discountType: args.discountType,
      discountPeriodInMonths: args.discountPeriodInMonths || null,
      discountStartDate: discountStartDate,
      internalNotes: args.internalNotes || null,
      subscriptionStatus: status,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateSubscription = authMutation(
  "admin",
  null
)({
  args: {
    subscriptionId: v.id("monthly_subscriptions"),
    title: v.optional(v.union(v.null(), v.string())),
    description: v.optional(v.union(v.null(), v.string())),
    subscriptionAmount: v.optional(v.union(v.null(), v.number())),
    tax: v.optional(
      v.union(v.null(), v.union(v.literal(0), v.literal(9), v.literal(21)))
    ),
    language: v.optional(
      v.union(v.null(), v.union(v.literal("en"), v.literal("nl")))
    ),
    subscriptionStartDate: v.optional(v.union(v.null(), v.number())),
    subscriptionEndDate: v.optional(v.union(v.null(), v.number())),
    discount: v.optional(v.union(v.null(), v.number())),
    discountType: v.optional(
      v.union(v.null(), v.union(v.literal("percentage"), v.literal("fixed")))
    ),
    discountPeriodInMonths: v.optional(v.union(v.null(), v.number())),
    internalNotes: v.optional(v.union(v.null(), v.string())),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.subscriptionId);
    if (!subscription) {
      throw new Error("Subscription not found");
    }

    // Prevent changes to cancelled subscriptions after end date
    if (
      subscription.subscriptionStatus === "cancelled" &&
      subscription.subscriptionEndDate &&
      subscription.subscriptionEndDate < Date.now()
    ) {
      throw new Error("Cannot update subscription that has ended");
    }

    // Validate dates
    const startDate =
      args.subscriptionStartDate ?? subscription.subscriptionStartDate;
    const endDate =
      args.subscriptionEndDate ?? subscription.subscriptionEndDate;

    if (endDate && endDate <= startDate) {
      throw new Error("End date must be after start date");
    }

    // Validate discount
    const amount = args.subscriptionAmount ?? subscription.subscriptionAmount;
    const discount = args.discount ?? subscription.discount;
    const discountType = args.discountType ?? subscription.discountType;

    if (discount) {
      if (discountType === "percentage") {
        if (discount < 0 || discount > 100) {
          throw new Error("Discount percentage must be between 0 and 100");
        }
      } else {
        if (discount < 0 || discount >= amount) {
          throw new Error(
            "Fixed discount must be between 0 and subscription amount"
          );
        }
      }
    }

    // Auto-set status to cancelled if endDate is set
    let status = subscription.subscriptionStatus;
    if (args.subscriptionEndDate !== undefined) {
      status = args.subscriptionEndDate ? "cancelled" : "active";
    }

    // Handle discountStartDate logic
    // If discount is being added/updated, set discountStartDate to now (or keep existing if discount already exists)
    let discountStartDate = subscription.discountStartDate ?? null;

    // If discount is being added (was null, now has value)
    const newDiscount = args.discount ?? subscription.discount;
    const newDiscountPeriod =
      args.discountPeriodInMonths ?? subscription.discountPeriodInMonths;

    if (newDiscount && newDiscountPeriod) {
      // If discount didn't exist before, or if discount is being changed, reset the start date
      if (
        !subscription.discount ||
        args.discount !== undefined ||
        args.discountPeriodInMonths !== undefined
      ) {
        // Set discount start date to current time (next invoice will start the discount period)
        discountStartDate = Date.now();
      }
    } else if (newDiscount === null || newDiscountPeriod === null) {
      // If discount is being removed, clear discountStartDate
      discountStartDate = null;
    }

    return await ctx.db.patch(args.subscriptionId, {
      title: args.title ?? subscription.title,
      description: args.description ?? subscription.description,
      subscriptionAmount:
        args.subscriptionAmount ?? subscription.subscriptionAmount,
      tax: args.tax ?? subscription.tax,
      language: args.language ?? subscription.language,
      subscriptionStartDate:
        args.subscriptionStartDate ?? subscription.subscriptionStartDate,
      subscriptionEndDate:
        args.subscriptionEndDate ?? subscription.subscriptionEndDate,
      discount: args.discount ?? subscription.discount,
      discountType: args.discountType ?? subscription.discountType,
      discountPeriodInMonths:
        args.discountPeriodInMonths ?? subscription.discountPeriodInMonths,
      discountStartDate: discountStartDate,
      internalNotes: args.internalNotes ?? subscription.internalNotes,
      subscriptionStatus: status,
      updatedAt: Date.now(),
    });
  },
});

export const deleteSubscription = authMutation(
  "admin",
  null
)({
  args: {
    subscriptionId: v.id("monthly_subscriptions"),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.subscriptionId);
    if (!subscription) {
      throw new Error("Subscription not found");
    }

    // Check if subscription has been invoiced
    if (subscription.lastInvoiceDate) {
      throw new Error(
        "Cannot delete subscription that has been invoiced. Cancel it instead."
      );
    }

    return await ctx.db.delete(args.subscriptionId);
  },
});

/**
 * Request subscription cancellation (client dashboard)
 * Creates a contact message and sends confirmation email
 * Does NOT automatically cancel the subscription
 */
export const requestSubscriptionCancellation = authOrganizationMutation(null)({
  args: {
    subscriptionId: v.id("monthly_subscriptions"),
    cancellationDate: v.optional(v.union(v.null(), v.number())),
    message: v.optional(v.union(v.null(), v.string())),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.subscriptionId);
    if (!subscription) {
      throw new Error("Subscription not found");
    }

    // Verify user has access to this subscription's organization
    if (subscription.organizationId !== args.organizationId) {
      throw new Error("Unauthorized");
    }

    // Get organization for name
    const organization = await ctx.db.get(args.organizationId);
    if (!organization) {
      throw new Error("Organization not found");
    }

    // Get user email
    const userEmail = ctx.user.email;
    if (!userEmail) {
      throw new Error("User email not found");
    }

    // Get project for organization name
    const project = await ctx.db.get(subscription.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Format cancellation date if provided
    const cancellationDateText = args.cancellationDate
      ? new Date(args.cancellationDate).toLocaleDateString(
          subscription.language === "nl" ? "nl-NL" : "en-US"
        )
      : null;

    // Create contact message
    const contactMessage = `Subscription Cancellation Request

Subscription: ${subscription.title}
Status: ${subscription.subscriptionStatus}
Amount: €${subscription.subscriptionAmount.toFixed(2)}/month
Start Date: ${new Date(subscription.subscriptionStartDate).toLocaleDateString(
      subscription.language === "nl" ? "nl-NL" : "en-US"
    )}${
      subscription.subscriptionEndDate
        ? `\nEnd Date: ${new Date(
            subscription.subscriptionEndDate
          ).toLocaleDateString(
            subscription.language === "nl" ? "nl-NL" : "en-US"
          )}`
        : ""
    }${
      cancellationDateText
        ? `\n\nRequested Cancellation Date: ${cancellationDateText}`
        : ""
    }${args.message ? `\n\nAdditional Message:\n${args.message}` : ""}`;

    // Insert contact message
    await ctx.db.insert("contact_regular_form", {
      name: ctx.user.name || "User",
      email: userEmail,
      subject: `Subscription Cancellation Request: ${subscription.title}`,
      message: contactMessage,
      read: false,
      userId: ctx.user._id,
      createdAt: Date.now(),
    });

    // Schedule email to be sent
    await ctx.scheduler.runAfter(
      0,
      internal.actions.sendSubscriptionCancellationEmail,
      {
        subscription: {
          _id: String(subscription._id),
          title: subscription.title,
          description: subscription.description,
          subscriptionAmount: subscription.subscriptionAmount,
          tax: subscription.tax,
          subscriptionStartDate: subscription.subscriptionStartDate,
          subscriptionEndDate: subscription.subscriptionEndDate,
          subscriptionStatus: subscription.subscriptionStatus,
          language: subscription.language,
        },
        contactPerson: {
          name: ctx.user.name || "User",
          email: userEmail,
          organizationName: organization.name,
        },
        cancellationDate: args.cancellationDate,
        message: args.message,
        portalUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://sleads.nl"}/dashboard/${args.organizationId}/projects/${subscription.projectId}/monthly-subscriptions`,
      }
    );

    return { success: true };
  },
});

export const getSubscriptions = authQuery("admin")({
  args: {
    projectId: v.optional(v.union(v.null(), v.id("projects"))),
    organizationId: v.optional(v.union(v.null(), v.id("organizations"))),
    status: v.optional(
      v.union(
        v.null(),
        v.union(
          v.literal("active"),
          v.literal("inactive"),
          v.literal("cancelled")
        )
      )
    ),
  },
  handler: async (ctx, args) => {
    let subscriptions = await ctx.db
      .query("monthly_subscriptions")
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

    // Filter by status if provided
    if (args.status) {
      subscriptions = subscriptions.filter(
        (s) => s.subscriptionStatus === args.status
      );
    }

    // Remove internal notes for non-admin users (though this is admin-only query)
    return subscriptions.map((sub) => ({
      ...sub,
      internalNotes: ctx.user.role === "admin" ? sub.internalNotes : null,
    }));
  },
});

export const getSubscription = authQuery("admin")({
  args: {
    subscriptionId: v.id("monthly_subscriptions"),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.subscriptionId);
    if (!subscription) {
      return null;
    }

    // Remove internal notes for non-admin users (though this is admin-only query)
    return {
      ...subscription,
      internalNotes:
        ctx.user.role === "admin" ? subscription.internalNotes : null,
    };
  },
});

/**
 * Get subscription titles by IDs (for displaying on invoice cards)
 */
export const getSubscriptionTitles = query({
  args: {
    subscriptionIds: v.array(v.id("monthly_subscriptions")),
  },
  handler: async (
    ctx: QueryCtx,
    args: { subscriptionIds: Id<"monthly_subscriptions">[] }
  ) => {
    const subscriptions = await Promise.all(
      args.subscriptionIds.map((id: Id<"monthly_subscriptions">) =>
        ctx.db.get(id)
      )
    );

    return subscriptions
      .filter((sub): sub is NonNullable<typeof sub> => sub !== null)
      .map((sub) => ({
        _id: sub._id,
        title: sub.title,
      }));
  },
});

/**
 * Get subscriptions for organization members (client dashboard)
 * Excludes internalNotes - never send to browser
 */
export const getSubscriptionsForOrganization = authOrganizationQuery(null)({
  args: {
    projectId: v.optional(v.union(v.null(), v.id("projects"))),
  },
  handler: async (ctx, args) => {
    const subscriptions = await ctx.db
      .query("monthly_subscriptions")
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

    // Remove internal notes - never send to browser
    return subscriptions.map((sub) => ({
      ...sub,
      internalNotes: null,
    }));
  },
});

// ==================== Calculation Utilities ====================

/**
 * Calculate the next invoice date based on project billing frequency and subscription dates
 */
export function calculateNextInvoiceDate(
  subscriptionStartDate: number,
  lastInvoiceDate: number | null,
  billingFrequency: "monthly" | "quarterly" | "semiannually" | "yearly"
): number {
  const baseDate = lastInvoiceDate || subscriptionStartDate;

  // Calculate months to add based on frequency
  let monthsToAdd = 1;
  switch (billingFrequency) {
    case "monthly":
      monthsToAdd = 1;
      break;
    case "quarterly":
      monthsToAdd = 3;
      break;
    case "semiannually":
      monthsToAdd = 6;
      break;
    case "yearly":
      monthsToAdd = 12;
      break;
  }

  // Calculate next invoice date
  const base = new Date(baseDate);
  const nextDate = new Date(base);
  nextDate.setMonth(nextDate.getMonth() + monthsToAdd);

  // Handle month-end edge cases (e.g., Jan 31 -> Feb 28/29)
  if (base.getDate() !== nextDate.getDate()) {
    // If day changed, it means we hit a month with fewer days
    // Set to last day of target month
    nextDate.setDate(0); // Go to last day of previous month (which is target month)
  }

  return nextDate.getTime();
}

/**
 * Calculate subscription amount for a period with discount applied
 */
export function calculateSubscriptionAmount(
  subscriptionAmount: number,
  discount: number | null,
  discountType: "percentage" | "fixed",
  discountPeriodInMonths: number | null,
  periodsSinceDiscountStart: number,
  monthsPerPeriod: number,
  actualQuantity: number // The actual quantity being invoiced (may be pro-rated)
): {
  amount: number;
  discountApplied: boolean;
  discountRemainingMonths: number | null; // Months remaining AFTER this invoice
  monthsRemainingAtStart: number | null; // Months remaining at START of this invoice
} {
  let amount = subscriptionAmount;
  let discountApplied = false;
  let discountRemainingMonths: number | null = null;
  let monthsRemainingAtStart: number | null = null;

  if (discount && discountPeriodInMonths) {
    // Convert billing periods to actual months that have been invoiced
    // For example: 1 quarterly period = 3 months, 1 monthly period = 1 month
    const monthsInvoicedSoFar = periodsSinceDiscountStart * monthsPerPeriod;

    // Calculate remaining months at the START of this invoice (before applying discount)
    monthsRemainingAtStart = discountPeriodInMonths - monthsInvoicedSoFar;

    // Calculate remaining months in the discount period AFTER this invoice
    // Use actualQuantity (which may be pro-rated) instead of monthsPerPeriod
    const monthsRemainingAfterThisInvoice =
      monthsRemainingAtStart - actualQuantity;

    // Discount applies if there are months remaining at the start of this invoice
    if (monthsRemainingAtStart > 0) {
      discountApplied = true;
      // Show remaining months AFTER this invoice (for display purposes)
      discountRemainingMonths = Math.max(0, monthsRemainingAfterThisInvoice);

      if (discountType === "percentage") {
        amount = subscriptionAmount * (1 - discount / 100);
      } else {
        amount = subscriptionAmount - discount;
      }
    }
  }

  return {
    amount,
    discountApplied,
    discountRemainingMonths,
    monthsRemainingAtStart,
  };
}

/**
 * Generate invoice items from active subscriptions
 */
export async function generateInvoiceItemsFromSubscriptions(
  ctx: MutationCtx,
  subscriptions: Doc<"monthly_subscriptions">[],
  invoiceDate: number,
  billingFrequency: "monthly" | "quarterly" | "semiannually" | "yearly",
  projectId: Id<"projects">
): Promise<{
  items: Array<{
    name: string;
    description: string;
    quantity: number;
    priceExclTax: number;
    tax: 0 | 9 | 21;
  }>;
  proRatedSubscriptions: Map<Id<"monthly_subscriptions">, number>; // Map of subscription ID to next invoice date
}> {
  const items: Array<{
    name: string;
    description: string;
    quantity: number;
    priceExclTax: number;
    tax: 0 | 9 | 21;
  }> = [];
  const proRatedSubscriptions = new Map<Id<"monthly_subscriptions">, number>();

  // Calculate months per billing period
  let monthsPerPeriod = 1;
  switch (billingFrequency) {
    case "monthly":
      monthsPerPeriod = 1;
      break;
    case "quarterly":
      monthsPerPeriod = 3;
      break;
    case "semiannually":
      monthsPerPeriod = 6;
      break;
    case "yearly":
      monthsPerPeriod = 12;
      break;
  }

  // Find the next invoice date for existing subscriptions in this project
  // This will be used to determine pro-rating for new subscriptions
  const allProjectSubscriptions = await ctx.db
    .query("monthly_subscriptions")
    .withIndex("by_projectId", (q) => q.eq("projectId", projectId))
    .collect();

  let nextInvoiceDateForExisting: number | null = null;
  for (const sub of allProjectSubscriptions) {
    if (sub.lastInvoiceDate !== null && sub.lastInvoiceDate !== undefined) {
      const nextDate = calculateNextInvoiceDate(
        sub.subscriptionStartDate,
        sub.lastInvoiceDate,
        billingFrequency
      );
      if (
        nextInvoiceDateForExisting === null ||
        nextDate < nextInvoiceDateForExisting
      ) {
        nextInvoiceDateForExisting = nextDate;
      }
    }
  }

  for (const subscription of subscriptions) {
    // Check if this is a pro-rated invoice (first invoice for a subscription that started mid-cycle)
    const isFirstInvoice =
      subscription.lastInvoiceDate === null ||
      subscription.lastInvoiceDate === undefined;

    // Calculate pro-rated months if this is a new subscription and there are existing subscriptions
    let proRatedMonths: number | null = null;
    if (isFirstInvoice && nextInvoiceDateForExisting !== null) {
      // Calculate months between subscription start and next invoice date for existing subscriptions
      const startDate = new Date(subscription.subscriptionStartDate);
      const nextDate = new Date(nextInvoiceDateForExisting);
      const monthsDiff =
        (nextDate.getFullYear() - startDate.getFullYear()) * 12 +
        (nextDate.getMonth() - startDate.getMonth());

      // If the subscription started before the next invoice date, we need pro-rating
      if (monthsDiff > 0 && monthsDiff < monthsPerPeriod) {
        proRatedMonths = monthsDiff;
        // Store the next invoice date for this pro-rated subscription
        proRatedSubscriptions.set(subscription._id, nextInvoiceDateForExisting);
      }
    }

    // Calculate how many billing periods have been invoiced since discount started
    // If discountStartDate exists, count periods from that date
    // Otherwise, count from subscription start (for backwards compatibility)
    let periodsSinceDiscountStart = 0;

    if (subscription.discountStartDate) {
      // Calculate periods since discount started
      const discountStart = subscription.discountStartDate;
      const lastInvoiceDate = subscription.lastInvoiceDate;

      // Check if discount has started (discountStartDate is in the past or equal to invoice date)
      const discountHasStarted = discountStart <= invoiceDate;

      if (
        lastInvoiceDate &&
        lastInvoiceDate >= discountStart &&
        discountHasStarted
      ) {
        // Calculate months between discount start and last invoice
        const discountStartDate = new Date(discountStart);
        const lastInvoice = new Date(lastInvoiceDate);
        const monthsDiff =
          (lastInvoice.getFullYear() - discountStartDate.getFullYear()) * 12 +
          (lastInvoice.getMonth() - discountStartDate.getMonth());

        // Calculate periods since discount started, add 1 for current invoice
        periodsSinceDiscountStart =
          Math.floor(monthsDiff / monthsPerPeriod) + 1;
      } else if (discountHasStarted) {
        // Discount has started (discountStartDate is in the past or now)
        // This is either the first invoice or discount was just added
        // For the first invoice, we haven't invoiced any periods yet
        // The discount will be applied to this invoice, so we start at 0 periods
        periodsSinceDiscountStart = 0;
      } else {
        // Discount hasn't started yet (discountStartDate is in the future)
        // Don't apply discount yet
        periodsSinceDiscountStart = 0;
        // Note: This case shouldn't happen for discounts created at subscription creation,
        // but could happen if discountStartDate is manually set to a future date
      }
    } else {
      // No discountStartDate (backwards compatibility or discount added at creation)
      // Calculate from subscription start date
      let periodsInvoiced = 0; // Changed from 1 to 0 - first invoice hasn't invoiced any periods yet

      if (
        subscription.lastInvoiceDate !== null &&
        subscription.lastInvoiceDate !== undefined
      ) {
        const startDate = subscription.subscriptionStartDate;
        const lastInvoiceDate = subscription.lastInvoiceDate;

        const start = new Date(startDate);
        const lastInvoice = new Date(lastInvoiceDate);
        const monthsDiff =
          (lastInvoice.getFullYear() - start.getFullYear()) * 12 +
          (lastInvoice.getMonth() - start.getMonth());

        periodsInvoiced = Math.floor(monthsDiff / monthsPerPeriod) + 1;
      }

      periodsSinceDiscountStart = periodsInvoiced;
    }

    // Determine the actual quantity (pro-rated or full period) FIRST
    const actualQuantity =
      proRatedMonths !== null ? proRatedMonths : monthsPerPeriod;

    // Calculate discount information - pass actualQuantity so it can calculate correctly
    const {
      amount: discountedAmount,
      discountApplied,
      discountRemainingMonths,
      monthsRemainingAtStart,
    } = calculateSubscriptionAmount(
      subscription.subscriptionAmount,
      subscription.discount ?? null,
      subscription.discountType,
      subscription.discountPeriodInMonths ?? null,
      periodsSinceDiscountStart,
      monthsPerPeriod,
      actualQuantity
    );

    const fullAmount = subscription.subscriptionAmount;
    const discountText =
      subscription.discount && subscription.discountType === "percentage"
        ? `${subscription.discount}%`
        : subscription.discount
          ? `€${subscription.discount.toFixed(2)}`
          : "";

    // Check if discount partially covers this billing period
    // Only split if discount will end DURING this billing period (not after)
    // monthsRemainingAtStart = months of discount available at START of this invoice
    // If monthsRemainingAtStart >= actualQuantity, discount covers full period (no split)
    // If monthsRemainingAtStart > 0 but < actualQuantity, discount ends during period (split needed)
    // IMPORTANT: We should NOT split if discount covers the full period
    // The split should only happen when discount ends partway through the billing period
    const shouldSplit =
      discountApplied &&
      monthsRemainingAtStart !== null &&
      monthsRemainingAtStart > 0 &&
      monthsRemainingAtStart < actualQuantity &&
      actualQuantity > 0; // Safety check to prevent negative quantities

    if (shouldSplit) {
      // Split into discounted and non-discounted items
      // Ensure we don't create negative quantities
      const discountedMonths = Math.min(
        monthsRemainingAtStart!,
        actualQuantity
      );
      const nonDiscountedMonths = Math.max(
        0,
        actualQuantity - monthsRemainingAtStart!
      );

      // Only add items if quantities are valid
      if (discountedMonths > 0) {
        // Add discounted items - these are the last months with discount
        const discountEndedDesc =
          subscription.language === "nl"
            ? `Kortingsperiode beëindigd`
            : `Discount period ended`;

        let discountedDescription = `${subscription.description} (${discountEndedDesc})`;
        if (proRatedMonths !== null && discountedMonths === proRatedMonths) {
          // If all pro-rated months are discounted, add pro-rating info
          const proRateDesc =
            subscription.language === "nl"
              ? `Pro-rata voor ${proRatedMonths} ${proRatedMonths === 1 ? "maand" : "maanden"} tot volgende factuurdatum`
              : `Pro-rated for ${proRatedMonths} ${proRatedMonths === 1 ? "month" : "months"} until next invoice date`;
          discountedDescription = `${subscription.description} (${proRateDesc}, ${discountEndedDesc})`;
        }

        items.push({
          name: subscription.title,
          description: discountedDescription,
          quantity: discountedMonths,
          priceExclTax: discountedAmount,
          tax: subscription.tax,
        });
      }

      if (nonDiscountedMonths > 0) {
        // Add non-discounted items - these are after discount ended
        let nonDiscountedDescription = subscription.description;
        if (proRatedMonths !== null && nonDiscountedMonths < proRatedMonths) {
          // If we're in a pro-rated period, add pro-rating info
          const proRateDesc =
            subscription.language === "nl"
              ? `Pro-rata voor ${nonDiscountedMonths} ${nonDiscountedMonths === 1 ? "maand" : "maanden"} tot volgende factuurdatum`
              : `Pro-rated for ${nonDiscountedMonths} ${nonDiscountedMonths === 1 ? "month" : "months"} until next invoice date`;
          nonDiscountedDescription = `${subscription.description} (${proRateDesc})`;
        }

        items.push({
          name: subscription.title,
          description: nonDiscountedDescription,
          quantity: nonDiscountedMonths,
          priceExclTax: fullAmount,
          tax: subscription.tax,
        });
      }
    } else if (
      discountApplied &&
      discountRemainingMonths !== null &&
      discountRemainingMonths > 0
    ) {
      // Full billing period is covered by discount
      const monthsText = discountRemainingMonths === 1 ? "month" : "months";
      const discountDesc =
        subscription.language === "nl"
          ? `${discountText} korting resterend voor ${discountRemainingMonths} ${monthsText === "month" ? "maand" : "maanden"}`
          : `${discountText} discount remaining for ${discountRemainingMonths} ${monthsText}`;
      // Build description with pro-rating info if applicable
      let description = `${subscription.description} (${discountDesc})`;
      if (proRatedMonths !== null) {
        const proRateDesc =
          subscription.language === "nl"
            ? `Pro-rata voor ${proRatedMonths} ${proRatedMonths === 1 ? "maand" : "maanden"} tot volgende factuurdatum`
            : `Pro-rated for ${proRatedMonths} ${proRatedMonths === 1 ? "month" : "months"} until next invoice date`;
        description = `${subscription.description} (${proRateDesc}, ${discountDesc})`;
      }

      items.push({
        name: subscription.title,
        description: description,
        quantity: actualQuantity,
        priceExclTax: discountedAmount,
        tax: subscription.tax,
      });
    } else {
      // No discount or discount has expired
      let description = subscription.description;
      if (proRatedMonths !== null) {
        const proRateDesc =
          subscription.language === "nl"
            ? `Pro-rata voor ${proRatedMonths} ${proRatedMonths === 1 ? "maand" : "maanden"} tot volgende factuurdatum`
            : `Pro-rated for ${proRatedMonths} ${proRatedMonths === 1 ? "month" : "months"} until next invoice date`;
        description = `${subscription.description} (${proRateDesc})`;
      }

      items.push({
        name: subscription.title,
        description: description,
        quantity: actualQuantity,
        priceExclTax: fullAmount,
        tax: subscription.tax,
      });
    }
  }

  return { items, proRatedSubscriptions };
}

// ==================== Invoice Generation ====================

export const createSubscriptionInvoice = internalMutation({
  args: {
    projectId: v.id("projects"),
    organizationId: v.id("organizations"),
    skipEmail: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get project to check billing frequency
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    if (!project.monthlySubscriptionType) {
      throw new Error("Project does not have a billing frequency set");
    }

    // Get all active subscriptions for this project
    const subscriptions = await ctx.db
      .query("monthly_subscriptions")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("subscriptionStatus"), "active"))
      .collect();

    // Also include cancelled subscriptions that haven't reached end date
    const cancelledSubscriptions = await ctx.db
      .query("monthly_subscriptions")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .filter((q) => q.eq(q.field("subscriptionStatus"), "cancelled"))
      .collect();

    const activeCancelledSubscriptions = cancelledSubscriptions.filter(
      (sub) => sub.subscriptionEndDate && sub.subscriptionEndDate > Date.now()
    );

    const allSubscriptions = [
      ...subscriptions,
      ...activeCancelledSubscriptions,
    ];

    if (allSubscriptions.length === 0) {
      return null; // No subscriptions to invoice
    }

    // Check which subscriptions need invoicing
    const subscriptionsToInvoice: typeof allSubscriptions = [];
    const subscriptionIds: Id<"monthly_subscriptions">[] = [];
    const now = Date.now();

    for (const subscription of allSubscriptions) {
      // Check if subscription hasn't ended
      if (
        subscription.subscriptionEndDate &&
        subscription.subscriptionEndDate <= now
      ) {
        continue; // Skip subscriptions that have ended
      }

      // If subscription has never been invoiced, invoice it if start date is today or in the past
      if (
        subscription.lastInvoiceDate === null ||
        subscription.lastInvoiceDate === undefined
      ) {
        if (subscription.subscriptionStartDate <= now) {
          subscriptionsToInvoice.push(subscription);
          subscriptionIds.push(subscription._id);
        }
        continue;
      }

      // For subscriptions that have been invoiced before, check if next invoice date has arrived
      const nextInvoiceDate = calculateNextInvoiceDate(
        subscription.subscriptionStartDate,
        subscription.lastInvoiceDate,
        project.monthlySubscriptionType
      );

      // Check if subscription should be invoiced
      if (nextInvoiceDate <= now) {
        subscriptionsToInvoice.push(subscription);
        subscriptionIds.push(subscription._id);
      }
    }

    if (subscriptionsToInvoice.length === 0) {
      return null; // No subscriptions need invoicing yet
    }

    // Generate invoice items from subscriptions
    const { items: invoiceItems, proRatedSubscriptions } =
      await generateInvoiceItemsFromSubscriptions(
        ctx,
        subscriptionsToInvoice,
        now,
        project.monthlySubscriptionType,
        args.projectId
      );

    // Determine language (use the most common language among subscriptions, or default to "en")
    const languageCounts: Record<"en" | "nl", number> = { en: 0, nl: 0 };
    for (const subscription of subscriptionsToInvoice) {
      languageCounts[subscription.language]++;
    }
    const language = languageCounts.nl > languageCounts.en ? "nl" : "en";

    // Get the highest invoice number
    const [maxInvoice] = await ctx.db.query("invoices").order("desc").take(1);
    const invoiceNumber = maxInvoice ? maxInvoice.invoiceNumber + 1 : 1;

    // Generate invoice items from extra costs (need invoiceId for link)
    // We'll create the invoice first with subscription items, then add extra costs items
    const allInvoiceItems = [...invoiceItems];

    // Calculate due date (14 days from invoice date)
    const dueDate = now + 14 * 24 * 60 * 60 * 1000;

    // Create invoice with subscription items first
    const invoiceId = await ctx.db.insert("invoices", {
      projectId: args.projectId,
      organizationId: args.organizationId,
      invoiceNumber: invoiceNumber,
      invoiceIdentifiefier: `I-${new Date().getFullYear()}-${String(invoiceNumber).padStart(6, "0")}`,
      invoiceItems: allInvoiceItems,
      invoiceStatus: "draft",
      language: language as "en" | "nl",
      invoiceDate: now,
      invoiceDueDate: dueDate,
      subscriptionIds: subscriptionIds,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Now generate extra costs items with the actual invoiceId
    const { items: extraCostItems, extraCostIds } =
      await generateInvoiceItemsFromExtraCosts(
        ctx,
        args.projectId,
        args.organizationId,
        invoiceId,
        language
      );

    // Add extra costs items to the invoice if there are any
    if (extraCostItems.length > 0) {
      const updatedInvoiceItems = [...allInvoiceItems, ...extraCostItems];
      await ctx.db.patch(invoiceId, {
        invoiceItems: updatedInvoiceItems,
        updatedAt: Date.now(),
      });

      // Update extra costs with invoice information
      await updateExtraCostsWithInvoice(ctx, extraCostIds, invoiceId, now);
    }

    // Update lastInvoiceDate for all invoiced subscriptions
    // For new subscriptions that were pro-rated, set lastInvoiceDate so the next invoice aligns
    // with existing subscriptions (nextInvoiceDate - billingPeriod)
    for (const subscription of subscriptionsToInvoice) {
      // Check if this subscription was pro-rated
      if (proRatedSubscriptions.has(subscription._id)) {
        // Calculate the lastInvoiceDate that will result in the next invoice being on the target date
        // If next invoice should be on Jan 1 and billing is quarterly, set lastInvoiceDate to Oct 1
        const nextInvoiceDate = proRatedSubscriptions.get(subscription._id)!;
        const nextDate = new Date(nextInvoiceDate);
        let monthsToSubtract = 1;
        switch (project.monthlySubscriptionType) {
          case "monthly":
            monthsToSubtract = 1;
            break;
          case "quarterly":
            monthsToSubtract = 3;
            break;
          case "semiannually":
            monthsToSubtract = 6;
            break;
          case "yearly":
            monthsToSubtract = 12;
            break;
        }
        nextDate.setMonth(nextDate.getMonth() - monthsToSubtract);
        await ctx.db.patch(subscription._id, {
          lastInvoiceDate: nextDate.getTime(),
          updatedAt: Date.now(),
        });
      } else {
        // Normal invoice, update lastInvoiceDate to now
        await ctx.db.patch(subscription._id, {
          lastInvoiceDate: now,
          updatedAt: Date.now(),
        });
      }
    }

    // Check if any cancelled subscriptions have reached their end date
    for (const subscription of activeCancelledSubscriptions) {
      if (
        subscription.subscriptionEndDate &&
        subscription.subscriptionEndDate <= now
      ) {
        await ctx.db.patch(subscription._id, {
          subscriptionStatus: "inactive",
          updatedAt: Date.now(),
        });
      }
    }

    // Only generate PDF and send email if skipEmail is not true
    if (!args.skipEmail) {
      const uploadUrl = await ctx.storage.generateUploadUrl();
      await ctx.scheduler.runAfter(0, internal.invoice.generatePdfAndUpload, {
        invoiceId: invoiceId,
        uploadUrl: uploadUrl,
      });
    }

    return invoiceId;
  },
});

// ==================== Internal Query for Projects ====================

export const getAllProjectsWithBilling = internalQuery({
  args: {},
  handler: async (ctx) => {
    const allProjects = await ctx.db.query("projects").collect();
    return allProjects.filter(
      (p) =>
        p.monthlySubscriptionType !== null &&
        p.monthlySubscriptionType !== undefined
    );
  },
});

export const generateUploadUrlInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// ==================== Cron Job Function ====================

export const checkAndInvoiceSubscriptions = internalAction({
  args: {},
  handler: async (ctx) => {
    // Get all projects with monthlySubscriptionType set
    const projectsWithBilling = await ctx.runQuery(
      internal.monthlysubscriptions.getAllProjectsWithBilling
    );

    const results: Array<{
      projectId: Id<"projects">;
      invoiceId?: Id<"invoices">;
      success: boolean;
      error?: string;
    }> = [];

    for (const project of projectsWithBilling) {
      try {
        const invoiceId = await ctx.runMutation(
          internal.monthlysubscriptions.createSubscriptionInvoice,
          {
            projectId: project._id,
            organizationId: project.organizationId,
          }
        );

        if (invoiceId) {
          // Generate upload URL via mutation and send invoice
          const uploadUrl = await ctx.runMutation(
            internal.monthlysubscriptions.generateUploadUrlInternal
          );

          await ctx.scheduler.runAfter(
            0,
            internal.invoice.generatePdfAndUpload,
            {
              invoiceId: invoiceId,
              uploadUrl: uploadUrl,
            }
          );

          results.push({
            projectId: project._id,
            invoiceId: invoiceId,
            success: true,
          });
        }
      } catch (error) {
        console.error(
          `Error processing subscriptions for project ${project._id}:`,
          error
        );
        results.push({
          projectId: project._id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  },
});

// ==================== Testing/Development Utilities ====================

/**
 * Internal query to get project for testing
 */
export const getProjectForTesting = internalQuery({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.projectId);
  },
});

/**
 * Manually trigger invoice generation for a specific project (for testing)
 * This bypasses the cron job and allows immediate testing
 * Note: This is an action because it needs to call internal mutations
 */
export const manuallyTriggerInvoiceGeneration = authAction(
  "admin",
  null
)({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (
    ctx,
    args
  ): Promise<{
    success: boolean;
    invoiceId?: Id<"invoices">;
    message: string;
  }> => {
    // Get project to verify it exists and has billing frequency
    const project = await ctx.runQuery(
      internal.monthlysubscriptions.getProjectForTesting,
      {
        projectId: args.projectId,
      }
    );

    if (!project) {
      throw new Error("Project not found");
    }

    if (!project.monthlySubscriptionType) {
      throw new Error("Project does not have a billing frequency set");
    }

    // Use internal mutation to create invoice
    const invoiceId: Id<"invoices"> | null = await ctx.runMutation(
      internal.monthlysubscriptions.createSubscriptionInvoice,
      {
        projectId: args.projectId,
        organizationId: project.organizationId,
      }
    );

    if (!invoiceId) {
      return {
        success: false,
        message: "No subscriptions needed invoicing at this time",
      };
    }

    // Generate upload URL and send invoice
    const uploadUrl = await ctx.runMutation(
      internal.monthlysubscriptions.generateUploadUrlInternal
    );

    await ctx.scheduler.runAfter(0, internal.invoice.generatePdfAndUpload, {
      invoiceId: invoiceId,
      uploadUrl: uploadUrl,
    });

    return {
      success: true,
      invoiceId: invoiceId,
      message: "Invoice generated and will be sent shortly",
    };
  },
});

/**
 * Simulate time passing by updating lastInvoiceDate for testing
 * This allows you to test invoice generation without waiting for actual time to pass
 */
export const simulateTimePassage = authMutation(
  "admin",
  null
)({
  args: {
    subscriptionId: v.id("monthly_subscriptions"),
    daysToSubtract: v.number(), // Number of days to subtract from lastInvoiceDate
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.subscriptionId);
    if (!subscription) {
      throw new Error("Subscription not found");
    }

    const currentLastInvoiceDate =
      subscription.lastInvoiceDate || subscription.subscriptionStartDate;
    const newLastInvoiceDate =
      currentLastInvoiceDate - args.daysToSubtract * 24 * 60 * 60 * 1000;

    await ctx.db.patch(args.subscriptionId, {
      lastInvoiceDate: newLastInvoiceDate,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      previousLastInvoiceDate: currentLastInvoiceDate,
      newLastInvoiceDate: newLastInvoiceDate,
      message: `Simulated ${args.daysToSubtract} days passing. Last invoice date updated.`,
    };
  },
});

/**
 * Reset lastInvoiceDate for a subscription (useful for testing)
 */
export const resetLastInvoiceDate = authMutation(
  "admin",
  null
)({
  args: {
    subscriptionId: v.id("monthly_subscriptions"),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.subscriptionId);
    if (!subscription) {
      throw new Error("Subscription not found");
    }

    await ctx.db.patch(args.subscriptionId, {
      lastInvoiceDate: null,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      message: "Last invoice date has been reset",
    };
  },
});

/**
 * Get next invoice date for a subscription (for testing/display)
 */
export const getNextInvoiceDate = authQuery("admin")({
  args: {
    subscriptionId: v.id("monthly_subscriptions"),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db.get(args.subscriptionId);
    if (!subscription) {
      throw new Error("Subscription not found");
    }

    const project = await ctx.db.get(subscription.projectId);
    if (!project || !project.monthlySubscriptionType) {
      throw new Error("Project not found or billing frequency not set");
    }

    const nextInvoiceDate = calculateNextInvoiceDate(
      subscription.subscriptionStartDate,
      subscription.lastInvoiceDate ?? null,
      project.monthlySubscriptionType
    );

    return {
      nextInvoiceDate: nextInvoiceDate,
      nextInvoiceDateFormatted: new Date(nextInvoiceDate).toISOString(),
      lastInvoiceDate: subscription.lastInvoiceDate,
      lastInvoiceDateFormatted: subscription.lastInvoiceDate
        ? new Date(subscription.lastInvoiceDate).toISOString()
        : null,
      startDate: subscription.subscriptionStartDate,
      startDateFormatted: new Date(
        subscription.subscriptionStartDate
      ).toISOString(),
      billingFrequency: project.monthlySubscriptionType,
      daysUntilNextInvoice: Math.ceil(
        (nextInvoiceDate - Date.now()) / (24 * 60 * 60 * 1000)
      ),
    };
  },
});

// ==================== Testing Helper Functions ====================

/**
 * Internal mutation to update test subscription dates (bypasses normal validation)
 */
export const updateTestSubscriptionDates = internalMutation({
  args: {
    subscriptionId: v.id("monthly_subscriptions"),
    discountStartDate: v.optional(v.number()),
    lastInvoiceDate: v.optional(v.number()),
    subscriptionStartDate: v.optional(v.number()),
    subscriptionEndDate: v.optional(v.union(v.null(), v.number())),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    };
    if (args.discountStartDate !== undefined) {
      updates.discountStartDate = args.discountStartDate;
    }
    if (args.lastInvoiceDate !== undefined) {
      updates.lastInvoiceDate = args.lastInvoiceDate;
    }
    if (args.subscriptionStartDate !== undefined) {
      updates.subscriptionStartDate = args.subscriptionStartDate;
    }
    if (args.subscriptionEndDate !== undefined) {
      updates.subscriptionEndDate = args.subscriptionEndDate;
    }

    return await ctx.db.patch(args.subscriptionId, updates);
  },
});

/**
 * Internal mutation to update subscription status for testing
 */
export const updateTestSubscriptionStatus = internalMutation({
  args: {
    subscriptionId: v.id("monthly_subscriptions"),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.subscriptionId, {
      subscriptionStatus: args.status,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Internal query to get invoice for testing
 */
export const getInvoiceForTesting = internalQuery({
  args: {
    invoiceId: v.id("invoices"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.invoiceId);
  },
});

/**
 * Internal mutation to delete test subscription (bypasses normal validation)
 */
export const deleteTestSubscription = internalMutation({
  args: {
    subscriptionId: v.id("monthly_subscriptions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.subscriptionId);
  },
});

/**
 * Internal mutation to create test subscription (bypasses normal validation)
 */
export const createTestSubscriptionInternal = internalMutation({
  args: {
    projectId: v.id("projects"),
    organizationId: v.id("organizations"),
    title: v.string(),
    description: v.string(),
    subscriptionAmount: v.number(),
    tax: v.union(v.literal(0), v.literal(9), v.literal(21)),
    language: v.union(v.literal("en"), v.literal("nl")),
    subscriptionStartDate: v.number(),
    subscriptionEndDate: v.optional(v.union(v.null(), v.number())),
    discount: v.optional(v.union(v.null(), v.number())),
    discountType: v.union(v.literal("percentage"), v.literal("fixed")),
    discountPeriodInMonths: v.optional(v.union(v.null(), v.number())),
    discountStartDate: v.optional(v.union(v.null(), v.number())),
    lastInvoiceDate: v.optional(v.union(v.null(), v.number())),
    subscriptionStatus: v.optional(
      v.union(
        v.literal("active"),
        v.literal("inactive"),
        v.literal("cancelled")
      )
    ),
  },
  handler: async (ctx, args) => {
    const status =
      args.subscriptionStatus ??
      (args.subscriptionEndDate ? "cancelled" : "active");

    const subscriptionId = await ctx.db.insert("monthly_subscriptions", {
      organizationId: args.organizationId,
      projectId: args.projectId,
      title: args.title,
      description: args.description,
      subscriptionAmount: args.subscriptionAmount,
      tax: args.tax,
      language: args.language,
      subscriptionStartDate: args.subscriptionStartDate,
      subscriptionEndDate: args.subscriptionEndDate || null,
      discount: args.discount ?? null,
      discountType: args.discountType,
      discountPeriodInMonths: args.discountPeriodInMonths ?? null,
      discountStartDate: args.discountStartDate ?? null,
      lastInvoiceDate: args.lastInvoiceDate || null,
      subscriptionStatus: status,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return subscriptionId;
  },
});

/**
 * Internal query to get subscription for testing
 */
export const getSubscriptionForTesting = internalQuery({
  args: {
    subscriptionId: v.id("monthly_subscriptions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.subscriptionId);
  },
});

/**
 * Internal mutation to delete test invoice (bypasses normal validation)
 */
export const deleteTestInvoice = internalMutation({
  args: {
    invoiceId: v.id("invoices"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.invoiceId);
  },
});
