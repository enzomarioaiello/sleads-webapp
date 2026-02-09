import { TableNamesInDataModel } from "convex/server";
import {
  query,
  mutation,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import { v } from "convex/values";
import { DataModel, Id } from "./_generated/dataModel";

export const getData = internalQuery({
  args: {
    table: v.string(),
    apiKey: v.string(),
    cursor: v.optional(v.union(v.null(), v.string())),
    numItems: v.number(),
  },
  handler: async (ctx, args) => {
    const { continueCursor, isDone, page } = await ctx.db
      .query(args.table as TableNamesInDataModel<DataModel>)
      .paginate({
        cursor: args.cursor ? args.cursor : null,
        numItems: args.numItems,
      });

    return {
      continueCursor: continueCursor,
      isDone: isDone,
      page: page,
    };
  },
});

export const createData = internalMutation({
  args: {
    table: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    // Remove all null values from args.data
    Object.keys(args.data).forEach((key) => {
      if (args.data[key] === null) {
        delete args.data[key];
      }
    });

    const data = await ctx.db.insert(
      args.table as TableNamesInDataModel<DataModel>,
      args.data
    );
    return data;
  },
});

export const getObject = internalQuery({
  args: {
    objectId: v.string(),
  },
  handler: async (ctx, args) => {
    const object = await ctx.db.get(
      args.objectId as Id<TableNamesInDataModel<DataModel>>
    );
    return object;
  },
});

export const deleteObject = internalMutation({
  args: {
    objectId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.objectId as Id<TableNamesInDataModel<DataModel>>);
    return { success: true };
  },
});

export const updateObject = internalMutation({
  args: {
    objectId: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const object = await ctx.db.get(
      args.objectId as Id<TableNamesInDataModel<DataModel>>
    );
    if (!object) {
      throw new Error("Object not found");
    }

    Object.keys(args.data).forEach((key) => {
      if (args.data[key] === null) {
        delete args.data[key];
      }
    });

    const updatedObject = {
      ...object,
      ...args.data,
    };

    await ctx.db.patch(
      args.objectId as Id<TableNamesInDataModel<DataModel>>,
      updatedObject
    );
    return { success: true };
  },
});
