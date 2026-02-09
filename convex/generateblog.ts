"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import OpenAI from "openai";

// Helper function to generate a URL-friendly slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .trim();
}

// Helper function to calculate read time based on word count
function calculateReadTime(content: string): string {
  // Strip HTML tags and count words
  const textContent = content.replace(/<[^>]*>/g, " ");
  const wordCount = textContent.split(/\s+/).filter((word) => word).length;
  const minutes = Math.ceil(wordCount / 200); // Average reading speed
  return `${minutes} min`;
}

// Content pillars for blog generation
const CONTENT_PILLARS = [
  {
    pillar: "Web Development",
    category: "Web Development",
    categoryNL: "Webontwikkeling",
    audience: "Technical leads, CTOs, developers",
    subTopics: [
      // Frontend
      "Frontend frameworks (React, Next.js, Vue, Svelte)",
      "State management strategies",
      "Component architecture & design systems",
      "Server-side rendering (SSR) vs static generation (SSG)",
      "Micro-frontends",
      "Web accessibility at code level",

      // Backend
      "Backend architecture patterns",
      "API design (REST vs GraphQL vs RPC)",
      "Authentication & authorization",
      "Scalable database design",
      "Caching strategies",
      "Event-driven architectures",

      // CMS
      "Traditional CMS vs headless CMS",
      "Content modeling strategies",
      "Multi-language CMS setups",
      "CMS performance optimization",
      "CMS security risks",

      // Quality & Ops
      "Performance optimization (code-level)",
      "Testing strategies (unit, integration, e2e)",
      "DevOps & CI/CD pipelines",
      "Monitoring & observability",
      "Error handling & logging",
      "Technical debt management",
    ],
    blogAngles: [
      "How-to guides for scalable project structures",
      "Architecture comparisons for different business sizes",
      "Common development mistakes we see in audits",
      "Deep dives into real-world performance bottlenecks",
      "Best practices for long-term maintainability",
      "Opinion pieces on overengineering vs pragmatism",
      "Security pitfalls developers underestimate",
      "Refactoring strategies without breaking production",
      "Framework trade-offs beyond hype",
      "Lessons learned from large-scale rebuilds",
    ],
  },

  {
    pillar: "SEO & Performance",
    category: "SEO & Performance",
    categoryNL: "SEO & Prestaties",
    audience: "Marketers, founders, growth teams",
    subTopics: [
      // Technical SEO
      "Technical SEO fundamentals",
      "Indexing & crawling behavior",
      "Site architecture & internal linking",
      "JavaScript SEO",
      "International SEO & hreflang",
      "Local SEO strategies",

      // Performance
      "Core Web Vitals optimization",
      "Page speed optimization",
      "Image & media optimization",
      "Server & hosting performance",
      "CDN strategies",

      // Content & tooling
      "SEO audits & tooling",
      "Search intent mapping",
      "Keyword clustering",
      "SEO automation",
      "AI-driven SEO workflows",

      // Risk & change
      "SEO migrations & redesigns",
      "Algorithm updates & volatility",
      "SEO recovery strategies",
    ],
    blogAngles: [
      "Step-by-step technical SEO checklists",
      "Explaining Google ranking factors in plain language",
      "SEO mistakes on high-quality websites",
      "Performance fixes with the highest ROI",
      "How AI is reshaping SEO workflows",
      "SEO strategies for competitive industries",
      "What breaks SEO during redesigns",
      "SEO myths founders still believe",
      "Trade-offs between speed, UX, and tracking",
      "SEO lessons from failed migrations",
    ],
  },

  {
    pillar: "UX / CRO",
    category: "UX & Conversion",
    categoryNL: "UX & Conversie",
    audience: "Product managers, founders, UX leads",
    subTopics: [
      // UX fundamentals
      "UX research methodologies",
      "User journey mapping",
      "Usability testing",
      "Information architecture",
      "Design heuristics",

      // CRO
      "Conversion rate optimization (CRO)",
      "A/B testing strategies",
      "Behavioral psychology in UX",
      "Form optimization",
      "Checkout optimization",

      // Accessibility & platforms
      "Accessibility (WCAG compliance)",
      "Mobile UX",
      "UX for SaaS platforms",
      "UX for e-commerce",
      "UX for B2B websites",

      // Measurement
      "UX metrics & KPIs",
      "Heatmaps & session recordings",
      "User feedback loops",
    ],
    blogAngles: [
      "Data-driven analysis of user drop-off",
      "UX patterns that consistently increase conversions",
      "Before/after UX case breakdowns",
      "Accessibility as a business advantage",
      "Mobile UX mistakes that hurt revenue",
      "UX myths that don’t survive testing",
      "Design decisions backed by real data",
      "Reducing friction without dark patterns",
      "CRO prioritization frameworks",
      "Why beautiful design doesn’t always convert",
    ],
  },

  {
    pillar: "AI & Automation",
    category: "AI & Automation",
    categoryNL: "AI & Automatisering",
    audience: "Founders, innovation leads, CTOs",
    subTopics: [
      // AI in products
      "AI-powered websites",
      "Chatbots & conversational interfaces",
      "AI search & RAG systems",
      "Personalization with AI",
      "AI recommendations",

      // Automation
      "Automation for agencies",
      "Automation for internal business processes",
      "Workflow automation",
      "No-code & low-code automation",
      "AI-assisted content pipelines",

      // Engineering & risk
      "AI in development workflows",
      "Prompt engineering",
      "Model selection & evaluation",
      "AI governance & reliability",
      "Security & privacy in AI systems",
      "AI hallucinations & mitigation",
    ],
    blogAngles: [
      "Where AI delivers real ROI (and where it doesn’t)",
      "Implementing AI without damaging trust",
      "Build vs buy AI decision frameworks",
      "Why AI features fail in production",
      "AI automation use cases that scale",
      "Operational risks of AI adoption",
      "From prototype to production AI",
      "AI hype vs reality for businesses",
      "Responsible AI design decisions",
      "Lessons learned from failed AI pilots",
    ],
  },

  {
    pillar: "Business & Strategy",
    category: "Business Strategy",
    categoryNL: "Bedrijfsstrategie",
    audience: "Founders, executives, managers",
    subTopics: [
      // Strategy
      "Digital strategy",
      "Digital transformation",
      "Platform selection",
      "Make vs buy decisions",
      "Vendor & agency selection",

      // Financials
      "Budgeting & prioritization",
      "ROI modeling",
      "Cost of ownership",
      "Technical investment planning",

      // Scaling & risk
      "Scaling digital platforms",
      "Scaling teams",
      "Risk management",
      "Compliance & regulation",
      "Security & legal considerations",

      // Operations
      "Governance & decision-making",
      "Stakeholder alignment",
      "Roadmapping & prioritization",
    ],
    blogAngles: [
      "Decision-making frameworks for tech investments",
      "When digital transformation actually pays off",
      "Why website projects fail organizationally",
      "Aligning business goals with technical execution",
      "Redesign vs rebuild vs optimize decisions",
      "Hidden costs of cheap solutions",
      "How to brief agencies effectively",
      "Reducing risk in large digital projects",
      "Executive mistakes in platform decisions",
      "Long-term strategy beyond launch day",
    ],
  },
];

// Helper to check if a subtopic has been used (fuzzy matching)
function isSubtopicUsed(
  subTopic: string,
  existingKeywords: string[],
  existingTitles: string[]
): boolean {
  const subTopicLower = subTopic.toLowerCase();
  const subTopicWords = subTopicLower
    .split(/[\s&(),\/]+/)
    .filter((w) => w.length > 3);

  // Check if any keyword set contains significant overlap with this subtopic
  for (const keywords of existingKeywords) {
    const keywordLower = keywords.toLowerCase();
    const matchCount = subTopicWords.filter((word) =>
      keywordLower.includes(word)
    ).length;
    if (matchCount >= 2) return true;
  }

  // Check if any title is too similar
  for (const title of existingTitles) {
    const titleLower = title.toLowerCase();
    const matchCount = subTopicWords.filter((word) =>
      titleLower.includes(word)
    ).length;
    if (matchCount >= 2) return true;
  }

  return false;
}

// Helper function to select a topic with balanced distribution
// Avoids already-used subtopics and ensures category balance
function selectBalancedTopic(
  existingCategories: string[],
  existingKeywords: string[],
  existingTitles: string[]
): {
  pillar: string;
  category: string;
  categoryNL: string;
  subTopic: string;
  blogAngle: string;
  audience: string;
} {
  // Count how many blogs exist per category
  const categoryCounts: Record<string, number> = {};
  for (const pillar of CONTENT_PILLARS) {
    categoryCounts[pillar.category] = 0;
  }
  for (const category of existingCategories) {
    if (categoryCounts[category] !== undefined) {
      categoryCounts[category]++;
    }
  }

  // Find the minimum count
  const minCount = Math.min(...Object.values(categoryCounts));

  // Get pillars that have the minimum count (underrepresented categories)
  const underrepresentedPillars = CONTENT_PILLARS.filter(
    (pillar) => categoryCounts[pillar.category] === minCount
  );

  // If all categories are equally represented, use all pillars
  const eligiblePillars =
    underrepresentedPillars.length > 0
      ? underrepresentedPillars
      : CONTENT_PILLARS;

  // Randomly select from eligible pillars
  const pillar =
    eligiblePillars[Math.floor(Math.random() * eligiblePillars.length)];

  // Find unused subtopics for this pillar
  const unusedSubTopics = pillar.subTopics.filter(
    (st) => !isSubtopicUsed(st, existingKeywords, existingTitles)
  );

  // Use unused subtopics if available, otherwise pick any
  const availableSubTopics =
    unusedSubTopics.length > 0 ? unusedSubTopics : pillar.subTopics;

  // Randomly select subtopic and angle
  const subTopic =
    availableSubTopics[Math.floor(Math.random() * availableSubTopics.length)];
  const blogAngle =
    pillar.blogAngles[Math.floor(Math.random() * pillar.blogAngles.length)];

  console.log(
    `Selected: ${pillar.category} > "${subTopic}" (${unusedSubTopics.length} unused subtopics, category count: ${categoryCounts[pillar.category]})`
  );

  return {
    pillar: pillar.pillar,
    category: pillar.category,
    categoryNL: pillar.categoryNL,
    subTopic,
    blogAngle,
    audience: pillar.audience,
  };
}

// Return type for blog generation
interface BlogGenerationResult {
  success: boolean;
  blogId: string;
  title: string;
  titleNL: string;
  slug: string;
  imageUrl: string;
}

// Main action to generate a complete blog post with AI
export const generateBlogPost = action({
  args: {
    topic: v.optional(v.string()), // Optional topic hint
    category: v.optional(v.string()), // Optional category
    language: v.optional(v.union(v.literal("nl"), v.literal("en"))), // Primary language
  },
  handler: async (ctx, args): Promise<BlogGenerationResult> => {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set in environment variables");
    }

    // 1. Get existing blog data to ensure uniqueness
    const existingBlogs: Array<{
      title: string;
      titleNL: string;
      slug: string;
      category: string;
      keywords: string;
      excerpt: string;
      tags: string[];
    }> = await ctx.runQuery(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (internal as any).generateblogHelpers.getAllBlogTitles
    );

    // Prepare data for uniqueness checking
    const existingTitlesArray = existingBlogs.map((b) => b.title);
    const existingTitlesNLArray = existingBlogs.map((b) => b.titleNL);
    const existingKeywords = existingBlogs
      .map((b) => b.keywords)
      .filter(Boolean);
    const existingCategories = existingBlogs.map((b) => b.category);

    // Format titles for the prompt
    const existingTitles = existingTitlesArray.join("\n- ");
    const existingTitlesNL = existingTitlesNLArray.join("\n- ");

    // 2. Select a balanced topic, avoiding already-used subtopics
    const selectedTopic = selectBalancedTopic(
      existingCategories,
      existingKeywords,
      existingTitlesArray
    );
    const currentYear = new Date().getFullYear();
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Use provided topic/category or fall back to random selection
    const topicInfo = args.topic
      ? {
          topic: args.topic,
          category: args.category || selectedTopic.category,
          categoryNL: args.category || selectedTopic.categoryNL,
        }
      : {
          topic: `${selectedTopic.subTopic} - ${selectedTopic.blogAngle}`,
          category: selectedTopic.category,
          categoryNL: selectedTopic.categoryNL,
        };

    const blogPrompt = `You are a professional content writer for Sleads, a digital product studio specializing in custom websites, web platforms, and software development.

⚠️ CRITICAL DATE REQUIREMENT ⚠️
Today is ${currentDate}. We are in the year ${currentYear}.
- NEVER mention 2024 or 2025 as current/future years - they are in the PAST
- All trends, forecasts, predictions MUST be for ${currentYear} or later

⚠️ CRITICAL UNIQUENESS REQUIREMENT ⚠️
You MUST write a COMPLETELY UNIQUE blog post. Check ALL existing titles below and ensure your new article:
1. Has a COMPLETELY DIFFERENT title (not just rephrased)
2. Covers a DIFFERENT angle or aspect
3. Does NOT rehash the same main points
4. Provides FRESH insights not covered before

═══════════════════════════════════════════════════════════════
YOUR ASSIGNED TOPIC (you MUST write about this specific topic):
═══════════════════════════════════════════════════════════════
📌 MAIN SUBJECT: "${selectedTopic.subTopic}"
📐 WRITING ANGLE: "${selectedTopic.blogAngle}"
📂 CATEGORY: ${topicInfo.category} (Dutch: ${topicInfo.categoryNL})
👥 TARGET AUDIENCE: ${selectedTopic.audience}
🏛️ CONTENT PILLAR: ${selectedTopic.pillar}

═══════════════════════════════════════════════════════════════
⛔ EXISTING BLOG TITLES - DO NOT DUPLICATE:
═══════════════════════════════════════════════════════════════
${existingTitles ? `English:\n- ${existingTitles}` : "English: (None yet)"}

${existingTitlesNL ? `Dutch:\n- ${existingTitlesNL}` : "Dutch: (None yet)"}
═══════════════════════════════════════════════════════════════

REQUIREMENTS:
1. Write specifically about: "${selectedTopic.subTopic}" using the angle: "${selectedTopic.blogAngle}"
2. Category must be exactly: "${topicInfo.category}" (English) / "${topicInfo.categoryNL}" (Dutch)
3. The blog must be professional, informative, and engaging
4. Content should be 800-1200 words
5. Use proper HTML formatting with these tags:
   - <h1> for the main title (only one)
   - <h2> for section headings
   - <h3> for subsection headings
   - <p> for paragraphs
   - <ul> and <li> for bullet lists
   - <strong> for emphasis
6. Write in a professional but approachable tone
7. Include practical tips or insights
8. ⚠️ MANDATORY CTA: End EVERY blog with a call-to-action section that:
   - Has a heading like "Ready to get started?" / "Klaar om te beginnen?"
   - Includes a friendly invitation to work with Sleads
   - Contains a clickable link using: <a href="https://www.sleads.nl/contact">contact us</a> or <a href="https://www.sleads.nl/contact">neem contact op</a>
   - Example: "Ready to take your website to the next level? <a href="https://www.sleads.nl/contact">Let's talk about your project</a>."

RESPOND IN THIS EXACT JSON FORMAT (no markdown, just pure JSON):
{
  "title": "English title",
  "titleNL": "Dutch title",
  "excerpt": "Short English description (2-3 sentences)",
  "excerptNL": "Short Dutch description (2-3 sentences)",
  "category": "${topicInfo.category}",
  "categoryNL": "${topicInfo.categoryNL}",
  "content": "Full HTML content in English (MUST end with CTA section with link to contact page)",
  "contentNL": "Full HTML content in Dutch (MUST end with CTA section with link to contact page)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "metaTitle": "SEO title in English (max 60 chars)",
  "metaDescription": "SEO description in English (max 160 chars)",
  "keywords": "comma, separated, keywords",
  "imagePrompt": "A detailed description for DALL-E to generate a relevant blog header image (professional, modern, tech-focused, related to ${selectedTopic.pillar})"
}`;

    const blogResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert content writer. Today's date is ${currentDate} (year ${currentYear}). Never reference 2024 or 2025 as current/future - they are past years. Always respond with valid JSON only, no markdown formatting.`,
        },
        {
          role: "user",
          content: blogPrompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 4000,
    });

    const blogContentRaw = blogResponse.choices[0]?.message?.content;
    if (!blogContentRaw) {
      throw new Error("Failed to generate blog content");
    }

    // Parse the JSON response
    let blogData: {
      title: string;
      titleNL: string;
      excerpt: string;
      excerptNL: string;
      category: string;
      categoryNL: string;
      content: string;
      contentNL: string;
      tags: string[];
      metaTitle: string;
      metaDescription: string;
      keywords: string;
      imagePrompt: string;
    };

    try {
      // Clean up potential markdown formatting
      const cleanedContent = blogContentRaw
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      blogData = JSON.parse(cleanedContent);
    } catch (_parseError) {
      console.error("Failed to parse blog JSON:", blogContentRaw);
      throw new Error("Failed to parse generated blog content as JSON");
    }

    // 3. Generate image using DALL-E
    let imageUrl = "";
    try {
      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: `${blogData.imagePrompt}. Style: Modern, professional, clean, suitable for a tech company blog header. No text in the image.`,
        n: 1,
        size: "1792x1024",
        quality: "standard",
      });

      const generatedImageUrl = imageResponse.data?.[0]?.url;
      if (generatedImageUrl) {
        // 4. Download the image and upload to Convex storage
        const imageData = await fetch(generatedImageUrl);
        const imageBlob = await imageData.blob();

        // Generate upload URL
        const uploadUrl = await ctx.storage.generateUploadUrl();

        // Upload the image
        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            "Content-Type": imageBlob.type || "image/png",
          },
          body: imageBlob,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload image to Convex storage");
        }

        const { storageId } = await uploadResponse.json();

        // Get the permanent URL
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        imageUrl =
          (await ctx.runMutation(
            (internal as any).generateblogHelpers.storeImageAndGetUrl,
            { storageId }
          )) || "";
      }
    } catch (imageError) {
      console.error("Failed to generate/upload image:", imageError);
      // Use a placeholder image URL if image generation fails
      imageUrl = "/images/blog/default-blog-header.jpg";
    }

    // 5. Generate slug from title
    const slug = generateSlug(blogData.title);

    // Check if slug already exists and modify if needed
    const existingSlugs = existingBlogs.map((b: { slug: string }) => b.slug);
    let finalSlug = slug;
    let slugCounter = 1;
    while (existingSlugs.includes(finalSlug)) {
      finalSlug = `${slug}-${slugCounter}`;
      slugCounter++;
    }

    // 6. Calculate read time
    const readTime = calculateReadTime(blogData.content);

    // 7. Create the blog post
    const blogDate = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const blogId: string = await ctx.runMutation(
      (internal as any).generateblogHelpers.createBlogPost,
      {
        title: blogData.title,
        titleNL: blogData.titleNL,
        excerpt: blogData.excerpt,
        excerptNL: blogData.excerptNL,
        category: blogData.category,
        categoryNL: blogData.categoryNL,
        author: "Sleads Team",
        date: blogDate,
        readTime: readTime,
        image: imageUrl,
        slug: finalSlug,
        content: blogData.content,
        contentNL: blogData.contentNL,
        tags: blogData.tags,
        metaTitle: blogData.metaTitle,
        metaDescription: blogData.metaDescription,
        keywords: blogData.keywords,
      }
    );

    return {
      success: true,
      blogId,
      title: blogData.title,
      titleNL: blogData.titleNL,
      slug: finalSlug,
      imageUrl,
    };
  },
});

// Return type for multiple blog generation
interface MultipleBlogGenerationResult {
  generated: number;
  failed: number;
  results: Array<BlogGenerationResult | { success: false; error: string }>;
}

// Action to generate multiple blog posts
export const generateMultipleBlogPosts = action({
  args: {
    count: v.number(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<MultipleBlogGenerationResult> => {
    const results: Array<
      BlogGenerationResult | { success: false; error: string }
    > = [];
    const maxCount = Math.min(args.count, 5); // Limit to 5 posts per call

    for (let i = 0; i < maxCount; i++) {
      try {
        const result: BlogGenerationResult = await ctx.runAction(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (internal as any).generateblog.generateBlogPost,
          {
            category: args.category,
            language: "nl", // Default to Dutch
          }
        );
        results.push(result);

        // Add a small delay between generations to avoid rate limiting
        if (i < maxCount - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`Failed to generate blog post ${i + 1}:`, error);
        results.push({
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      generated: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  },
});

// Internal action for scheduled/cron blog generation
export const scheduledBlogGeneration = internalAction({
  args: {},
  handler: async (ctx): Promise<{ success: boolean; message: string }> => {
    try {
      console.log(
        `[CRON] Starting scheduled blog generation at ${new Date().toISOString()}`
      );

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is not set in environment variables");
      }

      // Get existing blog data for uniqueness checking
      const existingBlogs: Array<{
        title: string;
        titleNL: string;
        slug: string;
        category: string;
        keywords: string;
        excerpt: string;
        tags: string[];
      }> = await ctx.runQuery(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (internal as any).generateblogHelpers.getAllBlogTitles
      );

      // Prepare data for uniqueness checking
      const existingTitlesArray = existingBlogs.map((b) => b.title);
      const existingTitlesNLArray = existingBlogs.map((b) => b.titleNL);
      const existingKeywords = existingBlogs
        .map((b) => b.keywords)
        .filter(Boolean);
      const existingCategories = existingBlogs.map((b) => b.category);

      // Format titles for the prompt
      const existingTitles = existingTitlesArray.join("\n- ");
      const existingTitlesNL = existingTitlesNLArray.join("\n- ");

      // Select balanced topic, avoiding already-used subtopics
      const selectedTopic = selectBalancedTopic(
        existingCategories,
        existingKeywords,
        existingTitlesArray
      );
      const currentYear = new Date().getFullYear();
      const currentDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const topicInfo = {
        topic: `${selectedTopic.subTopic} - ${selectedTopic.blogAngle}`,
        category: selectedTopic.category,
        categoryNL: selectedTopic.categoryNL,
      };

      console.log(
        `[CRON] Generating blog: "${selectedTopic.subTopic}" with angle "${selectedTopic.blogAngle}"`
      );

      const blogPrompt = `You are a professional content writer for Sleads, a digital product studio specializing in custom websites, web platforms, and software development.

⚠️ CRITICAL DATE REQUIREMENT ⚠️
Today is ${currentDate}. We are in the year ${currentYear}.
- NEVER mention 2024 or 2025 as current/future years - they are in the PAST
- All trends, forecasts, predictions MUST be for ${currentYear} or later

⚠️ CRITICAL UNIQUENESS REQUIREMENT ⚠️
You MUST write a COMPLETELY UNIQUE blog post. Check ALL existing titles below and ensure your new article:
1. Has a COMPLETELY DIFFERENT title (not just rephrased)
2. Covers a DIFFERENT angle or aspect
3. Does NOT rehash the same main points
4. Provides FRESH insights not covered before

═══════════════════════════════════════════════════════════════
YOUR ASSIGNED TOPIC (you MUST write about this specific topic):
═══════════════════════════════════════════════════════════════
📌 MAIN SUBJECT: "${selectedTopic.subTopic}"
📐 WRITING ANGLE: "${selectedTopic.blogAngle}"
📂 CATEGORY: ${topicInfo.category} (Dutch: ${topicInfo.categoryNL})
👥 TARGET AUDIENCE: ${selectedTopic.audience}
🏛️ CONTENT PILLAR: ${selectedTopic.pillar}

═══════════════════════════════════════════════════════════════
⛔ EXISTING BLOG TITLES - DO NOT DUPLICATE:
═══════════════════════════════════════════════════════════════
${existingTitles ? `English:\n- ${existingTitles}` : "English: (None yet)"}

${existingTitlesNL ? `Dutch:\n- ${existingTitlesNL}` : "Dutch: (None yet)"}
═══════════════════════════════════════════════════════════════

REQUIREMENTS:
1. Write specifically about: "${selectedTopic.subTopic}" using the angle: "${selectedTopic.blogAngle}"
2. Category must be exactly: "${topicInfo.category}" (English) / "${topicInfo.categoryNL}" (Dutch)
3. The blog must be professional, informative, and engaging
4. Content should be 800-1200 words
5. Use proper HTML formatting with these tags:
   - <h1> for the main title (only one)
   - <h2> for section headings
   - <h3> for subsection headings
   - <p> for paragraphs
   - <ul> and <li> for bullet lists
   - <strong> for emphasis
6. Write in a professional but approachable tone
7. Include practical tips or insights
8. ⚠️ MANDATORY CTA: End EVERY blog with a call-to-action section that:
   - Has a heading like "Ready to get started?" / "Klaar om te beginnen?"
   - Includes a friendly invitation to work with Sleads
   - Contains a clickable link using: <a href="https://www.sleads.nl/contact">contact us</a> or <a href="https://www.sleads.nl/contact">neem contact op</a>
   - Example: "Ready to take your website to the next level? <a href="https://www.sleads.nl/contact">Let's talk about your project</a>."

RESPOND IN THIS EXACT JSON FORMAT (no markdown, just pure JSON):
{
  "title": "English title - MUST BE UNIQUE from existing titles",
  "titleNL": "Dutch title - MUST BE UNIQUE from existing titles",
  "excerpt": "Short English description (2-3 sentences)",
  "excerptNL": "Short Dutch description (2-3 sentences)",
  "category": "${topicInfo.category}",
  "categoryNL": "${topicInfo.categoryNL}",
  "content": "Full HTML content in English (MUST end with CTA section with link to contact page)",
  "contentNL": "Full HTML content in Dutch (MUST end with CTA section with link to contact page)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "metaTitle": "SEO title in English (max 60 chars)",
  "metaDescription": "SEO description in English (max 160 chars)",
  "keywords": "comma, separated, keywords, related, to, ${selectedTopic.subTopic}",
  "imagePrompt": "A detailed description for DALL-E to generate a relevant blog header image (professional, modern, tech-focused, related to ${selectedTopic.subTopic})"
}`;

      const blogResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert content writer. Today's date is ${currentDate} (year ${currentYear}). Never reference 2024 or 2025 as current/future - they are past years. Always respond with valid JSON only, no markdown formatting.`,
          },
          {
            role: "user",
            content: blogPrompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 4000,
      });

      const blogContentRaw = blogResponse.choices[0]?.message?.content;
      if (!blogContentRaw) {
        throw new Error("Failed to generate blog content");
      }

      // Parse the JSON response
      let blogData: {
        title: string;
        titleNL: string;
        excerpt: string;
        excerptNL: string;
        category: string;
        categoryNL: string;
        content: string;
        contentNL: string;
        tags: string[];
        metaTitle: string;
        metaDescription: string;
        keywords: string;
        imagePrompt: string;
      };

      try {
        const cleanedContent = blogContentRaw
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        blogData = JSON.parse(cleanedContent);
      } catch (_parseError) {
        console.error("[CRON] Failed to parse blog JSON:", blogContentRaw);
        throw new Error("Failed to parse generated blog content as JSON");
      }

      // Generate image using DALL-E
      let imageUrl = "";
      try {
        const imageResponse = await openai.images.generate({
          model: "dall-e-3",
          prompt: `${blogData.imagePrompt}. Style: Modern, professional, clean, suitable for a tech company blog header. No text in the image.`,
          n: 1,
          size: "1792x1024",
          quality: "standard",
        });

        const generatedImageUrl = imageResponse.data?.[0]?.url;
        if (generatedImageUrl) {
          const imageData = await fetch(generatedImageUrl);
          const imageBlob = await imageData.blob();
          const uploadUrl = await ctx.storage.generateUploadUrl();

          const uploadResponse = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": imageBlob.type || "image/png" },
            body: imageBlob,
          });

          if (uploadResponse.ok) {
            const { storageId } = await uploadResponse.json();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            imageUrl =
              (await ctx.runMutation(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (internal as any).generateblogHelpers.storeImageAndGetUrl,
                { storageId }
              )) || "";
          }
        }
      } catch (imageError) {
        console.error("[CRON] Failed to generate/upload image:", imageError);
        imageUrl = "/images/blog/default-blog-header.jpg";
      }

      // Generate slug
      const slug = generateSlug(blogData.title);
      const existingSlugs = existingBlogs.map((b: { slug: string }) => b.slug);
      let finalSlug = slug;
      let slugCounter = 1;
      while (existingSlugs.includes(finalSlug)) {
        finalSlug = `${slug}-${slugCounter}`;
        slugCounter++;
      }

      // Calculate read time and create blog
      const readTime = calculateReadTime(blogData.content);
      const blogDate = new Date().toISOString().split("T")[0];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await ctx.runMutation(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (internal as any).generateblogHelpers.createBlogPost,
        {
          title: blogData.title,
          titleNL: blogData.titleNL,
          excerpt: blogData.excerpt,
          excerptNL: blogData.excerptNL,
          category: blogData.category,
          categoryNL: blogData.categoryNL,
          author: "Sleads Team",
          date: blogDate,
          readTime: readTime,
          image: imageUrl,
          slug: finalSlug,
          content: blogData.content,
          contentNL: blogData.contentNL,
          tags: blogData.tags,
          metaTitle: blogData.metaTitle,
          metaDescription: blogData.metaDescription,
          keywords: blogData.keywords,
        }
      );

      console.log(`[CRON] Successfully generated blog: "${blogData.title}"`);

      return {
        success: true,
        message: `Generated blog: ${blogData.title}`,
      };
    } catch (error) {
      console.error("[CRON] Blog generation failed:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
