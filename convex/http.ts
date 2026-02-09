import { httpRouter, TableNamesInDataModel } from "convex/server";
import { authComponent, createAuth } from "./auth";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { DataModel, Id } from "./_generated/dataModel";
import schema from "./schema";

const http = httpRouter();

// Helper function to add CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

// Helper function to create CORS response
const createCorsResponse = (
  body: string | object,
  status: number = 200,
  additionalHeaders: Record<string, string> = {}
): Response => {
  const responseBody = typeof body === "string" ? body : JSON.stringify(body);
  return new Response(responseBody, {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      ...additionalHeaders,
    },
  });
};

authComponent.registerRoutes(http, createAuth);

http.route({
  pathPrefix: "/cms/listening-mode/",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    try {
      const projectId = req.url.split("/").pop() as Id<"projects">;

      if (!projectId) {
        return createCorsResponse(
          {
            error: "Project ID is required",
          },
          400
        );
      }

      return createCorsResponse({
        listeningMode: await ctx.runQuery(api.cms.getListeningMode, {
          projectId: projectId,
        }),
      });
    } catch (error) {
      console.error("Error in /cms/listening-mode:", error);
      return createCorsResponse(
        {
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        500
      );
    }
  }),
});

// Handle OPTIONS preflight requests for /cms/register
http.route({
  path: "/cms/register",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return createCorsResponse("", 200);
  }),
});

http.route({
  path: "/cms/register",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const body = await req.json();
      const projectId = body.projectId as Id<"projects">;
      const apiKey = body.apiKey as string;
      const page = body.page as string;
      const fields = body.fields as Array<{ id: string; value: string }>;

      if (!projectId || !apiKey || !page || !fields) {
        return createCorsResponse({ error: "Invalid request" }, 400);
      }

      await ctx.runMutation(api.cms.register, {
        cmsKey: apiKey,
        page: page,
        fields: fields,
      });

      return createCorsResponse({ success: true }, 200);
    } catch (error) {
      console.error("Error in /cms/register:", error);
      return createCorsResponse(
        {
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        500
      );
    }
  }),
});

http.route({
  pathPrefix: "/cms/get-fields/",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    try {
      const params = req.url.split("?")[1];
      const paramsObj = new URLSearchParams(params);
      const pageId = paramsObj.get("pageId") as string;
      const splitId = paramsObj.get("splitId") as Id<"cms_splits"> | null;
      const projectId = paramsObj.get("projectId") as Id<"projects">;

      if (!projectId || !pageId || !splitId) {
        return createCorsResponse({ error: "Invalid request" }, 400);
      }

      const getFields = await ctx.runQuery(api.cms.getCMSFieldValues, {
        page: pageId,
        splitId:
          splitId !== "null"
            ? splitId !== "undefined"
              ? (splitId as Id<"cms_splits">)
              : null
            : null,
        projectId: projectId,
      });

      return createCorsResponse({ fields: getFields });
    } catch (error) {
      console.error("Error in /cms/get-fields:", error);
      return createCorsResponse(
        {
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        500
      );
    }
  }),
});

http.route({
  pathPrefix: "/cms/get-languages/",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    try {
      const projectId = req.url.split("/").pop() as Id<"projects">;
      if (!projectId) {
        return createCorsResponse({ error: "Invalid request" }, 400);
      }
      return createCorsResponse({
        languages: await ctx.runQuery(api.cms.getLanguages, {
          projectId: projectId,
        }),
      });
    } catch (error) {
      console.error("Error in /cms/get-languages:", error);
      return createCorsResponse(
        {
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        500
      );
    }
  }),
});

http.route({
  path: "/get-schema",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    try {
      const apiKey = req.url.split("?")[1].split("=")[1];
      return createCorsResponse({ schema: schema }, 200);
    } catch (error) {
      console.error("Error in /get-schema:", error);
      return createCorsResponse(
        {
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        500
      );
    }
  }),
});

http.route({
  pathPrefix: "/get-dynamic-table-data/",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    try {
      const table = req.url.split("/").pop()?.split("?")[0];
      const params = req.url.split("?")[1];
      const paramsObj = new URLSearchParams(params);
      const cursor = paramsObj.get("cursor") as string;
      const numItems = paramsObj.get("numItems") as string;
      const apiKey = paramsObj.get("apiKey") as string;

      const storedKey = process.env.SLEADS_SO_KEY;
      if (!storedKey || apiKey !== storedKey) {
        return createCorsResponse({ error: "Invalid API key" }, 401);
      }

      if (!table || !apiKey || !numItems) {
        return createCorsResponse({ error: "Invalid request" }, 400);
      }

      const data = await ctx.runQuery(internal.SOAdapter.getData, {
        table: table,
        apiKey: apiKey,
        cursor: cursor ? cursor : null,
        numItems: numItems ? parseInt(numItems) : 10,
      });

      return createCorsResponse(
        {
          continueCursor: data.continueCursor,
          isDone: data.isDone,
          page: data.page,
        },
        200
      );
    } catch (error) {
      console.error("Error in /get-dynamic-table-data:", error);
      return createCorsResponse(
        {
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        500
      );
    }
  }),
});

http.route({
  pathPrefix: "/get-object/",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    try {
      const objectId = req.url.split("/").pop()?.split("?")[0] as Id<
        TableNamesInDataModel<DataModel>
      >;
      const apiKey = req.url.split("?")[1].split("=")[1];
      if (!objectId || !apiKey) {
        return createCorsResponse({ error: "Invalid request" }, 400);
      }

      const storedKey = process.env.SLEADS_SO_KEY;
      if (!storedKey || apiKey !== storedKey) {
        return createCorsResponse({ error: "Invalid API key" }, 401);
      }

      console.log(objectId);
      const object = await ctx.runQuery(internal.SOAdapter.getObject, {
        objectId: objectId,
      });
      return createCorsResponse({ ...object }, 200);
    } catch (error) {
      console.error("Error in /get-object:", error);
      return createCorsResponse(
        {
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        500
      );
    }
  }),
});

http.route({
  pathPrefix: "/create-dynamic-table-data/",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const table = req.url.split("/").pop()?.split("?")[0];
      const apiKey = req.url.split("?")[1].split("=")[1];

      const storedKey = process.env.SLEADS_SO_KEY;
      if (!storedKey || apiKey !== storedKey) {
        return createCorsResponse({ error: "Invalid API key" }, 401);
      }

      const data = await req.json();
      console.log(data);
      if (!table || !apiKey || !data) {
        return createCorsResponse({ error: "Invalid request" }, 400);
      }

      console.log(data);

      const id = await ctx.runMutation(internal.SOAdapter.createData, {
        table: table,
        data: data,
      });

      return createCorsResponse({ success: true, id: id }, 200);
    } catch (error) {
      console.error("Error in /create-dynamic-table-data:", error);
      return createCorsResponse(
        {
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        500
      );
    }
  }),
});

http.route({
  pathPrefix: "/delete-object/",
  method: "DELETE",
  handler: httpAction(async (ctx, req) => {
    try {
      const storedKey = process.env.SLEADS_SO_KEY;

      const objectId = req.url.split("/").pop()?.split("?")[0] as Id<
        TableNamesInDataModel<DataModel>
      >;
      const apiKey = req.url.split("?")[1].split("=")[1];
      if (!objectId || !apiKey) {
        return createCorsResponse({ error: "Invalid request" }, 400);
      }

      if (!storedKey || apiKey !== storedKey) {
        return createCorsResponse({ error: "Invalid API key" }, 401);
      }

      await ctx.runMutation(internal.SOAdapter.deleteObject, {
        objectId: objectId,
      });
      return createCorsResponse({ success: true }, 200);
    } catch (error) {
      console.error("Error in /delete-object:", error);
      return createCorsResponse(
        {
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        500
      );
    }
  }),
});

http.route({
  pathPrefix: "/update-object/",
  method: "PUT",
  handler: httpAction(async (ctx, req) => {
    try {
      const storedKey = process.env.SLEADS_SO_KEY;

      const objectId = req.url.split("/").pop()?.split("?")[0] as Id<
        TableNamesInDataModel<DataModel>
      >;
      const apiKey = req.url.split("?")[1].split("=")[1];
      if (!objectId || !apiKey) {
        return createCorsResponse({ error: "Invalid request" }, 400);
      }

      if (!storedKey || apiKey !== storedKey) {
        return createCorsResponse({ error: "Invalid API key" }, 401);
      }

      const data = await req.json();
      if (!data) {
        return createCorsResponse({ error: "Invalid request" }, 400);
      }

      await ctx.runMutation(internal.SOAdapter.updateObject, {
        objectId: objectId,
        data: data,
      });
      return createCorsResponse({ success: true }, 200);
    } catch (error) {
      console.error("Error in /update-object:", error);
      return createCorsResponse(
        {
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        500
      );
    }
  }),
});
export default http;
