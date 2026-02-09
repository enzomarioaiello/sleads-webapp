"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useApp } from "../contexts/AppContext";
import { Send } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { PhoneInput } from "../components/ui/PhoneInput";
import { useToast } from "../hooks/useToast";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function Contact() {
  const { t } = useApp();
  const { toast } = useToast();
  const sendProjectContactForm = useMutation(
    api.contact.sendProjectContactForm
  );
  const [activeType, setActiveType] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: session, isPending, error } = authClient.useSession();

  useEffect(() => {
    if (session) {
      setTimeout(() => {
        setName(session.user.name);
        setEmail(session.user.email);
      }, 100);
    }
  }, [session, isPending]);

  const projectTypes = [
    { id: "website", label: t("contact.types.website") },
    { id: "platform", label: t("contact.types.platform") },
    { id: "internal", label: t("contact.types.internal") },
    { id: "design", label: t("contact.types.design") },
    { id: "saas", label: t("contact.types.saas") },
    { id: "other", label: t("contact.types.other") },
  ];

  const locations = [
    { id: "am", label: t("contact.locations.am"), x: "50%", y: "40%" },
    { id: "ny", label: t("contact.locations.ny"), x: "25%", y: "45%" },
    { id: "ln", label: t("contact.locations.ln"), x: "48%", y: "38%" },
    { id: "tk", label: t("contact.locations.tk"), x: "85%", y: "42%" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeType) {
      toast.warning(t("contact.toast_error_type"));
      return;
    }

    if (!name || !email || !company || !message) {
      toast.warning(t("contact.toast_error_fields"));
      return;
    }

    if (!email.includes("@")) {
      toast.error(t("contact.toast_error_email"));
      return;
    }

    setIsSubmitting(true);
    try {
      await sendProjectContactForm({
        name,
        email,
        subject: activeType,
        companyName: company,
        phone,
        message,
      });

      toast.success(t("contact.toast_success"));

      // Reset form
      if (!session) {
        setName("");
        setEmail("");
      }
      setCompany("");
      setMessage("");
      setPhone("");
      setActiveType(null);
    } catch (error) {
      console.error("Error sending project contact form:", error);
      toast.error(t("contact.toast_error_send"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative bg-slate-50 dark:bg-sleads-midnight pt-24 pb-20 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      <motion.div
        animate={{
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 right-0 w-[800px] h-[800px] bg-sleads-blue/5 rounded-full blur-[120px] pointer-events-none"
      />

      <div className="max-w-[1440px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 relative z-10">
        {/* LEFT: GLOBAL PRESENCE VISUALIZER */}
        <div className="flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sleads-blue/10 border border-sleads-blue/20 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sleads-blue opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sleads-blue"></span>
              </span>
              <span className="text-xs font-bold text-sleads-blue uppercase tracking-wide">
                Worldwide
              </span>
            </div>

            <h1 className="font-heading text-5xl md:text-6xl font-black text-slate-900 dark:text-white leading-[0.95] mb-6">
              {t("contact.title")}
            </h1>
            <p className="text-xl text-slate-600 dark:text-sleads-slate300 max-w-lg leading-relaxed mb-12">
              {t("contact.subtitle")}
            </p>
          </motion.div>

          {/* Animated Map / Globe Abstract */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 1 }}
            className="relative w-full aspect-[16/9] bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-sleads-slate700 shadow-xl overflow-hidden mb-12"
          >
            {/* Map Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px] opacity-10"></div>

            {/* World Map Silhouette (CSS shapes or SVG simplified) */}
            <svg
              className="absolute inset-0 w-full h-full text-slate-200 dark:text-slate-800 fill-current opacity-30"
              viewBox="0 0 100 50"
              preserveAspectRatio="none"
            >
              <path d="M20 15 Q25 10 30 15 T40 20 T50 15 T60 20 T80 15 V35 Q70 40 60 35 T40 30 T20 35 Z" />
            </svg>

            {/* Locations */}
            {locations.map((loc, i) => (
              <motion.div
                key={loc.id}
                className="absolute flex flex-col items-center"
                style={{ left: loc.x, top: loc.y }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.2 }}
              >
                <div className="relative">
                  <motion.div
                    animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.5,
                    }}
                    className="absolute inset-0 bg-sleads-blue rounded-full opacity-50"
                  />
                  <div className="w-3 h-3 bg-sleads-blue rounded-full shadow-[0_0_10px_rgba(31,111,235,0.8)] relative z-10 border border-white dark:border-sleads-midnight"></div>
                </div>
                <div className="mt-2 px-2 py-0.5 bg-white/80 dark:bg-sleads-midnight/80 backdrop-blur text-[10px] font-bold uppercase tracking-wider text-slate-900 dark:text-white rounded border border-slate-200 dark:border-sleads-slate700 shadow-sm">
                  {loc.label}
                </div>
              </motion.div>
            ))}

            {/* Connection Lines (Simulated) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <motion.path
                d="M25 45 Q35 30 48 38 T85 42"
                fill="none"
                stroke="url(#gradient-line)"
                strokeWidth="1"
                strokeDasharray="5 5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.3 }}
                transition={{ duration: 2, delay: 1.5 }}
              />
              <defs>
                <linearGradient
                  id="gradient-line"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="transparent" />
                  <stop offset="50%" stopColor="#1F6FEB" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6">
            {[
              { val: "250+", label: t("contact.stat_clients") },
              { val: "4", label: t("contact.stat_timezones") },
              { val: "99%", label: t("contact.stat_rate") },
            ].map((stat, i) => (
              <div key={i}>
                <h4 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                  {stat.val}
                </h4>
                <p className="text-xs font-medium text-slate-500 dark:text-sleads-slate500 uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: HOLOGRAPHIC FORM */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-sleads-blue to-blue-400 rounded-2xl blur opacity-20 dark:opacity-40"></div>
          <div className="relative bg-white/80 dark:bg-sleads-midnight/60 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-8 md:p-10 shadow-2xl">
            <form className="space-y-8" onSubmit={handleSubmit}>
              {/* Power Chips for Project Type */}
              <div>
                <label className="block text-sm font-bold text-slate-900 dark:text-white mb-4">
                  {t("contact.type_label")}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {projectTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setActiveType(type.id)}
                      className={`relative px-3 py-3 text-xs md:text-sm font-medium rounded-xl border transition-all duration-300 ${
                        activeType === type.id
                          ? "bg-sleads-blue border-sleads-blue text-white shadow-lg shadow-sleads-blue/30 scale-105"
                          : "bg-slate-50 dark:bg-sleads-slate900/50 border-slate-200 dark:border-sleads-slate700 text-slate-600 dark:text-sleads-slate300 hover:border-sleads-blue/50 hover:bg-white dark:hover:bg-sleads-slate900"
                      }`}
                    >
                      {activeType === type.id && (
                        <motion.div
                          layoutId="activeChip"
                          className="absolute inset-0 border-2 border-white/20 rounded-xl"
                        />
                      )}
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-sleads-slate500 uppercase tracking-wider mb-2 group-focus-within:text-sleads-blue transition-colors">
                    {t("contact.name")}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!!session}
                    className="w-full bg-transparent border-b border-slate-300 dark:border-sleads-slate700 py-2 text-slate-900 dark:text-white placeholder:text-slate-400/50 focus:outline-none focus:border-sleads-blue transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div className="group">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-sleads-slate500 uppercase tracking-wider mb-2 group-focus-within:text-sleads-blue transition-colors">
                    {t("contact.email")}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!!session}
                    className="w-full bg-transparent border-b border-slate-300 dark:border-sleads-slate700 py-2 text-slate-900 dark:text-white placeholder:text-slate-400/50 focus:outline-none focus:border-sleads-blue transition-all"
                    placeholder="john@company.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-sleads-slate500 uppercase tracking-wider mb-2 group-focus-within:text-sleads-blue transition-colors">
                    {t("contact.company")}
                  </label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full bg-transparent border-b border-slate-300 dark:border-sleads-slate700 py-2 text-slate-900 dark:text-white placeholder:text-slate-400/50 focus:outline-none focus:border-sleads-blue transition-all"
                    placeholder="Acme Inc."
                  />
                </div>
                <div className="group">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-sleads-slate500 uppercase tracking-wider mb-2 group-focus-within:text-sleads-blue transition-colors">
                    {t("contact.phone")}{" "}
                  </label>
                  <PhoneInput
                    value={phone}
                    onChange={(e) => setPhone(e)}
                    placeholder={t("contact.phone_placeholder")}
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-xs font-semibold text-slate-500 dark:text-sleads-slate500 uppercase tracking-wider mb-2 group-focus-within:text-sleads-blue transition-colors">
                  {t("contact.message")}
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-sleads-slate900/50 border border-slate-200 dark:border-sleads-slate700 rounded-xl p-4 text-slate-900 dark:text-white placeholder:text-slate-400/50 focus:outline-none focus:border-sleads-blue focus:ring-1 focus:ring-sleads-blue transition-all resize-none"
                  placeholder="Tell us about your goals, timeline, and vision..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-sleads-blue hover:bg-sleads-blue/90 text-white font-bold rounded-xl shadow-lg shadow-sleads-blue/20 hover:shadow-sleads-blue/30 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Sending..." : t("contact.submit")}
                {!isSubmitting && <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
