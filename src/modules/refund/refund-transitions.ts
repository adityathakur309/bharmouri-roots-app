import type { RefundRequestStatus } from "@/lib/db/models/refund-request.model";
import { ValidationError } from "@/lib/utils/errors";

/** Allowed status transitions for refund workflow. */
export const REFUND_TRANSITIONS: Record<
  RefundRequestStatus,
  RefundRequestStatus[]
> = {
  requested: ["under_review", "rejected"],
  under_review: ["approved", "rejected", "quality_check"],
  approved: ["quality_check", "pickup_scheduled", "rejected"],
  rejected: [],
  quality_check: ["pickup_scheduled", "rejected", "refund_processing"],
  pickup_scheduled: ["pickup_completed", "failed"],
  pickup_completed: ["refund_processing"],
  refund_processing: ["refunded", "failed"],
  refunded: [],
  failed: ["refund_processing"],
};

export function assertRefundTransition(
  from: RefundRequestStatus,
  to: RefundRequestStatus
) {
  const allowed = REFUND_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new ValidationError(
      `Invalid refund transition: ${from} → ${to}`
    );
  }
}

export const REFUND_STATUS_LABELS: Record<RefundRequestStatus, string> = {
  requested: "Requested",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  quality_check: "Quality Check",
  pickup_scheduled: "Pickup Scheduled",
  pickup_completed: "Pickup Completed",
  refund_processing: "Refund Processing",
  refunded: "Refunded",
  failed: "Failed",
};
