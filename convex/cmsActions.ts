"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import OpenAI from "openai";

export const translateCMSFields = action({
  args: {
    pageId: v.id("cms_pages"),
    splitId: v.optional(v.union(v.null(), v.id("cms_splits"))),
    sourceLang: v.string(), // "default" or language code
    targetLang: v.string(),
    fieldIds: v.array(v.id("cms_fields")),
    organizationId: v.id("organizations"),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    // Verify user has access to organization
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Verify project belongs to organization
    const project = await ctx.runQuery(api.project.getProject, {
      projectId: args.projectId,
      organizationId: args.organizationId,
    });
    if (!project) {
      throw new Error("Project not found or access denied");
    }

    // Get page to verify it belongs to project
    const page = await ctx.runQuery(internal.cms.getCMSPageInternal, {
      pageId: args.pageId,
    });
    if (!page || page.projectId !== args.projectId) {
      throw new Error("Page not found or access denied");
    }

    // Get field values for the page
    const fieldValuesData = await ctx.runQuery(
      internal.cms.getCMSFieldValuesInternal,
      {
        pageId: args.pageId,
        splitId: args.splitId,
      }
    );

    // Get fields to translate
    const fieldsToTranslate = fieldValuesData.filter((field) =>
      args.fieldIds.includes(field.fieldId)
    );

    if (fieldsToTranslate.length === 0) {
      throw new Error("No fields selected for translation");
    }

    // Prepare translation data
    const translationData: Array<{
      fieldId: Id<"cms_fields">;
      key: string;
      sourceText: string;
    }> = [];

    for (const field of fieldsToTranslate) {
      let sourceText = "";

      if (args.sourceLang === "default") {
        // Get default value from field
        const fieldDoc = await ctx.runQuery(internal.cms.getCMSFieldInternal, {
          fieldId: field.fieldId,
        });
        sourceText = fieldDoc?.defaultValue || "";
      } else {
        // Get value from source language
        sourceText = field.values[args.sourceLang] || "";
      }

      if (!sourceText.trim()) {
        continue; // Skip empty fields
      }

      translationData.push({
        fieldId: field.fieldId,
        key: field.key,
        sourceText,
      });
    }

    if (translationData.length === 0) {
      throw new Error("No content found to translate");
    }

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set in environment variables");
    }

    // Create translation prompt
    const translationPrompt = `Translate the following content from ${args.sourceLang === "default" ? "the default language" : args.sourceLang} to ${args.targetLang}. 

IMPORTANT RULES:
1. Preserve all HTML tags, formatting, and structure exactly as they appear
2. Do NOT translate URLs, email addresses, phone numbers, or any technical identifiers
3. Keep icons, emojis, and special characters unchanged
4. Use your judgment to determine if certain fields (like technical terms, brand names, or proper nouns) should remain in the source language
5. Return a valid JSON object with field keys and their translations

Content to translate:
${JSON.stringify(
  translationData.map((f) => ({
    fieldKey: f.key,
    content: f.sourceText,
  })),
  null,
  2
)}

Return only a JSON object in this format:
{
  "translations": {
    "fieldKey1": "translated content",
    "fieldKey2": "translated content"
  }
}`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a professional translator. Always respond with valid JSON only, no markdown formatting. Preserve HTML tags, URLs, emails, and phone numbers exactly as they appear.",
        },
        {
          role: "user",
          content: translationPrompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error("Failed to get translation response");
    }

    // Parse response
    let translations: Record<string, string>;
    try {
      const parsed = JSON.parse(responseContent);
      translations = parsed.translations || {};
    } catch {
      console.error("Failed to parse translation response:", responseContent);
      throw new Error("Failed to parse translation response");
    }

    // Get token usage
    const tokenCount = response.usage?.total_tokens || 0;
    const tokenPrice = 0.01 / 3; // Price per token (1/3 cent = 0.00333...)
    const START_TARIFF = 0.5; // Start tariff in EUR
    const FREE_TOKEN_THRESHOLD = 280; // Tokens included in start tariff

    // Calculate cost: if tokens <= 280, only charge start tariff
    // Otherwise charge (tokens × 0.00333...) + start tariff
    let totalCost: number;
    let tokenCostEntry: { amount: number; priceExclTax: number } | null = null;

    if (tokenCount <= FREE_TOKEN_THRESHOLD) {
      // Only charge start tariff, tokens are "free" (included)
      totalCost = START_TARIFF;
    } else {
      // Charge for tokens above the threshold + start tariff
      const chargeableTokens = tokenCount - FREE_TOKEN_THRESHOLD;
      const tokenCost = chargeableTokens * tokenPrice;
      totalCost = tokenCost + START_TARIFF;
      tokenCostEntry = {
        amount: chargeableTokens,
        priceExclTax: tokenPrice,
      };
    }

    // Create extra cost entries
    if (tokenCostEntry) {
      // Create entry for chargeable tokens (above threshold)
      await ctx.runMutation(internal.extraCosts.createExtraCostInternal, {
        projectId: args.projectId,
        organizationId: args.organizationId,
        name: "AI Translation Tokens",
        description: `${tokenCount} tokens (${FREE_TOKEN_THRESHOLD} free)@0.00333 --> AI translation CMS`,
        amount: tokenCostEntry.amount,
        priceExclTax: tokenCostEntry.priceExclTax,
        tax: 21,
        showSeparatelyOnInvoice: false,
      });
    }

    // Always add start tariff entry
    await ctx.runMutation(internal.extraCosts.createExtraCostInternal, {
      projectId: args.projectId,
      organizationId: args.organizationId,
      name: "AI Translation Start Tariff",
      description: `Start tariff (includes ${FREE_TOKEN_THRESHOLD} tokens)`,
      amount: 1,
      priceExclTax: START_TARIFF,
      tax: 21,
      showSeparatelyOnInvoice: false,
    });

    // Prepare field values for saving
    // We need to include all existing language values to preserve them
    const fieldValuesToSave = translationData
      .filter((field) => translations[field.key])
      .map((field) => {
        // Get existing values for this field from fieldValuesData
        const existingFieldData = fieldValuesData.find(
          (f) => f.fieldId === field.fieldId
        );

        // Build values array with all existing languages plus the new translation
        const values: Array<{ langCode: string; value: string | null }> = [];

        // Add all existing language values to preserve them
        if (existingFieldData) {
          for (const [langCode, value] of Object.entries(
            existingFieldData.values
          )) {
            if (langCode !== args.targetLang) {
              // Preserve existing values for other languages
              values.push({
                langCode,
                value,
              });
            }
          }
        }

        // Add the new translation for target language
        values.push({
          langCode: args.targetLang,
          value: translations[field.key],
        });

        return {
          fieldId: field.fieldId,
          values,
        };
      });

    // Save translations using existing mutation
    if (fieldValuesToSave.length > 0) {
      await ctx.runMutation(api.cms.saveCMSFieldValues, {
        pageId: args.pageId,
        organizationId: args.organizationId,
        splitId: args.splitId || null,
        fieldValues: fieldValuesToSave,
      });
    }

    return {
      success: true,
      tokenCount,
      cost: totalCost,
      translatedFields: fieldValuesToSave.length,
    };
  },
});

export const translateCMSFieldQuick = action({
  args: {
    pageId: v.id("cms_pages"),
    splitId: v.optional(v.union(v.null(), v.id("cms_splits"))),
    fieldId: v.id("cms_fields"),
    sourceLang: v.string(), // "default" or language code
    targetLangs: v.array(v.string()), // Array of target language codes
    organizationId: v.id("organizations"),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    // Verify user has access to organization
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Verify project belongs to organization
    const project = await ctx.runQuery(api.project.getProject, {
      projectId: args.projectId,
      organizationId: args.organizationId,
    });
    if (!project) {
      throw new Error("Project not found or access denied");
    }

    // Get page to verify it belongs to project
    const page = await ctx.runQuery(internal.cms.getCMSPageInternal, {
      pageId: args.pageId,
    });
    if (!page || page.projectId !== args.projectId) {
      throw new Error("Page not found or access denied");
    }

    // Get field values for the page
    const fieldValuesData = await ctx.runQuery(
      internal.cms.getCMSFieldValuesInternal,
      {
        pageId: args.pageId,
        splitId: args.splitId,
      }
    );

    // Find the specific field
    const fieldData = fieldValuesData.find((f) => f.fieldId === args.fieldId);
    if (!fieldData) {
      throw new Error("Field not found");
    }

    // Get source text
    let sourceText = "";
    if (args.sourceLang === "default") {
      const fieldDoc = await ctx.runQuery(internal.cms.getCMSFieldInternal, {
        fieldId: args.fieldId,
      });
      sourceText = fieldDoc?.defaultValue || "";
    } else {
      sourceText = fieldData.values[args.sourceLang] || "";
    }

    if (!sourceText.trim()) {
      throw new Error("Source field has no content to translate");
    }

    // Count words for pricing
    const wordCount = sourceText
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length;

    // Calculate pricing
    let pricePerTarget: number;
    if (wordCount > 10) {
      pricePerTarget = 0.03; // 3 cents per target if >10 words
    } else if (args.targetLangs.length === 1) {
      pricePerTarget = 0.02; // 2 cents total if only 1 target
    } else {
      pricePerTarget = 0.01; // 1 cent per target
    }

    const totalCost = pricePerTarget * args.targetLangs.length;

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set in environment variables");
    }

    // Create streamlined translation prompt for single field
    const translationPrompt = `Translate the following content from ${args.sourceLang === "default" ? "the default language" : args.sourceLang} to the following languages: ${args.targetLangs.join(", ")}.

IMPORTANT RULES:
1. Preserve all HTML tags, formatting, and structure exactly as they appear
2. Do NOT translate URLs, email addresses, phone numbers, or any technical identifiers
3. Keep icons, emojis, and special characters unchanged
4. Use your judgment to determine if certain content (like technical terms, brand names, or proper nouns) should remain in the source language
5. Return a valid JSON object with language codes as keys and translations as values

Content to translate:
${sourceText}

Return only a JSON object in this format:
{
  "translations": {
    "${args.targetLangs[0]}": "translated content for first language",
    "${args.targetLangs[1] || ""}": "translated content for second language"
  }
}`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a professional translator. Always respond with valid JSON only, no markdown formatting. Preserve HTML tags, URLs, emails, and phone numbers exactly as they appear.",
        },
        {
          role: "user",
          content: translationPrompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error("Failed to get translation response");
    }

    // Parse response
    let translations: Record<string, string>;
    try {
      const parsed = JSON.parse(responseContent);
      translations = parsed.translations || {};
    } catch {
      console.error("Failed to parse translation response:", responseContent);
      throw new Error("Failed to parse translation response");
    }

    // Get token usage
    const tokenCount = response.usage?.total_tokens || 0;

    // Create extra cost entry
    const fieldDoc = await ctx.runQuery(internal.cms.getCMSFieldInternal, {
      fieldId: args.fieldId,
    });
    const fieldKey = fieldDoc?.key || "unknown";

    if (args.targetLangs.length === 1) {
      // Single target language
      const lang = args.targetLangs[0];
      await ctx.runMutation(internal.extraCosts.createExtraCostInternal, {
        projectId: args.projectId,
        organizationId: args.organizationId,
        name: "AI Quick Translation",
        description: `Field "${fieldKey}" → ${lang} (${wordCount} words, ${tokenCount} tokens)`,
        amount: 1,
        priceExclTax: totalCost,
        tax: 21,
        showSeparatelyOnInvoice: false,
      });
    } else {
      // Multiple target languages - create one entry for all
      await ctx.runMutation(internal.extraCosts.createExtraCostInternal, {
        projectId: args.projectId,
        organizationId: args.organizationId,
        name: "AI Quick Translation",
        description: `Field "${fieldKey}" → ${args.targetLangs.join(", ")} (${wordCount} words, ${tokenCount} tokens)`,
        amount: 1,
        priceExclTax: totalCost,
        tax: 21,
        showSeparatelyOnInvoice: false,
      });
    }

    // Prepare field values for saving (preserve existing values)
    const existingFieldData = fieldValuesData.find(
      (f) => f.fieldId === args.fieldId
    );
    const values: Array<{ langCode: string; value: string | null }> = [];

    // Add all existing language values to preserve them
    if (existingFieldData) {
      for (const [langCode, value] of Object.entries(
        existingFieldData.values
      )) {
        if (!args.targetLangs.includes(langCode)) {
          // Preserve existing values for non-target languages
          values.push({
            langCode,
            value,
          });
        }
      }
    }

    // Add the new translations for target languages
    for (const targetLang of args.targetLangs) {
      if (translations[targetLang]) {
        values.push({
          langCode: targetLang,
          value: translations[targetLang],
        });
      }
    }

    // Save translations using existing mutation
    if (values.length > 0) {
      await ctx.runMutation(api.cms.saveCMSFieldValues, {
        pageId: args.pageId,
        organizationId: args.organizationId,
        splitId: args.splitId || null,
        fieldValues: [
          {
            fieldId: args.fieldId,
            values,
          },
        ],
      });
    }

    return {
      success: true,
      tokenCount,
      cost: totalCost,
      translatedLanguages: args.targetLangs.length,
      wordCount,
    };
  },
});
