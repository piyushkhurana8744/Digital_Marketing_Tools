"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info, Flame, Zap, Sparkles, Gem } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "ready" | "ai" | "compression" | "link" | "premium";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (message: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((msg: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { ...msg, id };
    setToasts((prev) => [...prev, newToast]);

    const duration = msg.duration ?? 4000;
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case "success":
        return {
          icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
          emoji: "🎉",
          border: "border-emerald-500/20 dark:border-emerald-500/30",
          bg: "bg-emerald-50/90 dark:bg-emerald-950/20",
          shadow: "shadow-emerald-500/5",
        };
      case "error":
        return {
          icon: <AlertCircle className="w-5 h-5 text-rose-500" />,
          emoji: "⚠️",
          border: "border-rose-500/20 dark:border-rose-500/30",
          bg: "bg-rose-50/90 dark:bg-rose-950/20",
          shadow: "shadow-rose-500/5",
        };
      case "ready":
        return {
          icon: <Sparkles className="w-5 h-5 text-sky-500" />,
          emoji: "🚀",
          border: "border-sky-500/20 dark:border-sky-500/30",
          bg: "bg-sky-50/90 dark:bg-sky-950/20",
          shadow: "shadow-sky-500/5",
        };
      case "ai":
        return {
          icon: <Sparkles className="w-5 h-5 text-violet-500" />,
          emoji: "✨",
          border: "border-violet-500/20 dark:border-violet-500/30",
          bg: "bg-violet-50/90 dark:bg-violet-950/20",
          shadow: "shadow-violet-500/5",
        };
      case "compression":
        return {
          icon: <Flame className="w-5 h-5 text-amber-500" />,
          emoji: "🔥",
          border: "border-amber-500/20 dark:border-amber-500/30",
          bg: "bg-amber-50/90 dark:bg-amber-950/20",
          shadow: "shadow-amber-500/5",
        };
      case "link":
        return {
          icon: <Zap className="w-5 h-5 text-cyan-500" />,
          emoji: "⚡",
          border: "border-cyan-500/20 dark:border-cyan-500/30",
          bg: "bg-cyan-50/90 dark:bg-cyan-950/20",
          shadow: "shadow-cyan-500/5",
        };
      case "premium":
        return {
          icon: <Gem className="w-5 h-5 text-[#BE1E2E]" />,
          emoji: "💎",
          border: "border-red-500/20 dark:border-red-500/30",
          bg: "bg-red-50/90 dark:bg-red-950/20",
          shadow: "shadow-red-500/5",
        };
      default:
        return {
          icon: <Info className="w-5 h-5 text-slate-500" />,
          emoji: "ℹ️",
          border: "border-slate-500/20 dark:border-slate-500/30",
          bg: "bg-slate-50/90 dark:bg-slate-900/40",
          shadow: "shadow-slate-500/5",
        };
    }
  };

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      {/* Toast container portal fixed overlay */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-md w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            const styles = getToastStyles(t.type);
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className={`pointer-events-auto w-full glass-panel flex gap-3.5 items-start p-4 rounded-2xl border ${styles.border} ${styles.bg} backdrop-blur-xl ${styles.shadow} relative overflow-hidden`}
              >
                {/* Visual side highlights */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#BE1E2E] to-rose-500" />
                
                <span className="text-xl select-none leading-none pt-0.5">{styles.emoji}</span>
                
                <div className="flex-1 min-w-0 space-y-0.5">
                  <h5 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    {t.title}
                  </h5>
                  {t.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      {t.description}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => removeToast(t.id)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
