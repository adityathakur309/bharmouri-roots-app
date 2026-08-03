"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type EmptyStateAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "default" | "outline" | "secondary" | "ghost";
};

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  className?: string;
  compact?: boolean;
}

function ActionButton({ action }: { action: EmptyStateAction }) {
  const variant = action.variant ?? "default";
  if (action.href) {
    return (
      <Button asChild variant={variant} className="min-h-11">
        <Link href={action.href}>{action.label}</Link>
      </Button>
    );
  }
  return (
    <Button type="button" variant={variant} className="min-h-11" onClick={action.onClick}>
      {action.label}
    </Button>
  );
}

/** Interactive empty / not-yet-available state (no dummy records). */
export function EmptyState({
  icon: Icon = Package,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-[hsl(var(--card))] text-center",
        compact ? "p-8" : "p-10 sm:p-12",
        className
      )}
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--muted))]">
        <Icon className="h-7 w-7 text-[hsl(var(--muted-foreground))]" />
      </div>
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      {description ? (
        <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-md mx-auto mb-5">{description}</p>
      ) : (
        <div className="mb-5" />
      )}
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {primaryAction && <ActionButton action={primaryAction} />}
          {secondaryAction && (
            <ActionButton action={{ ...secondaryAction, variant: secondaryAction.variant ?? "outline" }} />
          )}
        </div>
      )}
    </div>
  );
}
