"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, Store, Phone, Mail, MapPin, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { settingsApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import {
  DEFAULT_BUSINESS_SETTINGS,
  type PublicBusinessSettings,
} from "@/types/settings";

export function AdminSettingsForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PublicBusinessSettings>({
    ...DEFAULT_BUSINESS_SETTINGS,
  });

  useEffect(() => {
    settingsApi
      .getAdmin()
      .then((res) => {
        if (res.data?.settings) setForm(res.data.settings);
      })
      .catch(() => {
        toast({
          title: "Could not load settings",
          description: "Showing defaults. Run npm run seed if the database is empty.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  const update = <K extends keyof PublicBusinessSettings>(
    key: K,
    value: PublicBusinessSettings[K]
  ) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await settingsApi.updateAdmin(form);
      if (res.data) setForm(res.data);
      toast({ title: "Settings saved" });
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Could not save settings";
      toast({ title: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--muted-foreground))]" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
      <section className="bg-[hsl(var(--card))] rounded-2xl border p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Store className="w-4 h-4" /> Brand
        </h2>
        <div>
          <Label className="mb-1.5 block">Business name</Label>
          <Input
            value={form.businessName}
            onChange={(e) => update("businessName", e.target.value)}
            required
          />
        </div>
      </section>

      <section className="bg-[hsl(var(--card))] rounded-2xl border p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Mail className="w-4 h-4" /> Contact
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="mb-1.5 block">Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
          </div>
          <div>
            <Label className="mb-1.5 block">Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              required
            />
          </div>
          <div>
            <Label className="mb-1.5 block">Support email</Label>
            <Input
              type="email"
              value={form.supportEmail}
              onChange={(e) => update("supportEmail", e.target.value)}
              required
            />
          </div>
          <div>
            <Label className="mb-1.5 block">Support phone</Label>
            <Input
              value={form.supportPhone}
              onChange={(e) => update("supportPhone", e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Hours</Label>
            <Input value={form.hours} onChange={(e) => update("hours", e.target.value)} />
          </div>
        </div>
      </section>

      <section className="bg-[hsl(var(--card))] rounded-2xl border p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <MapPin className="w-4 h-4" /> Address
        </h2>
        <div>
          <Label className="mb-1.5 block">Address line</Label>
          <Input
            value={form.addressLine}
            onChange={(e) => update("addressLine", e.target.value)}
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="mb-1.5 block">City</Label>
            <Input value={form.city} onChange={(e) => update("city", e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block">State</Label>
            <Input value={form.state} onChange={(e) => update("state", e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block">PIN code</Label>
            <Input
              value={form.pincode}
              onChange={(e) => update("pincode", e.target.value)}
              maxLength={6}
            />
          </div>
          <div>
            <Label className="mb-1.5 block">Country</Label>
            <Input value={form.country} onChange={(e) => update("country", e.target.value)} />
          </div>
        </div>
      </section>

      <section className="bg-[hsl(var(--card))] rounded-2xl border p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Phone className="w-4 h-4" /> Social
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="mb-1.5 block">WhatsApp (with country code)</Label>
            <Input
              value={form.whatsapp}
              onChange={(e) => update("whatsapp", e.target.value)}
              placeholder="918894985606"
            />
          </div>
          <div>
            <Label className="mb-1.5 block">Instagram URL</Label>
            <Input
              value={form.instagram}
              onChange={(e) => update("instagram", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="bg-[hsl(var(--card))] rounded-2xl border p-5 space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Truck className="w-4 h-4" /> Commerce
        </h2>
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={form.codEnabled}
            onChange={(e) => update("codEnabled", e.target.checked)}
          />
          <span>
            <span className="font-medium block">Cash on Delivery enabled</span>
            <span className="text-[hsl(var(--muted-foreground))]">
              When off, COD is hidden at checkout and product forms treat COD as unavailable. Online
              payment remains the default.
            </span>
          </span>
        </label>
        <div>
          <Label className="mb-1.5 block">Free shipping above (₹)</Label>
          <Input
            type="number"
            min={0}
            value={form.freeShippingAbove}
            onChange={(e) => update("freeShippingAbove", Number(e.target.value) || 0)}
          />
        </div>
      </section>

      <div className="bg-[hsl(var(--muted))]/40 rounded-2xl border p-4 text-xs text-[hsl(var(--muted-foreground))] space-y-1">
        <p>
          <strong>Payments:</strong> Razorpay keys via env (`RAZORPAY_*`, `PAYMENT_MOCK_MODE`). Live
          approval requires Razorpay business verification outside this app.
        </p>
        <p>
          <strong>Shipping:</strong> Shiprocket via env (`SHIPROCKET_*`, `SHIPPING_MOCK_MODE` /
          `SHIPROCKET_MOCK`). Set mock to false and add real credentials for live booking.
        </p>
      </div>

      <Button type="submit" disabled={saving} className="gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save settings
      </Button>
    </form>
  );
}
