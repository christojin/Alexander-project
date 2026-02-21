"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout";
import { formatDate, cn } from "@/lib/utils";
import {
  Bell,
  Plus,
  Megaphone,
  Users,
  ShoppingBag,
  Store,
  Pencil,
  Trash2,
  X,
  Send,
  Mail,
  Loader2,
  Eye,
} from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  target: "ALL" | "BUYERS" | "SELLERS";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { readBy: number };
}

const targetLabels: Record<string, string> = {
  ALL: "Todos",
  BUYERS: "Compradores",
  SELLERS: "Vendedores",
};

const targetColors: Record<string, string> = {
  ALL: "bg-purple-100 text-purple-700",
  BUYERS: "bg-blue-100 text-blue-700",
  SELLERS: "bg-indigo-100 text-indigo-700",
};

const targetIcons: Record<string, typeof Users> = {
  ALL: Users,
  BUYERS: ShoppingBag,
  SELLERS: Store,
};

export default function AdminNotificationsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formTarget, setFormTarget] = useState<"ALL" | "BUYERS" | "SELLERS">("ALL");
  const [formSendEmail, setFormSendEmail] = useState(false);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/announcements");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAnnouncements(data.announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const openCreateModal = () => {
    setEditingId(null);
    setFormTitle("");
    setFormContent("");
    setFormTarget("ALL");
    setFormSendEmail(false);
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setFormTitle(announcement.title);
    setFormContent(announcement.content);
    setFormTarget(announcement.target);
    setFormSendEmail(false);
    setFormError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    setFormError("");
    if (!formTitle.trim() || !formContent.trim()) {
      setFormError("Titulo y contenido son requeridos");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        // Update
        const res = await fetch(`/api/admin/announcements/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formTitle,
            content: formContent,
            target: formTarget,
          }),
        });
        if (!res.ok) throw new Error("Failed to update");
        const data = await res.json();
        setAnnouncements((prev) =>
          prev.map((a) => (a.id === editingId ? data.announcement : a))
        );
      } else {
        // Create
        const res = await fetch("/api/admin/announcements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formTitle,
            content: formContent,
            target: formTarget,
            sendEmail: formSendEmail,
          }),
        });
        if (!res.ok) throw new Error("Failed to create");
        const data = await res.json();
        setAnnouncements((prev) => [data.announcement, ...prev]);
      }
      setShowModal(false);
    } catch {
      setFormError("Error al guardar el anuncio");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/admin/announcements/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isActive } : a))
      );
    } catch (error) {
      console.error("Error toggling announcement:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminar este anuncio?")) return;
    try {
      await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (error) {
      console.error("Error deleting announcement:", error);
    }
  };

  const totalAnnouncements = announcements.length;
  const activeCount = announcements.filter((a) => a.isActive).length;
  const totalReads = announcements.reduce((sum, a) => sum + a._count.readBy, 0);

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
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Notificaciones y Anuncios
            </h1>
            <p className="mt-1 text-slate-500">
              Crea y gestiona anuncios para compradores y vendedores
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Nuevo anuncio
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                <Megaphone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total anuncios</p>
                <p className="text-2xl font-bold text-slate-900">{totalAnnouncements}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Activos</p>
                <p className="text-2xl font-bold text-slate-900">{activeCount}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total lecturas</p>
                <p className="text-2xl font-bold text-slate-900">{totalReads}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Announcements Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Anuncios
            </h2>
          </div>
          {announcements.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Megaphone className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">
                No hay anuncios creados. Crea tu primer anuncio para notificar a los usuarios.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Titulo
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Destinatario
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Lecturas
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {announcements.map((announcement) => {
                    const TargetIcon = targetIcons[announcement.target];
                    return (
                      <tr key={announcement.id} className="transition-colors hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-slate-900">{announcement.title}</p>
                            <p className="mt-0.5 text-sm text-slate-500 line-clamp-1">
                              {announcement.content}
                            </p>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                            targetColors[announcement.target]
                          )}>
                            <TargetIcon className="h-3 w-3" />
                            {targetLabels[announcement.target]}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                          {formatDate(announcement.createdAt)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                          {announcement._count.readBy}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <button
                            onClick={() => handleToggleActive(announcement.id, !announcement.isActive)}
                            className={cn(
                              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                              announcement.isActive ? "bg-green-500" : "bg-slate-300"
                            )}
                          >
                            <span
                              className={cn(
                                "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                                announcement.isActive ? "translate-x-6" : "translate-x-1"
                              )}
                            />
                          </button>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditModal(announcement)}
                              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(announcement.id)}
                              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingId ? "Editar anuncio" : "Nuevo anuncio"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Titulo
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Titulo del anuncio"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Contenido
                </label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Escribe el contenido del anuncio..."
                  rows={4}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Destinatario
                </label>
                <div className="flex gap-3">
                  {(["ALL", "BUYERS", "SELLERS"] as const).map((target) => {
                    const Icon = targetIcons[target];
                    return (
                      <button
                        key={target}
                        onClick={() => setFormTarget(target)}
                        className={cn(
                          "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all",
                          formTarget === target
                            ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {targetLabels[target]}
                      </button>
                    );
                  })}
                </div>
              </div>
              {!editingId && (
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3">
                  <button
                    onClick={() => setFormSendEmail(!formSendEmail)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      formSendEmail ? "bg-indigo-500" : "bg-slate-300"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                        formSendEmail ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-700">
                      Enviar notificacion por email
                    </span>
                  </div>
                </div>
              )}
              {formError && (
                <p className="text-sm text-red-600">{formError}</p>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {editingId ? "Guardar cambios" : "Publicar anuncio"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
