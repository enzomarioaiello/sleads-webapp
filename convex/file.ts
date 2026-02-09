import { v } from "convex/values";
import { action, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import {
  authMutation,
  authOrganizationMutation,
  authOrganizationQuery,
  authQuery,
} from "./helpers";

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getFileUrl = action({
  args: {
    fileId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.fileId);
  },
});

export const getFilesForCustomers = authOrganizationQuery("admin")({
  args: {
    projectId: v.optional(v.union(v.null(), v.id("projects"))),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("files")
      .filter((q) => {
        if (args.projectId) {
          return q.and(
            q.eq(q.field("projectId"), args.projectId),
            q.eq(q.field("organizationId"), args.organizationId)
          );
        }
        return q.eq(q.field("organizationId"), args.organizationId);
      })
      .collect();
  },
});

export const createFile = authMutation(
  "admin",
  null
)({
  args: {
    name: v.string(),
    contentType: v.union(
      v.literal("file"),
      v.literal("url"),
      v.literal("text"),
      v.literal("folder")
    ),
    content: v.optional(v.union(v.null(), v.string())),
    url: v.optional(v.union(v.null(), v.string())),
    storageId: v.optional(v.union(v.null(), v.id("_storage"))),
    projectId: v.optional(v.union(v.null(), v.id("projects"))),
    organizationId: v.optional(v.union(v.null(), v.id("organizations"))),
    userCanEdit: v.boolean(),
    userCanDelete: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("files", {
      name: args.name,
      contentType: args.contentType,
      content: args.content,
      url: args.url,
      storageId: args.storageId,
      userCanEdit: args.userCanEdit,
      userCanDelete: args.userCanDelete,
      projectId: args.projectId,
      organizationId: args.organizationId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const createFileForCustomer = authOrganizationMutation("admin")({
  args: {
    projectId: v.optional(v.union(v.null(), v.id("projects"))),
    name: v.string(),
    contentType: v.union(
      v.literal("file"),
      v.literal("url"),
      v.literal("text"),
      v.literal("folder")
    ),
    content: v.optional(v.union(v.null(), v.string())),
    url: v.optional(v.union(v.null(), v.string())),
    storageId: v.optional(v.union(v.null(), v.id("_storage"))),
    userCanEdit: v.boolean(),
    userCanDelete: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Check if the folder the user is working in has permissions for the user to create the file.
    // Permission inheritance: if ANY parent folder allows edit/delete, the user can create files there.

    const files = await ctx.db
      .query("files")
      .filter((q) => {
        return q.eq(q.field("projectId"), args.projectId);
      })
      .collect();

    // Build all parent folder paths from the target path
    // For example: /home/test/hello/file.txt -> ["/home", "/home/test", "/home/test/hello"]
    const pathParts = args.name.split("/").filter((p) => p !== "");
    const parentPaths: string[] = [];

    // Build parent paths up to (but not including) the final segment
    // This gives us all parent folders in the hierarchy
    for (let i = 1; i < pathParts.length; i++) {
      const parentPath = "/" + pathParts.slice(0, i).join("/");
      parentPaths.push(parentPath);
    }

    // Check if any parent folder exists and has userCanEdit permission
    // Permission inheritance: if ANY parent folder has userCanEdit,
    // all children (subfolders and files) inherit that permission
    let hasPermissions = false;

    // Check each parent folder in the hierarchy (from root to immediate parent)
    for (const parentPath of parentPaths) {
      // Find the folder at this path
      const parentFolder = files.find(
        (f) => f.name === parentPath && f.contentType === "folder"
      );

      if (parentFolder && parentFolder.userCanEdit) {
        // Found a parent folder with edit permission - permission granted
        hasPermissions = true;
        break; // No need to check further up the hierarchy
      }
    }

    if (!hasPermissions) {
      throw new Error(
        "You do not have permission to create files in this folder"
      );
    }

    // Get organizationId from project if projectId is provided
    // Note: authOrganizationMutation automatically provides organizationId in args
    let organizationId: Id<"organizations"> | null | undefined =
      args.organizationId;
    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (!project) {
        throw new Error("Project not found");
      }
      organizationId = project.organizationId;
    }

    return await ctx.db.insert("files", {
      name: args.name,
      contentType: args.contentType,
      content: args.content,
      url: args.url,
      storageId: args.storageId,
      projectId: args.projectId,
      organizationId: organizationId,
      userCanEdit: true,
      userCanDelete: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const deleteFile = authMutation(
  "admin",
  null
)({
  args: {
    fileId: v.id("files"),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new Error("File not found");
    }

    if (file.storageId) {
      await ctx.storage.delete(file.storageId);
    }

    return await ctx.db.delete(args.fileId);
  },
});

export const deleteFolderStructure = authMutation(
  "admin",
  null
)({
  args: {
    folderPath: v.string(),
    projectId: v.optional(v.union(v.null(), v.id("projects"))),
  },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("files")
      .filter((q) => {
        if (args.projectId) {
          return q.eq(q.field("projectId"), args.projectId);
        }
        return true;
      })
      .collect();

    for (const file of files) {
      if (file.name.startsWith(args.folderPath)) {
        await ctx.db.delete(file._id);
      }
    }

    return { success: true };
  },
});

export const deleteFileForCustomer = authOrganizationMutation("admin")({
  args: {
    fileId: v.id("files"),
    projectId: v.optional(v.union(v.null(), v.id("projects"))),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new Error("File not found");
    }

    // Check if file belongs to the organization
    if (file.organizationId !== args.organizationId) {
      throw new Error("Unauthorized");
    }

    // Check if file belongs to the project (if projectId is provided)
    if (args.projectId && file.projectId !== args.projectId) {
      throw new Error("Unauthorized");
    }

    // Check permission inheritance: if ANY parent folder has userCanDelete, permission is granted
    const files = await ctx.db
      .query("files")
      .filter((q) => {
        if (args.projectId) {
          return q.eq(q.field("projectId"), args.projectId);
        }
        return q.eq(q.field("organizationId"), args.organizationId);
      })
      .collect();

    const pathParts = file.name.split("/").filter((p) => p !== "");
    const parentPaths: string[] = [];

    // Build all parent folder paths (from root to immediate parent)
    for (let i = 1; i < pathParts.length; i++) {
      const parentPath = "/" + pathParts.slice(0, i).join("/");
      parentPaths.push(parentPath);
    }

    // Check if any parent folder exists and has userCanDelete permission
    let hasPermissions = false;

    for (const parentPath of parentPaths) {
      const parentFolder = files.find(
        (f) => f.name === parentPath && f.contentType === "folder"
      );

      if (parentFolder && parentFolder.userCanDelete) {
        hasPermissions = true;
        break;
      }
    }

    // Also check direct file permission
    if (file.userCanDelete) {
      hasPermissions = true;
    }

    if (!hasPermissions) {
      throw new Error("You do not have permission to delete this file");
    }

    // If it's a folder, delete all children
    if (file.contentType === "folder") {
      for (const childFile of files) {
        if (
          childFile._id !== file._id &&
          childFile.name.startsWith(file.name + "/")
        ) {
          await ctx.db.delete(childFile._id);
        }
      }
    }

    // Delete the file itself
    await ctx.db.delete(args.fileId);

    return { success: true };
  },
});

export const deleteFolderStructureForCustomer = authOrganizationMutation(
  "admin"
)({
  args: {
    folderPath: v.string(),
    projectId: v.optional(v.union(v.null(), v.id("projects"))),
  },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("files")
      .filter((q) => {
        if (args.projectId) {
          return q.and(
            q.eq(q.field("projectId"), args.projectId),
            q.eq(q.field("organizationId"), args.organizationId)
          );
        }
        return q.eq(q.field("organizationId"), args.organizationId);
      })
      .collect();

    // Check permission for the folder path
    // Permission inheritance: if ANY parent folder has userCanDelete, permission is granted
    const pathParts = args.folderPath.split("/").filter((p) => p !== "");
    const parentPaths: string[] = [];

    // Build all parent folder paths (from root to immediate parent)
    // We check parent folders, not the folder itself (which might be virtual)
    for (let i = 1; i < pathParts.length; i++) {
      const parentPath = "/" + pathParts.slice(0, i).join("/");
      parentPaths.push(parentPath);
    }

    let hasPermissions = false;

    // Check if any parent folder exists and has userCanDelete permission
    for (const parentPath of parentPaths) {
      const parentFolder = files.find(
        (f) => f.name === parentPath && f.contentType === "folder"
      );

      if (parentFolder && parentFolder.userCanDelete) {
        hasPermissions = true;
        break;
      }
    }

    // Also check if the folder itself exists and has permission
    const folderFile = files.find(
      (f) => f.name === args.folderPath && f.contentType === "folder"
    );
    if (folderFile && folderFile.userCanDelete) {
      hasPermissions = true;
    }

    if (!hasPermissions) {
      throw new Error("You do not have permission to delete this folder");
    }

    // Delete all files that start with the folder path
    for (const file of files) {
      if (
        file.name.startsWith(args.folderPath + "/") ||
        file.name === args.folderPath
      ) {
        await ctx.db.delete(file._id);
      }
    }

    return { success: true };
  },
});

export const getFile = authQuery("admin")({
  args: {
    fileId: v.id("files"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.fileId);
  },
});

export const getFiles = authQuery("admin")({
  args: {
    projectId: v.optional(v.union(v.null(), v.id("projects"))),
    organizationId: v.optional(v.union(v.null(), v.id("organizations"))),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("files")
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
  },
});

export const editPerissionsOfFile = authMutation(
  "admin",
  null
)({
  args: {
    fileId: v.id("files"),
    userCanEdit: v.boolean(),
    userCanDelete: v.boolean(),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new Error("File not found");
    }

    // Update the file/folder itself
    await ctx.db.patch(args.fileId, {
      userCanEdit: args.userCanEdit,
      userCanDelete: args.userCanDelete,
      updatedAt: Date.now(),
    });

    // If it's a folder, update all children that start with this path
    if (file.contentType === "folder") {
      const folderPath = file.name;
      const allFiles = await ctx.db
        .query("files")
        .filter((q) => {
          if (file.projectId) {
            return q.eq(q.field("projectId"), file.projectId);
          }
          if (file.organizationId) {
            return q.eq(q.field("organizationId"), file.organizationId);
          }
          return true;
        })
        .collect();

      // Update all files/folders that are children of this folder
      for (const childFile of allFiles) {
        // Check if the file is a child (starts with folder path + /)
        if (
          childFile._id !== args.fileId &&
          childFile.name.startsWith(folderPath + "/")
        ) {
          await ctx.db.patch(childFile._id, {
            userCanEdit: args.userCanEdit,
            userCanDelete: args.userCanDelete,
            updatedAt: Date.now(),
          });
        }
      }
    }

    return { success: true };
  },
});

export const updateFileContent = authMutation(
  "admin",
  null
)({
  args: {
    fileId: v.id("files"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new Error("File not found");
    }

    if (file.contentType !== "text") {
      throw new Error(
        "Cannot update content of a file that is not a text file"
      );
    }

    return await ctx.db.patch(args.fileId, {
      content: args.content,
      updatedAt: Date.now(),
    });
  },
});

export const getFileForCustomer = authOrganizationQuery("admin")({
  args: {
    fileId: v.id("files"),
    projectId: v.optional(v.union(v.null(), v.id("projects"))),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (!file) {
      return null;
    }

    // Check if file belongs to the organization
    if (file.organizationId !== args.organizationId) {
      throw new Error("Unauthorized");
    }

    // Check if file belongs to the project (if projectId is provided)
    if (args.projectId && file.projectId !== args.projectId) {
      throw new Error("Unauthorized");
    }

    return file;
  },
});

export const updateFileContentForCustomer = authOrganizationMutation("admin")({
  args: {
    fileId: v.id("files"),
    content: v.string(),
    projectId: v.optional(v.union(v.null(), v.id("projects"))),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (!file) {
      throw new Error("File not found");
    }

    // Check if file belongs to the organization
    if (file.organizationId !== args.organizationId) {
      throw new Error("Unauthorized");
    }

    // Check if file belongs to the project (if projectId is provided)
    if (args.projectId && file.projectId !== args.projectId) {
      throw new Error("Unauthorized");
    }

    if (file.contentType !== "text") {
      throw new Error(
        "Cannot update content of a file that is not a text file"
      );
    }

    // Check permission inheritance: if ANY parent folder has userCanEdit, permission is granted
    const files = await ctx.db
      .query("files")
      .filter((q) => {
        if (args.projectId) {
          return q.eq(q.field("projectId"), args.projectId);
        }
        return q.eq(q.field("organizationId"), args.organizationId);
      })
      .collect();

    const pathParts = file.name.split("/").filter((p) => p !== "");
    const parentPaths: string[] = [];

    // Build all parent folder paths (from root to immediate parent)
    for (let i = 1; i < pathParts.length; i++) {
      const parentPath = "/" + pathParts.slice(0, i).join("/");
      parentPaths.push(parentPath);
    }

    // Check if any parent folder exists and has userCanEdit permission
    let hasPermissions = false;

    for (const parentPath of parentPaths) {
      const parentFolder = files.find(
        (f) => f.name === parentPath && f.contentType === "folder"
      );

      if (parentFolder && parentFolder.userCanEdit) {
        hasPermissions = true;
        break;
      }
    }

    // Also check direct file permission
    if (file.userCanEdit) {
      hasPermissions = true;
    }

    if (!hasPermissions) {
      throw new Error("You do not have permission to edit this file");
    }

    return await ctx.db.patch(args.fileId, {
      content: args.content,
      updatedAt: Date.now(),
    });
  },
});
