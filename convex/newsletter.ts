import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const subscribeToNewsletter = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const { email } = args;
    const existingSubscription = await ctx.db
      .query("newsletter_subscriptions")
      .filter((q) => q.eq(q.field("email"), email))
      .first();
    if (existingSubscription) {
      throw new Error("Email already subscribed");
    }
    const subscriptionId = await ctx.db.insert("newsletter_subscriptions", {
      email,
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.actions.sendNewsletter, {
      email,
      subscriptionId,
    });

    return { subscriptionId };
  },
});

export const getNewsletterSubscriptions = query({
  handler: async (ctx) => {
    return await ctx.db.query("newsletter_subscriptions").collect();
  },
});

export const unsubscribeFromNewsletter = mutation({
  args: {
    subscriptionId: v.id("newsletter_subscriptions"),
  },
  handler: async (ctx, args) => {
    const { subscriptionId } = args;
    const subscription = await ctx.db.get(subscriptionId);

    if (subscription) {
      // Send email first (or schedule it) before deleting, though scheduling works even if deleted as we pass the email string.
      await ctx.scheduler.runAfter(0, internal.actions.sendUnsubscribeEmail, {
        email: subscription.email,
      });

      await ctx.db.delete(subscriptionId);
    }

    return { success: true };
  },
});

// export const makeAdmin = mutation({
//   args: {},
//   handler: async (ctx) => {
//     try {
//       const user = await authComponent.getAuthUser(ctx);
//       if (!user) {
//         throw new Error("User not found");
//       }

//       const auth = await createAuth(ctx, { optionsOnly: true });
//       await auth.api.setRole({
//         body: {
//           userId: user._id.toString(),
//           role: "admin",
//         },
//         headers: {
//           "Content-Type": "application/json",
//         },
//       });

//       return { success: true };
//     } catch (error) {
//       console.error("Failed to make admin", error);
//       return { success: false, error: "Failed to make admin" };
//     }
//   },
// });
