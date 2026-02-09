import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  newsletter_subscriptions: defineTable({
    email: v.string(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),
  contact_regular_form: defineTable({
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
    read: v.optional(v.union(v.null(), v.boolean())),
    userId: v.optional(v.union(v.null(), v.string())),
    createdAt: v.number(),
  }).index("by_email", ["email"]),
  contact_project_form: defineTable({
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    companyName: v.string(),
    phone: v.string(),
    message: v.string(),
    read: v.optional(v.union(v.null(), v.boolean())),
    userId: v.optional(v.union(v.null(), v.string())),
    createdAt: v.number(),
  }).index("by_email", ["email"]),
  chat_sessions: defineTable({
    sessionId: v.string(), // Client-generated or server-generated session ID
    userId: v.optional(v.string()), // If authenticated
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_sessionId", ["sessionId"])
    .index("by_userId", ["userId"]),
  chat_messages: defineTable({
    sessionId: v.string(),
    role: v.union(
      v.literal("user"),
      v.literal("assistant"),
      v.literal("system")
    ),
    content: v.string(),
    createdAt: v.number(),
  })
    .index("by_sessionId", ["sessionId"])
    .index("by_sessionId_createdAt", ["sessionId", "createdAt"]),
  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    logo: v.optional(v.union(v.null(), v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_slug", ["slug"]),
  members: defineTable({
    organizationId: v.string(),
    userId: v.string(),
    role: v.string(),
    createdAt: v.number(),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_userId", ["userId"])
    .index("by_role", ["role"]),
  organizationContactInformation: defineTable({
    organizationId: v.id("organizations"),
    organizationName: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    address: v.string(),
    userId: v.optional(v.union(v.null(), v.string())),
    isDefault: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_organizationId", ["organizationId"]),
  projects: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    cmsKey: v.optional(v.union(v.null(), v.string())),
    smartObjectsKey: v.optional(v.union(v.null(), v.string())),
    smartObjectsUrl: v.optional(v.union(v.null(), v.string())),
    cmsIsListening: v.optional(v.union(v.null(), v.boolean())),
    selectedLanguages: v.optional(v.union(v.null(), v.array(v.string()))),
    monthlySubscriptionType: v.optional(
      v.union(
        v.null(),
        v.union(
          v.literal("yearly"),
          v.literal("quarterly"),
          v.literal("semiannually"),
          v.literal("monthly")
        )
      )
    ),
    description: v.string(),
    url: v.optional(v.union(v.null(), v.string())),
    enableSmartObjects: v.boolean(),
    progress: v.optional(v.union(v.null(), v.number())),
    phase: v.optional(v.union(v.null(), v.string())),
    enableCMS: v.boolean(),
    contactInformation: v.id("organizationContactInformation"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_organizationId", ["organizationId"])
    .index("by_cmsKey", ["cmsKey"]),
  quotes: defineTable({
    projectId: v.id("projects"),
    organizationId: v.id("organizations"),
    quoteNumber: v.number(),
    quoteFileUrl: v.optional(v.union(v.null(), v.string())),
    language: v.union(v.literal("en"), v.literal("nl")),
    quoteIdentifiefier: v.optional(v.union(v.null(), v.string())),
    quoteDate: v.optional(v.union(v.null(), v.number())),
    quoteValidUntil: v.optional(v.union(v.null(), v.number())),
    quoteItems: v.array(
      v.object({
        name: v.string(),
        description: v.string(),
        quantity: v.number(),
        priceExclTax: v.number(),
        tax: v.union(v.literal(0), v.literal(9), v.literal(21)),
      })
    ),
    quoteStatus: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("expired")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
  invoices: defineTable({
    projectId: v.id("projects"),
    organizationId: v.id("organizations"),
    invoiceNumber: v.number(),
    invoiceFileUrl: v.optional(v.union(v.null(), v.string())),
    language: v.union(v.literal("en"), v.literal("nl")),
    invoiceIdentifiefier: v.optional(v.union(v.null(), v.string())),
    invoiceDate: v.optional(v.union(v.null(), v.number())),
    invoiceDueDate: v.optional(v.union(v.null(), v.number())),
    invoiceItems: v.array(
      v.object({
        name: v.string(),
        description: v.string(),
        quantity: v.number(),
        priceExclTax: v.number(),
        tax: v.union(v.literal(0), v.literal(9), v.literal(21)),
      })
    ),
    invoiceStatus: v.union(
      v.literal("draft"),
      v.literal("paid"),
      v.literal("overdue"),
      v.literal("cancelled"),
      v.literal("sent")
    ),
    subscriptionIds: v.optional(
      v.union(v.null(), v.array(v.id("monthly_subscriptions")))
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),
  files: defineTable({
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
    projectId: v.optional(v.union(v.null(), v.id("projects"))),
    organizationId: v.optional(v.union(v.null(), v.id("organizations"))),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_contentType", ["contentType"])
    .index("by_url", ["url"]),
  cms_pages: defineTable({
    name: v.string(),
    slug: v.string(),
    projectId: v.id("projects"),
    listeningMode: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_projectId", ["projectId"])
    .index("by_slug", ["slug"]),
  cms_splits: defineTable({
    projectId: v.id("projects"),
    split: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_projectId", ["projectId"]),
  cms_fields: defineTable({
    cmsPageId: v.id("cms_pages"),
    key: v.string(),
    defaultValue: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),
  cms_field_values: defineTable({
    cmsFieldId: v.id("cms_fields"),
    pageId: v.id("cms_pages"),
    value: v.any(),
    splitId: v.optional(v.union(v.null(), v.id("cms_splits"))),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_cmsFieldId", ["cmsFieldId"])
    .index("by_pageId", ["pageId"])
    .index("by_splitId", ["splitId"]),
  project_agenda_items: defineTable({
    projectId: v.optional(v.union(v.null(), v.id("projects"))),
    organizationId: v.optional(v.union(v.null(), v.id("organizations"))),
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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_projectId", ["projectId"])
    .index("by_organizationId", ["organizationId"]),
  imagesOrganizations: defineTable({
    organizationId: v.id("organizations"),
    projectId: v.optional(v.union(v.null(), v.id("projects"))),
    imageUrl: v.string(),
    imageId: v.id("_storage"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_projectId", ["projectId"])
    .index("by_imageUrl", ["imageUrl"])
    .index("by_imageId", ["imageId"]),
  blog_posts: defineTable({
    title: v.string(),
    titleNL: v.string(),
    excerpt: v.string(),
    excerptNL: v.string(),
    category: v.string(),
    categoryNL: v.string(),
    author: v.string(),
    date: v.string(),
    readTime: v.string(),
    image: v.string(),
    slug: v.string(),
    content: v.string(),
    contentNL: v.string(),
    tags: v.optional(v.array(v.string())),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
    keywords: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_category", ["category"]),
  monthly_subscriptions: defineTable({
    organizationId: v.id("organizations"),
    projectId: v.id("projects"),
    title: v.string(),
    description: v.string(),
    internalNotes: v.optional(v.union(v.null(), v.string())),
    subscriptionStatus: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("cancelled")
    ),
    subscriptionStartDate: v.number(),
    subscriptionEndDate: v.optional(v.union(v.null(), v.number())),
    subscriptionAmount: v.number(),
    discount: v.optional(v.union(v.null(), v.number())),
    discountType: v.union(v.literal("percentage"), v.literal("fixed")),
    discountPeriodInMonths: v.optional(v.union(v.null(), v.number())),
    discountStartDate: v.optional(v.union(v.null(), v.number())),
    tax: v.union(v.literal(0), v.literal(9), v.literal(21)),
    language: v.union(v.literal("en"), v.literal("nl")),
    lastInvoiceDate: v.optional(v.union(v.null(), v.number())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organizationId", ["organizationId"])
    .index("by_projectId", ["projectId"])
    .index("by_subscriptionStatus", ["subscriptionStatus"])
    .index("by_subscriptionStartDate", ["subscriptionStartDate"])
    .index("by_subscriptionEndDate", ["subscriptionEndDate"])
    .index("by_subscriptionAmount", ["subscriptionAmount"])
    .index("by_tax", ["tax"]),
  extra_costs: defineTable({
    projectId: v.id("projects"),
    organizationId: v.id("organizations"),
    name: v.string(),
    description: v.string(),
    amount: v.number(),
    priceExclTax: v.number(),
    tax: v.union(v.literal(0), v.literal(9), v.literal(21)),
    invoicedDate: v.optional(v.union(v.null(), v.number())),
    invoiceId: v.optional(v.union(v.null(), v.id("invoices"))),
    voided: v.optional(v.union(v.null(), v.boolean())),
    showSeparatelyOnInvoice: v.optional(v.union(v.null(), v.boolean())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_projectId", ["projectId"])
    .index("by_organizationId", ["organizationId"])
    .index("by_invoicedDate", ["invoicedDate"])
    .index("by_invoiceId", ["invoiceId"]),
});
