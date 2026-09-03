"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { categoryTheme, productTheme } from "@/lib/catalog-image-themes";
import { normalizeProductImageUrl } from "@/lib/utils/image-url";

interface CatalogImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  /** Category slug or product seed for themed fallback */
  themeKey?: string;
  variant?: "product" | "category";
  /** Fill parent box (parent should have size). Safe even if parent is not `relative`. */
  fill?: boolean;
}

function FallbackPanel({
  themeKey,
  variant,
  alt,
  className,
}: {
  themeKey?: string;
  variant: "product" | "category";
  alt: string;
  className?: string;
}) {
  const theme =
    variant === "category"
      ? categoryTheme(themeKey ?? "default")
      : productTheme(themeKey ?? "default");

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center text-center text-white",
        className
      )}
      style={{
        background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
      }}
      aria-label={alt}
    >
      <span className="text-4xl sm:text-5xl mb-2 drop-shadow-md">{theme.emoji}</span>
      <span className="px-3 text-xs sm:text-sm font-semibold leading-snug opacity-95 line-clamp-2">
        {theme.label}
      </span>
    </div>
  );
}

export function CatalogImage({
  src,
  alt,
  className,
  themeKey,
  variant = "product",
  fill = true,
}: CatalogImageProps) {
  const [failed, setFailed] = useState(false);
  const normalized = src ? normalizeProductImageUrl(src) : "";
  const showFallback = !normalized || failed;

  if (showFallback) {
    if (!fill) {
      return (
        <FallbackPanel
          themeKey={themeKey}
          variant={variant}
          alt={alt}
          className={className}
        />
      );
    }
    return (
      <div className="relative h-full w-full overflow-hidden">
        <FallbackPanel
          themeKey={themeKey}
          variant={variant}
          alt={alt}
          className={className}
        />
      </div>
    );
  }

  if (!fill) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={normalized}
        alt={alt}
        className={cn("object-cover", className)}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={normalized}
        alt={alt}
        className={cn("absolute inset-0 h-full w-full object-cover", className)}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
