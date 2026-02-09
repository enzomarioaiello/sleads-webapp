"use client";

import { authClient } from "@/lib/auth-client";
import { X, VenetianMask } from "lucide-react";
import { useRouter } from "next/navigation";

export function ImpersonationControl() {
  const { data: session } = authClient.useSession();
  const router = useRouter();

  // Check if session has impersonatedBy field
  // We use "as any" because the type might not be strictly defined in the client types yet
  const isImpersonating = (session?.session as any)?.impersonatedBy;

  if (!isImpersonating) return null;

  const handleStopImpersonating = async () => {
    try {
      await authClient.admin.stopImpersonating();
      // Force a reload to ensure we get a clean session state
      window.location.href = "/admin-dashboard/users";
    } catch (error) {
      console.error("Failed to stop impersonating", error);
      alert("Failed to stop impersonating");
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 rounded-full bg-slate-900/90 pr-2 pl-4 py-2 text-white shadow-xl backdrop-blur-sm border border-slate-700/50">
        <div className="flex items-center gap-2">
          <VenetianMask className="h-4 w-4 text-blue-400" />
          <span className="text-xs font-medium">
            Impersonating <span className="text-blue-200">{session?.user.email}</span>
          </span>
        </div>
        <button
          onClick={handleStopImpersonating}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white transition-colors"
          title="Stop Impersonating"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

