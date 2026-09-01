"use client";

import { useCallback, useEffect, useEffectEvent, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Pencil, Star, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  reviewApi,
  type ReviewItem,
  type ReviewSummary,
} from "@/services/api";

function emptySummary(average = 0, total = 0): ReviewSummary {
  return {
    average,
    total,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  };
}

function StarPicker({
  value,
  onChange,
  size = "md",
}: {
  value: number;
  onChange: (v: number) => void;
  size?: "sm" | "md";
}) {
  const cls = size === "sm" ? "w-4 h-4" : "w-6 h-6";
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((r) => (
        <button
          key={r}
          type="button"
          role="radio"
          aria-checked={value === r}
          aria-label={`${r} star${r > 1 ? "s" : ""}`}
          onClick={() => onChange(r)}
          className="p-0.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--primary))]"
        >
          <Star
            className={cn(
              cls,
              r <= value ? "fill-amber-400 text-amber-400" : "text-gray-300"
            )}
          />
        </button>
      ))}
    </div>
  );
}

interface ProductReviewsProps {
  productIdOrSlug: string;
  initialAverage?: number;
  initialTotal?: number;
  onSummaryChange?: (summary: ReviewSummary) => void;
}

export function ProductReviews({
  productIdOrSlug,
  initialAverage = 0,
  initialTotal = 0,
  onSummaryChange,
}: ProductReviewsProps) {
  const { isAuthenticated, user, isAdmin } = useAuth();
  const { toast } = useToast();

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [summary, setSummary] = useState<ReviewSummary>(
    emptySummary(initialAverage, initialTotal)
  );
  const [loading, setLoading] = useState(true);
  const [myReview, setMyReview] = useState<ReviewItem | null>(null);
  const [canSubmit, setCanSubmit] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Parent often passes an inline onSummaryChange — keep it out of effect deps
  // to avoid fetch → setState → new callback → refetch loops.
  const notifySummaryChange = useEffectEvent((summary: ReviewSummary) => {
    onSummaryChange?.(summary);
  });

  const loadReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reviewApi.list(productIdOrSlug, { limit: 20, sort: "newest" });
      setReviews(res.data ?? []);
      const metaSummary = (res.meta as { summary?: ReviewSummary } | undefined)?.summary;
      if (metaSummary) {
        setSummary(metaSummary);
        notifySummaryChange(metaSummary);
      }
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [productIdOrSlug]);

  const loadEligibility = useCallback(async () => {
    if (!isAuthenticated) {
      setMyReview(null);
      setCanSubmit(false);
      setPurchased(false);
      return;
    }
    try {
      const res = await reviewApi.eligibility(productIdOrSlug);
      setCanSubmit(Boolean(res.data?.canSubmit));
      setPurchased(Boolean(res.data?.purchased));
      setMyReview(res.data?.myReview ?? null);
      if (res.data?.myReview) {
        setRating(res.data.myReview.rating);
        setComment(res.data.myReview.comment);
        setEditingId(res.data.myReview.id);
      } else {
        setEditingId(null);
        setRating(5);
        setComment("");
      }
    } catch {
      setCanSubmit(false);
      setMyReview(null);
    }
  }, [isAuthenticated, productIdOrSlug]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    void loadEligibility();
  }, [loadEligibility]);

  const distributionPercents = useMemo(() => {
    const total = summary.total || 1;
    return [5, 4, 3, 2, 1].map((r) => ({
      rating: r,
      percent: Math.round(((summary.distribution?.[r] ?? 0) / total) * 100),
    }));
  }, [summary]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return;
    if (comment.trim().length < 10) {
      toast({
        title: "Review too short",
        description: "Please write at least 10 characters.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      if (editingId && myReview) {
        await reviewApi.update(editingId, { rating, comment: comment.trim() });
        toast({
          title: "Review updated",
          description: "Your changes will appear after admin approval.",
        });
      } else {
        await reviewApi.create(productIdOrSlug, {
          rating,
          comment: comment.trim(),
        });
        toast({
          title: "Review submitted",
          description: "Thanks! It will appear publicly after admin approval.",
        });
      }
      setShowForm(false);
      await Promise.all([loadReviews(), loadEligibility()]);
    } catch (error) {
      const message =
        error && typeof error === "object" && "message" in error
          ? String((error as { message: string }).message)
          : "Please try again.";
      toast({
        title: "Could not save review",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await reviewApi.remove(id);
      toast({ title: "Review deleted" });
      setShowForm(false);
      await Promise.all([loadReviews(), loadEligibility()]);
      setComment("");
      setRating(5);
      setEditingId(null);
    } catch {
      toast({ title: "Could not delete review", variant: "destructive" });
    }
  };

  const hasPublicReviews = summary.total > 0 || reviews.length > 0;
  const showAddAction = isAuthenticated
    ? canSubmit || (myReview && (myReview.status === "pending" || myReview.status === "rejected"))
    : true;

  return (
    <div className="space-y-4">
      {/* Only show summary/list chrome when there are approved public reviews */}
      {hasPublicReviews && (
        <div className="flex items-center gap-6 p-5 bg-[hsl(var(--muted))]/30 rounded-2xl mb-2">
          <div className="text-center">
            <div className="text-5xl font-bold text-[hsl(var(--primary))]">
              {summary.average.toFixed(1)}
            </div>
            <div className="flex items-center gap-0.5 justify-center my-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "w-4 h-4",
                    i < Math.floor(summary.average)
                      ? "fill-amber-400 text-amber-400"
                      : "text-gray-300"
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {summary.total} reviews
            </p>
          </div>
          <div className="flex-1 space-y-1">
            {distributionPercents.map(({ rating: r, percent }) => (
              <div key={r} className="flex items-center gap-2">
                <span className="text-xs w-4">{r}</span>
                <div className="flex-1 h-1.5 rounded-full bg-[hsl(var(--muted))]">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Eligible Add Review / status of own review */}
      {showAddAction && (
        <div className="p-5 border rounded-2xl">
          {!isAuthenticated ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              <Link
                href={`/login?callbackUrl=/products/${productIdOrSlug}`}
                className="font-semibold text-[hsl(var(--primary))] hover:underline"
              >
                Sign in
              </Link>{" "}
              after purchasing to leave a review.
            </p>
          ) : myReview ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="font-semibold text-sm">Your review</h3>
                <Badge
                  variant={
                    myReview.status === "approved"
                      ? "green"
                      : myReview.status === "rejected"
                        ? "destructive"
                        : "secondary"
                  }
                  className="capitalize text-[10px]"
                >
                  {myReview.status ?? "pending"}
                </Badge>
              </div>
              {myReview.status === "pending" && (
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Waiting for admin approval — not visible publicly yet.
                </p>
              )}
              {myReview.status === "rejected" && (
                <p className="text-xs text-red-600">
                  Rejected{myReview.rejectionReason ? `: ${myReview.rejectionReason}` : ""}. You
                  can edit and resubmit.
                </p>
              )}
              {!showForm ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => {
                      setShowForm(true);
                      setEditingId(myReview.id);
                      setRating(myReview.rating);
                      setComment(myReview.comment);
                    }}
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1 text-destructive"
                    onClick={() => void handleDelete(myReview.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </Button>
                </div>
              ) : null}
            </div>
          ) : canSubmit ? (
            !showForm ? (
              <Button type="button" size="sm" onClick={() => setShowForm(true)}>
                Add Review
              </Button>
            ) : null
          ) : (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {purchased
                ? "You already reviewed this product."
                : "Only customers who purchased this product can leave a review."}
            </p>
          )}

          {showForm && isAuthenticated && (canSubmit || myReview) && (
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <Label className="mb-2 block text-xs">Rating</Label>
                <StarPicker value={rating} onChange={setRating} />
              </div>
              <div>
                <Label htmlFor="review-comment" className="mb-2 block text-xs">
                  Comment
                </Label>
                <textarea
                  id="review-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Share your experience with this product..."
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] bg-[hsl(var(--background))] resize-y min-h-[80px]"
                  required
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? "Saving..." : myReview ? "Resubmit Review" : "Submit Review"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      ) : hasPublicReviews ? (
        reviews.map((review) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-5 border rounded-2xl"
          >
            <div className="flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={review.avatar}
                alt={review.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-sm">{review.name}</span>
                  {review.verified && (
                    <Badge variant="green" className="text-[10px] py-0">
                      Verified
                    </Badge>
                  )}
                  <span className="text-xs text-[hsl(var(--muted-foreground))] ml-auto">
                    {review.date}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "w-3 h-3",
                        i < review.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-300"
                      )}
                    />
                  ))}
                </div>
                {review.title && (
                  <p className="text-sm font-medium mb-1">{review.title}</p>
                )}
                <p className="text-sm text-[hsl(var(--foreground))]/80">{review.comment}</p>
                {(user?.id === review.userId || isAdmin) && (
                  <div className="flex gap-2 mt-3">
                    {user?.id === review.userId && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs gap-1"
                        onClick={() => {
                          setShowForm(true);
                          setEditingId(review.id);
                          setRating(review.rating);
                          setComment(review.comment);
                          setMyReview(review);
                        }}
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs gap-1 text-destructive"
                      onClick={() => void handleDelete(review.id)}
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))
      ) : null}
    </div>
  );
}
