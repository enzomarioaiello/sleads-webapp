import { createAuth } from "../auth";
import { getStaticAuth } from "@convex-dev/better-auth";

// Export static instance for Better Auth CLI
export const auth = getStaticAuth(createAuth);
