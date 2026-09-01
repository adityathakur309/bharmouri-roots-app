import { buildPageMetadata } from "@/lib/seo/metadata";
import type { ReactNode } from "react";

export function PolicyShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <div className="border-b bg-[hsl(var(--muted))]/30">
        <div className="container mx-auto px-4 max-w-3xl py-10">
          <p className="text-xs uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2">
            Legal
          </p>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
            Last updated: August 2026 · BharmouriRoots, Bharmour, Himachal Pradesh
          </p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-10 max-w-3xl prose prose-sm dark:prose-invert prose-headings:scroll-mt-24">
        {children}
      </div>
    </div>
  );
}

export { buildPageMetadata };
