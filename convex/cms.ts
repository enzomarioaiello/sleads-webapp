import { v } from "convex/values";
import {
  authMutation,
  authOrganizationQuery,
  authOrganizationMutation,
  internalCMSMutation,
} from "./helpers";
import { internalQuery, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

export const createCMSPage = internalCMSMutation()({
  args: {
    name: v.string(),
    slug: v.string(),
    listeningMode: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("cms_pages", {
      name: args.name,
      slug: args.slug,
      projectId: ctx.project._id,
      listeningMode: args.listeningMode,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const changeSelectedLanguages = authOrganizationMutation("admin")({
  args: {
    projectId: v.id("projects"),
    selectedLanguages: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project || project.organizationId !== args.organizationId) {
      throw new Error("Project not found");
    }
    return await ctx.db.patch(project._id, {
      selectedLanguages:
        args.selectedLanguages || project.selectedLanguages || [],
      updatedAt: Date.now(),
    });
  },
});

export const getCMSPages = authOrganizationQuery("admin")({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project || project.organizationId !== args.organizationId) {
      throw new Error("Project not found");
    }
    return await ctx.db
      .query("cms_pages")
      .filter((q) => q.eq(q.field("projectId"), args.projectId))
      .collect();
  },
});

export const getCMSPageFields = authOrganizationQuery("admin")({
  args: {
    pageId: v.id("cms_pages"),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    const project = await ctx.db.get(page?.projectId as Id<"projects">);
    if (!page || !project || project.organizationId !== args.organizationId) {
      throw new Error("Page not found");
    }
    return await ctx.db
      .query("cms_fields")
      .filter((q) => q.eq(q.field("cmsPageId"), args.pageId))
      .collect();
  },
});

export const createCMSKey = authMutation(
  "admin",
  null
)({
  args: {
    organizationId: v.id("organizations"),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const cmsKey =
      "SLEADS-CMS-" +
      crypto.randomUUID().toString() +
      "-" +
      crypto.randomUUID().toString() +
      "-" +
      crypto.randomUUID().toString();
    return await ctx.db.patch(args.projectId, {
      cmsKey: cmsKey,
      updatedAt: Date.now(),
    });
  },
});

export const toggleListeningMode = authMutation(
  "admin",
  null
)({
  args: {
    projectId: v.id("projects"),
    listeningMode: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.projectId, {
      cmsIsListening: args.listeningMode,
    });
  },
});

export const getListeningMode = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    return project.cmsIsListening;
  },
});

export const register = internalCMSMutation()({
  args: {
    page: v.string(),
    fields: v.array(v.object({ id: v.string(), value: v.string() })),
    cmsKey: v.string(),
  },
  handler: async (ctx, args) => {
    //add check to see if key is valid
    const project = await ctx.db.get(ctx.project._id);
    if (!project || project.cmsKey !== args.cmsKey) {
      throw new Error("Invalid CMS key");
    }

    const pages = await ctx.db
      .query("cms_pages")
      .filter((q) => q.eq(q.field("projectId"), ctx.project._id))
      .collect();

    let page = pages.find((page) => page.slug === args.page);

    if (!page) {
      page = (await ctx.db.get(
        await ctx.runMutation(api.cms.createCMSPage, {
          name: args.page,
          slug: args.page,
          listeningMode: false,
          cmsKey: ctx.project.cmsKey || "",
        })
      )) as Doc<"cms_pages">;
    }

    for (const field of args.fields) {
      const existingField = await ctx.db
        .query("cms_fields")
        .filter((q) => q.eq(q.field("cmsPageId"), page._id))
        .filter((q) => q.eq(q.field("key"), field.id))
        .first();
      if (existingField) {
        await ctx.db.patch(existingField._id, {
          defaultValue: field.value,
          updatedAt: Date.now(),
        });
        continue;
      }
      const newField = await ctx.db.insert("cms_fields", {
        cmsPageId: page._id,
        key: field.id,
        defaultValue: field.value,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return true;
  },
});

export const deleteCMSPage = authMutation(
  "admin",
  null
)({
  args: {
    pageId: v.id("cms_pages"),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    if (!page) {
      throw new Error("Page not found");
    }
    return await ctx.db.delete(args.pageId);
  },
});

export const deleteCMSField = authMutation(
  "admin",
  null
)({
  args: {
    fieldId: v.id("cms_fields"),
  },
  handler: async (ctx, args) => {
    const field = await ctx.db.get(args.fieldId);
    if (!field) {
      throw new Error("Field not found");
    }
    return await ctx.db.delete(args.fieldId);
  },
});

export const saveCMSFieldValues = authOrganizationMutation("admin")({
  args: {
    pageId: v.id("cms_pages"),

    splitId: v.optional(v.union(v.null(), v.id("cms_splits"))),
    fieldValues: v.array(
      v.object({
        fieldId: v.id("cms_fields"),
        values: v.array(
          v.object({
            langCode: v.string(),
            value: v.union(v.null(), v.string()),
          })
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Verify page belongs to organization
    const page = await ctx.db.get(args.pageId);
    if (!page) {
      throw new Error("Page not found");
    }
    const project = await ctx.db.get(page.projectId);
    if (!project || project.organizationId !== args.organizationId) {
      throw new Error("Project not found or access denied");
    }

    const now = Date.now();
    const finalSplitId = args.splitId === undefined ? null : args.splitId;

    // If splitId is provided, get default values to compare
    const defaultValues: Record<string, Record<string, string | null>> = {};
    if (finalSplitId !== null) {
      // Get all default values (splitId = null) for this page
      const defaultFieldValues = await ctx.db
        .query("cms_field_values")
        .withIndex("by_pageId", (q) => q.eq("pageId", args.pageId))
        .filter((q) => q.eq(q.field("splitId"), null))
        .collect();

      for (const fieldValue of defaultFieldValues) {
        if (!defaultValues[fieldValue.cmsFieldId]) {
          defaultValues[fieldValue.cmsFieldId] = {};
        }
        // value is stored as an object with langCode keys
        if (typeof fieldValue.value === "object" && fieldValue.value !== null) {
          Object.assign(defaultValues[fieldValue.cmsFieldId], fieldValue.value);
        }
      }
    }

    // Process each field
    for (const fieldData of args.fieldValues) {
      // Get existing field value entry for this field, page, and split
      const existingValue = await ctx.db
        .query("cms_field_values")
        .withIndex("by_cmsFieldId", (q) =>
          q.eq("cmsFieldId", fieldData.fieldId)
        )
        .filter((q) => q.eq(q.field("pageId"), args.pageId))
        .filter((q) =>
          finalSplitId === null
            ? q.eq(q.field("splitId"), null)
            : q.eq(q.field("splitId"), finalSplitId)
        )
        .first();

      // Build the value object from language values
      const valueObject: Record<string, string | null> = {};
      let hasChanges = false;

      for (const langValue of fieldData.values) {
        // If splitId is provided, only save if different from default
        if (finalSplitId !== null) {
          const defaultValue =
            defaultValues[fieldData.fieldId]?.[langValue.langCode] || null;
          const newValue = langValue.value;

          // Only include if different from default
          if (newValue !== defaultValue) {
            valueObject[langValue.langCode] = newValue;
            hasChanges = true;
          }
        } else {
          // For default values (splitId = null), save all
          valueObject[langValue.langCode] = langValue.value;
          hasChanges = true;
        }
      }

      // If splitId is provided and all values match defaults, delete the entry if it exists
      if (finalSplitId !== null && !hasChanges && existingValue) {
        await ctx.db.delete(existingValue._id);
        continue;
      }

      // Skip if no changes and no existing entry
      if (!hasChanges && !existingValue) {
        continue;
      }

      // Create or update the entry
      if (existingValue) {
        // Update existing entry
        await ctx.db.patch(existingValue._id, {
          value: valueObject,
          updatedAt: now,
        });
      } else {
        // Create new entry
        await ctx.db.insert("cms_field_values", {
          cmsFieldId: fieldData.fieldId,
          pageId: args.pageId,
          value: valueObject,
          splitId: finalSplitId,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    return { success: true };
  },
});

export const addSplit = authOrganizationMutation("admin")({
  args: {
    projectId: v.id("projects"),
    splitName: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project || project.organizationId !== args.organizationId) {
      throw new Error("Project not found or access denied");
    }
    return await ctx.db.insert("cms_splits", {
      projectId: args.projectId,
      split: args.splitName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const getSplits = authOrganizationQuery("admin")({
  args: {
    projectId: v.id("projects"),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project || project.organizationId !== args.organizationId) {
      throw new Error("Project not found or access denied");
    }
    return await ctx.db
      .query("cms_splits")
      .filter((q) => q.eq(q.field("projectId"), args.projectId))
      .collect();
  },
});

export const getAllSplits = authOrganizationQuery("admin")({
  args: {
    projectId: v.id("projects"),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project || project.organizationId !== args.organizationId) {
      throw new Error("Project not found or access denied");
    }

    // Get all splits for this project
    return await ctx.db
      .query("cms_splits")
      .filter((q) => q.eq(q.field("projectId"), args.projectId))
      .collect();
  },
});

export const deleteSplit = authOrganizationMutation("admin")({
  args: {
    splitId: v.id("cms_splits"),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const split = await ctx.db.get(args.splitId);
    if (!split) {
      throw new Error("Split not found");
    }

    const project = await ctx.db.get(split.projectId);
    if (!project || project.organizationId !== args.organizationId) {
      throw new Error("Project not found or access denied");
    }

    await ctx.db.delete(args.splitId);

    // Delete all field values for this split
    const fieldValues = await ctx.db
      .query("cms_field_values")
      .filter((q) => q.eq(q.field("splitId"), args.splitId))
      .collect();
    for (const fieldValue of fieldValues) {
      await ctx.db.delete(fieldValue._id);
    }

    return { success: true };
  },
});

// Internal query to get a single CMS page
export const getCMSPageInternal = internalQuery({
  args: {
    pageId: v.id("cms_pages"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.pageId);
  },
});

// Internal query to get a single CMS field
export const getCMSFieldInternal = internalQuery({
  args: {
    fieldId: v.id("cms_fields"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.fieldId);
  },
});

// Internal query to get field values with split merging logic
export const getCMSFieldValuesInternal = internalQuery({
  args: {
    pageId: v.id("cms_pages"),
    splitId: v.optional(v.union(v.null(), v.id("cms_splits"))),
  },
  handler: async (ctx, args) => {
    // Get all fields for this page
    const fields = await ctx.db
      .query("cms_fields")
      .filter((q) => q.eq(q.field("cmsPageId"), args.pageId))
      .collect();

    // Get default values (splitId = null)
    const defaultFieldValues = await ctx.db
      .query("cms_field_values")
      .withIndex("by_pageId", (q) => q.eq("pageId", args.pageId))
      .filter((q) => q.eq(q.field("splitId"), null))
      .collect();

    // Build a map of default values by fieldId
    const defaultValuesMap: Record<string, Record<string, string | null>> = {};
    for (const fieldValue of defaultFieldValues) {
      if (!defaultValuesMap[fieldValue.cmsFieldId]) {
        defaultValuesMap[fieldValue.cmsFieldId] = {};
      }
      // value is stored as an object with langCode keys
      if (typeof fieldValue.value === "object" && fieldValue.value !== null) {
        Object.assign(
          defaultValuesMap[fieldValue.cmsFieldId],
          fieldValue.value
        );
      }
    }

    // If splitId is provided, get split-specific values and merge over defaults
    if (args.splitId !== null && args.splitId !== undefined) {
      const splitFieldValues = await ctx.db
        .query("cms_field_values")
        .withIndex("by_pageId", (q) => q.eq("pageId", args.pageId))
        .filter((q) => q.eq(q.field("splitId"), args.splitId))
        .collect();

      // Merge split-specific values over defaults
      for (const fieldValue of splitFieldValues) {
        if (!defaultValuesMap[fieldValue.cmsFieldId]) {
          defaultValuesMap[fieldValue.cmsFieldId] = {};
        }
        // value is stored as an object with langCode keys
        if (typeof fieldValue.value === "object" && fieldValue.value !== null) {
          Object.assign(
            defaultValuesMap[fieldValue.cmsFieldId],
            fieldValue.value
          );
        }
      }
    }

    // Build result array with field info and merged values
    return fields.map((field) => ({
      fieldId: field._id,
      key: field.key,
      defaultValue: field.defaultValue,
      values: defaultValuesMap[field._id] || {},
    }));
  },
});

type CMSFieldValueResult = Array<{
  fieldId: Id<"cms_fields">;
  key: string;
  defaultValue: string;
  values: Record<string, string | null>;
}>;

export const getCMSFieldValues = query({
  args: {
    projectId: v.id("projects"),
    page: v.string(),
    splitId: v.optional(v.union(v.null(), v.id("cms_splits"))),
  },
  handler: async (ctx, args): Promise<CMSFieldValueResult> => {
    if (!args.page.includes("/")) {
      return await ctx.runQuery(internal.cms.getCMSFieldValuesInternal, {
        pageId: args.page as Id<"cms_pages">,
        splitId: args.splitId,
      });
    }
    const pageDB = await ctx.db
      .query("cms_pages")
      .filter((q) =>
        q.and(
          q.eq(q.field("projectId"), args.projectId),
          q.eq(q.field("slug"), args.page)
        )
      )
      .first();

    if (!pageDB) {
      return [];
    }
    // Call the internal query
    return await ctx.runQuery(internal.cms.getCMSFieldValuesInternal, {
      pageId: pageDB?._id,
      splitId: args.splitId,
    });
  },
});

export const getLanguages = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    return project.selectedLanguages || [];
  },
});
