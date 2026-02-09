import React, { Suspense } from "react";
import UnsubscribeClient from "./UnsubscribeClient";
import { Loader2 } from "lucide-react";

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-sleads-midnight">
          <Loader2 className="w-10 h-10 text-sleads-blue animate-spin" />
        </div>
      }
    >
      <UnsubscribeClient />
    </Suspense>
  );
}
