"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, Star, X } from "lucide-react";
import { reviewApi, type ReviewItem } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { normalizeProductImageUrl } from "@/lib/utils/image-url";

type Tab = "pending" | "approved" | "rejected" | "all";

export default function AdminReviewsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("pending");
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reviewApi.adminList({ status: tab, limit: 50 });
      setReviews(res.data ?? []);
    } catch {
      setReviews([]);
      toast({ title: "Could not load reviews", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [tab, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const moderate = async (id: string, status: "approved" | "rejected") => {
    setActingId(id);
    try {
      await reviewApi.moderate(id, {
        status,
        rejectionReason: status === "rejected" ? "Does not meet guidelines" : undefined,
      });
      toast({ title: status === "approved" ? "Review approved" : "Review rejected" });
      await load();
    } catch {
      toast({ title: "Moderation failed", variant: "destructive" });
    } finally {
      setActingId(null);
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "pending", label: "Pending" },
    { id: "approved", label: "Approved" },
    { id: "rejected", label: "Rejected" },
    { id: "all", label: "All" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Review Management</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          Approve purchase-verified reviews before they appear publicly.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
              tab === t.id
                ? "gradient-forest text-white shadow"
                : "bg-[hsl(var(--card))] border hover:bg-[hsl(var(--muted))]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--primary))]" />
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          title="No reviews here"
          description="Reviews awaiting moderation will show under Pending."
        />
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[hsl(var(--card))] border rounded-2xl p-4 md:p-5"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                {review.productImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={normalizeProductImageUrl(review.productImage)}
                    alt=""
                    className="w-16 h-16 rounded-xl object-cover border shrink-0"
                  />
                ) : null}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-sm truncate">
                      {review.productName ?? "Product"}
                    </p>
                    <Badge
                      variant={
                        review.status === "approved"
                          ? "green"
                          : review.status === "rejected"
                            ? "destructive"
                            : "secondary"
                      }
                      className="capitalize text-[10px]"
                    >
                      {review.status ?? "pending"}
                    </Badge>
                    {review.verified && (
                      <Badge variant="green" className="text-[10px]">
                        Verified purchase
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{review.name}</span>
                    {review.userEmail && (
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">
                        {review.userEmail}
                      </span>
                    )}
                    <span className="text-xs text-[hsl(var(--muted-foreground))] ml-auto">
                      {review.date}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-3.5 h-3.5",
                          i < review.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300"
                        )}
                      />
                    ))}
                  </div>
                  {review.title && <p className="text-sm font-medium">{review.title}</p>}
                  <p className="text-sm text-[hsl(var(--foreground))]/80">{review.comment}</p>
                  {review.rejectionReason && (
                    <p className="text-xs text-red-600">Reason: {review.rejectionReason}</p>
                  )}
                </div>
                {review.status !== "approved" || tab === "all" || tab === "pending" ? (
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    {review.status !== "approved" && (
                      <Button
                        size="sm"
                        className="gap-1"
                        disabled={actingId === review.id}
                        onClick={() => void moderate(review.id, "approved")}
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </Button>
                    )}
                    {review.status !== "rejected" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-destructive"
                        disabled={actingId === review.id}
                        onClick={() => void moderate(review.id, "rejected")}
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </Button>
                    )}
                  </div>
                ) : null}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
