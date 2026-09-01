"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Power, Trash2, Users } from "lucide-react";
import { couponApi, type Coupon } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const emptyForm = {
  code: "",
  description: "",
  discountPercent: "10",
  expiresAt: "",
  maxUsesPerUser: "1",
  maxTotalUses: "5",
  isActive: true,
};

export default function AdminCouponsPage() {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [usageOpen, setUsageOpen] = useState(false);
  const [usageRows, setUsageRows] = useState<
    Array<{
      id: string;
      userName?: string;
      userEmail?: string;
      orderNumber?: string;
      discountAmount: number;
      createdAt?: string;
    }>
  >([]);
  const [usageCoupon, setUsageCoupon] = useState<Coupon | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await couponApi.list({ limit: 50 });
      setCoupons(res.data ?? []);
    } catch {
      setCoupons([]);
      toast({ title: "Could not load coupons", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      description: c.description ?? "",
      discountPercent: String(c.discountPercent),
      expiresAt: c.expiresAt ? String(c.expiresAt).slice(0, 16) : "",
      maxUsesPerUser: String(c.maxUsesPerUser),
      maxTotalUses: String(c.maxTotalUses),
      isActive: c.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description || undefined,
        discountPercent: Number(form.discountPercent),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        maxUsesPerUser: Number(form.maxUsesPerUser) || 1,
        maxTotalUses: Number(form.maxTotalUses) || 5,
        isActive: form.isActive,
      };
      if (editing) {
        await couponApi.update(editing.id, payload);
        toast({ title: "Coupon updated" });
      } else {
        await couponApi.create(payload);
        toast({ title: "Coupon created" });
      }
      setDialogOpen(false);
      await load();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Save failed";
      toast({ title: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: Coupon) => {
    try {
      await couponApi.update(c.id, { isActive: !c.isActive });
      toast({ title: c.isActive ? "Coupon disabled" : "Coupon enabled" });
      await load();
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const deactivate = async (c: Coupon) => {
    if (!confirm(`Deactivate coupon ${c.code}?`)) return;
    try {
      await couponApi.remove(c.id);
      toast({ title: "Coupon deactivated" });
      await load();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const showUsage = async (c: Coupon) => {
    setUsageCoupon(c);
    setUsageOpen(true);
    try {
      const res = await couponApi.usage(c.id, { limit: 50 });
      setUsageRows(res.data ?? []);
    } catch {
      setUsageRows([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Coupon Management</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Defaults: 1 use per user, 5 total uses — configurable per coupon.
          </p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Create coupon
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : coupons.length === 0 ? (
        <EmptyState title="No coupons yet" description="Create your first discount code." />
      ) : (
        <div className="grid gap-3">
          {coupons.map((c) => (
            <div
              key={c.id}
              className={cn(
                "bg-[hsl(var(--card))] border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3",
                !c.isActive && "opacity-60"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-lg">{c.code}</span>
                  <Badge variant="saffron">{c.discountPercent}% off</Badge>
                  <Badge variant={c.isActive ? "green" : "secondary"}>
                    {c.isActive ? "Active" : "Disabled"}
                  </Badge>
                </div>
                {c.description && (
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{c.description}</p>
                )}
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  Used {c.usedCount}/{c.maxTotalUses} · Max {c.maxUsesPerUser}/user
                  {c.expiresAt
                    ? ` · Expires ${new Date(c.expiresAt).toLocaleDateString()}`
                    : " · No expiry"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="gap-1" onClick={() => void showUsage(c)}>
                  <Users className="w-3.5 h-3.5" /> Usage
                </Button>
                <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => void toggleActive(c)}
                >
                  <Power className="w-3.5 h-3.5" />
                  {c.isActive ? "Disable" : "Enable"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => void deactivate(c)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit coupon" : "Create coupon"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <Label className="mb-1.5 block">Code *</Label>
              <Input
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
                }
                required
                disabled={Boolean(editing)}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="mb-1.5 block">% off *</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={form.discountPercent}
                  onChange={(e) => setForm((f) => ({ ...f, discountPercent: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Per user</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.maxUsesPerUser}
                  onChange={(e) => setForm((f) => ({ ...f, maxUsesPerUser: e.target.value }))}
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Total uses</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.maxTotalUses}
                  onChange={(e) => setForm((f) => ({ ...f, maxTotalUses: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Expires at</Label>
              <Input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              Active
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={usageOpen} onOpenChange={setUsageOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Usage — {usageCoupon?.code}</DialogTitle>
          </DialogHeader>
          {usageRows.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))] py-6 text-center">
              No redemptions yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {usageRows.map((u) => (
                <li key={u.id} className="text-sm border rounded-xl p-3">
                  <p className="font-medium">{u.userName ?? "Customer"}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {u.userEmail}
                    {u.orderNumber ? ` · ${u.orderNumber}` : ""}
                    {u.createdAt ? ` · ${new Date(u.createdAt).toLocaleString()}` : ""}
                  </p>
                  <p className="text-xs mt-1">Discount ₹{u.discountAmount.toFixed(0)}</p>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
