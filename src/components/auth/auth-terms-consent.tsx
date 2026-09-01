"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TermsBody } from "@/components/legal/terms-body";
import { PrivacyBody } from "@/components/legal/privacy-body";
import { cn } from "@/lib/utils";

export function AuthTermsConsent({
  checked,
  onCheckedChange,
  id = "auth-terms-consent",
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">("terms");

  const openTerms = (tab: "terms" | "privacy") => {
    setActiveTab(tab);
    setDialogOpen(true);
  };

  return (
    <>
      <div className="flex items-start gap-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/20 p-3">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-[hsl(var(--border))] accent-[hsl(var(--primary))]"
          aria-describedby={`${id}-description`}
        />
        <div className="min-w-0 space-y-1">
          <label htmlFor={id} className="text-sm leading-snug cursor-pointer">
            I have read and agree to the{" "}
            <button
              type="button"
              onClick={() => openTerms("terms")}
              className="font-medium text-[hsl(var(--primary))] hover:underline"
            >
              Terms &amp; Conditions
            </button>{" "}
            and{" "}
            <button
              type="button"
              onClick={() => openTerms("privacy")}
              className="font-medium text-[hsl(var(--primary))] hover:underline"
            >
              Privacy Policy
            </button>
            .
          </label>
          <p id={`${id}-description`} className="text-xs text-[hsl(var(--muted-foreground))]">
            Required before sign in or creating an account.
          </p>
          <button
            type="button"
            onClick={() => openTerms("terms")}
            className="inline-flex items-center gap-1 text-xs font-medium text-[hsl(var(--primary))] hover:underline"
          >
            <FileText className="w-3.5 h-3.5" />
            Read full terms &amp; privacy
          </button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[min(90vh,720px)] max-w-2xl overflow-hidden flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
            <DialogTitle>Legal agreements</DialogTitle>
            <DialogDescription>
              Please review before continuing. You can also open the full page in a new tab.
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "terms" | "privacy")}
            className="flex flex-col flex-1 min-h-0"
          >
            <div className="px-6 shrink-0">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="terms">Terms &amp; Conditions</TabsTrigger>
                <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
              <TabsContent value="terms" className="mt-0">
                <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-base">
                  <TermsBody />
                </div>
                <Link
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1 text-sm text-[hsl(var(--primary))] hover:underline"
                >
                  Open full Terms page
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </TabsContent>
              <TabsContent value="privacy" className="mt-0">
                <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-base">
                  <PrivacyBody />
                </div>
                <Link
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1 text-sm text-[hsl(var(--primary))] hover:underline"
                >
                  Open full Privacy page
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </TabsContent>
            </div>
          </Tabs>

          <div className="shrink-0 border-t px-6 py-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Last updated: August 2026
            </p>
            <button
              type="button"
              onClick={() => {
                onCheckedChange(true);
                setDialogOpen(false);
              }}
              className={cn(
                "text-sm font-medium rounded-md px-4 py-2",
                "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
              )}
            >
              I agree
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
