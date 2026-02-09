import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

import {
  authMutation,
  authOrganizationQuery,
  authQuery,
  checkOrganizationMembership,
} from "./helpers";
import { authComponent, createAuth } from "./auth";

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const createProject = authMutation(
  "admin",
  null
)({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    description: v.string(),
    url: v.optional(v.union(v.null(), v.string())),
    enableSmartObjects: v.boolean(),
    enableCMS: v.boolean(),
    contactInformation: v.id("organizationContactInformation"),
  },
  handler: async (ctx, args) => {
    const contactInformation = await ctx.db.get(args.contactInformation);
    if (!contactInformation) {
      throw new Error("Contact information not found");
    }

    const project = await ctx.db.insert("projects", {
      organizationId: args.organizationId,
      name: args.name,
      description: args.description,
      url: args.url,
      phase: "planning",
      cmsIsListening: false,
      progress: 5,
      enableSmartObjects: args.enableSmartObjects,
      enableCMS: args.enableCMS,
      contactInformation: args.contactInformation,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    //create following files and folders:
    await ctx.db.insert("files", {
      name: "/public",
      contentType: "folder",
      userCanEdit: true,
      userCanDelete: true,
      projectId: project,
      organizationId: args.organizationId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await ctx.db.insert("files", {
      name: "/quotes",
      contentType: "folder",
      userCanEdit: false,
      userCanDelete: false,
      projectId: project,
      organizationId: args.organizationId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await ctx.db.insert("files", {
      name: "/invoices",
      contentType: "folder",
      userCanEdit: false,
      userCanDelete: false,
      projectId: project,
      organizationId: args.organizationId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return project;
  },
});

export const updateProject = authMutation(
  "admin",
  null
)({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.union(v.null(), v.string())),
    description: v.optional(v.union(v.null(), v.string())),
    url: v.optional(v.union(v.null(), v.string())),
    enableSmartObjects: v.optional(v.union(v.null(), v.boolean())),
    enableCMS: v.optional(v.union(v.null(), v.boolean())),
    contactInformation: v.optional(
      v.union(v.null(), v.id("organizationContactInformation"))
    ),
    monthlySubscriptionType: v.optional(
      v.union(
        v.null(),
        v.union(
          v.literal("monthly"),
          v.literal("quarterly"),
          v.literal("semiannually"),
          v.literal("yearly")
        )
      )
    ),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    if (args.contactInformation) {
      const contactInformation = await ctx.db.get(args.contactInformation);
      if (!contactInformation) {
        throw new Error("Contact information not found");
      }
    }

    return await ctx.db.patch(args.projectId, {
      name: args.name || project.name,
      description: args.description || project.description,
      url: args.url || project.url,
      enableSmartObjects:
        args.enableSmartObjects === null
          ? project.enableSmartObjects
          : args.enableSmartObjects === true
            ? true
            : false,
      enableCMS:
        args.enableCMS === null
          ? project.enableCMS
          : args.enableCMS === true
            ? true
            : false,
      contactInformation: args.contactInformation || project.contactInformation,
      monthlySubscriptionType:
        args.monthlySubscriptionType !== undefined
          ? args.monthlySubscriptionType
          : project.monthlySubscriptionType,
      updatedAt: Date.now(),
    });
  },
});

export const deleteProject = authMutation(
  "admin",
  null
)({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    return await ctx.db.delete(args.projectId);
  },
});

/**
 * Internal mutation to update project billing frequency for testing
 */
export const updateProjectBillingFrequencyForTesting = internalMutation({
  args: {
    projectId: v.id("projects"),
    monthlySubscriptionType: v.optional(
      v.union(
        v.null(),
        v.union(
          v.literal("monthly"),
          v.literal("quarterly"),
          v.literal("semiannually"),
          v.literal("yearly")
        )
      )
    ),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    return await ctx.db.patch(args.projectId, {
      monthlySubscriptionType: args.monthlySubscriptionType,
      updatedAt: Date.now(),
    });
  },
});

export const getProject = authOrganizationQuery("admin")({
  args: {
    // organizationId: v.id("organizations"),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    if (project.organizationId !== args.organizationId) {
      throw new Error("Unauthorized");
    }

    return project;
  },
});

/**
 * Get project billing frequency for organization members (client dashboard)
 * Allows any organization member to see billing frequency
 */
export const getProjectBillingInfo = authOrganizationQuery(null)({
  args: {
    projectId: v.id("projects"),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    if (project.organizationId !== args.organizationId) {
      throw new Error("Unauthorized");
    }

    return {
      monthlySubscriptionType: project.monthlySubscriptionType,
    };
  },
});

export const updateProjectProgress = authMutation(
  "admin",
  null
)({
  args: {
    projectId: v.id("projects"),
    progress: v.number(),
    phase: v.optional(v.union(v.null(), v.string())),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    return await ctx.db.patch(args.projectId, {
      progress: args.progress || project.progress,
      phase: args.phase || project.phase,
      updatedAt: Date.now(),
    });
  },
});

export const getProjects = authOrganizationQuery("admin")({
  args: {
    // organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      return await ctx.db
        .query("projects")
        .withIndex("by_organizationId", (q) =>
          q.eq("organizationId", args.organizationId)
        )
        .collect();
    } catch (error) {
      console.error("Error getting projects:", error);
      throw new Error("Failed to get projects");
    }
  },
});

export const createSmartObjectsKey = authMutation(
  "admin",
  null
)({
  args: {
    projectId: v.id("projects"),
    smartObjectsUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const smartObjectsKey =
      "SLEADS-SO-KEY-" +
      crypto.randomUUID().toString() +
      "-" +
      crypto.randomUUID().toString() +
      "-" +
      crypto.randomUUID().toString();

    return await ctx.db.patch(args.projectId, {
      smartObjectsKey: smartObjectsKey,
      smartObjectsUrl: args.smartObjectsUrl,
      updatedAt: Date.now(),
    });
  },
});

export const updateSmartObjectsUrl = authMutation(
  "admin",
  null
)({
  args: {
    projectId: v.id("projects"),
    smartObjectsUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    return await ctx.db.patch(args.projectId, {
      smartObjectsUrl: args.smartObjectsUrl,
      updatedAt: Date.now(),
    });
  },
});

export const userIsPartOfProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const isAdmin = user.role === "admin";

    if (isAdmin) {
      return true;
    }

    const isMember = await ctx.db
      .query("members")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", project.organizationId)
      )
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();
    if (!isMember) {
      throw new Error("Unauthorized: Not a member of this organization");
    }

    return true;
  },
});
// // Read-only query for customers (any organization member can view)
// export const getProjectsForOrganization = query({
//   args: {
//     organizationId: v.string(),
//   },
//   handler: async (ctx, args) => {
//     const user = await authComponent.getAuthUser(ctx);
//     if (!user) {
//       throw new Error("Unauthorized");
//     }

//     // Check if user is a member of the organization
//     const { auth } = await authComponent.getAuth(createAuth, ctx);
//     const members = await auth.api.listMembers({
//       query: {
//         organizationId: args.organizationId,
//         filterField: "userId",
//         filterValue: user._id,
//         filterOperator: "eq",
//       },
//     });

//     if (!members.members || members.members.length === 0) {
//       throw new Error("Unauthorized: Not a member of this organization");
//     }

//     return await ctx.db
//       .query("projects")
//       .withIndex("by_organizationId", (q) =>
//         q.eq("organizationId", args.organizationId)
//       )
//       .collect();
//   },
// });
