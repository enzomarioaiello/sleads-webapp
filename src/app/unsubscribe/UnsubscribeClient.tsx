"use client";

import React, { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function UnsubscribeClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const subscriptionId = searchParams.get("id");

  const unsubscribe = useMutation(api.newsletter.unsubscribeFromNewsletter);

  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleUnsubscribe = async () => {
    if (!subscriptionId) return;

    setStatus("submitting");
    try {
      await unsubscribe({
        subscriptionId: subscriptionId as Id<"newsletter_subscriptions">,
      });
      localStorage.removeItem("newsletter_subscription");
      setStatus("success");
    } catch (error) {
      console.error("Unsubscribe error:", error);
      setStatus("error");
      setErrorMessage(
        "Failed to unsubscribe. The link might be invalid or expired."
      );
    }
  };

  if (!subscriptionId) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-sleads-midnight relative overflow-hidden">
        <div className="max-w-md w-full mx-4 p-8 bg-white dark:bg-sleads-slate900 rounded-3xl shadow-2xl border border-slate-200 dark:border-sleads-slate700 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600 dark:text-red-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Invalid Link
          </h1>
          <p className="text-slate-600 dark:text-sleads-slate300 mb-8">
            The unsubscribe link is missing required information. Please verify
            the URL.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-sleads-midnight">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(closest-side,rgba(31,111,235,0.1)_0%,transparent_100%)] dark:bg-[radial-gradient(closest-side,rgba(31,111,235,0.15)_0%,transparent_100%)]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(closest-side,rgba(96,165,250,0.1)_0%,transparent_100%)] dark:bg-[radial-gradient(closest-side,rgba(31,111,235,0.15)_0%,transparent_100%)]" />
      </div>

      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md mx-4 relative z-10 bg-white dark:bg-sleads-slate900 rounded-3xl shadow-2xl border border-slate-200 dark:border-sleads-slate700 overflow-hidden"
          >
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-sleads-blue/10 rounded-full flex items-center justify-center mx-auto mb-6 text-sleads-blue">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <AlertCircle className="w-8 h-8" />
                </motion.div>
              </div>

              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Unsubscribe?
              </h1>
              <p className="text-slate-600 dark:text-sleads-slate300 mb-8">
                We&apos;re sorry to see you go. Are you sure you want to stop
                receiving updates from our newsletter?
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleUnsubscribe}
                  className="w-full py-3.5 px-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2"
                >
                  Yes, unsubscribe me
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="w-full py-3.5 px-4 bg-transparent border border-slate-200 dark:border-sleads-slate700 text-slate-700 dark:text-sleads-slate300 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-sleads-slate800 transition-colors"
                >
                  No, keep me subscribed
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {status === "submitting" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-md mx-4 relative z-10 bg-white dark:bg-sleads-slate900 rounded-3xl shadow-2xl border border-slate-200 dark:border-sleads-slate700 p-12 flex flex-col items-center"
          >
            <Loader2 className="w-12 h-12 text-sleads-blue animate-spin mb-4" />
            <p className="text-slate-600 dark:text-sleads-slate300 font-medium">
              Processing your request...
            </p>
          </motion.div>
        )}

        {status === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md mx-4 relative z-10 bg-white dark:bg-sleads-slate900 rounded-3xl shadow-2xl border border-slate-200 dark:border-sleads-slate700 overflow-hidden"
          >
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Unsubscribed
              </h1>
              <p className="text-slate-600 dark:text-sleads-slate300 mb-8">
                You have been successfully removed from our newsletter. We
                won&apos;t email you again.
              </p>

              <button
                onClick={() => router.push("/")}
                className="w-full py-3.5 px-4 bg-sleads-blue text-white rounded-xl font-bold hover:bg-sleads-blue/90 shadow-lg shadow-sleads-blue/20 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Home
              </button>
            </div>
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md mx-4 relative z-10 bg-white dark:bg-sleads-slate900 rounded-3xl shadow-2xl border border-slate-200 dark:border-sleads-slate700 overflow-hidden"
          >
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600 dark:text-red-400">
                <XCircle className="w-8 h-8" />
              </div>

              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Something went wrong
              </h1>
              <p className="text-slate-600 dark:text-sleads-slate300 mb-8">
                {errorMessage}
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => setStatus("idle")}
                  className="w-full py-3.5 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90 transition-opacity"
                >
                  Try Again
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="w-full py-3.5 px-4 bg-transparent border border-slate-200 dark:border-sleads-slate700 text-slate-700 dark:text-sleads-slate300 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-sleads-slate800 transition-colors"
                >
                  Return Home
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
