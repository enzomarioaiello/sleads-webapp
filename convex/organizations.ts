import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { authComponent, createAuth } from "./auth";
import { authMutation, authOrganizationQuery, authQuery } from "./helpers";
import { Id } from "./_generated/dataModel";

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getLogoUrl = action({
  args: {
    logoUrl: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.logoUrl);
  },
});

export const createOrganization = authMutation(
  "admin",
  null
)({
  args: {
    name: v.string(),
    slug: v.string(),
    logo: v.optional(v.union(v.null(), v.string())),
  },
  handler: async (ctx, args) => {
    const organization = await ctx.db.insert("organizations", {
      name: args.name,
      slug: args.slug,
      logo: args.logo,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    //add admin member
    await ctx.db.insert("members", {
      organizationId: organization,
      userId: ctx.user._id,
      role: "owner",
      createdAt: Date.now(),
    });

    return organization;
  },
});

export const updateOrganization = authMutation(
  "admin",
  null
)({
  args: {
    organizationId: v.id("organizations"),
    name: v.optional(v.union(v.null(), v.string())),
    slug: v.optional(v.union(v.null(), v.string())),
    logo: v.optional(v.union(v.null(), v.string())),
  },
  handler: async (ctx, args) => {
    const organization = await ctx.db.get(args.organizationId);
    if (!organization) {
      throw new Error("Organization not found");
    }

    return await ctx.db.patch(args.organizationId, {
      name: args.name || organization.name,
      slug: args.slug || organization.slug,
      logo: args.logo || organization.logo,
      updatedAt: Date.now(),
    });
  },
});

export const deleteOrganization = authMutation(
  "admin",
  null
)({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.organizationId);
  },
});

export const getOrganizations = authQuery("admin")({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("organizations").collect();
  },
});

export const getMyOrganizations = authQuery(null)({
  args: {},
  handler: async (ctx) => {
    const memberships = await ctx.db
      .query("members")
      .withIndex("by_userId", (q) => q.eq("userId", ctx.user._id))
      .collect();

    const organizations = await Promise.all(
      memberships.map(async (membership) => {
        return await ctx.db.get(
          membership.organizationId as Id<"organizations">
        );
      })
    );

    return organizations;
  },
});

export const getOrganization = authOrganizationQuery("admin")({
  args: {},
  handler: async (ctx, args) => {
    return await ctx.db.get(args.organizationId);
  },
});

export const addMember = authMutation(
  "admin",
  null
)({
  args: {
    organizationId: v.id("organizations"),
    userId: v.string(),
    role: v.union(v.literal("member"), v.literal("admin"), v.literal("owner")),
  },
  handler: async (ctx, args) => {
    // Check if member already exists
    const existingMember = await ctx.db
      .query("members")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (existingMember) {
      throw new Error("User is already a member of this organization");
    }

    return await ctx.db.insert("members", {
      organizationId: args.organizationId, // Store as string (Convex will handle conversion)
      userId: args.userId,
      role: args.role,
      createdAt: Date.now(),
    });
  },
});

// Get all users for admin (for adding members)
export const getAllUsers = authQuery("admin")({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.auth.api.listUsers({
      query: {
        limit: 1000,
      },
      headers: ctx.headers,
    });

    return users.users || [];
  },
});

export const updateMember = authMutation(
  "admin",
  null
)({
  args: {
    memberId: v.id("members"),
    role: v.union(v.literal("member"), v.literal("admin"), v.literal("owner")),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.memberId);
    if (!member) {
      throw new Error("Member not found");
    }
    return await ctx.db.patch(args.memberId, {
      role: args.role,
    });
  },
});

export const getMembers = authQuery("admin")({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("members")
      .withIndex("by_organizationId", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();

    const membersWithUsers = await Promise.all(
      members.map(async (member) => {
        try {
          // Query user from betterAuth
          const userQuery = await ctx.auth.api.listUsers({
            query: {
              filterField: "id",
              filterValue: member.userId,
              filterOperator: "eq",
            },
            headers: ctx.headers,
          });

          const user = userQuery.users?.[0];
          return {
            id: member._id,
            organizationId: member.organizationId,
            userId: member.userId,
            role: member.role,
            createdAt: member.createdAt,
            user: user
              ? {
                  id: user.id,
                  name: user.name || "",
                  email: user.email || "",
                  image: user.image || null,
                }
              : null,
          };
        } catch (error) {
          console.error("Error fetching user:", error);
          return {
            id: member._id,
            organizationId: member.organizationId,
            userId: member.userId,
            role: member.role,
            createdAt: member.createdAt,
            user: null,
          };
        }
      })
    );

    return membersWithUsers;
  },
});

// Get organizations for a user (any role)
export const getUserOrganizations = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Get all memberships for this user
    const memberships = await ctx.db
      .query("members")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    // Get organization details for each membership
    const organizations = await Promise.all(
      memberships.map(async (membership) => {
        // organizationId is stored as string, try to get the organization
        try {
          // Query organizations by matching the string ID
          const orgs = await ctx.db.query("organizations").collect();
          const org = orgs.find(
            (o) =>
              o._id ===
              (membership.organizationId as unknown as Id<"organizations">)
          );
          if (!org) return null;
          return {
            ...org,
            role: membership.role,
            memberId: membership._id,
            joinedAt: membership.createdAt,
          };
        } catch (error) {
          console.error("Error fetching organization:", error);
          return null;
        }
      })
    );

    return organizations.filter((org) => org !== null);
  },
});

export const removeMember = authMutation(
  "admin",
  null
)({
  args: {
    memberId: v.id("members"),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.memberId);
    if (!member) {
      throw new Error("Member not found");
    }

    return await ctx.db.delete(args.memberId);
  },
});

export const createOrganizationContactInformation = authMutation(
  "admin",
  null
)({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    email: v.string(),
    organizationName: v.string(),
    phone: v.string(),
    userId: v.optional(v.union(v.null(), v.string())),
    address: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.userId) {
      try {
        const member = await ctx.db
          .query("members")
          .withIndex("by_organizationId", (q) =>
            q.eq("organizationId", args.organizationId)
          )
          .filter((q) => q.eq(q.field("userId"), args.userId))
          .first();
        if (!member) {
          throw new Error("User is not a member of the organization");
        }
      } catch (error) {
        console.error("Error checking user membership", error);
        throw new Error("Failed to check user membership");
      }
    }

    return await ctx.db.insert("organizationContactInformation", {
      organizationId: args.organizationId,
      name: args.name,
      email: args.email,
      phone: args.phone,
      address: args.address,
      organizationName: args.organizationName,
      userId: args.userId || null,
      isDefault: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateOrganizationContactInformation = mutation({
  args: {
    organizationContactInformationId: v.id("organizationContactInformation"),
    organizationId: v.string(),
    name: v.optional(v.union(v.null(), v.string())),
    organizationName: v.optional(v.union(v.null(), v.string())),
    email: v.optional(v.union(v.null(), v.string())),
    phone: v.optional(v.union(v.null(), v.string())),
    isDefault: v.optional(v.union(v.null(), v.boolean())),
    address: v.optional(v.union(v.null(), v.string())),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    if (user.role !== "admin") {
      throw new Error("Unauthorized");
    }

    const organizationContactInformation = await ctx.db.get(
      args.organizationContactInformationId
    );
    if (!organizationContactInformation) {
      throw new Error("Organization contact information not found");
    }

    if (args.isDefault) {
      const allOrganizationContactInformation = await ctx.db
        .query("organizationContactInformation")
        .filter((q) => q.eq(q.field("organizationId"), args.organizationId))
        .collect();
      for (const contactInformation of allOrganizationContactInformation) {
        if (
          contactInformation._id !== args.organizationContactInformationId &&
          contactInformation.isDefault
        ) {
          await ctx.db.patch(contactInformation._id, {
            isDefault: false,
          });
        }
      }
    }

    return await ctx.db.patch(args.organizationContactInformationId, {
      name: args.name || organizationContactInformation.name,
      email: args.email || organizationContactInformation.email,
      phone: args.phone || organizationContactInformation.phone,
      organizationName:
        args.organizationName ||
        organizationContactInformation.organizationName,
      isDefault: args.isDefault || organizationContactInformation.isDefault,
      address: args.address || organizationContactInformation.address,
      updatedAt: Date.now(),
    });
  },
});

export const deleteOrganizationContactInformation = mutation({
  args: {
    organizationContactInformationId: v.id("organizationContactInformation"),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    if (user.role !== "admin") {
      throw new Error("Unauthorized");
    }

    return await ctx.db.delete(args.organizationContactInformationId);
  },
});

export const getOrganizationContactInformation = authOrganizationQuery("admin")(
  {
    args: {
      // organizationId: v.union(v.string(), v.id("organizations")),
    },
    handler: async (ctx, args) => {
      // Convert string to Id if needed
      const orgId =
        typeof args.organizationId === "string"
          ? (args.organizationId as unknown as Id<"organizations">)
          : args.organizationId;

      return await ctx.db
        .query("organizationContactInformation")
        .withIndex("by_organizationId", (q) => q.eq("organizationId", orgId))
        .collect();
    },
  }
);
