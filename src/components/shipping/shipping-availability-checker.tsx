"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, MapPin, Truck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shippingApi } from "@/services/api";
import { formatPrice } from "@/lib/utils";

export interface ShippingEstimateView {
  serviceable: boolean;
  deliveryAvailable: boolean;
  codAvailable: boolean;
  shippingCharge: number | null;
  estimatedDeliveryDays: string | null;
  couriers: Array<{
    courierId: string | number;
    courierName: string;
    rate: number;
    estimatedDays: string;
    codAvailable: boolean;
  }>;
}

function errMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message: string }).message) || fallback;
  }
  return fallback;
}

export function ShippingAvailabilityChecker({
  weight = 0.5,
  cod = false,
}: {
  weight?: number;
  cod?: boolean;
}) {
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ShippingEstimateView | null>(null);

  const check = async () => {
    if (pincode.length !== 6) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await shippingApi.estimate({
        deliveryPincode: pincode,
        weight,
        cod,
      });
      setResult(res.data as ShippingEstimateView);
    } catch (err) {
      setError(errMessage(err, "Could not check delivery for this pincode"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-xl space-y-3">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        <Truck className="w-4 h-4 text-[hsl(var(--primary))]" /> Check Delivery
      </h3>
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={pincode}
          onChange={(e) => {
            setPincode(e.target.value.replace(/\D/g, ""));
            setResult(null);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") void check();
          }}
          placeholder="Enter 6-digit pincode"
          className="flex-1 px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] bg-[hsl(var(--background))]"
          aria-label="Delivery pincode"
        />
        <Button
          size="sm"
          onClick={() => void check()}
          disabled={pincode.length !== 6 || loading}
          className="gap-1.5 min-w-[72px]"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check"}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key="err"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2"
          >
            <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {result && !result.serviceable && (
          <motion.div
            key="unavail"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2"
          >
            <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
            <span>Not deliverable to {pincode}. Try another pincode.</span>
          </motion.div>
        )}

        {result?.serviceable && (
          <motion.div
            key="ok"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-2.5"
          >
            <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
              <Check className="w-4 h-4 shrink-0" />
              Delivery available to {pincode}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-lg bg-[hsl(var(--muted))]/50 px-3 py-2">
                <p className="text-[hsl(var(--muted-foreground))]">Shipping from</p>
                <p className="font-semibold mt-0.5">
                  {result.shippingCharge != null
                    ? formatPrice(result.shippingCharge)
                    : "—"}
                </p>
              </div>
              <div className="rounded-lg bg-[hsl(var(--muted))]/50 px-3 py-2">
                <p className="text-[hsl(var(--muted-foreground))]">Est. delivery</p>
                <p className="font-semibold mt-0.5">
                  {result.estimatedDeliveryDays
                    ? `${result.estimatedDeliveryDays} business days`
                    : "—"}
                </p>
              </div>
              <div className="rounded-lg bg-[hsl(var(--muted))]/50 px-3 py-2 col-span-2">
                <p className="text-[hsl(var(--muted-foreground))] mb-1.5">
                  Available courier partners
                </p>
                <ul className="space-y-1">
                  {result.couriers.slice(0, 4).map((c) => (
                    <li
                      key={String(c.courierId)}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="font-medium truncate">{c.courierName}</span>
                      <span className="text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                        {formatPrice(c.rate)} · {c.estimatedDays}d
                        {c.codAvailable ? " · COD" : ""}
                      </span>
                    </li>
                  ))}
                </ul>
                {result.codAvailable && (
                  <p className="mt-1.5 text-[hsl(var(--muted-foreground))]">
                    COD available for this pincode
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
