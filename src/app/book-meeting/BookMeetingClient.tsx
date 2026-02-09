"use client";
import React, { useState, useEffect } from "react";
import {
  motion,
  useSpring,
  useMotionValue,
  useTransform,
  Variants,
} from "framer-motion";
import {
  Calendar,
  Clock,
  Mail,
  Phone,
  User,
  Building2,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { useToast } from "../hooks/useToast";
import Image from "next/image";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";

export default function BookMeetingClient() {
  const { t } = useApp();
  const { toast } = useToast();
  const { data: session } = authClient.useSession();

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [timezone, setTimezone] = useState("Europe/Amsterdam");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parallax mouse effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    if (session) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
    }
  }, [session]);

  useEffect(() => {
    // Only enable parallax on non-touch devices
    if (window.matchMedia("(hover: none)").matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mouseX.set((e.clientX - innerWidth / 2) / innerWidth);
      mouseY.set((e.clientY - innerHeight / 2) / innerHeight);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const springConfig = { damping: 25, stiffness: 120 };
  const moveX = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-20, 20]),
    springConfig
  );
  const moveY = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [-20, 20]),
    springConfig
  );
  const moveXReverse = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [20, -20]),
    springConfig
  );
  const moveYReverse = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [20, -20]),
    springConfig
  );

  const variants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.1 * i,
        duration: 0.8,
        ease: [0.215, 0.61, 0.355, 1.0] as [number, number, number, number],
      },
    }),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !company || !message) {
      toast.warning(t("book_meeting.toast_error_fields"));
      return;
    }

    if (!email.includes("@")) {
      toast.error(t("book_meeting.toast_error_email"));
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Implement booking mutation
      // For now, we'll use the contact form mutation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(t("book_meeting.toast_success"));

      // Reset form
      if (!session) {
        setName("");
        setEmail("");
      }
      setCompany("");
      setPhone("");
      setMessage("");
      setPreferredDate("");
      setPreferredTime("");
    } catch (error) {
      console.error("Error booking meeting:", error);
      toast.error(t("book_meeting.toast_error_send"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white dark:bg-sleads-midnight transition-colors duration-300">
      {/* Background Decor Elements - Interactive */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top Right Gradient Blob */}
        <motion.div
          style={{ x: moveXReverse, y: moveYReverse }}
          className="will-change-transform absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(closest-side,rgba(31,111,235,0.08)_0%,transparent_100%)] dark:bg-[radial-gradient(closest-side,rgba(31,111,235,0.12)_0%,transparent_100%)]"
        />
        {/* Bottom Left Gradient Blob */}
        <motion.div
          style={{ x: moveX, y: moveY }}
          className="will-change-transform absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(closest-side,rgba(96,165,250,0.08)_0%,transparent_100%)] dark:bg-[radial-gradient(closest-side,rgba(31,111,235,0.1)_0%,transparent_100%)]"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-[1440px] mx-auto px-6 pt-20 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-24 items-start lg:items-center min-h-[85vh]">
          {/* LEFT COLUMN: Text & Form */}
          <div className="flex flex-col items-start justify-center relative z-20 pt-8 lg:pt-0">
            {/* Badge */}
            <motion.div
              custom={0}
              initial="hidden"
              animate="visible"
              variants={variants}
              className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate700 shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-sleads-blue animate-pulse" />
              <span className="text-[10px] font-bold font-heading tracking-widest text-slate-500 dark:text-sleads-slate300 uppercase">
                {t("book_meeting.tag")}
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              custom={1}
              initial="hidden"
              animate="visible"
              variants={variants}
              className="font-heading font-black text-5xl md:text-6xl xl:text-7xl leading-[0.95] tracking-tight text-slate-900 dark:text-white mb-4"
            >
              <span className="block">{t("book_meeting.title_1")}</span>
              <span className="block text-transparent bg-clip-text bg-linear-to-r from-sleads-blue via-[#3B82F6] to-blue-400 animate-gradient bg-size-[200%_auto]">
                {t("book_meeting.title_2")}
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              custom={2}
              initial="hidden"
              animate="visible"
              variants={variants}
              className="text-base md:text-lg text-slate-600 dark:text-sleads-slate300 font-sans leading-relaxed mb-8 max-w-xl"
            >
              {t("book_meeting.subtitle")}
            </motion.p>

            {/* Booking Form */}
            <motion.div
              custom={3}
              initial="hidden"
              animate="visible"
              variants={variants}
              className="w-full max-w-2xl"
            >
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute -inset-0.5 bg-linear-to-r from-sleads-blue/20 via-blue-400/20 to-sleads-blue/20 rounded-3xl blur-xl opacity-50 dark:opacity-30"></div>
                <form
                  onSubmit={handleSubmit}
                  className="relative bg-white dark:bg-sleads-slate900/95 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/50 rounded-3xl p-8 md:p-10 shadow-xl dark:shadow-2xl space-y-6"
                >
                  {/* Name & Email Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="group">
                      <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-sleads-slate400 uppercase tracking-widest mb-3 group-focus-within:text-sleads-blue transition-colors">
                        <User className="w-3.5 h-3.5" />
                        {t("book_meeting.name")}
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={!!session}
                        className="w-full bg-slate-50 dark:bg-sleads-slate800/50 border border-slate-200 dark:border-sleads-slate700 rounded-lg px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-sleads-slate500 focus:outline-none focus:ring-2 focus:ring-sleads-blue/20 focus:border-sleads-blue transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div className="group">
                      <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-sleads-slate400 uppercase tracking-widest mb-3 group-focus-within:text-sleads-blue transition-colors">
                        <Mail className="w-3.5 h-3.5" />
                        {t("book_meeting.email")}
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={!!session}
                        className="w-full bg-slate-50 dark:bg-sleads-slate800/50 border border-slate-200 dark:border-sleads-slate700 rounded-lg px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-sleads-slate500 focus:outline-none focus:ring-2 focus:ring-sleads-blue/20 focus:border-sleads-blue transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        placeholder="john@company.com"
                        required
                      />
                    </div>
                  </div>

                  {/* Company & Phone Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="group">
                      <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-sleads-slate400 uppercase tracking-widest mb-3 group-focus-within:text-sleads-blue transition-colors">
                        <Building2 className="w-3.5 h-3.5" />
                        {t("book_meeting.company")}
                      </label>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-sleads-slate800/50 border border-slate-200 dark:border-sleads-slate700 rounded-lg px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-sleads-slate500 focus:outline-none focus:ring-2 focus:ring-sleads-blue/20 focus:border-sleads-blue transition-all"
                        placeholder="Company Name"
                        required
                      />
                    </div>
                    <div className="group">
                      <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-sleads-slate400 uppercase tracking-widest mb-3 group-focus-within:text-sleads-blue transition-colors">
                        <Phone className="w-3.5 h-3.5" />
                        {t("book_meeting.phone")}
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-sleads-slate800/50 border border-slate-200 dark:border-sleads-slate700 rounded-lg px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-sleads-slate500 focus:outline-none focus:ring-2 focus:ring-sleads-blue/20 focus:border-sleads-blue transition-all"
                        placeholder={t("book_meeting.phone_placeholder")}
                      />
                    </div>
                  </div>

                  {/* Date & Time Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="group">
                      <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-sleads-slate400 uppercase tracking-widest mb-3 group-focus-within:text-sleads-blue transition-colors">
                        <Calendar className="w-3.5 h-3.5" />
                        {t("book_meeting.preferred_date")}
                      </label>
                      <input
                        type="date"
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full bg-slate-50 dark:bg-sleads-slate800/50 border border-slate-200 dark:border-sleads-slate700 rounded-lg px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sleads-blue/20 focus:border-sleads-blue transition-all [color-scheme:light] dark:[color-scheme:dark]"
                      />
                    </div>
                    <div className="group">
                      <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-sleads-slate400 uppercase tracking-widest mb-3 group-focus-within:text-sleads-blue transition-colors">
                        <Clock className="w-3.5 h-3.5" />
                        {t("book_meeting.preferred_time")}
                      </label>
                      <input
                        type="time"
                        value={preferredTime}
                        onChange={(e) => setPreferredTime(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-sleads-slate800/50 border border-slate-200 dark:border-sleads-slate700 rounded-lg px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sleads-blue/20 focus:border-sleads-blue transition-all [color-scheme:light] dark:[color-scheme:dark]"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div className="group">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-sleads-slate400 uppercase tracking-widest mb-3 group-focus-within:text-sleads-blue transition-colors">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {t("book_meeting.message")}
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      className="w-full bg-slate-50 dark:bg-sleads-slate800/50 border border-slate-200 dark:border-sleads-slate700 rounded-lg px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-sleads-slate500 focus:outline-none focus:ring-2 focus:ring-sleads-blue/20 focus:border-sleads-blue transition-all resize-none"
                      placeholder={t("book_meeting.message")}
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-2 px-8 py-4 bg-sleads-blue text-white rounded-xl font-bold text-sm tracking-wide transition-all hover:bg-blue-600 hover:shadow-xl hover:shadow-sleads-blue/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {t("book_meeting.submitting")}
                      </>
                    ) : (
                      <>
                        {t("book_meeting.submit")}
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: Coffee Image with Parallax */}
          <motion.div
            custom={4}
            initial="hidden"
            animate="visible"
            variants={variants}
            className="hidden lg:flex relative h-[700px] w-full items-center justify-center px-8 xl:px-12"
          >
            <motion.div
              style={{
                x: moveXReverse,
                y: moveYReverse,
                rotate: useTransform(mouseX, [-0.5, 0.5], [-3, 3]),
              }}
              className="relative w-full h-full will-change-transform flex items-center justify-center"
            >
              {/* Background frame/container for better integration */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full max-w-[550px] h-full max-h-[550px]">
                  {/* Subtle background circle for depth */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-50/50 via-blue-50/30 to-slate-50/50 dark:from-sleads-slate800/30 dark:via-sleads-blue/10 dark:to-sleads-slate800/30 blur-3xl" />

                  {/* Decorative border elements */}
                  <div className="absolute -inset-4 rounded-full border border-slate-200/50 dark:border-sleads-slate700/30 opacity-50" />
                  <div className="absolute -inset-8 rounded-full border border-slate-100/30 dark:border-sleads-slate800/20 opacity-30" />
                </div>
              </div>

              {/* Coffee Image Container with padding */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  duration: 1,
                  delay: 0.5,
                  ease: [0.215, 0.61, 0.355, 1.0],
                }}
                className="relative w-full max-w-[500px] h-full max-h-[500px] flex items-center justify-center p-8"
              >
                <div className="relative w-full h-full">
                  <Image
                    src="/images/hero/coffee.png"
                    alt="Coffee"
                    width={800}
                    height={800}
                    className="object-contain w-full h-full drop-shadow-[0_25px_80px_rgba(0,0,0,0.12)] dark:drop-shadow-[0_25px_80px_rgba(0,0,0,0.25)]"
                    priority
                  />
                </div>
              </motion.div>

              {/* Floating decorative elements - positioned better */}
              <motion.div
                style={{ x: moveX, y: moveY }}
                className="absolute top-16 right-16 w-32 h-32 rounded-full bg-sleads-blue/8 dark:bg-sleads-blue/12 blur-3xl will-change-transform"
              />
              <motion.div
                style={{ x: moveXReverse, y: moveYReverse }}
                className="absolute bottom-16 left-16 w-40 h-40 rounded-full bg-blue-400/8 dark:bg-blue-400/12 blur-3xl will-change-transform"
              />

              {/* Additional subtle glow behind image */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[450px] h-[450px] rounded-full bg-sleads-blue/5 dark:bg-sleads-blue/8 blur-2xl" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}





