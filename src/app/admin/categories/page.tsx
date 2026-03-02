"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Eye,
  EyeOff,
  Tv,
  Gamepad2,
  Smartphone,
  ShoppingBag,
  Monitor,
  Share2,
  Music,
  Gift,
  Wifi,
  CreditCard,
  Globe,
  Zap,
  Tag,
  Layers,
  Loader2,
  ImageIcon,
  Star,
  Upload,
} from "lucide-react";

const iconOptions = [
  { name: "Tv", component: Tv },
  { name: "Gamepad2", component: Gamepad2 },
  { name: "Smartphone", component: Smartphone },
  { name: "ShoppingBag", component: ShoppingBag },
  { name: "Monitor", component: Monitor },
  { name: "Share2", component: Share2 },
  { name: "Music", component: Music },
  { name: "Gift", component: Gift },
  { name: "Wifi", component: Wifi },
  { name: "CreditCard", component: CreditCard },
  { name: "Globe", component: Globe },
  { name: "Zap", component: Zap },
];

function getIconComponent(iconName: string) {
  const found = iconOptions.find((i) => i.name === iconName);
  return found ? found.component : Tag;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface CategoryForm {
  name: string;
  slug: string;
  description: string;
  icon: string;
  image: string;
  bannerImage: string;
  isPopular: boolean;
  isActive: boolean;
}

const emptyForm: CategoryForm = {
  name: "",
  slug: "",
  description: "",
  icon: "Tag",
  image: "",
  bannerImage: "",
  isPopular: false,
  isActive: true,
};

export default function AdminCategoriesPage() {
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const handleUploadImage = async (file: File, field: "image" | "bannerImage") => {
    const setter = field === "image" ? setUploadingImage : setUploadingBanner;
    setter(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "categories");
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setForm((prev) => ({ ...prev, [field]: data.url }));
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setter(false);
    }
  };

  const handleTogglePopular = async (catId: string) => {
    const category = categoryList.find((c) => c.id === catId);
    if (!category) return;
    try {
      const res = await fetch(`/api/admin/categories/${catId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPopular: !category.isPopular }),
      });
      if (!res.ok) throw new Error("Failed to toggle popular");
      const updated: Category = await res.json();
      setCategoryList((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
    } catch (err) {
      console.error("Error toggling popular:", err);
    }
  };

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data: Category[] = await res.json();
      setCategoryList(data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleToggleActive = async (catId: string) => {
    const category = categoryList.find((c) => c.id === catId);
    if (!category) return;
    try {
      const res = await fetch(`/api/admin/categories/${catId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !category.isActive }),
      });
      if (!res.ok) throw new Error("Failed to toggle category");
      const updated: Category = await res.json();
      setCategoryList((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
    } catch (err) {
      console.error("Error toggling category:", err);
    }
  };

  const handleAddCategory = async () => {
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug || slugify(form.name),
          description: form.description,
          icon: form.icon,
          image: form.image || null,
          bannerImage: form.bannerImage || null,
          isPopular: form.isPopular,
          isActive: form.isActive,
        }),
      });
      if (!res.ok) throw new Error("Failed to add category");
      const newCat: Category = await res.json();
      setCategoryList((prev) => [...prev, newCat]);
      setShowAddModal(false);
      setForm(emptyForm);
    } catch (err) {
      console.error("Error adding category:", err);
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory) return;
    try {
      const res = await fetch(`/api/admin/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug || slugify(form.name),
          description: form.description,
          icon: form.icon,
          image: form.image || null,
          bannerImage: form.bannerImage || null,
          isPopular: form.isPopular,
          isActive: form.isActive,
        }),
      });
      if (!res.ok) throw new Error("Failed to edit category");
      const updated: Category = await res.json();
      setCategoryList((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      setEditingCategory(null);
      setForm(emptyForm);
    } catch (err) {
      console.error("Error editing category:", err);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    try {
      const res = await fetch(`/api/admin/categories/${catId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete category");
      setCategoryList((prev) => prev.filter((c) => c.id !== catId));
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Error deleting category:", err);
    }
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      icon: cat.icon,
      image: cat.image ?? "",
      bannerImage: cat.bannerImage ?? "",
      isPopular: cat.isPopular,
      isActive: cat.isActive,
    });
  };

  const openAddModal = () => {
    setForm(emptyForm);
    setShowAddModal(true);
  };

  const activeCount = categoryList.filter((c) => c.isActive).length;
  const totalProducts = categoryList.reduce(
    (sum, c) => sum + c.productCount,
    0
  );

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Gestion de categorias
            </h1>
            <p className="mt-1 text-slate-500">
              Organiza los productos por categorias
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Nueva categoria
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total categorias</p>
                <p className="text-2xl font-bold text-slate-900">
                  {categoryList.length}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Activas</p>
                <p className="text-2xl font-bold text-green-600">
                  {activeCount}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                <Tag className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total productos</p>
                <p className="text-2xl font-bold text-purple-600">
                  {totalProducts}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categoryList.map((cat) => {
            const IconComp = getIconComponent(cat.icon);
            return (
              <div
                key={cat.id}
                className={cn(
                  "rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md",
                  cat.isActive
                    ? "border-slate-200"
                    : "border-slate-200 opacity-60"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl",
                        cat.isActive
                          ? "bg-indigo-100 text-indigo-600"
                          : "bg-slate-100 text-slate-400"
                      )}
                    >
                      <IconComp className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {cat.name}
                      </h3>
                      <p className="text-xs font-mono text-slate-400">
                        /{cat.slug}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleTogglePopular(cat.id)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
                        cat.isPopular
                          ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                          : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                      )}
                      title={cat.isPopular ? "Quitar de populares" : "Marcar como popular"}
                    >
                      <Star className={cn("h-3 w-3", cat.isPopular && "fill-amber-500")} />
                    </button>
                    <button
                      onClick={() => handleToggleActive(cat.id)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors",
                        cat.isActive
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-red-100 text-red-700 hover:bg-red-200"
                      )}
                    >
                      {cat.isActive ? (
                        <Eye className="h-3 w-3" />
                      ) : (
                        <EyeOff className="h-3 w-3" />
                      )}
                      {cat.isActive ? "Activa" : "Inactiva"}
                    </button>
                  </div>
                </div>
                {(cat.image || cat.bannerImage) && (
                  <div className="mt-3 space-y-1.5">
                    {cat.image && (
                      <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                        <ImageIcon className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="truncate text-xs text-slate-500">Icono: {cat.image}</span>
                      </div>
                    )}
                    {cat.bannerImage && (
                      <div className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2">
                        <ImageIcon className="h-4 w-4 shrink-0 text-indigo-400" />
                        <span className="truncate text-xs text-indigo-500">Banner: {cat.bannerImage}</span>
                      </div>
                    )}
                  </div>
                )}
                <p className="mt-3 text-sm text-slate-600 line-clamp-2">
                  {cat.description}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-sm text-slate-500">
                    <span className="font-semibold text-slate-700">
                      {cat.productCount}
                    </span>{" "}
                    productos
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(cat)}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(cat.id)}
                      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(showAddModal || editingCategory) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingCategory ? "Editar categoria" : "Nueva categoria"}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCategory(null);
                  setForm(emptyForm);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Nombre
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      name,
                      slug: slugify(name),
                    }));
                  }}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Nombre de la categoria"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Slug
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-mono text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="auto-generado"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Descripcion
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Descripcion de la categoria"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Imagen cuadrada (icono)
                </label>
                {form.image ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
                      {form.image}
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, image: "" }))}
                      className="rounded-lg border border-slate-200 p-2.5 text-slate-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500 transition-colors hover:border-indigo-400 hover:text-indigo-600">
                    {uploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {uploadingImage ? "Subiendo..." : "Subir imagen cuadrada"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUploadImage(f, "image");
                      }}
                    />
                  </label>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  Imagen cuadrada tipo logo/icono para la categoria
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Banner rectangular (home)
                </label>
                {form.bannerImage ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 truncate rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
                      {form.bannerImage}
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, bannerImage: "" }))}
                      className="rounded-lg border border-slate-200 p-2.5 text-slate-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500 transition-colors hover:border-indigo-400 hover:text-indigo-600">
                    {uploadingBanner ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {uploadingBanner ? "Subiendo..." : "Subir banner rectangular"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUploadImage(f, "bannerImage");
                      }}
                    />
                  </label>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  Imagen rectangular que aparece en &quot;Categorias populares&quot; del inicio
                </p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Icono
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {iconOptions.map((icon) => {
                    const IconComp = icon.component;
                    return (
                      <button
                        key={icon.name}
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({ ...prev, icon: icon.name }))
                        }
                        className={cn(
                          "flex flex-col items-center gap-1 rounded-lg border p-3 transition-all",
                          form.icon === icon.name
                            ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                            : "border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600"
                        )}
                      >
                        <IconComp className="h-5 w-5" />
                        <span className="text-[10px]">{icon.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="cat-active"
                    checked={form.isActive}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        isActive: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label
                    htmlFor="cat-active"
                    className="text-sm text-slate-700"
                  >
                    Categoria activa
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="cat-popular"
                    checked={form.isPopular}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        isPopular: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                  />
                  <label
                    htmlFor="cat-popular"
                    className="flex items-center gap-1.5 text-sm text-slate-700"
                  >
                    <Star className="h-3.5 w-3.5 text-amber-500" />
                    Categoria popular
                  </label>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCategory(null);
                  setForm(emptyForm);
                }}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={
                  editingCategory ? handleEditCategory : handleAddCategory
                }
                disabled={!form.name}
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingCategory ? "Guardar cambios" : "Crear categoria"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              Eliminar categoria
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Esta seguro de que desea eliminar esta categoria? Los productos
              asociados quedaran sin categoria.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteCategory(deleteConfirm)}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
