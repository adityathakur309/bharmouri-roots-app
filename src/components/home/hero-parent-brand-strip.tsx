"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Mountain } from "lucide-react";
import { PARENT_BRAND } from "@/lib/config/site";

/**
 * Glass “Powered by” strip — matches the classic hero layout.
 */
export function HeroParentBrandStrip() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.5 }}
      className="mb-5 sm:mb-6 max-w-xl"
    >
      <div className="flex items-center gap-3 sm:gap-4 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md px-3.5 py-3 sm:px-4 shadow-lg shadow-black/15">
        <div className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
          <Mountain className="w-5 h-5 text-[hsl(var(--accent))]" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.16em] text-white/70 font-medium leading-none mb-1">
            Powered by{" "}
            <span className="text-white font-semibold tracking-normal normal-case text-sm sm:text-[15px]">
              {PARENT_BRAND.name}
            </span>
          </p>
          <p className="text-white/75 text-xs sm:text-[13px] leading-snug line-clamp-2">
            Authentic Himachali produce from our mountain travel family.
          </p>
        </div>

        <a
          href={PARENT_BRAND.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center justify-center gap-1 min-h-9 px-3.5 rounded-xl bg-white text-[hsl(var(--primary))] text-sm font-semibold hover:bg-white/90 active:scale-[0.98] transition-all"
          aria-label={`Visit ${PARENT_BRAND.name}`}
        >
          Visit
          <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>
    </motion.div>
  );
}
