import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { betterAuth } from "better-auth";
import { admin, organization } from "better-auth/plugins";
import { ac, admin as adminRole, user as userRole } from "./permissions";
import { Resend } from "resend";
import { renderVerificationEmail } from "../src/app/email-designs/verification-email";
import { renderForgotPasswordEmail } from "../src/app/email-designs/forgot-password-email";
import authSchema from "./betterAuth/schema";
import { ComponentApi } from "@convex-dev/better-auth/_generated/component.js";

const siteUrl = process.env.SITE_URL!;

// The component client has methods needed for integrating Convex with Better Auth,
// as well as helper methods for general use.

const ADMIN_USER_IDS = process.env.ADMIN_USER_IDS?.split(",") ?? [];

export const authComponent = createClient<DataModel, typeof authSchema>(
  components.betterAuth as unknown as ComponentApi<"betterAuth">,
  {
    local: {
      schema: authSchema,
    },
  }
);

type BetterAuthOptions = Parameters<typeof betterAuth>[0];
type BetterAuthDatabase = BetterAuthOptions["database"];

export const createAuth = (
  ctx: GenericCtx<DataModel>,
  { optionsOnly } = { optionsOnly: false }
) => {
  return betterAuth({
    // disable logging when createAuth is called just to generate options.
    // this is not required, but there's a lot of noise in logs without it.
    logger: {
      disabled: optionsOnly,
    },
    baseURL: siteUrl,
    trustedOrigins: [
      siteUrl,
      ...(process.env.TRUSTED_ORIGINS
        ? process.env.TRUSTED_ORIGINS.split(",")
        : []),
    ],
    database: authComponent.adapter(ctx) as BetterAuthDatabase,
    // Configure simple, non-verified email/password to get started
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: async ({ user, url, token }) => {
        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
          console.error("RESEND_API_KEY is not defined");
          return;
        }

        const resend = new Resend(resendApiKey);
        const emailHtml = await renderForgotPasswordEmail({
          email: user.email,
          url,
          name: user.name,
          token,
        });

        await resend.emails.send({
          from: "Sleads Security <no-reply@authentication.sleads.nl>", // Make sure to update this with your verified domain
          to: user.email,
          subject: "Reset your Sleads password 🔐",
          html: emailHtml,
        });
      },
    },
    account: {
      accountLinking: {
        enabled: true,
        allowSameEmail: true,
      },
    },
    socialProviders: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      },
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        accessType: "offline",
        prompt: "select_account consent",
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url, token }) => {
        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
          console.error("RESEND_API_KEY is not defined");
          return;
        }

        const resend = new Resend(resendApiKey);
        const emailHtml = await renderVerificationEmail({
          email: user.email,
          url,
          token,
          name: user.name,
        });

        await resend.emails.send({
          from: "Sleads Email Verification <no-reply@authentication.sleads.nl>", // Make sure to update this with your verified domain
          to: user.email,
          subject: "Finish your Sleads account setup 🚀!",
          html: emailHtml,
        });
      },
    },

    plugins: [
      // The Convex plugin is required for Convex compatibility
      convex(),
      admin({
        ac,
        roles: {
          admin: adminRole,
          user: userRole,
        },
        adminUserIds: ADMIN_USER_IDS,
      }),
      organization(),
    ],
  });
};

// Example function for getting the current user
// Feel free to edit, omit, etc.
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.getAuthUser(ctx);
  },
});
