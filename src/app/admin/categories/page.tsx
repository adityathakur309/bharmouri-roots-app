"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FolderTree, Plus, Edit, Trash2, Power, Upload } from "lucide-react";
import { categoryApi } from "@/services/api";
import type { Category } from "@/types/category";
import { EmptyState } from "@/components/shared/empty-state";
import { ViewModeToggle } from "@/components/shared/view-mode-toggle";
import { useListViewMode } from "@/hooks/use-list-view-mode";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CategoryIcon, DEFAULT_CATEGORY_ICON, isCategoryIconUrl } from "@/components/shared/category-icon";

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
  description: "",
  icon: DEFAULT_CATEGORY_ICON,
  image: "",
  sortOrder: "0",
  isActive: true,
};

export default function AdminCategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const { viewMode, setViewMode } = useListViewMode();

  const load = useCallback(async () => {
    try {
      const res = await categoryApi.adminList();
      setCategories(res.data ?? []);
      setLoadError(false);
    } catch {
      setCategories([]);
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? "",
      icon: cat.icon || DEFAULT_CATEGORY_ICON,
      image: cat.image ?? "",
      sortOrder: String(cat.sortOrder ?? 0),
      isActive: cat.isActive !== false,
    });
    setDialogOpen(true);
  };

  const handleIconUpload = async (file: File | null) => {
    if (!file) return;
    setUploadingIcon(true);
    try {
      const res = await categoryApi.uploadIcon(file);
      const url = res.data?.data?.url;
      if (!url) throw new Error("Upload failed");
      setForm((f) => ({ ...f, icon: url }));
      toast({ title: "Icon uploaded" });
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Could not upload icon";
      toast({ title: message, variant: "destructive" });
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: (form.slug || slugify(form.name)).trim(),
        description: form.description.trim() || undefined,
        icon: form.icon.trim() || undefined,
        image: form.image.trim() || undefined,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };

      if (editing) {
        await categoryApi.update(editing.id, payload);
        toast({ title: "Category updated" });
      } else {
        await categoryApi.create(payload);
        toast({ title: "Category created" });
      }
      setDialogOpen(false);
      await load();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Could not save category";
      toast({ title: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (cat: Category) => {
    const next = cat.isActive === false;
    try {
      await categoryApi.update(cat.id, { isActive: next });
      toast({ title: next ? "Category activated" : "Category deactivated" });
      await load();
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Deactivate category "${cat.name}"? It will hide from the storefront.`)) {
      return;
    }
    try {
      await categoryApi.remove(cat.id);
      toast({ title: "Category deactivated" });
      await load();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const handleDeleteAll = async () => {
    setDeletingAll(true);
    try {
      const res = await categoryApi.removeAll();
      const count = res.data?.deactivated ?? 0;
      toast({
        title: "Categories deactivated",
        description: `${count} category(ies) deactivated.`,
      });
      setDeleteAllOpen(false);
      await load();
    } catch {
      toast({ title: "Delete All failed", variant: "destructive" });
    } finally {
      setDeletingAll(false);
    }
  };

  const categoryActions = (cat: Category) => (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className={cn(
          "p-1.5 rounded-lg hover:bg-[hsl(var(--muted))]",
          cat.isActive === false ? "text-green-600" : "text-amber-600"
        )}
        title={cat.isActive === false ? "Activate" : "Deactivate"}
        onClick={() => void toggleActive(cat)}
      >
        <Power className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))]"
        title="Edit"
        onClick={() => openEdit(cat)}
      >
        <Edit className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
        title="Deactivate"
        onClick={() => void handleDelete(cat)}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  const categoryThumb = (cat: Category, size: "sm" | "lg" = "sm") => (
    <div
      className={cn(
        "rounded-xl overflow-hidden bg-[hsl(var(--muted))] shrink-0 flex items-center justify-center",
        size === "sm" ? "w-10 h-10" : "w-14 h-14"
      )}
    >
      {cat.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
      ) : (
        <CategoryIcon icon={cat.icon} alt={cat.name} size={size === "lg" ? "lg" : "sm"} />
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {categories.length} top-level categories
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
          <Button
            variant="outline"
            className="gap-2 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400"
            onClick={() => setDeleteAllOpen(true)}
            disabled={categories.length === 0}
          >
            <Trash2 className="w-4 h-4" /> Delete All
          </Button>
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="w-4 h-4" /> Add Category
          </Button>
        </div>
      </div>

      {loadError ? (
        <EmptyState
          icon={FolderTree}
          title="Could not load categories"
          description="Check your database connection, then try again."
          primaryAction={{ label: "Retry", onClick: () => void load() }}
        />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title="No categories yet"
          description="Create categories so products can be organized on the storefront."
          primaryAction={{ label: "Add Category", onClick: openCreate }}
        />
      ) : viewMode === "list" ? (
        <div className="bg-[hsl(var(--card))] rounded-2xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[hsl(var(--muted))]/30 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                    Category
                  </th>
                  <th className="text-left p-4 font-semibold text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))] hidden sm:table-cell">
                    Slug
                  </th>
                  <th className="text-left p-4 font-semibold text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))] hidden md:table-cell">
                    Products
                  </th>
                  <th className="text-left p-4 font-semibold text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                    Status
                  </th>
                  <th className="text-left p-4 font-semibold text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {categories.map((cat, i) => (
                  <motion.tr
                    key={cat.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-[hsl(var(--muted))]/20 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {categoryThumb(cat)}
                        <div className="min-w-0">
                          <p className="font-medium truncate">{cat.name}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                            {cat.description || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell text-xs font-mono">
                      {cat.slug}
                    </td>
                    <td className="p-4 hidden md:table-cell">{cat.productCount}</td>
                    <td className="p-4">
                      <Badge
                        variant={cat.isActive === false ? "secondary" : "green"}
                        className="text-[10px]"
                      >
                        {cat.isActive === false ? "Inactive" : "Active"}
                      </Badge>
                    </td>
                    <td className="p-4">{categoryActions(cat)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="bg-[hsl(var(--card))] rounded-2xl border p-4 flex flex-col gap-3"
            >
              <div className="flex items-start gap-3">
                {categoryThumb(cat, "lg")}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{cat.name}</p>
                  <p className="text-xs font-mono text-[hsl(var(--muted-foreground))] truncate">
                    {cat.slug}
                  </p>
                </div>
                <Badge
                  variant={cat.isActive === false ? "secondary" : "green"}
                  className="text-[10px] shrink-0"
                >
                  {cat.isActive === false ? "Inactive" : "Active"}
                </Badge>
              </div>
              {cat.description ? (
                <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-2">
                  {cat.description}
                </p>
              ) : null}
              <p className="text-sm">
                <span className="font-medium">{cat.productCount}</span>{" "}
                <span className="text-[hsl(var(--muted-foreground))]">products</span>
              </p>
              <div className="mt-auto pt-2 border-t flex items-center justify-end">
                {categoryActions(cat)}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Name *</Label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    name: e.target.value,
                    slug: editing ? f.slug : slugify(e.target.value),
                  }))
                }
                required
                minLength={2}
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
            <div>
              <Label className="mb-1.5 block">Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="block">Category icon</Label>
              <div className="flex items-center gap-3 rounded-xl border p-3 bg-[hsl(var(--muted))]/20">
                <CategoryIcon icon={form.icon} alt={form.name || "Category"} size="lg" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex">
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        disabled={uploadingIcon}
                        onChange={(e) => void handleIconUpload(e.target.files?.[0] ?? null)}
                      />
                      <Button type="button" size="sm" variant="outline" className="gap-1.5" asChild>
                        <span>
                          {uploadingIcon ? (
                            "Uploading..."
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5" /> Upload icon
                            </>
                          )}
                        </span>
                      </Button>
                    </label>
                    {isCategoryIconUrl(form.icon) && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setForm((f) => ({ ...f, icon: DEFAULT_CATEGORY_ICON }))}
                      >
                        Use default
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                    Upload a square icon, or keep an emoji below. Missing icons show {DEFAULT_CATEGORY_ICON} on the storefront.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1.5 block text-xs">Emoji fallback</Label>
                  <Input
                    value={isCategoryIconUrl(form.icon) ? "" : form.icon}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        icon: e.target.value || DEFAULT_CATEGORY_ICON,
                      }))
                    }
                    placeholder={DEFAULT_CATEGORY_ICON}
                    disabled={isCategoryIconUrl(form.icon)}
                  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs">Sort order</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.sortOrder}
                    onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">Banner image URL (optional)</Label>
              <Input
                value={form.image}
                onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                placeholder="https://... or /uploads/..."
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
              Active (visible on storefront)
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteAllOpen} onOpenChange={(open) => !deletingAll && setDeleteAllOpen(open)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete All Categories</DialogTitle>
            <DialogDescription>
              This will deactivate ALL active categories from the storefront. Continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={deletingAll}
              onClick={() => setDeleteAllOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deletingAll}
              onClick={() => void handleDeleteAll()}
            >
              {deletingAll ? "Deleting..." : "Delete All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
