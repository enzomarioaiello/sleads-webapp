"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  Bell,
  Check,
  Info,
  X,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/app/utils/cn";

type ToastVariant = "success" | "error" | "warning" | "info" | "neutral";

type ToastAction = {
  label: string;
  onClick: () => void;
};

export type ToastOptions = {
  id?: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  action?: ToastAction;
  dismissible?: boolean;
};

export type ToastInstance = Required<Pick<ToastOptions, "id">> &
  Omit<ToastOptions, "id">;

type ToastFunction = {
  (options: ToastOptions): string;
  success: (
    message: string,
    options?: Omit<ToastOptions, "variant" | "title">
  ) => string;
  error: (
    message: string,
    options?: Omit<ToastOptions, "variant" | "title">
  ) => string;
  warning: (
    message: string,
    options?: Omit<ToastOptions, "variant" | "title">
  ) => string;
  info: (
    message: string,
    options?: Omit<ToastOptions, "variant" | "title">
  ) => string;
  neutral: (
    message: string,
    options?: Omit<ToastOptions, "variant" | "title">
  ) => string;
};

type ToastContextValue = {
  toast: ToastFunction;
  dismiss: (id?: string) => void;
  toasts: ToastInstance[];
};

const DEFAULT_DURATION = 5000;

const ToastContext = createContext<ToastContextValue | null>(null);

const variantConfig: Record<
  ToastVariant,
  {
    icon: React.ElementType;
    lightBorder: string;
    darkBorder: string;
    lightIcon: string;
    darkIcon: string;
    lightGlow: string;
    darkGlow: string;
    lightBg: string; 
    darkBg: string;  
    accent: string;  
  }
> = {
  success: {
    icon: Check,
    lightBorder: "border-emerald-200",
    darkBorder: "dark:border-emerald-500/30",
    lightIcon: "text-emerald-600",
    darkIcon: "dark:text-emerald-400",
    lightGlow: "shadow-emerald-500/20",
    darkGlow: "shadow-[0_0_30px_-10px_rgba(16,185,129,0.4)]",
    lightBg: "bg-emerald-100",
    darkBg: "dark:bg-emerald-500/20",
    accent: "bg-emerald-500",
  },
  error: {
    icon: XCircle,
    lightBorder: "border-rose-200",
    darkBorder: "dark:border-rose-500/30",
    lightIcon: "text-rose-600",
    darkIcon: "dark:text-rose-400",
    lightGlow: "shadow-rose-500/20",
    darkGlow: "shadow-[0_0_30px_-10px_rgba(244,63,94,0.4)]",
    lightBg: "bg-rose-100",
    darkBg: "dark:bg-rose-500/20",
    accent: "bg-rose-500",
  },
  warning: {
    icon: AlertTriangle,
    lightBorder: "border-amber-200",
    darkBorder: "dark:border-amber-500/30",
    lightIcon: "text-amber-600",
    darkIcon: "dark:text-amber-400",
    lightGlow: "shadow-amber-500/20",
    darkGlow: "shadow-[0_0_30px_-10px_rgba(245,158,11,0.4)]",
    lightBg: "bg-amber-100",
    darkBg: "dark:bg-amber-500/20",
    accent: "bg-amber-500",
  },
  info: {
    icon: Info,
    lightBorder: "border-blue-200",
    darkBorder: "dark:border-blue-500/30",
    lightIcon: "text-sleads-blue",
    darkIcon: "dark:text-blue-400",
    lightGlow: "shadow-blue-500/20",
    darkGlow: "shadow-[0_0_30px_-10px_rgba(59,130,246,0.4)]",
    lightBg: "bg-blue-50",
    darkBg: "dark:bg-blue-500/20",
    accent: "bg-sleads-blue",
  },
  neutral: {
    icon: Bell,
    lightBorder: "border-slate-200",
    darkBorder: "dark:border-slate-700/50",
    lightIcon: "text-slate-600",
    darkIcon: "dark:text-slate-300",
    lightGlow: "shadow-slate-500/10",
    darkGlow: "shadow-[0_0_30px_-10px_rgba(148,163,184,0.1)]",
    lightBg: "bg-slate-100",
    darkBg: "dark:bg-white/10",
    accent: "bg-slate-500",
  },
};

const createId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export const ToastCard = ({
  toast,
  onDismiss,
}: {
  toast: ToastInstance;
  onDismiss: (id: string) => void;
}) => {
  const { variant = "neutral", title, description, action, duration } = toast;
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.95, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 0.9, y: -10, filter: "blur(4px)" }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="pointer-events-auto w-full max-w-[400px]"
    >
      <div
        className={cn(
          "relative flex items-start gap-4 overflow-hidden rounded-2xl border p-5 transition-all shadow-xl backdrop-blur-2xl",
          // Light Mode Styles: Pure white with high opacity, very clean look
          "bg-white/95 border-white/60",
          // Dark Mode Styles: Matching sleads midnight blue with glass effect
          "dark:bg-[#0a0f1f]/80 dark:border-white/10",
          config.lightBorder,
          config.darkBorder,
          config.lightGlow,
          config.darkGlow
        )}
      >
        {/* Glass Shimmer Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-50 pointer-events-none dark:from-white/5 dark:to-transparent" />

        {/* Icon Section */}
        <div className={cn(
          "relative mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          config.lightBg,
          config.darkBg
        )}>
           <Icon className={cn("h-5 w-5", config.lightIcon, config.darkIcon)} />
        </div>

        {/* Content Section */}
        <div className="flex-1 space-y-1.5 pt-0.5 relative z-10">
          {title && (
            <h3 className="text-[0.95rem] font-bold leading-tight text-slate-900 dark:text-white">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm font-medium leading-relaxed text-slate-500 dark:text-sleads-slate300/90">
              {description}
            </p>
          )}
          {action && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
                onDismiss(toast.id);
              }}
              className={cn(
                "mt-2 inline-flex items-center text-xs font-bold transition-colors hover:underline",
                 config.lightIcon,
                 config.darkIcon
              )}
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Close Button */}
        {toast.dismissible !== false && (
          <button
            onClick={() => onDismiss(toast.id)}
            className="absolute right-3 top-3 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-slate-300 z-20"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Progress Line */}
        {duration && duration > 0 && (
          <div className="absolute bottom-0 left-0 h-[3px] w-full bg-slate-100 dark:bg-white/5">
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: 0 }}
              transition={{ duration: duration / 1000, ease: "linear" }}
              className={cn("h-full", config.accent)}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastInstance[]>([]);
  const timeoutsRef = useRef<Map<string, number>>(new Map());

  const clearTimer = useCallback((id: string) => {
    const existing = timeoutsRef.current.get(id);
    if (existing) {
      window.clearTimeout(existing);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const dismiss = useCallback((id?: string) => {
    setToasts((current) => {
      if (!current.length) return current;
      if (!id) {
         return current;
      }
      return current.filter((toast) => toast.id !== id);
    });
    if (id) {
      clearTimer(id);
    }
  }, [clearTimer]);

  const scheduleRemoval = useCallback(
    (id: string, duration?: number) => {
      const timeout = window.setTimeout(
        () => dismiss(id),
        duration ?? DEFAULT_DURATION
      );
      timeoutsRef.current.set(id, timeout);
    },
    [dismiss]
  );

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutsRef.current.clear();
    };
  }, []);

  const toastImpl = useCallback(
    (options: ToastOptions) => {
      const id = options.id ?? createId();
      const instance: ToastInstance = {
        id,
        title: options.title,
        description: options.description,
        variant: options.variant ?? "info",
        duration: options.duration ?? DEFAULT_DURATION,
        action: options.action,
        dismissible: options.dismissible ?? true,
      };

      setToasts((current) => [instance, ...current].slice(0, 3));

      if (instance.duration && instance.duration > 0) {
        scheduleRemoval(id, instance.duration);
      }

      return id;
    },
    [scheduleRemoval]
  );

  const toast = useMemo(() => {
    const t = toastImpl as ToastFunction;
    
    t.success = (message, options) => t({ ...options, title: message, variant: "success" });
    t.error = (message, options) => t({ ...options, title: message, variant: "error" });
    t.warning = (message, options) => t({ ...options, title: message, variant: "warning" });
    t.info = (message, options) => t({ ...options, title: message, variant: "info" });
    t.neutral = (message, options) => t({ ...options, title: message, variant: "neutral" });

    return t;
  }, [toastImpl]);

  const value = useMemo(
    () => ({
      toast,
      dismiss,
      toasts,
    }),
    [dismiss, toast, toasts]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastViewport = () => {
  const { toasts, dismiss } = useToast();

  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed right-0 top-0 z-50 flex max-h-screen w-full flex-col items-end gap-3 p-6 sm:p-8">
      <AnimatePresence initial={false} mode="popLayout">
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export { ToastCard as Toast };
