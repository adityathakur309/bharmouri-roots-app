"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { categories } from "@/lib/mock-data";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/product-images";
import { productApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/types/product";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const emptyForm = {
  name: "",
  slug: "",
  category: categories[0]?.name ?? "Organic Dals",
  categorySlug: categories[0]?.slug ?? "organic-dals",
  price: "",
  originalPrice: "",
  stock: "",
  images: "",
  description: "",
  shortDescription: "",
  origin: "Bharmour, Himachal Pradesh",
  weight: "",
  isFeatured: false,
  isNew: false,
  isBestseller: false,
};

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSaved: () => void;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  onSaved,
}: ProductFormDialogProps) {
  const { toast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isEdit = Boolean(product?.id);

  useEffect(() => {
    if (!open) return;
    if (product) {
      setForm({
        name: product.name,
        slug: product.slug,
        category: product.category,
        categorySlug: product.categorySlug,
        price: String(product.price),
        originalPrice: product.originalPrice ? String(product.originalPrice) : "",
        stock: String(product.stock),
        images: product.images.join("\n"),
        description: product.description,
        shortDescription: product.shortDescription,
        origin: product.origin,
        weight: product.weight ?? "",
        isFeatured: product.isFeatured ?? false,
        isNew: product.isNew ?? false,
        isBestseller: product.isBestseller ?? false,
      });
    } else {
      setForm(emptyForm);
    }
  }, [open, product]);

  const handleCategoryChange = (categorySlug: string) => {
    const cat = categories.find((c) => c.slug === categorySlug);
    setForm((f) => ({
      ...f,
      categorySlug,
      category: cat?.name ?? f.category,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await productApi.uploadImage(file);
      const url = res.data?.data?.url;
      if (!url) throw new Error("No URL returned from server");
      setForm((f) => ({
        ...f,
        images: f.images ? `${f.images}\n${url}` : url,
      }));
      toast({ title: "Image uploaded" });
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Upload failed — check MongoDB connection (npm run test:mongo)";
      toast({ title: message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const imageList = form.images
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        name: form.name,
        slug: form.slug || slugify(form.name),
        category: form.category,
        categorySlug: form.categorySlug,
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        stock: Number(form.stock),
        images: imageList.length ? imageList : [DEFAULT_PRODUCT_IMAGE],
        description: form.description,
        shortDescription: form.shortDescription,
        features: [] as string[],
        origin: form.origin,
        weight: form.weight || undefined,
        isFeatured: form.isFeatured,
        isNew: form.isNew,
        isBestseller: form.isBestseller,
      };

      if (isEdit && product) {
        await productApi.update(product.id, payload);
        toast({ title: "Product updated" });
      } else {
        await productApi.create(payload);
        toast({ title: "Product created" });
      }
      onSaved();
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Could not save product";
      toast({ title: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Product" : "Add Product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="mb-1.5 block">Name *</Label>
            <Input
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  name: e.target.value,
                  slug: f.slug || slugify(e.target.value),
                }))
              }
              required
            />
          </div>
          <div>
            <Label className="mb-1.5 block">Slug *</Label>
            <Input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Category *</Label>
              <select
                value={form.categorySlug}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full h-10 rounded-lg border px-3 text-sm bg-[hsl(var(--background))]"
              >
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="mb-1.5 block">Stock *</Label>
              <Input
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">Price (₹) *</Label>
              <Input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Original Price</Label>
              <Input
                type="number"
                min={0}
                value={form.originalPrice}
                onChange={(e) => setForm((f) => ({ ...f, originalPrice: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Short description *</Label>
            <Input
              value={form.shortDescription}
              onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label className="mb-1.5 block">Description *</Label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full min-h-[80px] rounded-lg border px-3 py-2 text-sm bg-[hsl(var(--background))]"
              required
            />
          </div>
          <div>
            <Label className="mb-1.5 block">Image URLs (one per line)</Label>
            <textarea
              value={form.images}
              onChange={(e) => setForm((f) => ({ ...f, images: e.target.value }))}
              className="w-full min-h-[60px] rounded-lg border px-3 py-2 text-sm bg-[hsl(var(--background))]"
            />
            <div className="mt-2 flex items-center gap-2">
              <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
              {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
              />
              Featured
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isNew}
                onChange={(e) => setForm((f) => ({ ...f, isNew: e.target.checked }))}
              />
              New
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isBestseller}
                onChange={(e) => setForm((f) => ({ ...f, isBestseller: e.target.checked }))}
              />
              Bestseller
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
