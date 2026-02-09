import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Only register cron jobs in production to avoid duplicate API costs in development
// Set ENABLE_BLOG_CRONS=false in your development Convex deployment environment variables
// to disable blog generation crons
const enableBlogCrons = process.env.ENABLE_BLOG_CRONS !== "false";

if (enableBlogCrons) {
  // Generate 7 blog posts per day at optimal times
  // Times are in UTC, adjusted for Dutch timezone (CET = UTC+1, CEST = UTC+2)
  // These times target peak engagement hours in Central European Time

  // 1. Early morning (7:00 CET = 6:00 UTC)
  crons.cron(
    "generate-blog-morning-early",
    "0 6 * * *",
    internal.generateblog.scheduledBlogGeneration,
  );

  // 3. Lunch time (12:00 CET = 11:00 UTC)
  crons.cron(
    "generate-blog-noon",
    "0 11 * * *",
    internal.generateblog.scheduledBlogGeneration,
  );

  // 6. Evening (18:00 CET = 17:00 UTC)
  crons.cron(
    "generate-blog-evening",
    "0 17 * * *",
    internal.generateblog.scheduledBlogGeneration,
  );
}

// Subscription invoicing cron - runs daily at 9 AM UTC
crons.cron(
  "check-subscription-invoices",
  "0 9 * * *",
  internal.monthlysubscriptions.checkAndInvoiceSubscriptions,
);

export default crons;
