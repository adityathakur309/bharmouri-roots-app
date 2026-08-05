"use client";

import { Grid3X3, List } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ListViewMode } from "@/hooks/use-list-view-mode";

export function ViewModeToggle({
  value,
  onChange,
  className,
}: {
  value: ListViewMode;
  onChange: (mode: ListViewMode) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center border rounded-xl overflow-hidden shrink-0",
        className
      )}
      role="group"
      aria-label="View mode"
    >
      <button
        type="button"
        onClick={() => onChange("card")}
        className={cn(
          "p-2 transition-colors min-h-9 min-w-9 inline-flex items-center justify-center",
          value === "card"
            ? "bg-[hsl(var(--primary))] text-white"
            : "hover:bg-[hsl(var(--muted))]"
        )}
        title="Card view"
        aria-pressed={value === "card"}
      >
        <Grid3X3 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        className={cn(
          "p-2 transition-colors min-h-9 min-w-9 inline-flex items-center justify-center",
          value === "list"
            ? "bg-[hsl(var(--primary))] text-white"
            : "hover:bg-[hsl(var(--muted))]"
        )}
        title="List view"
        aria-pressed={value === "list"}
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
}
