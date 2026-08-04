"use client";

import { motion } from "framer-motion";
import { Check, Circle } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

export interface TimelineEvent {
  status: string;
  label: string;
  timestamp?: string;
  description?: string;
}

export function ShipmentTimeline({
  events,
  className,
}: {
  events: TimelineEvent[];
  className?: string;
}) {
  if (!events.length) {
    return (
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        Tracking updates will appear once the shipment is created.
      </p>
    );
  }

  return (
    <ol className={cn("relative space-y-0", className)}>
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const done = !isLast || Boolean(event.timestamp);
        return (
          <motion.li
            key={`${event.status}-${index}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.06 }}
            className="relative flex gap-3 pb-6 last:pb-0"
          >
            {!isLast && (
              <span
                className="absolute left-[11px] top-7 bottom-0 w-px bg-[hsl(var(--border))]"
                aria-hidden
              />
            )}
            <span
              className={cn(
                "relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                done
                  ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-white"
                  : "border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))]"
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3 w-3" />}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold text-sm">{event.label}</p>
                {event.timestamp && (
                  <time className="text-[11px] text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                    {formatDate(event.timestamp)}
                  </time>
                )}
              </div>
              {event.description && (
                <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                  {event.description}
                </p>
              )}
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
