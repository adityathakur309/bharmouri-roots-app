"use client";

import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div
      className="
        fixed z-[100] flex flex-col gap-2 pointer-events-none
        left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
        w-[min(100%-2rem,24rem)] max-w-sm
        sm:left-auto sm:right-4 sm:top-auto sm:bottom-4
        sm:translate-x-0 sm:translate-y-0 sm:w-full
      "
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className={`
              pointer-events-auto flex items-start gap-3 rounded-xl p-4 shadow-xl border
              ${toast.variant === "destructive"
                ? "bg-red-600 text-white border-red-700"
                : "bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] border-[hsl(var(--border))]"
              }
            `}
          >
            <div className="flex-1 min-w-0">
              {toast.title && <p className="font-semibold text-sm">{toast.title}</p>}
              {toast.description && <p className="text-sm opacity-90 mt-0.5">{toast.description}</p>}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
