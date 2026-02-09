"use node";

import { v } from "convex/values";
import * as brevo from "@getbrevo/brevo";
import { internalAction } from "./_generated/server";
import { renderSubscriptionEmail } from "../src/app/email-designs/subscription-newsletter";
import { renderContactUsEmail } from "../src/app/email-designs/contact-us-email";
import { renderContactProjectRequestEmail } from "../src/app/email-designs/contact-project-request-email";
// import { renderVerificationEmail } from "../src/app/email-designs/verification-email";
import { renderUnsubscribeEmail } from "../src/app/email-designs/unsubscribe-newsletter";
import { renderNewQuoteEmail } from "../src/app/email-designs/new-quote-email";
import { renderNewInvoiceEmail } from "../src/app/email-designs/new-invoice-email";
import { renderInvoicePaidEmail } from "../src/app/email-designs/invoice-paid-email";
import { renderInvoiceOverdueEmail } from "../src/app/email-designs/invoice-overdue-email";
import { renderInvoiceCancelledEmail } from "../src/app/email-designs/invoice-cancelled-email";
import { renderSubscriptionCancellationEmail } from "../src/app/email-designs/subscription-cancellation-email";

export const sendContactEmail = internalAction({
  args: {
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      throw new Error("BREVO_API_KEY is not defined");
    }

    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);

    const emailHtml = await renderContactUsEmail({
      name: args.name,
      email: args.email,
      subject: args.subject,
      message: args.message,
    });

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = "We received your message - Sleads";
    sendSmtpEmail.sender = {
      name: "Sleads",
      email: "hello@sleads.nl",
    };
    sendSmtpEmail.to = [{ email: args.email }];
    sendSmtpEmail.htmlContent = emailHtml;

    try {
      await apiInstance.sendTransacEmail(sendSmtpEmail);
    } catch (error) {
      console.error("Failed to send contact email:", error);
    }
  },
});

export const sendProjectContactEmail = internalAction({
  args: {
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    companyName: v.string(),
    phone: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      throw new Error("BREVO_API_KEY is not defined");
    }

    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);

    const emailHtml = await renderContactProjectRequestEmail({
      name: args.name,
      email: args.email,
      subject: args.subject,
      companyName: args.companyName,
      phone: args.phone,
      message: args.message,
    });

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = "We received your project request - Sleads";
    sendSmtpEmail.sender = {
      name: "Sleads",
      email: "hello@sleads.nl",
    };
    sendSmtpEmail.to = [{ email: args.email }];
    sendSmtpEmail.htmlContent = emailHtml;

    try {
      await apiInstance.sendTransacEmail(sendSmtpEmail);
    } catch (error) {
      console.error("Failed to send project request email:", error);
    }
  },
});

export const sendNewsletter = internalAction({
  args: {
    email: v.string(),
    subscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      throw new Error("BREVO_API_KEY is not defined");
    }

    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);

    const emailHtml = await renderSubscriptionEmail({
      email: args.email,
      subscriptionId: args.subscriptionId,
    });

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = "Welcome to the future of web development 🚀!";
    sendSmtpEmail.sender = {
      name: "Sleads newsletter",
      email: "info@sleads.nl",
    }; // You should customize this
    sendSmtpEmail.to = [{ email: args.email }];
    sendSmtpEmail.htmlContent = emailHtml;

    try {
      await apiInstance.sendTransacEmail(sendSmtpEmail);
    } catch (error) {
      console.error("Failed to send welcome email:", error);
      // We don't rethrow here to prevent the action from retrying indefinitely if it's a permanent error
    }
  },
});

export const sendUnsubscribeEmail = internalAction({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      throw new Error("BREVO_API_KEY is not defined");
    }

    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);

    const emailHtml = await renderUnsubscribeEmail({
      email: args.email,
    });

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = "Goodbye from Sleads";
    sendSmtpEmail.sender = {
      name: "Sleads newsletter",
      email: "info@sleads.nl",
    };
    sendSmtpEmail.to = [{ email: args.email }];
    sendSmtpEmail.htmlContent = emailHtml;

    try {
      await apiInstance.sendTransacEmail(sendSmtpEmail);
    } catch (error) {
      console.error("Failed to send unsubscribe email:", error);
    }
  },
});

export const sendQuoteEmail = internalAction({
  args: {
    quote: v.object({
      quoteIdentifiefier: v.union(v.null(), v.string()),
      quoteDate: v.union(v.null(), v.number()),
      quoteValidUntil: v.union(v.null(), v.number()),
      quoteItems: v.array(
        v.object({
          name: v.string(),
          description: v.string(),
          quantity: v.number(),
          priceExclTax: v.number(),
          tax: v.union(v.literal(0), v.literal(9), v.literal(21)),
        })
      ),
      language: v.union(v.literal("en"), v.literal("nl")),
    }),
    contactPerson: v.object({
      name: v.string(),
      email: v.string(),
      organizationName: v.string(),
    }),
    portalUrl: v.string(),
    quoteFileUrl: v.optional(v.union(v.null(), v.string())),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      throw new Error("BREVO_API_KEY is not defined");
    }

    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);

    // Render the email HTML
    const emailHtml = await renderNewQuoteEmail({
      quote: args.quote,
      contactPerson: args.contactPerson,
      portalUrl: args.portalUrl,
      quoteFileUrl: args.quoteFileUrl || null,
    });

    // Determine subject based on language
    const subject =
      args.quote.language === "nl"
        ? `Uw offerte ${args.quote.quoteIdentifiefier || ""} van Sleads`
        : `Your quote ${args.quote.quoteIdentifiefier || ""} from Sleads`;

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = subject.trim();
    sendSmtpEmail.sender = {
      name: "Sleads",
      email: "hello@sleads.nl",
    };
    sendSmtpEmail.to = [{ email: args.contactPerson.email }];
    sendSmtpEmail.htmlContent = emailHtml;

    // Attach PDF if URL is provided
    if (args.quoteFileUrl) {
      try {
        // Fetch the PDF from the URL
        const pdfResponse = await fetch(args.quoteFileUrl);
        if (!pdfResponse.ok) {
          throw new Error(`Failed to fetch PDF: ${pdfResponse.statusText}`);
        }

        // Convert PDF to base64 for Brevo attachment
        const pdfBuffer = await pdfResponse.arrayBuffer();
        const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

        // Get filename from quote identifier or use default
        const filename = args.quote.quoteIdentifiefier
          ? `${args.quote.quoteIdentifiefier}.pdf`
          : `quote-${Date.now()}.pdf`;

        // Add attachment
        sendSmtpEmail.attachment = [
          {
            name: filename,
            content: pdfBase64,
          },
        ];
      } catch (error) {
        console.error("Failed to attach PDF to email:", error);
        // Continue sending email without attachment rather than failing completely
      }
    }

    try {
      await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(
        `Quote email sent successfully to ${args.contactPerson.email}`
      );
    } catch (error) {
      console.error("Failed to send quote email:", error);
      throw error;
    }
  },
});

export const sendInvoiceEmail = internalAction({
  args: {
    invoice: v.object({
      invoiceIdentifiefier: v.union(v.null(), v.string()),
      invoiceDate: v.union(v.null(), v.number()),
      invoiceDueDate: v.union(v.null(), v.number()),
      invoiceItems: v.array(
        v.object({
          name: v.string(),
          description: v.string(),
          quantity: v.number(),
          priceExclTax: v.number(),
          tax: v.union(v.literal(0), v.literal(9), v.literal(21)),
        })
      ),
      language: v.union(v.literal("en"), v.literal("nl")),
      subscriptionIds: v.optional(
        v.union(v.null(), v.array(v.id("monthly_subscriptions")))
      ),
    }),
    contactPerson: v.object({
      name: v.string(),
      email: v.string(),
      organizationName: v.string(),
    }),
    portalUrl: v.string(),
    invoiceFileUrl: v.optional(v.union(v.null(), v.string())),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      throw new Error("BREVO_API_KEY is not defined");
    }

    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);

    // Determine subject based on language and whether it's a subscription invoice
    const isSubscriptionInvoice =
      args.invoice.subscriptionIds !== null &&
      args.invoice.subscriptionIds !== undefined &&
      Array.isArray(args.invoice.subscriptionIds) &&
      args.invoice.subscriptionIds.length > 0;

    // Debug logging
    console.log(
      "Email sending - subscriptionIds:",
      args.invoice.subscriptionIds
    );
    console.log(
      "Email sending - isSubscriptionInvoice:",
      isSubscriptionInvoice
    );

    // Render the email HTML
    // Ensure subscriptionIds are properly serialized (Convex IDs become strings)
    const emailInvoice = {
      ...args.invoice,
      subscriptionIds: args.invoice.subscriptionIds
        ? args.invoice.subscriptionIds.map((id) => String(id))
        : null,
    };

    const emailHtml = await renderNewInvoiceEmail({
      invoice: emailInvoice,
      contactPerson: args.contactPerson,
      portalUrl: args.portalUrl,
      invoiceFileUrl: args.invoiceFileUrl || null,
    });
    const subject = isSubscriptionInvoice
      ? args.invoice.language === "nl"
        ? `Uw factuur voor uw lopende abonnementen ${args.invoice.invoiceIdentifiefier || ""} van Sleads`
        : `Your invoice for your running subscriptions ${args.invoice.invoiceIdentifiefier || ""} from Sleads`
      : args.invoice.language === "nl"
        ? `Uw factuur ${args.invoice.invoiceIdentifiefier || ""} van Sleads`
        : `Your invoice ${args.invoice.invoiceIdentifiefier || ""} from Sleads`;

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = subject.trim();
    sendSmtpEmail.sender = {
      name: "Sleads",
      email: "hello@sleads.nl",
    };
    sendSmtpEmail.to = [{ email: args.contactPerson.email }];
    sendSmtpEmail.htmlContent = emailHtml;

    // Attach PDF if URL is provided
    if (args.invoiceFileUrl) {
      try {
        // Fetch the PDF from the URL
        const pdfResponse = await fetch(args.invoiceFileUrl);
        if (!pdfResponse.ok) {
          throw new Error(`Failed to fetch PDF: ${pdfResponse.statusText}`);
        }

        // Convert PDF to base64 for Brevo attachment
        const pdfBuffer = await pdfResponse.arrayBuffer();
        const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

        // Get filename from invoice identifier or use default
        const filename = args.invoice.invoiceIdentifiefier
          ? `${args.invoice.invoiceIdentifiefier}.pdf`
          : `invoice-${Date.now()}.pdf`;

        // Add attachment
        sendSmtpEmail.attachment = [
          {
            name: filename,
            content: pdfBase64,
          },
        ];
      } catch (error) {
        console.error("Failed to attach PDF to email:", error);
        // Continue sending email without attachment rather than failing completely
      }
    }

    try {
      await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(
        `Invoice email sent successfully to ${args.contactPerson.email}`
      );
    } catch (error) {
      console.error("Failed to send invoice email:", error);
      throw error;
    }
  },
});

export const sendInvoicePaidEmail = internalAction({
  args: {
    invoice: v.object({
      invoiceIdentifiefier: v.union(v.null(), v.string()),
      invoiceDate: v.union(v.null(), v.number()),
      invoiceDueDate: v.union(v.null(), v.number()),
      invoiceItems: v.array(
        v.object({
          name: v.string(),
          description: v.string(),
          quantity: v.number(),
          priceExclTax: v.number(),
          tax: v.union(v.literal(0), v.literal(9), v.literal(21)),
        })
      ),
      language: v.union(v.literal("en"), v.literal("nl")),
    }),
    contactPerson: v.object({
      name: v.string(),
      email: v.string(),
      organizationName: v.string(),
    }),
    portalUrl: v.string(),
    invoiceFileUrl: v.optional(v.union(v.null(), v.string())),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      throw new Error("BREVO_API_KEY is not defined");
    }

    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);

    // Render the email HTML
    const emailHtml = await renderInvoicePaidEmail({
      invoice: args.invoice,
      contactPerson: args.contactPerson,
      portalUrl: args.portalUrl,
      invoiceFileUrl: args.invoiceFileUrl || null,
    });

    // Determine subject based on language
    const subject =
      args.invoice.language === "nl"
        ? `Betaling ontvangen - Factuur ${args.invoice.invoiceIdentifiefier || ""} van Sleads`
        : `Payment Received - Invoice ${args.invoice.invoiceIdentifiefier || ""} from Sleads`;

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = subject.trim();
    sendSmtpEmail.sender = {
      name: "Sleads",
      email: "hello@sleads.nl",
    };
    sendSmtpEmail.to = [{ email: args.contactPerson.email }];
    sendSmtpEmail.htmlContent = emailHtml;

    // Attach PDF if URL is provided
    if (args.invoiceFileUrl) {
      try {
        const pdfResponse = await fetch(args.invoiceFileUrl);
        if (!pdfResponse.ok) {
          throw new Error(`Failed to fetch PDF: ${pdfResponse.statusText}`);
        }

        const pdfBuffer = await pdfResponse.arrayBuffer();
        const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

        const filename = args.invoice.invoiceIdentifiefier
          ? `${args.invoice.invoiceIdentifiefier}.pdf`
          : `invoice-${Date.now()}.pdf`;

        sendSmtpEmail.attachment = [
          {
            name: filename,
            content: pdfBase64,
          },
        ];
      } catch (error) {
        console.error("Failed to attach PDF to email:", error);
      }
    }

    try {
      await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(
        `Invoice paid email sent successfully to ${args.contactPerson.email}`
      );
    } catch (error) {
      console.error("Failed to send invoice paid email:", error);
      throw error;
    }
  },
});

export const sendInvoiceOverdueEmail = internalAction({
  args: {
    invoice: v.object({
      invoiceIdentifiefier: v.union(v.null(), v.string()),
      invoiceDate: v.union(v.null(), v.number()),
      invoiceDueDate: v.union(v.null(), v.number()),
      invoiceItems: v.array(
        v.object({
          name: v.string(),
          description: v.string(),
          quantity: v.number(),
          priceExclTax: v.number(),
          tax: v.union(v.literal(0), v.literal(9), v.literal(21)),
        })
      ),
      language: v.union(v.literal("en"), v.literal("nl")),
    }),
    contactPerson: v.object({
      name: v.string(),
      email: v.string(),
      organizationName: v.string(),
    }),
    portalUrl: v.string(),
    invoiceFileUrl: v.optional(v.union(v.null(), v.string())),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      throw new Error("BREVO_API_KEY is not defined");
    }

    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);

    // Render the email HTML
    const emailHtml = await renderInvoiceOverdueEmail({
      invoice: args.invoice,
      contactPerson: args.contactPerson,
      portalUrl: args.portalUrl,
      invoiceFileUrl: args.invoiceFileUrl || null,
    });

    // Determine subject based on language
    const subject =
      args.invoice.language === "nl"
        ? `Betalingsherinnering - Achterstallige factuur ${args.invoice.invoiceIdentifiefier || ""} van Sleads`
        : `Payment Reminder - Overdue Invoice ${args.invoice.invoiceIdentifiefier || ""} from Sleads`;

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = subject.trim();
    sendSmtpEmail.sender = {
      name: "Sleads",
      email: "hello@sleads.nl",
    };
    sendSmtpEmail.to = [{ email: args.contactPerson.email }];
    sendSmtpEmail.htmlContent = emailHtml;

    // Attach PDF if URL is provided
    if (args.invoiceFileUrl) {
      try {
        const pdfResponse = await fetch(args.invoiceFileUrl);
        if (!pdfResponse.ok) {
          throw new Error(`Failed to fetch PDF: ${pdfResponse.statusText}`);
        }

        const pdfBuffer = await pdfResponse.arrayBuffer();
        const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

        const filename = args.invoice.invoiceIdentifiefier
          ? `${args.invoice.invoiceIdentifiefier}.pdf`
          : `invoice-${Date.now()}.pdf`;

        sendSmtpEmail.attachment = [
          {
            name: filename,
            content: pdfBase64,
          },
        ];
      } catch (error) {
        console.error("Failed to attach PDF to email:", error);
      }
    }

    try {
      await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(
        `Invoice overdue email sent successfully to ${args.contactPerson.email}`
      );
    } catch (error) {
      console.error("Failed to send invoice overdue email:", error);
      throw error;
    }
  },
});

export const sendInvoiceCancelledEmail = internalAction({
  args: {
    invoice: v.object({
      invoiceIdentifiefier: v.union(v.null(), v.string()),
      invoiceDate: v.union(v.null(), v.number()),
      invoiceDueDate: v.union(v.null(), v.number()),
      invoiceItems: v.array(
        v.object({
          name: v.string(),
          description: v.string(),
          quantity: v.number(),
          priceExclTax: v.number(),
          tax: v.union(v.literal(0), v.literal(9), v.literal(21)),
        })
      ),
      language: v.union(v.literal("en"), v.literal("nl")),
    }),
    contactPerson: v.object({
      name: v.string(),
      email: v.string(),
      organizationName: v.string(),
    }),
    portalUrl: v.string(),
    invoiceFileUrl: v.optional(v.union(v.null(), v.string())),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      throw new Error("BREVO_API_KEY is not defined");
    }

    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);

    // Render the email HTML
    const emailHtml = await renderInvoiceCancelledEmail({
      invoice: args.invoice,
      contactPerson: args.contactPerson,
      portalUrl: args.portalUrl,
      invoiceFileUrl: args.invoiceFileUrl || null,
    });

    // Determine subject based on language
    const subject =
      args.invoice.language === "nl"
        ? `Factuur geannuleerd ${args.invoice.invoiceIdentifiefier || ""} van Sleads`
        : `Invoice Cancelled ${args.invoice.invoiceIdentifiefier || ""} from Sleads`;

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = subject.trim();
    sendSmtpEmail.sender = {
      name: "Sleads",
      email: "hello@sleads.nl",
    };
    sendSmtpEmail.to = [{ email: args.contactPerson.email }];
    sendSmtpEmail.htmlContent = emailHtml;

    // Attach PDF if URL is provided
    if (args.invoiceFileUrl) {
      try {
        const pdfResponse = await fetch(args.invoiceFileUrl);
        if (!pdfResponse.ok) {
          throw new Error(`Failed to fetch PDF: ${pdfResponse.statusText}`);
        }

        const pdfBuffer = await pdfResponse.arrayBuffer();
        const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

        const filename = args.invoice.invoiceIdentifiefier
          ? `${args.invoice.invoiceIdentifiefier}.pdf`
          : `invoice-${Date.now()}.pdf`;

        sendSmtpEmail.attachment = [
          {
            name: filename,
            content: pdfBase64,
          },
        ];
      } catch (error) {
        console.error("Failed to attach PDF to email:", error);
      }
    }

    try {
      await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(
        `Invoice cancelled email sent successfully to ${args.contactPerson.email}`
      );
    } catch (error) {
      console.error("Failed to send invoice cancelled email:", error);
      throw error;
    }
  },
});

// export const sendVerificationEmail = internalAction({
//   args: {
//     email: v.string(),
//     url: v.string(),
//   },
//   handler: async (ctx, args) => {
//     const apiKey = process.env.BREVO_API_KEY;
//     if (!apiKey) {
//       throw new Error("BREVO_API_KEY is not defined");
//     }

//     const apiInstance = new brevo.TransactionalEmailsApi();
//     apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);

//     const emailHtml = await renderVerificationEmail({
//       email: args.email,
//       url: args.url,
//     });

//     const sendSmtpEmail = new brevo.SendSmtpEmail();
//     sendSmtpEmail.subject = "Verify your email address for Sleads";
//     sendSmtpEmail.sender = {
//       name: "Sleads Authentication",
//       email: "authentication@sleads.nl",
//     };
//     sendSmtpEmail.to = [{ email: args.email }];
//     sendSmtpEmail.htmlContent = emailHtml;

//     try {
//       await apiInstance.sendTransacEmail(sendSmtpEmail);
//     } catch (error) {
//       console.error("Failed to send verification email:", error);
//       throw error;
//     }
//   },
// });

export const sendSubscriptionCancellationEmail = internalAction({
  args: {
    subscription: v.object({
      _id: v.string(),
      title: v.string(),
      description: v.string(),
      subscriptionAmount: v.number(),
      tax: v.union(v.literal(0), v.literal(9), v.literal(21)),
      subscriptionStartDate: v.number(),
      subscriptionEndDate: v.optional(v.union(v.null(), v.number())),
      subscriptionStatus: v.union(
        v.literal("active"),
        v.literal("cancelled"),
        v.literal("inactive")
      ),
      language: v.union(v.literal("en"), v.literal("nl")),
    }),
    contactPerson: v.object({
      name: v.string(),
      email: v.string(),
      organizationName: v.string(),
    }),
    cancellationDate: v.optional(v.union(v.null(), v.number())),
    message: v.optional(v.union(v.null(), v.string())),
    portalUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      throw new Error("BREVO_API_KEY is not defined");
    }

    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);

    // Render the email HTML
    const emailHtml = await renderSubscriptionCancellationEmail({
      subscription: {
        ...args.subscription,
        subscriptionEndDate: args.subscription.subscriptionEndDate ?? null,
      },
      contactPerson: args.contactPerson,
      cancellationDate: args.cancellationDate ?? null,
      message: args.message ?? null,
      portalUrl: args.portalUrl,
    });

    // Determine subject based on language
    const subject =
      args.subscription.language === "nl"
        ? "Verzoek tot Opzegging Abonnement Ontvangen - Sleads"
        : "Subscription Cancellation Request Received - Sleads";

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.sender = {
      name: "Sleads",
      email: "hello@sleads.nl",
    };
    sendSmtpEmail.to = [{ email: args.contactPerson.email }];
    sendSmtpEmail.htmlContent = emailHtml;

    try {
      await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(
        `Subscription cancellation email sent successfully to ${args.contactPerson.email}`
      );
    } catch (error) {
      console.error("Failed to send subscription cancellation email:", error);
      throw error;
    }
  },
});
