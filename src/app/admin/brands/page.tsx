"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Award,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  X,
  Save,
  Image as ImageIcon,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { cn } from "@/lib/utils";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  displayOrder: number;
  productCount: number;
  isActive: boolean;
}

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formLogo, setFormLogo] = useState("");
  const [formOrder, setFormOrder] = useState(0);

  const fetchBrands = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/brands");
      if (!res.ok) return;
      setBrands(await res.json());
    } catch {
      // keep current state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const openCreate = () => {
    setEditingId(null);
    setFormName("");
    setFormSlug("");
    setFormLogo("");
    setFormOrder(0);
    setShowModal(true);
  };

  const openEdit = (brand: Brand) => {
    setEditingId(brand.id);
    setFormName(brand.name);
    setFormSlug(brand.slug);
    setFormLogo(brand.logo ?? "");
    setFormOrder(brand.displayOrder);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: formName,
        slug: formSlug || undefined,
        logo: formLogo || undefined,
        displayOrder: formOrder,
      };

      if (editingId) {
        const res = await fetch(`/api/admin/brands/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) return;
        const updated = await res.json();
        setBrands((prev) => prev.map((b) => (b.id === editingId ? updated : b)));
      } else {
        const res = await fetch("/api/admin/brands", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) return;
        const created = await res.json();
        setBrands((prev) => [...prev, created]);
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (brand: Brand) => {
    const res = await fetch(`/api/admin/brands/${brand.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !brand.isActive }),
    });
    if (!res.ok) return;
    const updated = await res.json();
    setBrands((prev) => prev.map((b) => (b.id === brand.id ? updated : b)));
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/admin/brands/${deleteId}`, { method: "DELETE" });
    setBrands((prev) => prev.filter((b) => b.id !== deleteId));
    setDeleteId(null);
  };

  const activeCount = brands.filter((b) => b.isActive).length;
  const totalProducts = brands.reduce((s, b) => s + b.productCount, 0);

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-surface-400" />
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
            <h1 className="text-2xl font-bold text-surface-900">Marcas</h1>
            <p className="mt-1 text-sm text-surface-500">
              Gestiona las marcas disponibles para los productos
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nueva marca
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-surface-200 bg-white p-5">
            <p className="text-sm text-surface-500">Total marcas</p>
            <p className="mt-1 text-2xl font-bold text-surface-900">{brands.length}</p>
          </div>
          <div className="rounded-xl border border-surface-200 bg-white p-5">
            <p className="text-sm text-surface-500">Activas</p>
            <p className="mt-1 text-2xl font-bold text-green-600">{activeCount}</p>
          </div>
          <div className="rounded-xl border border-surface-200 bg-white p-5">
            <p className="text-sm text-surface-500">Productos con marca</p>
            <p className="mt-1 text-2xl font-bold text-indigo-600">{totalProducts}</p>
          </div>
        </div>

        {/* Brands Grid */}
        {brands.length === 0 ? (
          <div className="rounded-xl border border-surface-200 bg-white p-12 text-center">
            <Award className="mx-auto h-12 w-12 text-surface-300" />
            <p className="mt-4 text-sm text-surface-500">No hay marcas creadas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {brands.map((brand) => (
              <div
                key={brand.id}
                className={cn(
                  "rounded-xl border bg-white p-5 transition-all",
                  brand.isActive ? "border-surface-200" : "border-surface-200 opacity-60"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {brand.logo ? (
                      <img
                        src={brand.logo}
                        alt={brand.name}
                        className="h-10 w-10 rounded-lg object-contain bg-surface-50 p-1"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                        <Award className="h-5 w-5" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-surface-900">{brand.name}</h3>
                      <p className="text-xs text-surface-400">{brand.slug}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                      brand.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-surface-100 text-surface-500"
                    )}
                  >
                    {brand.isActive ? "Activa" : "Inactiva"}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-surface-500">
                    {brand.productCount} {brand.productCount === 1 ? "producto" : "productos"}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleActive(brand)}
                      className="rounded-md p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors"
                      title={brand.isActive ? "Desactivar" : "Activar"}
                    >
                      {brand.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => openEdit(brand)}
                      className="rounded-md p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(brand.id)}
                      className="rounded-md p-1.5 text-surface-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-surface-900">
                {editingId ? "Editar marca" : "Nueva marca"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-surface-400 hover:text-surface-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-surface-700">Nombre</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="ej: Netflix, Steam, PlayStation"
                  className="w-full rounded-lg border border-surface-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-surface-700">Slug</label>
                <input
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="auto-generado si se deja vacio"
                  className="w-full rounded-lg border border-surface-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-surface-700">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5" />
                    Logo URL
                  </span>
                </label>
                <input
                  type="text"
                  value={formLogo}
                  onChange={(e) => setFormLogo(e.target.value)}
                  placeholder="https://... o /images/brands/logo.png"
                  className="w-full rounded-lg border border-surface-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {formLogo && (
                  <div className="mt-2 flex justify-center">
                    <img src={formLogo} alt="preview" className="h-16 w-16 rounded-lg object-contain bg-surface-50 p-1" />
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-surface-700">Orden de visualizacion</label>
                <input
                  type="number"
                  value={formOrder}
                  onChange={(e) => setFormOrder(Number(e.target.value))}
                  min={0}
                  className="w-full rounded-lg border border-surface-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-surface-200 px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formName.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-surface-900">Eliminar marca</h3>
            <p className="mt-2 text-sm text-surface-500">
              Esta accion eliminara la marca permanentemente. Los productos asociados perderan la referencia.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="rounded-lg border border-surface-200 px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
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
