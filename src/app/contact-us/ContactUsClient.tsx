"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useApp } from "../contexts/AppContext";
import { useToast } from "../hooks/useToast";
import { Send, Mail, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";

export default function ContactUsClient() {
  const { t } = useApp();
  const { toast } = useToast();
  const sendContactForm = useMutation(api.contact.sendContactForm);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (session) {
      setName(session.user.name);
      setEmail(session.user.email);
    }
  }, [session, isPending]);

  const submitForm = async () => {
    // Basic validation
    if (!name || !email || !subject || !message) {
      toast.warning("Please fill in all fields");
      return;
    }

    if (!email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      await sendContactForm({
        name: name,
        email: email,
        subject: subject,
        message: message,
      });

      toast.success("Message sent successfully! We'll get back to you soon.");

      // Clear form
      setName(session?.user.name ?? "");
      setEmail(session?.user.email ?? "");
      setSubject("");
      setMessage("");
      setIsSubmitting(false);
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
      console.error("Error sending contact form:", error);
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
        {/* LEFT: INFO & VISUALS */}
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
                {t("contact_us.general_inquiries")}
              </span>
            </div>

            <h1 className="font-heading text-5xl md:text-6xl font-black text-slate-900 dark:text-white leading-[0.95] mb-6">
              {t("contact_us.title")}.
            </h1>
            <p className="text-xl gap-2 text-slate-600 dark:text-sleads-slate300 max-w-lg leading-relaxed mb-12">
              {t("contact_us.subtitle")}
              <Link
                href="/contact"
                className="text-sleads-blue font-semibold hover:underline inline-flex items-center gap-1 ml-1"
              >
                <MessageSquare className="w-4 h-4" />
              </Link>
            </p>
          </motion.div>

          {/* Contact Methods */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 1 }}
            className="grid grid-cols-1 gap-6 mb-12"
          >
            <div className="flex items-start gap-4 p-6 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-sleads-slate700 shadow-sm hover:shadow-md transition-all">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  {t("contact_us.email_us")}
                </h3>
                <p className="text-slate-500 dark:text-sleads-slate500 text-sm mb-2">
                  {t("contact_us.email_desc")}
                </p>
                <a
                  href="mailto:hello@sleads.nl"
                  className="text-sleads-blue font-semibold hover:underline"
                >
                  hello@sleads.nl
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-sleads-slate700 shadow-sm hover:shadow-md transition-all">
              <div className="p-3 bg-sleads-blue/10 dark:bg-sleads-blue/20 text-sleads-blue dark:text-sleads-blue rounded-xl">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  {t("contact_us.live_chat")}
                </h3>
                <p className="text-slate-500 dark:text-sleads-slate500 text-sm mb-2">
                  {t("contact_us.chat_desc")}
                </p>
                <span className="text-sleads-blue font-semibold cursor-pointer">
                  {t("contact_us.start_chat")}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* RIGHT: CONTACT FORM */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-sleads-blue to-blue-400 rounded-2xl blur opacity-20 dark:opacity-40"></div>
          <div className="relative bg-white/80 dark:bg-sleads-midnight/60 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-8 md:p-10 shadow-2xl">
            <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
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
                    disabled={!!session}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent border-b border-slate-300 dark:border-sleads-slate700 py-2 text-slate-900 dark:text-white placeholder:text-slate-400/50 focus:outline-none focus:border-sleads-blue transition-all"
                    placeholder="john@company.com"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-xs font-semibold text-slate-500 dark:text-sleads-slate500 uppercase tracking-wider mb-2 group-focus-within:text-sleads-blue transition-colors">
                  {t("contact_us.subject")}
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-transparent border-b border-slate-300 dark:border-sleads-slate700 py-2 text-slate-900 dark:text-white placeholder:text-slate-400/50 focus:outline-none focus:border-sleads-blue transition-all"
                  placeholder={t("contact_us.subject_placeholder")}
                />
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
                  placeholder={t("contact_us.message_placeholder")}
                />
              </div>

              <button
                onClick={() => submitForm()}
                disabled={isSubmitting}
                className="w-full py-4 bg-sleads-blue hover:bg-sleads-blue/90 disabled:bg-sleads-blue/50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-sleads-blue/20 hover:shadow-sleads-blue/30 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {isSubmitting ? "Sending..." : t("contact.submit")}
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
