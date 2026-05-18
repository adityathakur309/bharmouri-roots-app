"use client";

import { CreditCard, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/utils";

interface MockPaymentDialogProps {
  open: boolean;
  amount: number;
  orderNumber: string;
  onClose: () => void;
  onOutcome: (outcome: "success" | "failed" | "pending") => void;
  isProcessing?: boolean;
}

export function MockPaymentDialog({
  open,
  amount,
  orderNumber,
  onClose,
  onOutcome,
  isProcessing,
}: MockPaymentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Demo Payment Gateway</DialogTitle>
          <DialogDescription>
            Razorpay test keys are not configured. Simulate payment for order{" "}
            <strong>{orderNumber}</strong> ({formatPrice(amount / 100)}).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <Button
            className="w-full gap-2"
            disabled={isProcessing}
            onClick={() => onOutcome("success")}
          >
            <CreditCard className="w-4 h-4" />
            Simulate Successful Payment
          </Button>
          <Button
            variant="outline"
            className="w-full gap-2"
            disabled={isProcessing}
            onClick={() => onOutcome("pending")}
          >
            <Clock className="w-4 h-4" />
            Simulate Pending Payment
          </Button>
          <Button
            variant="destructive"
            className="w-full gap-2"
            disabled={isProcessing}
            onClick={() => onOutcome("failed")}
          >
            <XCircle className="w-4 h-4" />
            Simulate Failed Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
