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

export const createAgendaItem = authOrganizationMutation("admin")({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    description: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    createdByAdmin: v.boolean(),
    location: v.optional(v.union(v.null(), v.string())),
    teams_link: v.optional(v.union(v.null(), v.string())),
    type: v.union(
      v.literal("meeting"),
      v.literal("deliverable"),
      v.literal("cancelled"),
      v.literal("other")
    ),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    if (project.organizationId !== args.organizationId) {
      throw new Error("Unauthorized");
    }

    return await ctx.db.insert("project_agenda_items", {
      projectId: args.projectId,
      organizationId: args.organizationId,
      title: args.title,
      description: args.description,
      startDate: args.startDate,
      endDate: args.endDate,
      createdByAdmin: ctx.user.role === "admin",
      location: args.location,
      teams_link: args.teams_link,
      type: args.type,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateAgendaItem = authOrganizationMutation("admin")({
  args: {
    agendaItemId: v.id("project_agenda_items"),
    title: v.optional(v.union(v.null(), v.string())),
    description: v.optional(v.union(v.null(), v.string())),
    startDate: v.optional(v.union(v.null(), v.number())),
    endDate: v.optional(v.union(v.null(), v.number())),
    location: v.optional(v.union(v.null(), v.string())),
    teams_link: v.optional(v.union(v.null(), v.string())),
    type: v.optional(
      v.union(
        v.null(),
        v.union(
          v.literal("meeting"),
          v.literal("deliverable"),
          v.literal("cancelled"),
          v.literal("other")
        )
      )
    ),
  },
  handler: async (ctx, args) => {
    const agendaItem = await ctx.db.get(args.agendaItemId);
    if (!agendaItem) {
      throw new Error("Agenda item not found");
    }
    if (agendaItem.organizationId !== args.organizationId) {
      throw new Error("Unauthorized");
    }

    if (agendaItem.createdByAdmin) {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }
    }

    return await ctx.db.patch(args.agendaItemId, {
      title: args.title || agendaItem.title,
      description: args.description || agendaItem.description,
      startDate: args.startDate || agendaItem.startDate,
      endDate: args.endDate || agendaItem.endDate,
      location: args.location || agendaItem.location,
      teams_link: args.teams_link || agendaItem.teams_link,
      type: args.type || agendaItem.type,
      updatedAt: Date.now(),
    });
  },
});

export const getAgendaItems = authOrganizationQuery("admin")({
  args: {
    projectId: v.optional(v.id("projects")),
  },
  handler: async (ctx, args) => {
    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (project && project.organizationId !== args.organizationId) {
        throw new Error("Unauthorized");
      }
    }

    return await (
      args.projectId
        ? ctx.db
            .query("project_agenda_items")
            .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
        : ctx.db
            .query("project_agenda_items")
            .withIndex("by_organizationId", (q) =>
              q.eq("organizationId", args.organizationId)
            )
    ).collect();
  },
});

export const getAgendaItem = authOrganizationQuery("admin")({
  args: {
    agendaItemId: v.id("project_agenda_items"),
  },
  handler: async (ctx, args) => {
    const agendaItem = await ctx.db.get(args.agendaItemId);
    if (!agendaItem) {
      throw new Error("Agenda item not found");
    }
    if (agendaItem.organizationId !== args.organizationId) {
      throw new Error("Unauthorized");
    }
    return agendaItem;
  },
});

export const deleteAgendaItem = authOrganizationMutation("admin")({
  args: {
    agendaItemId: v.id("project_agenda_items"),
  },
  handler: async (ctx, args) => {
    const agendaItem = await ctx.db.get(args.agendaItemId);
    if (!agendaItem) {
      throw new Error("Agenda item not found");
    }
    if (agendaItem.organizationId !== args.organizationId) {
      throw new Error("Unauthorized");
    }

    if (agendaItem.createdByAdmin) {
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }
    }
    return await ctx.db.delete(args.agendaItemId);
  },
});

// User-specific mutations (for non-admin users)
export const createAgendaItemForUser = authOrganizationMutation(null)({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    description: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    location: v.optional(v.union(v.null(), v.string())),
    teams_link: v.optional(v.union(v.null(), v.string())),
    type: v.union(
      v.literal("meeting"),
      v.literal("deliverable"),
      v.literal("cancelled"),
      v.literal("other")
    ),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    if (project.organizationId !== args.organizationId) {
      throw new Error("Unauthorized");
    }

    return await ctx.db.insert("project_agenda_items", {
      projectId: args.projectId,
      organizationId: args.organizationId,
      title: args.title,
      description: args.description,
      startDate: args.startDate,
      endDate: args.endDate,
      createdByAdmin: false, // Users create non-admin items
      location: args.location,
      teams_link: args.teams_link,
      type: args.type,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateAgendaItemForUser = authOrganizationMutation(null)({
  args: {
    agendaItemId: v.id("project_agenda_items"),
    title: v.optional(v.union(v.null(), v.string())),
    description: v.optional(v.union(v.null(), v.string())),
    startDate: v.optional(v.union(v.null(), v.number())),
    endDate: v.optional(v.union(v.null(), v.number())),
    location: v.optional(v.union(v.null(), v.string())),
    teams_link: v.optional(v.union(v.null(), v.string())),
    type: v.optional(
      v.union(
        v.null(),
        v.union(
          v.literal("meeting"),
          v.literal("deliverable"),
          v.literal("cancelled"),
          v.literal("other")
        )
      )
    ),
  },
  handler: async (ctx, args) => {
    const agendaItem = await ctx.db.get(args.agendaItemId);
    if (!agendaItem) {
      throw new Error("Agenda item not found");
    }
    if (agendaItem.organizationId !== args.organizationId) {
      throw new Error("Unauthorized");
    }

    // Users cannot update admin-created items
    if (agendaItem.createdByAdmin) {
      throw new Error("Unauthorized: Cannot update admin-created events");
    }

    return await ctx.db.patch(args.agendaItemId, {
      title: args.title || agendaItem.title,
      description: args.description || agendaItem.description,
      startDate: args.startDate || agendaItem.startDate,
      endDate: args.endDate || agendaItem.endDate,
      location: args.location || agendaItem.location,
      teams_link: args.teams_link || agendaItem.teams_link,
      type: args.type || agendaItem.type,
      updatedAt: Date.now(),
    });
  },
});

export const deleteAgendaItemForUser = authOrganizationMutation(null)({
  args: {
    agendaItemId: v.id("project_agenda_items"),
  },
  handler: async (ctx, args) => {
    const agendaItem = await ctx.db.get(args.agendaItemId);
    if (!agendaItem) {
      throw new Error("Agenda item not found");
    }
    if (agendaItem.organizationId !== args.organizationId) {
      throw new Error("Unauthorized");
    }

    // Users cannot delete admin-created items
    if (agendaItem.createdByAdmin) {
      throw new Error("Unauthorized: Cannot delete admin-created events");
    }

    return await ctx.db.delete(args.agendaItemId);
  },
});

// export const getAgendaItemsForUser = authOrganizationQuery(null)({
//   args: {
//     projectId: v.optional(v.id("projects")),
//   },
//   handler: async (ctx, args) => {
//     if (args.projectId) {
//       const project = await ctx.db.get(args.projectId);

//       if (project && project.organizationId !== args.organizationId) {
//         throw new Error("Unauthorized");
//       }

//       return await ctx.db
//         .query("project_agenda_items")
//         .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
//         .collect();
//     }

//     // If no projectId, return all agenda items for the organization
//     return await ctx.db
//       .query("project_agenda_items")
//       .withIndex("by_organizationId", (q) =>
//         q.eq("organizationId", args.organizationId)
//       )
//       .collect();
//   },
// });
