import React, { Suspense } from "react";
import VerifyEmailClient from "./VerifyEmailClient";
import { Loader2 } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-sleads-midnight">
          <Loader2 className="w-10 h-10 text-sleads-blue animate-spin" />
        </div>
      }
    >
      <VerifyEmailClient />
    </Suspense>
  );
}
