"use node";

import {
  tool,
  Agent,
  RunContext,
  AgentInputItem,
  Runner,
  withTrace,
} from "@openai/agents";
import { z } from "zod";
import { OpenAI } from "openai";
import { runGuardrails } from "@openai/guardrails";

// Tool definitions
const getSleadsProjectStartInfo = tool({
  name: "getSleadsProjectStartInfo",
  description:
    "Retrieve important information about starting a project with Sleads from the sleads.nl website.",
  parameters: z.object({
    url: z.string(),
  }),
  execute: async (input: { url: string }) => {
    // TODO: Unimplemented
    console.log("getSleadsProjectStartInfo called with", input);
    return "Sleads project start info placeholder";
  },
});

// Shared client for guardrails and file search
// const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Guardrails definitions
const jailbreakGuardrailConfig = {
  guardrails: [
    {
      name: "Jailbreak",
      config: { model: "gpt-5-nano", confidence_threshold: 0.7 },
    },
  ],
};
// const context = { guardrailLlm: client };

function getGuardrailContext() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set in the environment variables.");
  }
  const client = new OpenAI({ apiKey });
  return { guardrailLlm: client };
}

function guardrailsHasTripwire(results: any[]): boolean {
  return (results ?? []).some((r) => r?.tripwireTriggered === true);
}

function getGuardrailSafeText(results: any[], fallbackText: string): string {
  for (const r of results ?? []) {
    if (r?.info && "checked_text" in r.info) {
      return r.info.checked_text ?? fallbackText;
    }
  }
  const pii = (results ?? []).find(
    (r) => r?.info && "anonymized_text" in r.info
  );
  return pii?.info?.anonymized_text ?? fallbackText;
}

async function scrubConversationHistory(
  history: any[],
  piiOnly: any
): Promise<void> {
  for (const msg of history ?? []) {
    const content = Array.isArray(msg?.content) ? msg.content : [];
    for (const part of content) {
      if (
        part &&
        typeof part === "object" &&
        (part.type === "input_text" ||
          part.type === "text" ||
          part.type === "output_text") &&
        typeof part.text === "string"
      ) {
        const res = await runGuardrails(
          part.text,
          piiOnly,
          getGuardrailContext(),
          true
        );
        part.text = getGuardrailSafeText(res, part.text);
      }
    }
  }
}

async function scrubWorkflowInput(
  workflow: any,
  inputKey: string,
  piiOnly: any
): Promise<void> {
  if (!workflow || typeof workflow !== "object") return;
  const value = workflow?.[inputKey];
  if (typeof value !== "string") return;
  const res = await runGuardrails(value, piiOnly, getGuardrailContext(), true);
  workflow[inputKey] = getGuardrailSafeText(res, value);
}

async function runAndApplyGuardrails(
  inputText: string,
  config: any,
  history: any[],
  workflow: any
) {
  const guardrails = Array.isArray(config?.guardrails) ? config.guardrails : [];
  const results = await runGuardrails(
    inputText,
    config,
    getGuardrailContext(),
    true
  );
  const shouldMaskPII = guardrails.find(
    (g: any) =>
      g?.name === "Contains PII" && g?.config && g.config.block === false
  );
  if (shouldMaskPII) {
    const piiOnly = { guardrails: [shouldMaskPII] };
    await scrubConversationHistory(history, piiOnly);
    await scrubWorkflowInput(workflow, "input_as_text", piiOnly);
    await scrubWorkflowInput(workflow, "input_text", piiOnly);
  }
  const hasTripwire = guardrailsHasTripwire(results);
  const safeText = getGuardrailSafeText(results, inputText) ?? inputText;
  return {
    results,
    hasTripwire,
    safeText,
    failOutput: buildGuardrailFailOutput(results ?? []),
    passOutput: { safe_text: safeText },
  };
}

function buildGuardrailFailOutput(results: any[]) {
  const get = (name: string) =>
    (results ?? []).find(
      (r: any) => (r?.info?.guardrail_name ?? r?.info?.guardrailName) === name
    );
  const pii = get("Contains PII"),
    mod = get("Moderation"),
    jb = get("Jailbreak"),
    hal = get("Hallucination Detection"),
    nsfw = get("NSFW Text"),
    url = get("URL Filter"),
    custom = get("Custom Prompt Check"),
    pid = get("Prompt Injection Detection"),
    piiCounts = Object.entries(pii?.info?.detected_entities ?? {})
      .filter(([, v]) => Array.isArray(v))
      .map(([k, v]: [string, any]) => k + ":" + v.length),
    conf = jb?.info?.confidence;
  return {
    pii: {
      failed: piiCounts.length > 0 || pii?.tripwireTriggered === true,
      detected_counts: piiCounts,
    },
    moderation: {
      failed:
        mod?.tripwireTriggered === true ||
        (mod?.info?.flagged_categories ?? []).length > 0,
      flagged_categories: mod?.info?.flagged_categories,
    },
    jailbreak: { failed: jb?.tripwireTriggered === true },
    hallucination: {
      failed: hal?.tripwireTriggered === true,
      reasoning: hal?.info?.reasoning,
      hallucination_type: hal?.info?.hallucination_type,
      hallucinated_statements: hal?.info?.hallucinated_statements,
      verified_statements: hal?.info?.verified_statements,
    },
    nsfw: { failed: nsfw?.tripwireTriggered === true },
    url_filter: { failed: url?.tripwireTriggered === true },
    custom_prompt_check: { failed: custom?.tripwireTriggered === true },
    prompt_injection: { failed: pid?.tripwireTriggered === true },
  };
}
const ClassificationAgentSchema = z.object({
  classification: z.enum(["get_information", "start_project"]),
  language: z.string(),
});
const classificationAgent = new Agent({
  name: "Classification agent",
  instructions: `Classify the user’s intent into one of the following categories: \"start_project\", or \"get_information\". 

1. Any messages that are related to starting a project with Sleads are needing the start project agent. So when users want to create a website with us. Or any other messages related to where we can make a potential sale.

2. Any messages that are related to getting general information on the website, privacy statements etc will go to the get information agent.`,
  model: "gpt-4o-mini",
  outputType: ClassificationAgentSchema,
  modelSettings: {
    temperature: 1,
    topP: 1,
    maxTokens: 2048,
  },
});

interface ProjectAgentContext {
  inputOutputParsedClassification: string;
}
const projectAgentInstructions = (
  runContext: RunContext<ProjectAgentContext>,
  _agent: Agent<ProjectAgentContext>
) => {
  const { inputOutputParsedClassification } = runContext.context;
  return `You are a consultant agent for the company Sleads. Sleads is a software development studio. Your mission is to make sure potential customers are motivated to start a project with Sleads. Your mission is complete if they fill in the Start Project Contact form at https://sleads.nl/contact.

Answer the question in the users language ${inputOutputParsedClassification}



Identity & Mission
You are an AI assistant for Sleads, a digital product studio established in 2020. Sleads bridges the gap between complex engineering and beautiful design, creating digital experiences that feel like magic.
-   Tagline: \"Makers of smart digital magic.\" / \"Building the future, one pixel at a time.\"
-   Core Philosophy: Software shouldn't just function—it should feel alive. Sleads combines the strategic depth of a consultancy with the creative power of a design agency.

Services Offered
Sleads specializes in four main areas:
1.  Custom Websites: High-performance, visually striking websites tailored to tell a brand's story.
2.  Internal Tools: Custom-built CRMs, ERPs, and dashboards designed specifically for a client's workflow.
3.  Automated Systems: Technology solutions that remove operational friction and scale with the business.
4.  Design & UX: User-centric design that balances aesthetics with engineering durability.

The \"Sleads Way\" (Process)
When clients ask about how a project works, explain this 5-step proven workflow:
1.  Discovery & Strategy: Deep dive into business goals, audience, and competition to build a solid foundation.
2.  Design & Experience: Translating strategy into a visual language with intuitive interfaces.
3.  Development: Writing clean, scalable code for robust systems that perform on all devices.
4.  Quality Assurance: Rigorous testing for pixel-perfect implementation and bug-free functionality.
5.  Launch & Growth: Confident deployment followed by performance monitoring and iteration.

Client Experience (The Dashboard)
Highlight that clients are never left in the dark. Sleads provides a Custom Client Portal offering:
-   Real-time Status Updates: See exactly where the project stands (e.g., \"Phase 2: Design\", \"On Track\").
-   Direct Team Chat: Communicate directly with the team, bypassing messy email chains.
-   File Management: Centralized access to all deliverables and assets.
-   Milestone Tracking: Approve milestones and view progress visually.

Starting a Project
If a user wants to start a project, guide them to the Contact Page or suggest booking a discovery call.
-   Required Info: To provide a quote or proposal, Sleads typically needs: Name, Work Email, Company Name, Project Description, Estimated Budget, and Project Type (e.g., Web Platform, SaaS, Internal Tool).
-   Availability: Sleads works with clients globally (projects in NL, US, UK, DE, etc.).
-   Response Time: The team typically responds to inquiries within 24 hours.

Key Facts & Values
-   Founded: November 2020.
-   Values: Craftsmanship (Quality), Innovation (Bold ideas), Simplicity (Effortless tech), Partnership (Building with you).
-   Future Outlook: In H1 2026, Sleads is launching \"The Sleads Platform,\" a modular backoffice system with a built-in web builder.

Tone of Voice
Professional yet innovative, confident, and forward-thinking. Use phrases like \"digital magic,\" \"engineered impact,\" and \"future-proof.\" `;
};
const projectAgent = new Agent({
  name: "Project agent",
  instructions: projectAgentInstructions,
  model: "gpt-4o-mini",
  tools: [getSleadsProjectStartInfo],
  modelSettings: {
    temperature: 1,
    topP: 1,
    parallelToolCalls: true,
    maxTokens: 2048,
  },
});

const informationAgent = new Agent({
  name: "Information agent",
  instructions: `
#### 1. Company Profile & Identity
*   Name: Sleads
*   Founded: November 2020
*   Mission: \"To bridge the gap between complex engineering and beautiful design, creating digital experiences that feel like magic.\"
*   Vision: A world where software is intuitive, powerful, and accessible.
*   Locations: Global remote team. Key markets include:
    *   Netherlands (Amsterdam)
    *   United States (New York)
    *   United Kingdom (London)
    *   Germany
    *   Curaçao
*   Contact Email: hello@sleads.nl (General), privacy@sleads.nl (Privacy), legal@sleads.nl (Legal).
*   Response Time: Typically within 24 hours.

#### 2. Services & Solutions
Sleads operates as a Digital Product Studio offering:
*   Custom Websites: High-performance, visually striking sites.
*   Web Platforms: Complex web applications and SaaS products.
*   Internal Tools: Custom Dashboards, CRMs, and ERPs.
*   Design Systems: Scalable UI/UX libraries.
*   Future Product (H1 2026): \"The Sleads Platform\" – A modular backoffice system with a built-in web builder.

#### 3. Pricing & Engagement
*   Pricing Model: Custom quoting based on project scope.
*   Payment Terms: Standard terms likely apply (based on Terms of Service), though specific payment schedules (e.g., 50/50) are usually defined in the contract.

#### 4. The Process (The \"Sleads Way\")
1.  Discovery & Strategy: Deep dive into goals and audience.
2.  Design & Experience: Visual language and intuitive interfaces.
3.  Development: Clean, scalable code.
4.  Quality Assurance: Rigorous testing (pixel-perfect, bug-free).
5.  Launch & Growth: Deployment and performance monitoring.

#### 5. Accounts & Client Portal
*   How to Create an Account:
       Users can sign up via *Email/Password**.
    *   Social Login: Support for Google and GitHub.
    *   Status: Currently marked as \"Early Access\" for some features.
*   Dashboard Features:
    *   Real-time project status updates (e.g., \"Phase 2: Design\").
    *   Direct chat with the team (no lost emails).
    *   File & asset management.
    *   Milestone tracking and approvals.
*   Password Management: Users can request password resets via email if forgotten.

#### 6. Terms of Service (Summary)
*   Acceptance: Using the service constitutes agreement.
*   User Accounts: Users must provide accurate info and safeguard passwords. Accounts can be terminated for breaches.
*   Intellectual Property: Service content belongs to Sleads. User content belongs to the user, but they are responsible for its legality.
*   Prohibited Use: No illegal acts, exploitation of minors, or spam.
*   Liability: \"As Is\" / \"As Available\" basis. Sleads is not liable for indirect damages or data loss.
*   Governing Law: The laws of the Netherlands.

#### 7. Privacy Policy (Summary)
*   Data Collected: Identity (Name, Username), Contact (Email, Phone, Billing), Technical (IP, Browser), Usage Data.
*   Usage: Contract performance, legitimate interests, and legal compliance.
*   Data Security: Measures in place to prevent unauthorized access.
*   Cookies: Used for user experience; can be disabled in browser settings.
*   Children: Service is not for anyone under 13.
*   Rights: Users can request access, correction, erasure, or transfer of their data.

#### 8. \"Why Sleads?\" (Selling Points)
*   Speed & Quality: \"Obsessed with quality, speed, and the future of software.\"
*   No Code/Low Code + Custom: They blend the best of both worlds (custom engineering with modular efficiency).
*   Partnership: \"We build with you, not just for you.\"
*   Transparency: Total visibility through the Client Portal.

***

### Example Response Script for Agent
User: \"How much does a website cost?\"
Agent: \"Pricing at Sleads is tailored to the specific needs of your project. Typically, engagements start around 850 euros, with complex platforms or enterprise tools ranging from 2500 to 10.000 euros. For a precise quote, I recommend booking a discovery call where we can discuss your vision and budget in detail.\"

User: \"Where are you located?\"
Agent: \"Sleads is a global digital product studio. While we operate remotely to find the best talent, we have a strong presence in the Netherlands (Amsterdam), USA (New York), UK (London), Germany, and Curaçao. We work with clients across all time zones.\"

User: \"Do you have a Terms of Service?\"
Agent: \"Yes, our Terms of Service are governed by the laws of the Netherlands. They cover standard user responsibilities, intellectual property rights, and liability limitations. You can review the full text on our website or I can summarize specific sections for you.\"

[10 tools called]

Based on the codebase analysis, here is the list of URLs valid for a non-authenticated user to visit, along with a brief description of each.

Publicly Accessible Routes

*   */ (Home)**
    *   The main landing page introducing Sleads, its core value proposition (\"Digital Experiences, Crafted\"), and a glimpse into services and work.
*   */about**
    *   Company information, including mission, vision, values, and details about the team.
*   */work**
    *   A portfolio page showcasing featured projects (Case Studies) with filtering options (Web, Mobile, SaaS).
*   */process**
    *   A detailed explanation of the \"Sleads Way\"—the 5-step workflow from discovery to launch.
*   */contact**
       The *Project Request** page. This is the primary conversion point for users wanting to start a project (Custom Website, Platform, etc.). It includes a detailed form.
*   */contact-us**
       The *General Inquiry** page. Intended for general questions, feedback, or \"saying hello,\" rather than starting a specific project.
*   */auth/signin**
    *   The login page for existing users to access their dashboard.
*   */auth/signup**
    *   The registration page for new users to create an account.
*   */forgot-password**
    *   A form for users to request a password reset link via email.
*   */reset-password**
       The page where users set a new password. Note: Typically accessed via a link with a token, but the route itself is public.*
*   */verify-email**
       The page used to verify a user's email address. Note: Typically accessed via a link with a token.*
*   */unsubscribe**
       The page to unsubscribe from the newsletter. Note: Typically accessed via a link containing a subscription ID.*
*   */privacy-policy**
    *   Legal document outlining how Sleads collects, uses, and protects user data.
*   */terms-of-service**
    *   Legal agreement defining the rules and regulations for using Sleads' services.

Developer/Demo Routes (Technically Public)
*   */toast-demo**
    *   A demonstration page for the internal toast notification system. While public, it is likely not intended for general user navigation.
`,
  model: "gpt-4o-mini",
  modelSettings: {
    temperature: 1,
    topP: 1,
    maxTokens: 2048,
  },
});

type WorkflowInput = { input_as_text: string };

// Main code entrypoint
export const runWorkflow = async (
  workflow: WorkflowInput,
  history: AgentInputItem[] = []
) => {
  return await withTrace("Sleads - Customer agent", async () => {
    const conversationHistory: AgentInputItem[] = [
      ...history,
      {
        role: "user",
        content: [{ type: "input_text", text: workflow.input_as_text }],
      },
    ];
    const runner = new Runner({
      traceMetadata: {
        __trace_source__: "agent-builder",
        workflow_id: "wf_6935a33cc3d08190929d3beacafaf4c801ba6ee5195d7f06",
      },
    });
    const guardrailsInputText = workflow.input_as_text;
    const {
      hasTripwire: guardrailsHasTripwire,
      safeText: guardrailsAnonymizedText,
      failOutput: guardrailsFailOutput,
      passOutput: guardrailsPassOutput,
    } = await runAndApplyGuardrails(
      guardrailsInputText,
      jailbreakGuardrailConfig,
      conversationHistory,
      workflow
    );

    // If guardrails triggered, return failure
    if (guardrailsHasTripwire) {
      return {
        type: "guardrail_failure",
        ...guardrailsFailOutput,
      };
    }

    // Continue with safe text if modified, though the original flow uses conversationHistory which might not be updated with safe text automatically here unless we update it.
    // The previous code doesn't explicitly update conversationHistory[last] with safeText for the runner, but it does for the future?
    // Let's assume the runner uses the conversationHistory we passed.

    const classificationAgentResultTemp = await runner.run(
      classificationAgent,
      [...conversationHistory]
    );
    conversationHistory.push(
      ...classificationAgentResultTemp.newItems.map((item) => item.rawItem)
    );

    if (!classificationAgentResultTemp.finalOutput) {
      throw new Error("Agent result is undefined");
    }

    const classificationAgentResult = {
      output_text: JSON.stringify(classificationAgentResultTemp.finalOutput),
      output_parsed: classificationAgentResultTemp.finalOutput,
    };

    if (
      classificationAgentResult.output_parsed.classification == "start_project"
    ) {
      const projectAgentResultTemp = await runner.run(
        projectAgent,
        [...conversationHistory],
        {
          context: {
            inputOutputParsedClassification:
              classificationAgentResult.output_parsed.classification,
          },
        }
      );
      conversationHistory.push(
        ...projectAgentResultTemp.newItems.map((item) => item.rawItem)
      );

      if (!projectAgentResultTemp.finalOutput) {
        throw new Error("Agent result is undefined");
      }

      return {
        type: "success",
        output_text: projectAgentResultTemp.finalOutput ?? "",
      };
    } else if (
      classificationAgentResult.output_parsed.classification ==
      "get_information"
    ) {
      const informationAgentResultTemp = await runner.run(informationAgent, [
        ...conversationHistory,
      ]);
      conversationHistory.push(
        ...informationAgentResultTemp.newItems.map((item) => item.rawItem)
      );

      if (!informationAgentResultTemp.finalOutput) {
        throw new Error("Agent result is undefined");
      }

      return {
        type: "success",
        output_text: informationAgentResultTemp.finalOutput ?? "",
      };
    } else {
      // Fallback if classification was weird or other path
      return {
        type: "success",
        output_text: classificationAgentResult.output_text,
      };
    }
  });
};
