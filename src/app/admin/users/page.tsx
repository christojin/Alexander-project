"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout";
import { formatDate, cn } from "@/lib/utils";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Star,
  BadgeCheck,
  ShoppingBag,
  Store,
  Users as UsersIcon,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

type Tab = "all" | "buyers" | "sellers";

/* ------------------------------------------------------------------ */
/*  Types matching the API response from GET /api/admin/users          */
/* ------------------------------------------------------------------ */

interface SellerProfile {
  id: string;
  storeName: string;
  slug: string;
  commissionRate: number;
  rating: number;
  totalSales: number;
  totalEarnings: number;
  status: string;
  marketType: string;
  isVerified: boolean;
}

interface ApiUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: "BUYER" | "SELLER" | "ADMIN";
  isActive: boolean;
  createdAt: string;
  sellerProfile: SellerProfile | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface EditingUser {
  id: string;
  name: string;
  email: string;
  role: "BUYER" | "SELLER" | "ADMIN";
  isActive: boolean;
  storeName?: string;
  commissionRate?: number;
  isVerified?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Helper: map tab selection to API role query param                   */
/* ------------------------------------------------------------------ */

function localRoleToApi(role: Tab): string | undefined {
  const map: Record<Tab, string | undefined> = { all: undefined, buyers: "BUYER", sellers: "SELLER" };
  return map[role];
}

/* ================================================================== */

export default function AdminUsersPage() {
  /* ---- API data state ---- */
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  /* ---- UI state ---- */
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  /* ---- Debounce search input ---- */
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  /* ---- Fetch users from API ---- */
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      const roleParam = localRoleToApi(activeTab);
      if (roleParam) params.set("role", roleParam);
      if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Error ${res.status}`);
      }
      const data = await res.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /* ---- Counts for tabs (computed from current data when tab=all, otherwise show fetched total) ---- */
  const [allCount, setAllCount] = useState(0);
  const [buyerCount, setBuyerCount] = useState(0);
  const [sellerCount, setSellerCount] = useState(0);

  // Fetch counts separately so tabs always show correct totals
  const fetchCounts = useCallback(async () => {
    try {
      const [allRes, buyerRes, sellerRes] = await Promise.all([
        fetch("/api/admin/users?limit=1"),
        fetch("/api/admin/users?role=BUYER&limit=1"),
        fetch("/api/admin/users?role=SELLER&limit=1"),
      ]);
      if (allRes.ok) {
        const d = await allRes.json();
        setAllCount(d.pagination.total);
      }
      if (buyerRes.ok) {
        const d = await buyerRes.json();
        setBuyerCount(d.pagination.total);
      }
      if (sellerRes.ok) {
        const d = await sellerRes.json();
        setSellerCount(d.pagination.total);
      }
    } catch {
      // Non-critical; counts will just stay at their previous values
    }
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  /* ---- Get seller info for a user ---- */
  const getSellerInfo = (user: ApiUser): SellerProfile | null => {
    return user.sellerProfile;
  };

  /* ---- Toggle active status via PATCH ---- */
  const handleToggleActive = async (user: ApiUser) => {
    // Optimistic update
    setUsers((prev) =>
      prev.map((u) =>
        u.id === user.id ? { ...u, isActive: !u.isActive } : u
      )
    );
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (!res.ok) {
        // Revert on failure
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id ? { ...u, isActive: user.isActive } : u
          )
        );
        const data = await res.json().catch(() => null);
        alert(data?.error || "Error al actualizar estado");
      }
    } catch {
      // Revert on failure
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, isActive: user.isActive } : u
        )
      );
      alert("Error de conexion al actualizar estado");
    }
  };

  /* ---- Edit user via PATCH ---- */
  const handleEditUser = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: editingUser.name,
        email: editingUser.email,
        isActive: editingUser.isActive,
      };
      if (editingUser.role === "SELLER") {
        body.seller = {
          storeName: editingUser.storeName,
          commissionRate: editingUser.commissionRate,
          isVerified: editingUser.isVerified,
        };
      }
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.error || "Error al actualizar usuario");
        return;
      }
      setEditingUser(null);
      fetchUsers();
      fetchCounts();
    } catch {
      alert("Error de conexion al actualizar usuario");
    } finally {
      setSaving(false);
    }
  };

  /* ---- Deactivate user via DELETE ---- */
  const handleDeleteUser = async (userId: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.error || "Error al desactivar usuario");
        return;
      }
      setDeleteConfirm(null);
      fetchUsers();
      fetchCounts();
    } catch {
      alert("Error de conexion al desactivar usuario");
    } finally {
      setSaving(false);
    }
  };

  /* ---- Open edit modal ---- */
  const openEditModal = (user: ApiUser) => {
    const sellerInfo = getSellerInfo(user);
    setEditingUser({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      storeName: sellerInfo?.storeName || "",
      commissionRate: sellerInfo?.commissionRate || 10,
      isVerified: sellerInfo?.isVerified || false,
    });
  };

  /* ---- Tab config ---- */
  const tabs = [
    { key: "all" as Tab, label: "Todos", icon: UsersIcon, count: allCount },
    { key: "buyers" as Tab, label: "Compradores", icon: ShoppingBag, count: buyerCount },
    { key: "sellers" as Tab, label: "Vendedores", icon: Store, count: sellerCount },
  ];

  /* ---- Role badge ---- */
  const getRoleBadge = (role: "BUYER" | "SELLER" | "ADMIN") => {
    const styles: Record<string, string> = {
      ADMIN: "bg-red-100 text-red-700",
      SELLER: "bg-indigo-100 text-indigo-700",
      BUYER: "bg-slate-100 text-slate-700",
    };
    const labels: Record<string, string> = {
      ADMIN: "Admin",
      SELLER: "Vendedor",
      BUYER: "Comprador",
    };
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          styles[role]
        )}
      >
        {labels[role]}
      </span>
    );
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Gestion de usuarios
            </h1>
            <p className="mt-1 text-slate-500">
              Administra compradores, vendedores y administradores
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Agregar usuario
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
                activeTab === tab.key
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              <span
                className={cn(
                  "ml-1 rounded-full px-2 py-0.5 text-xs",
                  activeTab === tab.key
                    ? "bg-indigo-100 text-indigo-600"
                    : "bg-slate-200 text-slate-500"
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={fetchUsers}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reintentar
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-20 shadow-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              <p className="text-sm text-slate-500">Cargando usuarios...</p>
            </div>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Nombre
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Email
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Rol
                    </th>
                    {(activeTab === "all" || activeTab === "sellers") && (
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Tienda
                      </th>
                    )}
                    {(activeTab === "all" || activeTab === "sellers") && (
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Rating
                      </th>
                    )}
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Registro
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => {
                    const sellerInfo = getSellerInfo(user);
                    return (
                      <tr
                        key={user.id}
                        className="transition-colors hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
                              {user.name.charAt(0)}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900">
                                {user.name}
                              </span>
                              {sellerInfo?.isVerified && (
                                <BadgeCheck className="h-4 w-4 text-blue-500" />
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                          {user.email}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {getRoleBadge(user.role)}
                        </td>
                        {(activeTab === "all" || activeTab === "sellers") && (
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                            {sellerInfo ? (
                              <div>
                                <p className="font-medium">{sellerInfo.storeName}</p>
                                <p className="text-xs text-slate-500">
                                  {sellerInfo.commissionRate}% comision -- {sellerInfo.totalSales} ventas
                                </p>
                              </div>
                            ) : (
                              <span className="text-slate-400">--</span>
                            )}
                          </td>
                        )}
                        {(activeTab === "all" || activeTab === "sellers") && (
                          <td className="whitespace-nowrap px-6 py-4">
                            {sellerInfo ? (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                <span className="text-sm font-medium text-slate-700">
                                  {sellerInfo.rating}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">--</span>
                            )}
                          </td>
                        )}
                        <td className="whitespace-nowrap px-6 py-4">
                          <button
                            onClick={() => handleToggleActive(user)}
                            className={cn(
                              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                              user.isActive ? "bg-green-500" : "bg-slate-300"
                            )}
                          >
                            <span
                              className={cn(
                                "inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm",
                                user.isActive
                                  ? "translate-x-6"
                                  : "translate-x-1"
                              )}
                            />
                          </button>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditModal(user)}
                              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(user.id)}
                              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {users.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-12 text-center text-sm text-slate-500"
                      >
                        No se encontraron usuarios
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Agregar usuario
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Registro de usuarios</p>
                  <p className="mt-1">
                    Los nuevos usuarios se crean a traves del proceso de registro en la plataforma.
                    Desde aqui puedes gestionar los usuarios existentes usando las opciones de edicion y desactivacion.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Editar usuario
              </h3>
              <button
                onClick={() => setEditingUser(null)}
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
                  value={editingUser.name}
                  onChange={(e) =>
                    setEditingUser((prev) =>
                      prev ? { ...prev, name: e.target.value } : null
                    )
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) =>
                    setEditingUser((prev) =>
                      prev ? { ...prev, email: e.target.value } : null
                    )
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={editingUser.isActive}
                  onChange={(e) =>
                    setEditingUser((prev) =>
                      prev ? { ...prev, isActive: e.target.checked } : null
                    )
                  }
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label
                  htmlFor="edit-active"
                  className="text-sm text-slate-700"
                >
                  Activo
                </label>
              </div>
              {editingUser.role === "SELLER" && (
                <>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Nombre de tienda
                    </label>
                    <input
                      type="text"
                      value={editingUser.storeName}
                      onChange={(e) =>
                        setEditingUser((prev) =>
                          prev
                            ? { ...prev, storeName: e.target.value }
                            : null
                        )
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Tasa de comision (%)
                    </label>
                    <input
                      type="number"
                      value={editingUser.commissionRate}
                      onChange={(e) =>
                        setEditingUser((prev) =>
                          prev
                            ? {
                                ...prev,
                                commissionRate: Number(e.target.value),
                              }
                            : null
                        )
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      min={0}
                      max={100}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="edit-verified"
                      checked={editingUser.isVerified}
                      onChange={(e) =>
                        setEditingUser((prev) =>
                          prev
                            ? { ...prev, isVerified: e.target.checked }
                            : null
                        )
                      }
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label
                      htmlFor="edit-verified"
                      className="text-sm text-slate-700"
                    >
                      Vendedor verificado
                    </label>
                  </div>
                </>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditingUser(null)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditUser}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar cambios
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
              Desactivar usuario
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Esta seguro de que desea desactivar este usuario? El usuario no podra
              acceder a la plataforma.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteUser(deleteConfirm)}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Desactivar
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
