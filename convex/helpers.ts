import {
  customMutation,
  customQuery,
  customAction,
} from "convex-helpers/server/customFunctions";

import {
  mutation,
  query,
  MutationCtx,
  QueryCtx,
  ActionCtx,
  action,
} from "./_generated/server";

import { authComponent, createAuth } from "./auth";
import { Doc as BetterAuthDoc } from "./betterAuth/_generated/dataModel";
import { Doc } from "./_generated/dataModel";
import { v } from "convex/values";

// ✅ exact inferred types - use ReturnType of createAuth directly
export type BetterAuthInstance = ReturnType<typeof createAuth>;
export type BetterHeaders = Headers;

export type AuthUserDoc = BetterAuthDoc<"user">;

export type AuthQueryCtx = Omit<QueryCtx, "auth"> & {
  user: AuthUserDoc;
  auth: BetterAuthInstance;
  headers: BetterHeaders;
};

export type AuthMutationCtx = Omit<MutationCtx, "auth"> & {
  user: AuthUserDoc;
  auth: BetterAuthInstance;
  headers: BetterHeaders;
};

export type AuthActionCtx = Omit<ActionCtx, "auth"> & {
  user: AuthUserDoc;
  auth: BetterAuthInstance;
  headers: BetterHeaders;
};

export type InternalCMSMutationCtx = Omit<MutationCtx, "project"> & {
  project: Doc<"projects">;
};

export const authQuery = (role: string | null) =>
  customQuery(query, {
    args: {},
    input: async (ctx, args) => {
      const user = await authComponent.getAuthUser(ctx);
      if (!user) throw new Error("Unauthorized");

      const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

      const newCtx = {
        ...ctx,
        user,
        auth,
        headers,
      } satisfies AuthQueryCtx;

      if (role && user.role !== role) {
        throw new Error("Unauthorized");
      }

      return { ctx: newCtx, args };
    },
  });

export const authOrganizationQuery = (role: string | null) =>
  customQuery(query, {
    args: {
      organizationId: v.id("organizations"),
    },
    input: async (ctx, args) => {
      const user = await authComponent.getAuthUser(ctx);
      if (!user) throw new Error("Unauthorized");

      const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

      const newCtx = {
        ...ctx,
        user,
        auth,
        headers,
      } satisfies AuthQueryCtx;

      if (args.organizationId) {
        if (args.organizationId) {
          const isMember = await checkOrganizationMembership(
            newCtx,
            args.organizationId
          );
          if (!isMember) {
            throw new Error("Unauthorized");
          }
        } else {
          throw new Error("Organization ID is required");
        }
      } else if (role && user.role !== role) {
        throw new Error("Unauthorized");
      }

      return { ctx: newCtx, args };
    },
  });

export const authMutation = (
  role: string | null,
  organizationId: string | null
) =>
  customMutation(mutation, {
    args: {},
    input: async (ctx, args) => {
      const user = await authComponent.getAuthUser(ctx);
      if (!user) throw new Error("Unauthorized");

      const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

      const newCtx = {
        ...ctx,
        user,
        auth,
        headers,
      } satisfies AuthMutationCtx;

      if (organizationId) {
        const member = await checkOrganizationMembership(
          newCtx,
          organizationId
        );
        if (!member) {
          throw new Error("Unauthorized");
        }
        if (member.role !== role) {
          throw new Error("Unauthorized");
        }
      } else if (role && user.role !== role) {
        throw new Error("Unauthorized");
      }

      return { ctx: newCtx, args };
    },
  });

export const internalCMSMutation = () =>
  customMutation(mutation, {
    args: {
      cmsKey: v.string(),
    },
    input: async (ctx, args) => {
      const project = await ctx.db
        .query("projects")
        .withIndex("by_cmsKey", (q) => q.eq("cmsKey", args.cmsKey))
        .first();
      if (!project) throw new Error("Project not found");

      const newCtx = {
        ...ctx,
        project,
      } satisfies InternalCMSMutationCtx;

      return { ctx: newCtx, args };
    },
  });

export const authOrganizationMutation = (role: string | null) =>
  customMutation(mutation, {
    args: {
      organizationId: v.id("organizations"),
    },
    input: async (ctx, args) => {
      const user = await authComponent.getAuthUser(ctx);
      if (!user) throw new Error("Unauthorized");

      const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

      const newCtx = {
        ...ctx,
        user,
        auth,
        headers,
      } satisfies AuthMutationCtx;

      if (args.organizationId) {
        if (args.organizationId) {
          const isMember = await checkOrganizationMembership(
            newCtx,
            args.organizationId
          );
          if (!isMember) {
            throw new Error("Unauthorized");
          }
        } else {
          throw new Error("Organization ID is required");
        }
      } else if (role && user.role !== role) {
        throw new Error("Unauthorized");
      }

      return { ctx: newCtx, args };
    },
  });

export const authAction = (
  role: string | null,
  organizationId: string | null
) =>
  customAction(action, {
    args: {},
    input: async (ctx, args) => {
      const user = await authComponent.getAuthUser(ctx);
      if (!user) throw new Error("Unauthorized");

      const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

      const newCtx = {
        ...ctx,
        user,
        auth,
        headers,
      } satisfies AuthActionCtx;

      if (organizationId) {
        // const member = await checkOrganizationMembership(
        //   newCtx,
        //   organizationId
        // );
        // if (!member) {
        //   throw new Error("Unauthorized");
        // }
        // if (member.role !== role) {
        //   throw new Error("Unauthorized");
        // }
      } else if (role && user.role !== role) {
        throw new Error("Unauthorized");
      }

      return { ctx: newCtx, args };
    },
  });

export const checkOrganizationMembership = async (
  ctx: AuthMutationCtx | AuthQueryCtx,
  organizationId: string | { _id: string }
) => {
  // Handle both string and Id types
  const orgIdString =
    typeof organizationId === "string" ? organizationId : organizationId._id;

  // Check membership in Convex members table (only QueryCtx and MutationCtx have db)
  const member = await ctx.db
    .query("members")
    .withIndex("by_organizationId", (q) => q.eq("organizationId", orgIdString))
    .filter((q) => q.eq(q.field("userId"), ctx.user._id))
    .first();

  return member || null;
};
