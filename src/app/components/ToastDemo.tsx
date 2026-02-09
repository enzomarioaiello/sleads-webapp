"use client";

import React from "react";
import { useToast } from "../hooks/useToast";
import { CheckCircle2, XCircle, AlertTriangle, Info, Sparkles } from "lucide-react";

/**
 * ToastDemo Component
 * 
 * A demonstration component showcasing all toast notification types and features.
 * Use this component to test and preview the toast system.
 * 
 * Usage:
 * Import this component in any page to add toast testing buttons.
 * 
 * Example:
 * ```tsx
 * import ToastDemo from "@/app/components/ToastDemo";
 * 
 * export default function Page() {
 *   return (
 *     <div>
 *       <h1>My Page</h1>
 *       <ToastDemo />
 *     </div>
 *   );
 * }
 * ```
 */
export default function ToastDemo() {
  const { toast } = useToast();

  const demoToasts = [
    {
      type: "success",
      icon: CheckCircle2,
      title: "Success Toast",
      description: "Shows confirmation messages",
      action: () => toast.success("Operation completed successfully! 🎉"),
      color: "emerald",
    },
    {
      type: "error",
      icon: XCircle,
      title: "Error Toast",
      description: "Shows error messages",
      action: () => toast.error("Something went wrong. Please try again."),
      color: "red",
    },
    {
      type: "warning",
      icon: AlertTriangle,
      title: "Warning Toast",
      description: "Shows warning messages",
      action: () => toast.warning("This action cannot be undone!"),
      color: "amber",
    },
    {
      type: "info",
      icon: Info,
      title: "Info Toast",
      description: "Shows informational messages",
      action: () => toast.info("New features are now available!"),
      color: "blue",
    },
  ];

  const advancedExamples = [
    {
      title: "Quick Toast (2s)",
      action: () => toast.success("Quick notification!", { duration: 2000 }),
    },
    {
      title: "Long Toast (10s)",
      action: () => toast.info("This will stay for 10 seconds", { duration: 10000 }),
    },
    {
      title: "No Auto-dismiss",
      action: () => toast.warning("Close me manually", { duration: 0 }),
    },
    {
      title: "Multiple Toasts",
      action: () => {
        toast.info("First toast");
        setTimeout(() => toast.success("Second toast"), 500);
        setTimeout(() => toast.warning("Third toast"), 1000);
      },
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sleads-blue/10 border border-sleads-blue/20 mb-4">
          <Sparkles className="w-4 h-4 text-sleads-blue" />
          <span className="text-xs font-bold text-sleads-blue uppercase tracking-wide">
            Toast System Demo
          </span>
        </div>
        <h1 className="font-heading text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
          Toast Notifications
        </h1>
        <p className="text-lg text-slate-600 dark:text-sleads-slate300 max-w-2xl mx-auto">
          Click any button below to see the toast notification system in action.
          Each toast type has its own style, icon, and color scheme.
        </p>
      </div>

      {/* Basic Toast Types */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          Toast Types
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {demoToasts.map((demo) => {
            const Icon = demo.icon;
            return (
              <button
                key={demo.type}
                onClick={demo.action}
                className={`group relative p-6 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-sleads-slate700 rounded-xl hover:border-${demo.color}-500/50 transition-all hover:shadow-lg hover:shadow-${demo.color}-500/10 text-left`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 bg-${demo.color}-500/10 dark:bg-${demo.color}-500/20 rounded-xl`}
                  >
                    <Icon
                      className={`w-6 h-6 text-${demo.color}-600 dark:text-${demo.color}-400`}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                      {demo.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-sleads-slate500 mb-3">
                      {demo.description}
                    </p>
                    <span className="text-xs text-sleads-blue font-semibold group-hover:underline">
                      Click to test →
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced Examples */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          Advanced Examples
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {advancedExamples.map((example, index) => (
            <button
              key={index}
              onClick={example.action}
              className="p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-sleads-slate700 rounded-xl hover:border-sleads-blue/50 transition-all hover:shadow-lg hover:shadow-sleads-blue/10 text-left"
            >
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                {example.title}
              </h3>
              <span className="text-xs text-sleads-blue font-semibold hover:underline">
                Click to test →
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Code Example */}
      <div className="bg-slate-900 rounded-xl p-6 overflow-x-auto">
        <h3 className="text-lg font-bold text-white mb-4">Usage Example</h3>
        <pre className="text-sm text-slate-300">
          <code>{`import { useToast } from "@/app/hooks/useToast";

export default function MyComponent() {
  const { toast } = useToast();

  const handleClick = () => {
    toast.success("Success message!");
    toast.error("Error message!");
    toast.warning("Warning message!");
    toast.info("Info message!");
  };

  return <button onClick={handleClick}>Show Toast</button>;
}`}</code>
        </pre>
      </div>
    </div>
  );
}

