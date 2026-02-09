"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { runWorkflow } from "./workflow";

// Helper function to create or update session (since we can't call mutations directly easily from here without defining them as internal)
// Actually we can call internal mutations.
// But we need to make sure the session exists.

export const sendMessage = action({
  args: {
    sessionId: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    // 0. Ensure session exists (Upsert)
    // We can't easily check auth here without passing token or context, but usually `ctx.auth` is available in actions too?
    // Convex Actions running in Node usually have access to auth if configured.
    // However, for simplicity, we'll just ask the internal mutation to handle "create if missing".
    // We already have `createSession` public mutation, but we should probably have an internal one for this or use `runMutation`.
    // Let's add a `ensureSession` internal mutation or just update `createSession` to be internal as well?
    // Actually, `createSession` is public. We can call it? No, `ctx.runMutation` calls registered mutations.

    // Let's rely on the frontend to call `createSession` on init, OR
    // we can add a step here to ensure it exists.
    // Let's add an internal mutation `ensureSession` in `chat.ts` to be safe?
    // Or just call `createSession` (public) via `runMutation`? `runMutation` can call public mutations too (usually `api.chat.createSession`).
    // But `api` is for clients. `internal` is for internal.
    // Let's add `internalCreateSession` in `chat.ts`.

    // For now, I will skip the explicit backend session creation in `sendMessage` and assume Frontend does it OR `saveMessage` could do it?
    // `saveMessage` is internal mutation. It can insert into `chat_sessions` if missing.

    // Let's update `chat.ts`'s `saveMessage` to also upsert `chat_sessions`.

    // 1. Save user message
    await ctx.runMutation((internal as any).chat.saveMessage, {
      sessionId: args.sessionId,
      role: "user",
      content: args.message,
    });

    // 2. Fetch history
    const messages = await ctx.runQuery((internal as any).chat.getMessages, {
      sessionId: args.sessionId,
    });

    // 3. Prepare messages for Workflow
    const historyForAgent = messages
      .slice(0, -1) // Exclude the just-added message
      .map((msg: any) => {
        if (msg.role === "assistant") {
          return {
            role: "assistant",
            content: [{ type: "output_text" as const, text: msg.content }],
          };
        }
        return {
          role: "user",
          content: [{ type: "input_text" as const, text: msg.content }],
        };
      });

    try {
      const result: any = await runWorkflow(
        { input_as_text: args.message },
        historyForAgent as any
      );

      let responseContent = "";

      if (result.type === "guardrail_failure") {
        responseContent =
          "I cannot process that request due to safety guidelines.";
        console.warn("Guardrail failure:", result);
      } else if (result.type === "success") {
        responseContent = result.output_text;
      } else {
        responseContent =
          "Sorry, I encountered an error processing your request.";
      }

      // 4. Save assistant response
      await ctx.runMutation((internal as any).chat.saveMessage, {
        sessionId: args.sessionId,
        role: "assistant",
        content: responseContent,
      });

      return responseContent;
    } catch (error) {
      console.error("Workflow Error:", error);
      // Don't throw to client, just return error message
      const errorMsg = "Sorry, something went wrong. Please try again later.";
      await ctx.runMutation((internal as any).chat.saveMessage, {
        sessionId: args.sessionId,
        role: "assistant",
        content: errorMsg,
      });
      return errorMsg;
    }
  },
});
