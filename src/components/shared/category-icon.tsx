import { cn } from "@/lib/utils";

export const DEFAULT_CATEGORY_ICON = "🏔️";

/** True when category.icon stores an uploaded image URL instead of an emoji. */
export function isCategoryIconUrl(icon?: string | null): boolean {
  if (!icon) return false;
  const v = icon.trim();
  return (
    v.startsWith("/") ||
    v.startsWith("http://") ||
    v.startsWith("https://") ||
    v.startsWith("data:")
  );
}

export function resolveCategoryIcon(icon?: string | null): {
  type: "image" | "emoji";
  value: string;
} {
  if (isCategoryIconUrl(icon)) {
    return { type: "image", value: icon!.trim() };
  }
  const emoji = icon?.trim();
  if (emoji) return { type: "emoji", value: emoji };
  return { type: "emoji", value: DEFAULT_CATEGORY_ICON };
}

export function CategoryIcon({
  icon,
  alt,
  className,
  size = "md",
}: {
  icon?: string | null;
  alt?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const resolved = resolveCategoryIcon(icon);
  const box =
    size === "sm" ? "w-7 h-7 text-base" : size === "lg" ? "w-11 h-11 text-2xl" : "w-9 h-9 text-lg";

  if (resolved.type === "image") {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[hsl(var(--muted))]/60",
          box,
          className
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolved.value}
          alt={alt ?? ""}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(e) => {
            const el = e.currentTarget;
            el.style.display = "none";
            const parent = el.parentElement;
            if (parent && !parent.dataset.fallback) {
              parent.dataset.fallback = "1";
              parent.textContent = DEFAULT_CATEGORY_ICON;
            }
          }}
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-[hsl(var(--muted))]/40",
        box,
        className
      )}
      aria-hidden={alt ? undefined : true}
      role={alt ? "img" : undefined}
      aria-label={alt}
    >
      {resolved.value}
    </span>
  );
}
