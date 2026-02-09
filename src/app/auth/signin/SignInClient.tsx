"use client";
import { motion } from "framer-motion";
import { useApp } from "../../contexts/AppContext";
import { Mail, Lock, Github, ArrowRight, CheckCircle2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function SignIn() {
  const { t } = useApp();
  const router = useRouter();
  // Get the possible destination after ?redirect= from the URL search params
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get("redirect") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSocialSignIn = async (provider: "github" | "google") => {
    await authClient.signIn.social({
      provider,
      callbackURL: redirectTo,
    });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authClient.signIn.email(
        {
          email,
          password,
        },
        {
          onSuccess: () => {
            router.push(redirectTo);
          },
          onError: (ctx) => {
            setError(ctx.error.message);
            setLoading(false);
          },
        }
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-sleads-midnight pt-20 pb-20">
      {/* Background Perspective Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      {/* Floating Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 20, 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[radial-gradient(closest-side,rgba(31,111,235,0.05)_0%,transparent_100%)] dark:bg-[radial-gradient(closest-side,rgba(31,111,235,0.1)_0%,transparent_100%)] will-change-transform"
        />
        <motion.div
          animate={{
            x: [0, -30, 0],
            y: [0, 30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-[radial-gradient(closest-side,rgba(96,165,250,0.05)_0%,transparent_100%)] dark:bg-[radial-gradient(closest-side,rgba(31,111,235,0.1)_0%,transparent_100%)] will-change-transform"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-5xl mx-4 relative z-10 grid grid-cols-1 md:grid-cols-2 bg-white dark:bg-sleads-slate900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-sleads-slate700"
      >
        {/* LEFT COLUMN: FORM */}
        <div className="p-8 md:p-12 flex flex-col justify-center relative">
          <div className="mb-8">
            <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {t("auth.welcome_back")}
            </h1>
            <p className="text-slate-500 dark:text-sleads-slate500">
              {t("auth.signin_desc")}
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSignIn}>
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-sleads-slate300 ml-1">
                {t("auth.email")}
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

            <div className="space-y-1.5">
              <div className="flex justify-between ml-1">
                <label className="text-sm font-medium text-slate-700 dark:text-sleads-slate300">
                  {t("auth.password")}
                </label>
                <a
                  onClick={() => router.push("/forgot-password")}
                  className="text-xs font-medium cursor-pointer text-sleads-blue hover:text-blue-400 transition-colors"
                >
                  {t("auth.forgot")}
                </a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-sleads-slate500 group-focus-within:text-sleads-blue transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-sleads-midnight border border-slate-200 dark:border-sleads-slate700 rounded-xl py-3.5 pl-11 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-sleads-blue focus:ring-1 focus:ring-sleads-blue transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sleads-blue hover:bg-sleads-blue/90 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-sleads-blue/20 hover:shadow-sleads-blue/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 group mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : t("auth.signin_btn")}
              {!loading && (
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200 dark:bg-sleads-slate700"></div>
            <span className="text-xs text-slate-400 dark:text-sleads-slate500 font-medium uppercase tracking-wider">
              {t("auth.or_continue")}
            </span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-sleads-slate700"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleSocialSignIn("google")}
              className="flex items-center justify-center gap-2 py-2.5 bg-white dark:bg-sleads-midnight border border-slate-200 dark:border-sleads-slate700 rounded-xl hover:bg-slate-50 dark:hover:bg-sleads-slate900 hover:border-slate-300 dark:hover:border-sleads-slate500 transition-all cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className="text-sm font-semibold text-slate-700 dark:text-white">
                Google
              </span>
            </button>
            <button
              onClick={() => handleSocialSignIn("github")}
              className="flex items-center justify-center gap-2 py-2.5 bg-white dark:bg-sleads-midnight border border-slate-200 dark:border-sleads-slate700 rounded-xl hover:bg-slate-50 dark:hover:bg-sleads-slate900 hover:border-slate-300 dark:hover:border-sleads-slate500 transition-all cursor-pointer"
            >
              <Github className="w-5 h-5 text-slate-900 dark:text-white" />
              <span className="text-sm font-semibold text-slate-700 dark:text-white">
                GitHub
              </span>
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 dark:text-sleads-slate500">
              {t("auth.no_account")}{" "}
              <button
                onClick={() => router.push("/auth/signup")}
                className="font-bold text-sleads-blue hover:text-blue-400 transition-colors"
              >
                {t("auth.signup_btn")}
              </button>
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: VISUAL */}
        <div className="hidden md:flex relative flex-col justify-between p-12 bg-slate-900 overflow-hidden">
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-linear-to-br from-sleads-blue/20 via-sleads-midnight to-sleads-midnight z-0"></div>

          {/* Abstract Animated Shapes */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-[100px] border border-white/10 opacity-30 z-0"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute top-40 -left-20 w-[300px] h-[300px] rounded-full border border-sleads-blue/20 opacity-30 z-0"
          />

          {/* Glass Card */}
          <div className="relative z-10 mt-auto">
            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl shadow-xl">
              <div className="flex gap-1 mb-4">
                <div className="w-2 h-2 rounded-full bg-sleads-blue"></div>
                <div className="w-2 h-2 rounded-full bg-sleads-blue/50"></div>
                <div className="w-2 h-2 rounded-full bg-sleads-blue/20"></div>
              </div>
              <p className="text-xl font-heading text-white mb-4">
                &quot;The internal tools Sleads built for us automated 40% of
                our workflow. It&apos;s not just software, it&apos;s a growth
                engine.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-linear-to-tr from-sleads-blue to-blue-600 flex items-center justify-center text-white font-bold text-xs">
                  JS
                </div>
                <div>
                  <div className="text-white font-bold text-sm">
                    James Smith
                  </div>
                  <div className="text-white/50 text-xs">
                    CTO, Apex Architecture
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Decoration */}
          <div className="relative z-10 mt-8 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-sleads-blue" />
            <span className="text-sm text-sleads-slate300">
              Secure 256-bit encryption
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
