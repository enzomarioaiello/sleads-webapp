"use client";
import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { authClient } from "@/lib/auth-client";
import {
  ArrowRight,
  FolderKanban,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  Sparkles,
  ReceiptEuro,
} from "lucide-react";
import Link from "next/link";
import { useApp } from "@/app/contexts/AppContext";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { data: session } = authClient.useSession();
  const params = useParams();
  const organizationId = params.orgID as string;
  const { t } = useApp();
  const router = useRouter();

  const [quotesWaitingForApproval, setQuotesWaitingForApproval] =
    useState<Array<Doc<"quotes">> | null>(null);
  const [invoicesSent, setInvoicesSent] = useState<Array<
    Doc<"invoices">
  > | null>(null);
  const [invoicesPaymentLate, setInvoicesPaymentLate] = useState<Array<
    Doc<"invoices">
  > | null>(null);
  const projects = useQuery(api.project.getProjects, {
    organizationId: organizationId as Id<"organizations">,
  });

  const quotes = useQuery(api.quote.getQuotesForOrganization, {
    organizationId: organizationId as Id<"organizations">,
  });

  const invoices = useQuery(api.invoice.getInvoicesForOrganization, {
    organizationId: organizationId as Id<"organizations">,
  });

  useEffect(() => {
    if (!quotes) return;
    setTimeout(() => {
      setQuotesWaitingForApproval(
        quotes.filter((quote) => quote.quoteStatus === "sent")
      );
    }, 10);
  }, [quotes]);

  useEffect(() => {
    if (!invoices) return;
    setTimeout(() => {
      setInvoicesPaymentLate(
        invoices.filter((invoice) => invoice.invoiceStatus === "overdue")
      );
      setInvoicesSent(
        invoices.filter((invoice) => invoice.invoiceStatus === "sent")
      );
    }, 10);
  }, [invoices]);

  // Sort projects by updatedAt (most recent first) and take first 2
  const recentProjects = useMemo(() => {
    if (!projects) return [];
    return [...projects]
      .sort(
        (a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt)
      )
      .slice(0, 2);
  }, [projects]);

  // Format date helper
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get gradient colors based on project index
  const getGradientColors = (index: number) => {
    const gradients = [
      "from-sleads-blue to-blue-700",
      "from-blue-500 to-sleads-blue",
      "from-purple-500 to-pink-500",
      "from-green-500 to-emerald-600",
    ];
    return gradients[index % gradients.length];
  };

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greetingKey =
    hour < 12
      ? "dashboard_internal.page.greeting.morning"
      : hour < 18
        ? "dashboard_internal.page.greeting.afternoon"
        : "dashboard_internal.page.greeting.evening";

  const greeting = t(greetingKey);

  const handleTakeAction = () => {
    const soonestInvoice = invoicesPaymentLate?.sort(
      (a, b) => (a.invoiceDueDate || 0) - (b.invoiceDueDate || 0)
    )[0];
    if (soonestInvoice) {
      router.push(
        `/dashboard/${organizationId}/projects/${soonestInvoice?.projectId}/invoices/${soonestInvoice?._id}`
      );
    } else {
      const soonestQuote = quotesWaitingForApproval?.sort(
        (a, b) => (a.quoteValidUntil || 0) - (b.quoteValidUntil || 0)
      )[0];
      if (soonestQuote) {
        router.push(
          `/dashboard/${organizationId}/projects/${soonestQuote?.projectId}/quotes/${soonestQuote?._id}`
        );
      }
    }
  };

  const handleOpenInvoices = () => {
    const soonestInvoice = invoicesSent?.sort(
      (a, b) => (a.invoiceDueDate || 0) - (b.invoiceDueDate || 0)
    )[0];
    router.push(
      `/dashboard/${organizationId}/projects/${soonestInvoice?.projectId}/invoices/${soonestInvoice?._id}`
    );
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  if (!projects) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sleads-blue mx-auto mb-4"></div>
        <p className="text-slate-500 dark:text-sleads-slate400">
          {t("dashboard_internal.projects.loading")}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-10"
    >
      {/* Welcome Section */}
      <motion.div variants={item} className="flex flex-col gap-2">
        <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white">
          {greeting},{" "}
          <span className="text-sleads-blue">
            {session?.user?.name?.split(" ")[0] || "Guest"}
          </span>
        </h2>
        <p className="text-slate-500 dark:text-sleads-slate400 text-lg max-w-2xl">
          {t("dashboard_internal.page.subtitle")}
        </p>
      </motion.div>

      {/* Stats / Quick Overview */}
      <motion.div
        variants={item}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 dark:bg-sleads-blue/10 rounded-xl text-sleads-blue dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
              <FolderKanban className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 rounded-full">
              {t("dashboard_internal.page.stats.active")}
            </span>
          </div>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
            {
              projects.filter(
                (project) =>
                  project.progress &&
                  project.progress > 0 &&
                  project.progress < 100
              ).length
            }
          </h3>
          <p className="text-slate-500 dark:text-sleads-slate400 text-sm font-medium">
            {t("dashboard_internal.page.stats.active_projects")}
          </p>
        </div>
        <div className="bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
              <Clock className="w-6 h-6" />
            </div>
            {(quotesWaitingForApproval?.length || 0) > 0 && (
              <span
                onClick={handleTakeAction}
                className="text-xs cursor-pointer flex items-center gap-2 font-bold px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 rounded-full"
              >
                {t("dashboard_internal.page.stats.action_required")}{" "}
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </div>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
            {(quotesWaitingForApproval?.length || 0) +
              (invoicesPaymentLate?.length || 0) || 0}
          </h3>
          <p className="text-slate-500 dark:text-sleads-slate400 text-sm font-medium">
            {t("dashboard_internal.page.stats.pending_approval")}
          </p>
        </div>

        <div className="bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 dark:bg-sleads-blue/10 rounded-xl text-sleads-blue dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
              <ReceiptEuro className="w-6 h-6" />
            </div>
            {(invoicesSent?.length || 0) > 0 && (
              <span
                onClick={handleOpenInvoices}
                className="text-xs cursor-pointer flex items-center gap-2 font-bold px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 rounded-full"
              >
                {t("dashboard_internal.page.stats.action_required")}{" "}
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </div>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
            {invoicesSent?.length || 0}
          </h3>
          <p className="text-slate-500 dark:text-sleads-slate400 text-sm font-medium">
            {t("dashboard_internal.page.stats.completed_tasks")}
          </p>
        </div>
      </motion.div>

      {/* Main Content Area: Project Cards */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            {t("dashboard_internal.page.recent_projects")}
          </h3>
          <Link
            href={`/dashboard/${organizationId}/projects`}
            className="text-sm font-semibold text-sleads-blue dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            {t("dashboard_internal.page.view_all")}{" "}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dynamic Project Cards */}
          {recentProjects.map((project, index) => (
            <div
              key={project._id}
              className="bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group"
            >
              <div
                className={`h-32 bg-linear-to-r ${getGradientColors(index)} relative`}
              >
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute bottom-4 left-6">
                  <h4 className="text-white font-bold text-xl">
                    {project.name}
                  </h4>
                  <p className="text-white/80 text-sm">
                    {project.phase
                      ? `${project.phase} ${t("dashboard_internal.page.card.phase")}`
                      : t("dashboard_internal.page.card.progress")}
                  </p>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white dark:border-sleads-slate900"></div>
                    <div className="w-8 h-8 rounded-full bg-slate-300 border-2 border-white dark:border-sleads-slate900"></div>
                  </div>
                  <div className="text-xs font-bold text-slate-500 dark:text-sleads-slate400">
                    {t("dashboard_internal.page.card.started_on")}{" "}
                    {formatDate(project.createdAt)}
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-sleads-slate300 font-medium">
                      {t("dashboard_internal.page.card.progress")}
                    </span>
                    <span className="text-sleads-blue font-bold">
                      {project.progress || 0}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-sleads-slate800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sleads-blue rounded-full"
                      style={{
                        width: `${project.progress || 0}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Link
                    href={`/dashboard/${organizationId}/projects/${project._id}`}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-50 dark:bg-sleads-slate800 text-slate-700 dark:text-white text-sm font-semibold hover:bg-slate-100 dark:hover:bg-sleads-slate700 transition-colors text-center"
                  >
                    {t("dashboard_internal.page.card.details")}
                  </Link>
                  <Link
                    href={`/dashboard/${organizationId}/projects/${project._id}`}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-sleads-blue text-white text-sm font-semibold hover:bg-sleads-blue/90 transition-colors shadow-lg shadow-sleads-blue/20 text-center"
                  >
                    {t("dashboard_internal.page.card.open")}
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {/* Show "Start New Project" card if only one project */}
          {recentProjects.length === 1 && (
            <div className="bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group">
              <div className="h-32 bg-linear-to-r from-sleads-blue to-blue-700 relative">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Sparkles className="w-12 h-12 text-white mx-auto mb-2 opacity-90" />
                    <h4 className="text-white font-bold text-xl">
                      {t("dashboard_internal.page.start_new_project.title")}
                    </h4>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-sleads-blue/20 flex items-center justify-center">
                    <Plus className="w-8 h-8 text-sleads-blue dark:text-blue-400" />
                  </div>
                </div>

                <div className="space-y-4 mb-6 text-center">
                  <p className="text-slate-600 dark:text-sleads-slate300 text-sm leading-relaxed">
                    {t("dashboard_internal.page.start_new_project.description")}
                  </p>
                </div>

                <Link
                  href="/contact"
                  className="w-full py-2.5 px-4 rounded-xl bg-sleads-blue text-white text-sm font-semibold hover:bg-sleads-blue/90 transition-colors shadow-lg shadow-sleads-blue/20 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {t("dashboard_internal.page.start_new_project.button")}
                </Link>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Notifications / Activity */}
      <motion.div
        variants={item}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="lg:col-span-2 bg-white dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            {t("dashboard_internal.page.recent_activity")}
          </h3>
          <div className="space-y-6">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-sleads-blue/10 text-sleads-blue flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  {i !== 2 && (
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 w-px h-10 bg-slate-200 dark:bg-sleads-slate800"></div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    <span className="font-bold">Sem de Jong</span>{" "}
                    {t("dashboard_internal.page.uploaded_file")}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-sleads-slate400 mt-1">
                    Design_System_v2.fig • 2 hours ago
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-linear-to-br from-sleads-blue to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-sleads-blue/20 relative overflow-hidden">
          <div className="relative z-10">
            <AlertCircle className="w-8 h-8 mb-4 opacity-80" />
            <h3 className="text-lg font-bold mb-2">
              {t("dashboard_internal.page.help.title")}
            </h3>
            <p className="text-white/80 text-sm mb-6 leading-relaxed">
              {t("dashboard_internal.page.help.desc")}
            </p>
            <button
              onClick={() => router.push("/contact-us")}
              className="w-full py-3 bg-white text-sleads-blue font-bold rounded-xl text-sm hover:bg-blue-50 transition-colors"
            >
              {t("dashboard_internal.page.help.btn")}
            </button>
          </div>

          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-10 -translate-y-10 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/20 rounded-full -translate-x-5 translate-y-5 blur-xl"></div>
        </div>
      </motion.div>
    </motion.div>
  );
}
