"use client";

import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className={`
              flex items-start gap-3 rounded-xl p-4 shadow-xl border
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
