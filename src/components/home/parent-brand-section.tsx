"use client";

import { useRef } from "react";
import { motion, useInView, type Variants } from "framer-motion";
import { ArrowUpRight, Compass, Mountain } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PARENT_BRAND } from "@/lib/config/site";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export function ParentBrandSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-14 sm:py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[hsl(var(--muted))]/40" />
      <div className="absolute inset-0 pattern-dots opacity-[0.07]" />
      <div className="absolute -left-16 top-10 w-56 h-56 rounded-full bg-[hsl(var(--primary))]/10 blur-3xl" />
      <div className="absolute -right-10 bottom-0 w-64 h-64 rounded-full bg-[hsl(var(--accent))]/15 blur-3xl" />

      <div ref={ref} className="relative container mx-auto px-4 max-w-7xl">
        <motion.div
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
          className="rounded-3xl border bg-[hsl(var(--card))]/80 backdrop-blur-sm shadow-sm overflow-hidden"
        >
          <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-0">
            <div className="p-8 sm:p-12">
              <motion.div variants={fadeUp}>
                <Badge variant="secondary" className="mb-4 px-3 py-1 text-xs font-semibold tracking-wider uppercase">
                  <Mountain className="w-3 h-3 mr-1" />
                  Our Parent Brand
                </Badge>
              </motion.div>

              <motion.h2
                variants={fadeUp}
                className="text-3xl md:text-4xl font-bold text-gradient mb-4 leading-tight"
              >
                {PARENT_BRAND.title}
              </motion.h2>

              <motion.p
                variants={fadeUp}
                className="text-[hsl(var(--muted-foreground))] text-base md:text-lg leading-relaxed mb-8 max-w-xl"
              >
                {PARENT_BRAND.description}
              </motion.p>

              <motion.div variants={fadeUp}>
                <a
                  href={PARENT_BRAND.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex"
                >
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      size="lg"
                      variant="saffron"
                      className="gap-2 shadow-lg shadow-[hsl(var(--accent))]/25 relative overflow-hidden group"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        Visit Manimahesh Hikers
                        <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </span>
                      <motion.span
                        aria-hidden
                        className="absolute inset-0 bg-white/20"
                        initial={{ x: "-100%" }}
                        whileHover={{ x: "100%" }}
                        transition={{ duration: 0.6 }}
                      />
                    </Button>
                  </motion.div>
                </a>
              </motion.div>
            </div>

            <motion.div
              variants={fadeUp}
              className="relative min-h-[220px] md:min-h-full gradient-himalaya p-8 sm:p-10 flex flex-col justify-end overflow-hidden"
            >
              <div className="absolute inset-0 pattern-dots opacity-10" />
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-8 right-8 w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center"
              >
                <Compass className="w-7 h-7 text-[hsl(var(--accent))]" />
              </motion.div>
              <div className="relative z-10">
                <p className="text-white/70 text-xs uppercase tracking-[0.2em] mb-2">
                  Since the mountains
                </p>
                <p className="text-white text-xl sm:text-2xl font-bold leading-snug mb-3">
                  Hotel booking, travel & Himalayan hospitality — now nurturing local produce too.
                </p>
                <p className="text-white/65 text-sm">
                  An initiative connecting Himachal&apos;s farms and artisans to every home.
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
