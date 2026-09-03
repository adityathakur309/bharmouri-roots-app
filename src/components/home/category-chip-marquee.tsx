"use client";

import Link from "next/link";
import { CategoryIcon } from "@/components/shared/category-icon";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/category";

function CategoryChip({
  category,
  className,
}: {
  category: Pick<Category, "name" | "slug" | "icon">;
  className?: string;
}) {
  return (
    <Link
      href={`/products?category=${category.slug}`}
      className={cn(
        "group inline-flex items-center gap-2 shrink-0 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3.5 py-2 shadow-sm",
        "hover:border-[hsl(var(--primary))]/40 hover:bg-[hsl(var(--primary))]/5 hover:shadow-md",
        "active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]",
        className
      )}
    >
      <CategoryIcon icon={category.icon} alt={category.name} size="sm" />
      <span className="text-sm font-semibold whitespace-nowrap text-[hsl(var(--foreground))]">
        {category.name}
      </span>
    </Link>
  );
}

/**
 * Single-row category chips with continuous right → left marquee.
 * Pauses on hover/focus; respects reduced-motion.
 */
export function CategoryChipMarquee({
  categories,
}: {
  categories: Array<Pick<Category, "id" | "name" | "slug" | "icon">>;
}) {
  if (categories.length === 0) return null;

  // Duplicate enough times for a seamless loop on wide screens
  const loop = [...categories, ...categories, ...categories];

  return (
    <div className="relative w-full overflow-hidden">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 sm:w-16 bg-linear-to-r from-[hsl(var(--background))] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 sm:w-16 bg-linear-to-l from-[hsl(var(--background))] to-transparent" />

      <div className="category-marquee-track flex w-max gap-3 py-1 hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]">
        {loop.map((cat, i) => (
          <CategoryChip
            key={`${cat.id || cat.slug}-${i}`}
            category={cat}
          />
        ))}
      </div>
    </div>
  );
}
