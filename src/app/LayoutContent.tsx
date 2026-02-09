"use client";
import React from "react";
import { Footer } from "./components/Footer";
import { Navbar } from "./components/Navbar";
import { AnimatePresence } from "framer-motion";
import { ChatWidget } from "./components/ChatWidget";
import { ImpersonationControl } from "./components/ImpersonationControl";
import { useLenis } from "./hooks/useLenis";
import { ConvexReactClient } from "convex/react";
import { ToastProvider } from "./components/ui/Toast";
import { usePathname } from "next/navigation";

import { authClient } from "../lib/auth-client";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const LayoutContent = ({ children }: { children: React.ReactNode }) => {
  useLenis();
  const pathname = usePathname();

  // Check if current route is a dashboard route
  const isDashboard = pathname?.startsWith("/dashboard") || pathname?.startsWith("/admin-dashboard");
  
  // Check if current route is a doc-preview route (for PDF generation)
  const isDocPreview = pathname?.startsWith("/doc-preview");

  return (
    <div className="font-sans antialiased text-slate-900 dark:text-sleads-white bg-slate-50 dark:bg-sleads-midnight selection:bg-sleads-blue selection:text-white transition-colors duration-300">
      <ConvexBetterAuthProvider client={convex} authClient={authClient}>
        <ToastProvider>
          {!isDashboard && !isDocPreview && <Navbar />}
          <main>
            <AnimatePresence mode="wait">{children}</AnimatePresence>
          </main>
          {!isDashboard && !isDocPreview && <Footer />}
          {!isDashboard && !isDocPreview && <ChatWidget />}
          <ImpersonationControl />
        </ToastProvider>
      </ConvexBetterAuthProvider>
    </div>
  );
};
