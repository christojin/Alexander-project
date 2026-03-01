"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Globe,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  X,
  Save,
  Flag,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { cn } from "@/lib/utils";

interface Region {
  id: string;
  name: string;
  code: string;
  flagEmoji: string | null;
  flagImage: string | null;
  displayOrder: number;
  productCount: number;
  isActive: boolean;
}

export default function AdminRegionsPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formEmoji, setFormEmoji] = useState("");
  const [formFlagImage, setFormFlagImage] = useState("");
  const [formOrder, setFormOrder] = useState(0);

  const fetchRegions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/regions");
      if (!res.ok) return;
      setRegions(await res.json());
    } catch {
      // keep current state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegions();
  }, [fetchRegions]);

  const openCreate = () => {
    setEditingId(null);
    setFormName("");
    setFormCode("");
    setFormEmoji("");
    setFormFlagImage("");
    setFormOrder(0);
    setShowModal(true);
  };

  const openEdit = (region: Region) => {
    setEditingId(region.id);
    setFormName(region.name);
    setFormCode(region.code);
    setFormEmoji(region.flagEmoji ?? "");
    setFormFlagImage(region.flagImage ?? "");
    setFormOrder(region.displayOrder);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim() || !formCode.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: formName,
        code: formCode,
        flagEmoji: formEmoji || undefined,
        flagImage: formFlagImage || undefined,
        displayOrder: formOrder,
      };

      if (editingId) {
        const res = await fetch(`/api/admin/regions/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) return;
        const updated = await res.json();
        setRegions((prev) => prev.map((r) => (r.id === editingId ? updated : r)));
      } else {
        const res = await fetch("/api/admin/regions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) return;
        const created = await res.json();
        setRegions((prev) => [...prev, created]);
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (region: Region) => {
    const res = await fetch(`/api/admin/regions/${region.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !region.isActive }),
    });
    if (!res.ok) return;
    const updated = await res.json();
    setRegions((prev) => prev.map((r) => (r.id === region.id ? updated : r)));
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/admin/regions/${deleteId}`, { method: "DELETE" });
    setRegions((prev) => prev.filter((r) => r.id !== deleteId));
    setDeleteId(null);
  };

  const activeCount = regions.filter((r) => r.isActive).length;
  const totalProducts = regions.reduce((s, r) => s + r.productCount, 0);

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
            <h1 className="text-2xl font-bold text-surface-900">Regiones</h1>
            <p className="mt-1 text-sm text-surface-500">
              Gestiona las regiones y paises disponibles para los productos
            </p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nueva region
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-surface-200 bg-white p-5">
            <p className="text-sm text-surface-500">Total regiones</p>
            <p className="mt-1 text-2xl font-bold text-surface-900">{regions.length}</p>
          </div>
          <div className="rounded-xl border border-surface-200 bg-white p-5">
            <p className="text-sm text-surface-500">Activas</p>
            <p className="mt-1 text-2xl font-bold text-green-600">{activeCount}</p>
          </div>
          <div className="rounded-xl border border-surface-200 bg-white p-5">
            <p className="text-sm text-surface-500">Productos con region</p>
            <p className="mt-1 text-2xl font-bold text-indigo-600">{totalProducts}</p>
          </div>
        </div>

        {/* Regions Table */}
        {regions.length === 0 ? (
          <div className="rounded-xl border border-surface-200 bg-white p-12 text-center">
            <Globe className="mx-auto h-12 w-12 text-surface-300" />
            <p className="mt-4 text-sm text-surface-500">No hay regiones creadas</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-surface-200 bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50/50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Region</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Codigo</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">Bandera</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-surface-500">Productos</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-surface-500">Estado</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-surface-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {regions.map((region) => (
                  <tr key={region.id} className={cn("transition-colors hover:bg-surface-50/50", !region.isActive && "opacity-50")}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        {region.flagEmoji ? (
                          <span className="text-xl">{region.flagEmoji}</span>
                        ) : (
                          <Flag className="h-5 w-5 text-surface-400" />
                        )}
                        <span className="text-sm font-medium text-surface-900">{region.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-md bg-surface-100 px-2 py-0.5 text-xs font-mono font-medium text-surface-600">
                        {region.code}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {region.flagImage ? (
                        <img src={region.flagImage} alt={region.code} className="h-5 w-8 rounded object-cover" />
                      ) : (
                        <span className="text-xs text-surface-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center text-sm text-surface-600">{region.productCount}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        region.isActive ? "bg-green-100 text-green-700" : "bg-surface-100 text-surface-500"
                      )}>
                        {region.isActive ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggleActive(region)}
                          className="rounded-md p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors"
                          title={region.isActive ? "Desactivar" : "Activar"}
                        >
                          {region.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => openEdit(region)}
                          className="rounded-md p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(region.id)}
                          className="rounded-md p-1.5 text-surface-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-surface-900">
                {editingId ? "Editar region" : "Nueva region"}
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
                  placeholder="ej: Estados Unidos, Bolivia, Global"
                  className="w-full rounded-lg border border-surface-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-surface-700">Codigo</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="US, BO, EU"
                    maxLength={5}
                    className="w-full rounded-lg border border-surface-200 px-3 py-2.5 text-sm font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-surface-700">Emoji bandera</label>
                  <input
                    type="text"
                    value={formEmoji}
                    onChange={(e) => setFormEmoji(e.target.value)}
                    placeholder="🇺🇸 🇧🇴 🌎"
                    className="w-full rounded-lg border border-surface-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-surface-700">
                  Imagen de bandera (URL)
                </label>
                <input
                  type="text"
                  value={formFlagImage}
                  onChange={(e) => setFormFlagImage(e.target.value)}
                  placeholder="https://... o /images/flags/bo.png"
                  className="w-full rounded-lg border border-surface-200 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
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
                disabled={saving || !formName.trim() || !formCode.trim()}
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
            <h3 className="text-lg font-semibold text-surface-900">Eliminar region</h3>
            <p className="mt-2 text-sm text-surface-500">
              Esta accion eliminara la region permanentemente. Los productos asociados perderan la referencia.
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
