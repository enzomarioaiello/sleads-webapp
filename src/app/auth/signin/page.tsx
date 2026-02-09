import React, { Suspense } from "react";
import { Metadata } from "next";
import SignInClient from "./SignInClient";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign In | Sleads",
  description:
    "Sign in to your Sleads account to access your dashboard and manage your projects.",
  alternates: {
    canonical: "/auth/signin",
  },
};

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-sleads-midnight">
          <Loader2 className="w-10 h-10 text-sleads-blue animate-spin" />
        </div>
      }
    >
      <SignInClient />
    </Suspense>
  );
}
