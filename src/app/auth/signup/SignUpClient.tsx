"use client";

import { motion } from "framer-motion";
import { useApp } from "../../contexts/AppContext";
import { Mail, Lock, User, Github, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function SignUp() {
  const { t } = useApp();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSocialSignUp = async (provider: "github" | "google") => {
    await authClient.signIn.social({
      provider,
      callbackURL: "/",
    });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authClient.signUp.email(
        {
          email,
          password,
          name,
        },
        {
          onSuccess: () => {
            router.push("/");
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

      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, -20, 0],
            y: [0, 20, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[10%] left-[10%] w-[700px] h-[700px] rounded-full bg-[radial-gradient(closest-side,rgba(31,111,235,0.05)_0%,transparent_100%)] dark:bg-[radial-gradient(closest-side,rgba(31,111,235,0.1)_0%,transparent_100%)] will-change-transform"
        />
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(closest-side,rgba(96,165,250,0.05)_0%,transparent_100%)] dark:bg-[radial-gradient(closest-side,rgba(31,111,235,0.2)_0%,transparent_100%)] will-change-transform"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-5xl mx-4 relative z-10 grid grid-cols-1 md:grid-cols-2 bg-white dark:bg-sleads-slate900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-sleads-slate700"
      >
        {/* LEFT COLUMN: VISUAL (On Sign Up, let's put visual on Left for variety, or keep right for consistency? Let's keep Right for consistency but different content) */}

        {/* FORM COLUMN */}
        <div className="p-8 md:p-12 flex flex-col justify-center relative order-last md:order-first">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-sleads-blue/20 text-sleads-blue text-[10px] font-bold uppercase tracking-wider">
                Early Access
              </span>
            </div>
            <h1 className="font-heading text-3xl font-bold text-slate-900 dark:text-white mb-2">
              {t("auth.create_account")}
            </h1>
            <p className="text-slate-500 dark:text-sleads-slate500">
              {t("auth.signup_desc")}
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSignUp}>
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-sleads-slate300 ml-1">
                {t("auth.name")}
              </label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-sleads-slate500 group-focus-within:text-sleads-blue transition-colors" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-sleads-midnight border border-slate-200 dark:border-sleads-slate700 rounded-xl py-3.5 pl-11 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-sleads-blue focus:ring-1 focus:ring-sleads-blue transition-all"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

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
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-sleads-slate300 ml-1">
                {t("auth.password")}
              </label>
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
              {loading ? "Creating account..." : t("auth.signup_btn")}
              {!loading && (
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </form>

          <p className="mt-4 text-[10px] text-center text-slate-400 dark:text-sleads-slate500 leading-tight px-4">
            {t("auth.terms")}
          </p>

          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200 dark:bg-sleads-slate700"></div>
            <span className="text-xs text-slate-400 dark:text-sleads-slate500 font-medium uppercase tracking-wider">
              {t("auth.or_continue")}
            </span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-sleads-slate700"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleSocialSignUp("google")}
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
              onClick={() => handleSocialSignUp("github")}
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
              {t("auth.has_account")}{" "}
              <button
                onClick={() => router.push("/auth/signin")}
                className="font-bold text-sleads-blue hover:text-blue-400 transition-colors"
              >
                {t("auth.signin_btn")}
              </button>
            </p>
          </div>
        </div>

        {/* VISUAL COLUMN */}
        <div className="hidden md:flex relative flex-col p-12 bg-slate-900 overflow-hidden">
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-linear-to-bl from-sleads-midnight via-sleads-midnight to-blue-900/30 z-0"></div>

          {/* Geometric Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#1F6FEB_1px,transparent_1px)] bg-size-[20px_20px] opacity-10"></div>

          {/* Animated Elements */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10 my-auto"
          >
            <div className="aspect-square w-full max-w-[300px] mx-auto relative perspective-1000">
              <motion.div
                animate={{ rotateY: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-full h-full preserve-3d"
              >
                <div className="absolute inset-0 border-2 border-sleads-blue/30 rounded-full"></div>
                <div className="absolute inset-4 border border-sleads-blue/50 rounded-full rotate-45"></div>
                <div className="absolute inset-10 border border-white/20 rounded-full rotate-90"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-sleads-blue/20 blur-xl rounded-full"></div>
              </motion.div>
            </div>
          </motion.div>

          <div className="relative z-10 mt-12 text-center">
            <h2 className="text-2xl font-heading font-bold text-white mb-3">
              Build the future.
            </h2>
            <p className="text-sleads-slate300 text-sm leading-relaxed">
              Join thousands of founders and developers building their next big
              idea with Sleads technology.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
