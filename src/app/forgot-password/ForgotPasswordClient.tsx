"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useApp } from "../contexts/AppContext";

export default function ForgotPasswordClient() {
  const { t } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      const { error } = await authClient.forgetPassword({
        email,
      });

      if (error) {
        throw new Error(error.message);
      }

      setStatus("success");
    } catch (err: unknown) {
      console.error("Forgot password error:", err);
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : t("forgot_password.error_generic")
      );
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-sleads-midnight">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(closest-side,rgba(31,111,235,0.1)_0%,transparent_100%)] dark:bg-[radial-gradient(closest-side,rgba(31,111,235,0.15)_0%,transparent_100%)]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(closest-side,rgba(96,165,250,0.1)_0%,transparent_100%)] dark:bg-[radial-gradient(closest-side,rgba(31,111,235,0.15)_0%,transparent_100%)]" />
      </div>

      <AnimatePresence mode="wait">
        {status === "success" ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md mx-4 relative z-10 bg-white dark:bg-sleads-slate900 rounded-3xl shadow-2xl border border-slate-200 dark:border-sleads-slate700 overflow-hidden"
          >
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                {t("forgot_password.success_title")}
              </h1>
              <p className="text-slate-600 dark:text-sleads-slate300 mb-8">
                {t("forgot_password.success_desc")}
              </p>

              <button
                onClick={() => router.push("/auth/signin")}
                className="w-full py-3.5 px-4 bg-sleads-blue text-white rounded-xl font-bold hover:bg-sleads-blue/90 shadow-lg shadow-sleads-blue/20 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("forgot_password.back_to_signin")}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md mx-4 relative z-10 bg-white dark:bg-sleads-slate900 rounded-3xl shadow-2xl border border-slate-200 dark:border-sleads-slate700 overflow-hidden"
          >
            <div className="p-8">
              <div className="w-14 h-14 bg-sleads-blue/10 rounded-2xl flex items-center justify-center mb-6 text-sleads-blue">
                <KeyRound className="w-7 h-7" />
              </div>

              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {t("forgot_password.title")}
              </h1>
              <p className="text-slate-600 dark:text-sleads-slate300 mb-8">
                {t("forgot_password.desc")}
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {status === "error" && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg">
                    {errorMessage}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-sleads-slate300 ml-1">
                    {t("forgot_password.email_label")}
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-sleads-slate500 group-focus-within:text-sleads-blue transition-colors" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-sleads-midnight border border-slate-200 dark:border-sleads-slate700 rounded-xl py-3.5 pl-11 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-sleads-blue focus:ring-1 focus:ring-sleads-blue transition-all"
                      placeholder="name@example.com"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="w-full bg-sleads-blue hover:bg-sleads-blue/90 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-sleads-blue/20 hover:shadow-sleads-blue/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {status === "submitting" ? (
                    t("forgot_password.submitting")
                  ) : (
                    <>
                      {t("forgot_password.submit_btn")}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => router.push("/auth/signin")}
                  className="text-sm font-medium text-slate-500 dark:text-sleads-slate500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t("forgot_password.back_to_signin")}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
