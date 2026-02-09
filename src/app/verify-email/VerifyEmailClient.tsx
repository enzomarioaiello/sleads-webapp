"use client";

import React, { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useApp } from "../contexts/AppContext";

export default function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const verifyUrl = searchParams.get("url");
  const { t } = useApp();

  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleVerify = async () => {
    if (!verifyUrl) return;

    setStatus("submitting");
    try {
      const response = await authClient.verifyEmail({
        query: {
          token: verifyUrl.split("token=")[1].split("&callbackURL=")[0],
        },
      });

      if (!response || response.error) {
        throw new Error(response?.error?.message || "Verification failed");
      }
      setStatus("success");
      setTimeout(() => {
        router.push("/");
      }, 3000);
    } catch (error) {
      console.error("Verification error:", error);
      setStatus("error");
      setErrorMessage(t("verify_email.default_error"));
    }
  };

  if (!verifyUrl) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-sleads-midnight relative overflow-hidden">
        <div className="max-w-md w-full mx-4 p-8 bg-white dark:bg-sleads-slate900 rounded-3xl shadow-2xl border border-slate-200 dark:border-sleads-slate700 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600 dark:text-red-400">
            <XCircle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {t("verify_email.invalid_link_title")}
          </h1>
          <p className="text-slate-600 dark:text-sleads-slate300 mb-8">
            {t("verify_email.invalid_link_desc")}
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90 transition-opacity"
          >
            {t("verify_email.return_home")}
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
            key="verify"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md mx-4 relative z-10 bg-white dark:bg-sleads-slate900 rounded-3xl shadow-2xl border border-slate-200 dark:border-sleads-slate700 overflow-hidden"
          >
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-sleads-blue/10 rounded-full flex items-center justify-center mx-auto mb-6 text-sleads-blue">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <ShieldCheck className="w-8 h-8" />
                </motion.div>
              </div>

              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                {t("verify_email.verify_title")}
              </h1>
              <p className="text-slate-600 dark:text-sleads-slate300 mb-8">
                {t("verify_email.verify_desc")}
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleVerify}
                  className="w-full py-3.5 px-4 bg-sleads-blue text-white rounded-xl font-bold hover:bg-sleads-blue/90 shadow-lg shadow-sleads-blue/20 transition-all flex items-center justify-center gap-2 group"
                >
                  <span>{t("verify_email.verify_btn")}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
              {t("verify_email.verifying_text")}
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
                {t("verify_email.success_title")}
              </h1>
              <p className="text-slate-600 dark:text-sleads-slate300 mb-8">
                {t("verify_email.success_desc")}
              </p>

              <button
                onClick={() => router.push("/")}
                className="w-full py-3.5 px-4 bg-sleads-blue text-white rounded-xl font-bold hover:bg-sleads-blue/90 shadow-lg shadow-sleads-blue/20 transition-all flex items-center justify-center gap-2"
              >
                {t("verify_email.dashboard_btn")}
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
                {t("verify_email.error_title")}
              </h1>
              <p className="text-slate-600 dark:text-sleads-slate300 mb-8">
                {errorMessage}
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => setStatus("idle")}
                  className="w-full py-3.5 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90 transition-opacity"
                >
                  {t("verify_email.try_again")}
                </button>
                <button
                  onClick={() => router.push("/")}
                  className="w-full py-3.5 px-4 bg-transparent border border-slate-200 dark:border-sleads-slate700 text-slate-700 dark:text-sleads-slate300 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-sleads-slate800 transition-colors"
                >
                  {t("verify_email.return_home")}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
