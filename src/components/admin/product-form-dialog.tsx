"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  Star,
  Upload,
  ImageIcon,
} from "lucide-react";
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
import { categories as mockFallbackCategories } from "@/lib/mock-data";
import { DEFAULT_PRODUCT_IMAGE } from "@/lib/product-images";
import { categoryApi, productApi, settingsApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import type { Product, ProductVariant } from "@/types/product";
import type { Category } from "@/types/category";
import { normalizeProductImageUrl } from "@/lib/utils/image-url";
import { cn } from "@/lib/utils";

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const fallbackCategories: Category[] = mockFallbackCategories.map((c) => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  description: c.description,
  icon: c.icon,
  image: c.image,
  sortOrder: 0,
  productCount: c.count,
}));

type VariantForm = {
  id?: string;
  name: string;
  sku: string;
  price: string;
  salePrice: string;
  stock: string;
  weight: string;
  isActive: boolean;
};

type FormState = {
  name: string;
  slug: string;
  sku: string;
  category: string;
  categorySlug: string;
  price: string;
  originalPrice: string;
  stock: string;
  images: string[];
  description: string;
  shortDescription: string;
  origin: string;
  weight: string;
  metaTitle: string;
  metaDescription: string;
  isFeatured: boolean;
  isNew: boolean;
  isBestseller: boolean;
  codEnabled: boolean;
  variants: VariantForm[];
};

const emptyVariant = (): VariantForm => ({
  name: "",
  sku: "",
  price: "",
  salePrice: "",
  stock: "0",
  weight: "",
  isActive: true,
});

const emptyForm = (): FormState => ({
  name: "",
  slug: "",
  sku: "",
  category: fallbackCategories[0]?.name ?? "Organic Dals",
  categorySlug: fallbackCategories[0]?.slug ?? "organic-dals",
  price: "",
  originalPrice: "",
  stock: "",
  images: [],
  description: "",
  shortDescription: "",
  origin: "Bharmour, Himachal Pradesh",
  weight: "",
  metaTitle: "",
  metaDescription: "",
  isFeatured: false,
  isNew: false,
  isBestseller: false,
  codEnabled: false,
  variants: [],
});

function variantToForm(v: ProductVariant): VariantForm {
  return {
    id: v.id,
    name: v.name,
    sku: v.sku,
    price: String(v.price),
    salePrice: v.salePrice != null ? String(v.salePrice) : "",
    stock: String(v.stock),
    weight: v.weight ?? "",
    isActive: v.isActive !== false,
  };
}

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
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>(fallbackCategories);
  const [codGloballyEnabled, setCodGloballyEnabled] = useState(false);

  const isEdit = Boolean(product?.id);

  useEffect(() => {
    if (!open) return;
    categoryApi
      .list()
      .then((res) => {
        if (res.data?.length) setCategories(res.data);
      })
      .catch(() => {
        /* keep fallback */
      });
    settingsApi
      .getPublic()
      .then((res) => setCodGloballyEnabled(Boolean(res.data?.codEnabled)))
      .catch(() => setCodGloballyEnabled(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (product) {
      setForm({
        name: product.name,
        slug: product.slug,
        sku: product.sku ?? "",
        category: product.category,
        categorySlug: product.categorySlug,
        price: String(product.price),
        originalPrice: product.originalPrice ? String(product.originalPrice) : "",
        stock: String(product.stock),
        images: product.images ?? [],
        description: product.description,
        shortDescription: product.shortDescription,
        origin: product.origin,
        weight: product.weight ?? "",
        metaTitle: product.metaTitle ?? "",
        metaDescription: product.metaDescription ?? "",
        isFeatured: product.isFeatured ?? false,
        isNew: product.isNew ?? false,
        isBestseller: product.isBestseller ?? false,
        codEnabled: product.codEnabled ?? false,
        variants: (product.variants ?? []).map(variantToForm),
      });
      return;
    }
    setForm({
      ...emptyForm(),
      category: categories[0]?.name ?? emptyForm().category,
      categorySlug: categories[0]?.slug ?? emptyForm().categorySlug,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reset form when dialog opens / product changes
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
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        toast({ title: "Only image files are allowed", variant: "destructive" });
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Each image must be under 5MB", variant: "destructive" });
        continue;
      }
      setUploading(true);
      try {
        const res = await productApi.uploadImage(file);
        const url = res.data?.data?.url;
        if (!url) throw new Error("No URL returned from server");
        setForm((f) => ({ ...f, images: [...f.images, url] }));
        toast({ title: "Image uploaded" });
      } catch (err: unknown) {
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: string }).message)
            : "Upload failed";
        toast({ title: message, variant: "destructive" });
      } finally {
        setUploading(false);
      }
    }
  };

  const moveImage = (from: number, to: number) => {
    setForm((f) => {
      if (to < 0 || to >= f.images.length) return f;
      const next = [...f.images];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return { ...f, images: next };
    });
  };

  const setPrimaryImage = (index: number) => {
    if (index === 0) return;
    moveImage(index, 0);
  };

  const removeImage = (index: number) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  };

  const updateVariant = (index: number, patch: Partial<VariantForm>) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const variants = form.variants
        .filter((v) => v.name.trim() && v.sku.trim())
        .map((v, index) => ({
          ...(v.id ? { id: v.id } : {}),
          name: v.name.trim(),
          sku: v.sku.trim(),
          price: Number(v.price) || 0,
          salePrice: v.salePrice ? Number(v.salePrice) : undefined,
          stock: Number(v.stock) || 0,
          weight: v.weight || undefined,
          isActive: v.isActive,
          attributes: { size: v.name.trim() },
          sortOrder: index,
        }));

      const basePrice =
        variants.length > 0
          ? Math.min(
              ...variants.map((v) =>
                v.salePrice && v.salePrice > 0 ? v.salePrice : v.price
              )
            )
          : Number(form.price);

      const baseStock =
        variants.length > 0
          ? variants.filter((v) => v.isActive).reduce((s, v) => s + v.stock, 0)
          : Number(form.stock);

      const payload = {
        name: form.name,
        slug: form.slug || slugify(form.name),
        sku: form.sku || undefined,
        category: form.category,
        categorySlug: form.categorySlug,
        price: basePrice,
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        stock: baseStock,
        images: form.images.length ? form.images : [DEFAULT_PRODUCT_IMAGE],
        description: form.description,
        shortDescription: form.shortDescription,
        features: [] as string[],
        origin: form.origin,
        weight: form.weight || undefined,
        metaTitle: form.metaTitle || undefined,
        metaDescription: form.metaDescription || undefined,
        isFeatured: form.isFeatured,
        isNew: form.isNew,
        isBestseller: form.isBestseller,
        codEnabled: codGloballyEnabled ? form.codEnabled : false,
        variants,
      };

      if (isEdit && product) {
        await productApi.update(product.id, payload);
        toast({ title: "Product updated" });
      } else {
        await productApi.create(payload);
        toast({
          title: "Product created as draft",
          description: "Use Publish on the product row to show it on the storefront.",
        });
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Product" : "Add Product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="mb-1.5 block">SKU</Label>
              <Input
                value={form.sku}
                onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                placeholder="BR-PRODUCT"
              />
            </div>
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
              <Label className="mb-1.5 block">Base stock *</Label>
              <Input
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                required={form.variants.length === 0}
                disabled={form.variants.length > 0}
              />
              {form.variants.length > 0 && (
                <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">
                  Derived from variant stocks
                </p>
              )}
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
                required={form.variants.length === 0}
                disabled={form.variants.length > 0}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block">SEO title</Label>
              <Input
                value={form.metaTitle}
                maxLength={70}
                onChange={(e) => setForm((f) => ({ ...f, metaTitle: e.target.value }))}
              />
            </div>
            <div>
              <Label className="mb-1.5 block">SEO description</Label>
              <Input
                value={form.metaDescription}
                maxLength={160}
                onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value }))}
              />
            </div>
          </div>

          {/* Images */}
          <div className="space-y-2">
            <Label className="block">Product images</Label>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              First image is primary. Reorder with arrows or set primary.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {form.images.map((url, index) => (
                <div
                  key={`${url}-${index}`}
                  className={cn(
                    "relative aspect-square rounded-xl overflow-hidden border bg-[hsl(var(--muted))]",
                    index === 0 && "ring-2 ring-[hsl(var(--primary))]"
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={normalizeProductImageUrl(url)}
                    alt={`Product ${index + 1}`}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 flex gap-1 p-1 bg-black/50">
                    <button
                      type="button"
                      title="Move left"
                      onClick={() => moveImage(index, index - 1)}
                      className="p-1 rounded text-white hover:bg-white/20"
                    >
                      <GripVertical className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Set primary"
                      onClick={() => setPrimaryImage(index)}
                      className="p-1 rounded text-white hover:bg-white/20"
                    >
                      <Star
                        className={cn("w-3.5 h-3.5", index === 0 && "fill-amber-400 text-amber-400")}
                      />
                    </button>
                    <button
                      type="button"
                      title="Remove"
                      onClick={() => removeImage(index)}
                      className="p-1 rounded text-white hover:bg-white/20 ml-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {index === 0 && (
                    <span className="absolute top-1 left-1 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded">
                      Primary
                    </span>
                  )}
                </div>
              ))}
              <label className="aspect-square rounded-xl border border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-[hsl(var(--muted))]/50 transition-colors">
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Upload</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </label>
            </div>
            {form.images.length === 0 && (
              <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" />
                A default placeholder will be used if no images are uploaded.
              </p>
            )}
          </div>

          {/* Variants */}
          <div className="space-y-3 border rounded-xl p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <Label className="block">Variants</Label>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  e.g. 250g / 500g / 1kg — each with own SKU, price, and stock
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={() =>
                  setForm((f) => ({ ...f, variants: [...f.variants, emptyVariant()] }))
                }
              >
                <Plus className="w-3.5 h-3.5" /> Add variant
              </Button>
            </div>
            {form.variants.map((v, index) => (
              <div
                key={v.id ?? `new-${index}`}
                className="grid grid-cols-2 sm:grid-cols-6 gap-2 p-3 rounded-lg bg-[hsl(var(--muted))]/40"
              >
                <Input
                  placeholder="Name"
                  value={v.name}
                  onChange={(e) => updateVariant(index, { name: e.target.value })}
                />
                <Input
                  placeholder="SKU"
                  value={v.sku}
                  onChange={(e) => updateVariant(index, { sku: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Price"
                  value={v.price}
                  onChange={(e) => updateVariant(index, { price: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Sale"
                  value={v.salePrice}
                  onChange={(e) => updateVariant(index, { salePrice: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Stock"
                  value={v.stock}
                  onChange={(e) => updateVariant(index, { stock: e.target.value })}
                />
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Weight"
                    value={v.weight}
                    onChange={(e) => updateVariant(index, { weight: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        variants: f.variants.filter((_, i) => i !== index),
                      }))
                    }
                    className="p-2 text-destructive"
                    aria-label="Remove variant"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <label className="col-span-full flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={v.isActive}
                    onChange={(e) => updateVariant(index, { isActive: e.target.checked })}
                  />
                  Active
                </label>
              </div>
            ))}
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
            {codGloballyEnabled ? (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.codEnabled}
                  onChange={(e) => setForm((f) => ({ ...f, codEnabled: e.target.checked }))}
                />
                COD available
              </label>
            ) : (
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                COD unavailable (enable in Admin → Settings)
              </span>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || uploading}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isEdit ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
