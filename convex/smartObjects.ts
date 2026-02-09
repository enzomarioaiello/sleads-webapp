import { v } from "convex/values";
import { action, internalQuery, mutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { authComponent } from "./auth";
import { authOrganizationMutation } from "./helpers";

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
    //store image id to organization
    return await ctx.storage.getUrl(args.logoUrl);
  },
});

export const storeImageAndGetUrl = authOrganizationMutation("admin")({
  args: {
    projectId: v.optional(v.union(v.null(), v.id("projects"))),
    imageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const organization = await ctx.db.get(args.organizationId);
    if (!organization) {
      throw new Error("Organization not found");
    }

    const imageUrl = await ctx.storage.getUrl(args.imageId);
    if (!imageUrl) {
      throw new Error("Image not found");
    }
    await ctx.db.insert("imagesOrganizations", {
      organizationId: args.organizationId,
      projectId: args.projectId,
      imageUrl: imageUrl,
      imageId: args.imageId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return imageUrl;
  },
});

export const deleteImage = authOrganizationMutation("admin")({
  args: {
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const image = await ctx.db
      .query("imagesOrganizations")
      .withIndex("by_imageUrl", (q) => q.eq("imageUrl", args.imageUrl))
      .first();
    if (!image) {
      throw new Error("Image not found");
    }

    const orgFromImage = await ctx.db.get(image.organizationId);
    if (!orgFromImage) {
      throw new Error("Organization not found");
    }

    if (orgFromImage._id !== args.organizationId) {
      throw new Error("Unauthorized");
    }

    await ctx.storage.delete(image.imageId);
    await ctx.db.delete(image._id);
    return { success: true };
  },
});

// Internal query to get project with Smart Objects config
export const getProjectForSchema = internalQuery({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    return {
      smartObjectsUrl: project.smartObjectsUrl,
      smartObjectsKey: project.smartObjectsKey,
      organizationId: project.organizationId,
    };
  },
});

export const getSchema = action({
  args: {
    projectId: v.id("projects"),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Check if user is platform admin OR organization member
    const isAdmin = user.role === "admin";

    if (!isAdmin) {
      // Check organization membership by getting the project
      // The getProject query will verify organization membership
      try {
        await ctx.runQuery(api.project.getProject, {
          projectId: args.projectId,
          organizationId: args.organizationId,
        });
      } catch {
        throw new Error("Unauthorized: Not a member of this organization");
      }
    }

    // Get the project to retrieve Smart Objects config
    const projectConfig: {
      smartObjectsUrl: string | null | undefined;
      smartObjectsKey: string | null | undefined;
      organizationId: string;
    } = await ctx.runQuery(internal.smartObjects.getProjectForSchema, {
      projectId: args.projectId,
    });

    // Verify Smart Objects is configured
    if (!projectConfig.smartObjectsUrl || !projectConfig.smartObjectsKey) {
      throw new Error(
        "Smart Objects URL and API key must be configured for this project"
      );
    }

    // Make the fetch call to get the schema
    const url: string = `${projectConfig.smartObjectsUrl}/get-schema?apiKey=${projectConfig.smartObjectsKey}`;

    try {
      const response: Response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch schema: ${response.status} ${response.statusText}`
        );
      }

      const schema: unknown = await response.json();
      return schema;
    } catch (error) {
      throw new Error(
        `Failed to fetch schema: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },
});

export const getTableData = action({
  args: {
    projectId: v.id("projects"),
    organizationId: v.id("organizations"),
    tableName: v.string(),
    cursor: v.optional(v.union(v.null(), v.string())),
    numItems: v.number(),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Check if user is platform admin OR organization member
    const isAdmin = user.role === "admin";

    if (!isAdmin) {
      // Check organization membership by getting the project
      try {
        await ctx.runQuery(api.project.getProject, {
          projectId: args.projectId,
          organizationId: args.organizationId,
        });
      } catch {
        throw new Error("Unauthorized: Not a member of this organization");
      }
    }

    // Get the project to retrieve Smart Objects config
    const projectConfig: {
      smartObjectsUrl: string | null | undefined;
      smartObjectsKey: string | null | undefined;
      organizationId: string;
    } = await ctx.runQuery(internal.smartObjects.getProjectForSchema, {
      projectId: args.projectId,
    });

    // Verify Smart Objects is configured
    if (!projectConfig.smartObjectsUrl || !projectConfig.smartObjectsKey) {
      throw new Error(
        "Smart Objects URL and API key must be configured for this project"
      );
    }

    // Build the URL with query parameters
    const url = new URL(
      `${projectConfig.smartObjectsUrl}/get-dynamic-table-data/${args.tableName}`
    );
    url.searchParams.set("apiKey", projectConfig.smartObjectsKey);
    url.searchParams.set("numItems", args.numItems.toString());
    if (args.cursor) {
      url.searchParams.set("cursor", args.cursor);
    }

    try {
      const response: Response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(
          `Failed to fetch table data: ${response.status} ${response.statusText}`
        );
      }

      const data: unknown = await response.json();
      return data;
    } catch (error) {
      throw new Error(
        `Failed to fetch table data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },
});

export const createTableData = action({
  args: {
    projectId: v.id("projects"),
    organizationId: v.id("organizations"),
    tableName: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Check if user is platform admin OR organization member
    const isAdmin = user.role === "admin";

    if (!isAdmin) {
      // Check organization membership by getting the project
      try {
        await ctx.runQuery(api.project.userIsPartOfProject, {
          projectId: args.projectId,
        });
      } catch {
        throw new Error("Unauthorized: Not a member of this organization");
      }
    }

    // Get the project to retrieve Smart Objects config
    const projectConfig: {
      smartObjectsUrl: string | null | undefined;
      smartObjectsKey: string | null | undefined;
      organizationId: string;
    } = await ctx.runQuery(internal.smartObjects.getProjectForSchema, {
      projectId: args.projectId,
    });

    // Verify Smart Objects is configured
    if (!projectConfig.smartObjectsUrl || !projectConfig.smartObjectsKey) {
      throw new Error(
        "Smart Objects URL and API key must be configured for this project"
      );
    }

    // Build the URL
    const url = `${projectConfig.smartObjectsUrl}/create-dynamic-table-data/${args.tableName}?apiKey=${projectConfig.smartObjectsKey}`;

    try {
      const response: Response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(args.data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to create table data: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const result: { success: boolean; id: string } = await response.json();
      return result;
    } catch (error) {
      throw new Error(
        `Failed to create table data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },
});

export const deleteTableData = action({
  args: {
    projectId: v.id("projects"),
    organizationId: v.id("organizations"),
    objectId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Check if user is platform admin OR organization member
    const isAdmin = user.role === "admin";

    if (!isAdmin) {
      // Check organization membership by getting the project
      try {
        await ctx.runQuery(api.project.userIsPartOfProject, {
          projectId: args.projectId,
        });
      } catch {
        throw new Error("Unauthorized: Not a member of this organization");
      }
    }

    // Get the project to retrieve Smart Objects config
    const projectConfig: {
      smartObjectsUrl: string | null | undefined;
      smartObjectsKey: string | null | undefined;
      organizationId: string;
    } = await ctx.runQuery(internal.smartObjects.getProjectForSchema, {
      projectId: args.projectId,
    });

    // Verify Smart Objects is configured
    if (!projectConfig.smartObjectsUrl || !projectConfig.smartObjectsKey) {
      throw new Error(
        "Smart Objects URL and API key must be configured for this project"
      );
    }

    // Build the URL
    const url = `${projectConfig.smartObjectsUrl}/delete-object/${args.objectId}?apiKey=${projectConfig.smartObjectsKey}`;

    try {
      const response: Response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to delete object: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const result: { success: boolean } = await response.json();
      return result;
    } catch (error) {
      throw new Error(
        `Failed to delete object: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },
});

export const updateTableData = action({
  args: {
    projectId: v.id("projects"),
    organizationId: v.id("organizations"),
    objectId: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Check if user is platform admin OR organization member
    const isAdmin = user.role === "admin";

    if (!isAdmin) {
      // Check organization membership by getting the project
      try {
        await ctx.runQuery(api.project.userIsPartOfProject, {
          projectId: args.projectId,
        });
      } catch {
        throw new Error("Unauthorized: Not a member of this organization");
      }
    }

    // Get the project to retrieve Smart Objects config
    const projectConfig: {
      smartObjectsUrl: string | null | undefined;
      smartObjectsKey: string | null | undefined;
      organizationId: string;
    } = await ctx.runQuery(internal.smartObjects.getProjectForSchema, {
      projectId: args.projectId,
    });

    // Verify Smart Objects is configured
    if (!projectConfig.smartObjectsUrl || !projectConfig.smartObjectsKey) {
      throw new Error(
        "Smart Objects URL and API key must be configured for this project"
      );
    }

    // Build the URL
    const url = `${projectConfig.smartObjectsUrl}/update-object/${args.objectId}?apiKey=${projectConfig.smartObjectsKey}`;

    try {
      const response: Response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(args.data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to update object: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const result: { success: boolean } = await response.json();
      return result;
    } catch (error) {
      throw new Error(
        `Failed to update object: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },
});

export const getObject = action({
  args: {
    projectId: v.id("projects"),
    organizationId: v.id("organizations"),
    objectId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get authenticated user
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Check if user is platform admin OR organization member
    const isAdmin = user.role === "admin";

    if (!isAdmin) {
      // Check organization membership by getting the project
      try {
        await ctx.runQuery(api.project.userIsPartOfProject, {
          projectId: args.projectId,
        });
      } catch {
        throw new Error("Unauthorized: Not a member of this organization");
      }
    }

    // Get the project to retrieve Smart Objects config
    const projectConfig: {
      smartObjectsUrl: string | null | undefined;
      smartObjectsKey: string | null | undefined;
      organizationId: string;
    } = await ctx.runQuery(internal.smartObjects.getProjectForSchema, {
      projectId: args.projectId,
    });

    // Verify Smart Objects is configured
    if (!projectConfig.smartObjectsUrl || !projectConfig.smartObjectsKey) {
      throw new Error(
        "Smart Objects URL and API key must be configured for this project"
      );
    }

    // Build the URL
    const url = `${projectConfig.smartObjectsUrl}/get-object/${args.objectId}?apiKey=${projectConfig.smartObjectsKey}`;

    try {
      const response: Response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch object: ${response.status} ${response.statusText}`
        );
      }

      const data: unknown = await response.json();
      return data;
    } catch (error) {
      throw new Error(
        `Failed to fetch object: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  },
});
