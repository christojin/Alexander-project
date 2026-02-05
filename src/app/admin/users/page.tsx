"use client";

import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout";
import { allUsers, sellers as mockSellers } from "@/data/mock/users";
import { formatDate, cn, generateId } from "@/lib/utils";
import type { User, Seller, UserRole } from "@/types";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Star,
  BadgeCheck,
  Shield,
  ShoppingBag,
  Store,
  Users as UsersIcon,
} from "lucide-react";

type Tab = "all" | "buyers" | "sellers";

interface EditingUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  storeName?: string;
  commissionRate?: number;
  isVerified?: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>(allUsers);
  const [sellerData, setSellerData] = useState<Seller[]>(mockSellers);
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<EditingUser | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [newUser, setNewUser] = useState<EditingUser>({
    id: "",
    name: "",
    email: "",
    role: "buyer",
    isActive: true,
    storeName: "",
    commissionRate: 10,
    isVerified: false,
  });

  const filteredUsers = useMemo(() => {
    let list = users;
    if (activeTab === "buyers") list = list.filter((u) => u.role === "buyer");
    if (activeTab === "sellers") list = list.filter((u) => u.role === "seller");
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, activeTab, search]);

  const getSellerInfo = (userId: string): Seller | undefined => {
    return sellerData.find((s) => s.id === userId);
  };

  const handleToggleActive = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, isActive: !u.isActive } : u
      )
    );
    setSellerData((prev) =>
      prev.map((s) =>
        s.id === userId ? { ...s, isActive: !s.isActive } : s
      )
    );
  };

  const handleAddUser = () => {
    const id = `${newUser.role}-${generateId()}`;
    const user: User = {
      id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      isActive: newUser.isActive,
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, user]);
    if (newUser.role === "seller") {
      const seller: Seller = {
        ...user,
        role: "seller",
        storeName: newUser.storeName || "",
        commissionRate: newUser.commissionRate || 10,
        totalSales: 0,
        totalEarnings: 0,
        rating: 0,
        totalReviews: 0,
        isVerified: newUser.isVerified || false,
      };
      setSellerData((prev) => [...prev, seller]);
    }
    setShowAddModal(false);
    setNewUser({
      id: "",
      name: "",
      email: "",
      role: "buyer",
      isActive: true,
      storeName: "",
      commissionRate: 10,
      isVerified: false,
    });
  };

  const handleEditUser = () => {
    if (!editingUser) return;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === editingUser.id
          ? { ...u, name: editingUser.name, email: editingUser.email, isActive: editingUser.isActive }
          : u
      )
    );
    if (editingUser.role === "seller") {
      setSellerData((prev) =>
        prev.map((s) =>
          s.id === editingUser.id
            ? {
                ...s,
                name: editingUser.name,
                email: editingUser.email,
                isActive: editingUser.isActive,
                storeName: editingUser.storeName || s.storeName,
                commissionRate: editingUser.commissionRate ?? s.commissionRate,
                isVerified: editingUser.isVerified ?? s.isVerified,
              }
            : s
        )
      );
    }
    setEditingUser(null);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setSellerData((prev) => prev.filter((s) => s.id !== userId));
    setDeleteConfirm(null);
  };

  const openEditModal = (user: User) => {
    const sellerInfo = getSellerInfo(user.id);
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

  const tabs = [
    { key: "all" as Tab, label: "Todos", icon: UsersIcon, count: users.length },
    {
      key: "buyers" as Tab,
      label: "Compradores",
      icon: ShoppingBag,
      count: users.filter((u) => u.role === "buyer").length,
    },
    {
      key: "sellers" as Tab,
      label: "Vendedores",
      icon: Store,
      count: users.filter((u) => u.role === "seller").length,
    },
  ];

  const getRoleBadge = (role: UserRole) => {
    const styles: Record<UserRole, string> = {
      admin: "bg-red-100 text-red-700",
      seller: "bg-indigo-100 text-indigo-700",
      buyer: "bg-slate-100 text-slate-700",
    };
    const labels: Record<UserRole, string> = {
      admin: "Admin",
      seller: "Vendedor",
      buyer: "Comprador",
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

        {/* Table */}
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
                {filteredUsers.map((user) => {
                  const sellerInfo = getSellerInfo(user.id);
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
                              <span className="text-xs text-slate-400">
                                ({sellerInfo.totalReviews})
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">--</span>
                          )}
                        </td>
                      )}
                      <td className="whitespace-nowrap px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(user.id)}
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
                {filteredUsers.length === 0 && (
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
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Nombre
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="email@ejemplo.com"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Rol
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser((prev) => ({
                      ...prev,
                      role: e.target.value as UserRole,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="buyer">Comprador</option>
                  <option value="seller">Vendedor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {newUser.role === "seller" && (
                <>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Nombre de tienda
                    </label>
                    <input
                      type="text"
                      value={newUser.storeName}
                      onChange={(e) =>
                        setNewUser((prev) => ({
                          ...prev,
                          storeName: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="Nombre de la tienda"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Tasa de comision (%)
                    </label>
                    <input
                      type="number"
                      value={newUser.commissionRate}
                      onChange={(e) =>
                        setNewUser((prev) => ({
                          ...prev,
                          commissionRate: Number(e.target.value),
                        }))
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      min={0}
                      max={100}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="new-verified"
                      checked={newUser.isVerified}
                      onChange={(e) =>
                        setNewUser((prev) => ({
                          ...prev,
                          isVerified: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label
                      htmlFor="new-verified"
                      className="text-sm text-slate-700"
                    >
                      Vendedor verificado
                    </label>
                  </div>
                </>
              )}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="new-active"
                  checked={newUser.isActive}
                  onChange={(e) =>
                    setNewUser((prev) => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label
                  htmlFor="new-active"
                  className="text-sm text-slate-700"
                >
                  Activo
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddUser}
                disabled={!newUser.name || !newUser.email}
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Agregar
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
              {editingUser.role === "seller" && (
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
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
              >
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
              Eliminar usuario
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Esta seguro de que desea eliminar este usuario? Esta accion no se
              puede deshacer.
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
