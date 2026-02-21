"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout";
import { formatDate, cn } from "@/lib/utils";
import {
  KeyRound,
  Search,
  Loader2,
  CheckCircle2,
  ShoppingBag,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Code {
  id: string;
  productName: string;
  sellerStore: string;
  status: "AVAILABLE" | "SOLD" | "RESERVED" | "EXPIRED";
  expiresAt: string | null;
  soldAt: string | null;
  buyerId: string | null;
  createdAt: string;
}

interface StatusCounts {
  available: number;
  sold: number;
  reserved: number;
  expired: number;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  AVAILABLE: { label: "Disponible", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  SOLD: { label: "Vendido", color: "bg-blue-100 text-blue-700", icon: ShoppingBag },
  RESERVED: { label: "Reservado", color: "bg-amber-100 text-amber-700", icon: Clock },
  EXPIRED: { label: "Expirado", color: "bg-red-100 text-red-700", icon: AlertTriangle },
};

export default function AdminCodesPage() {
  const [codes, setCodes] = useState<Code[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    available: 0,
    sold: 0,
    reserved: 0,
    expired: 0,
  });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 50;

  const fetchCodes = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);
      params.set("page", page.toString());
      params.set("limit", limit.toString());

      const res = await fetch(`/api/admin/codes?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCodes(data.codes);
      setTotal(data.total);
      setStatusCounts(data.statusCounts);
    } catch (error) {
      console.error("Error fetching codes:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page]);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const totalCodes =
    statusCounts.available + statusCounts.sold + statusCounts.reserved + statusCounts.expired;
  const totalPages = Math.ceil(total / limit);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status === statusFilter ? "" : status);
    setPage(1);
  };

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
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Estado de Codigos
          </h1>
          <p className="mt-1 text-slate-500">
            Revisa el estado de todos los codigos de gift cards en la plataforma
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total</p>
                <p className="text-2xl font-bold text-slate-900">{totalCodes}</p>
              </div>
            </div>
          </div>
          {(["available", "sold", "reserved", "expired"] as const).map((status) => {
            const key = status.toUpperCase() as keyof typeof statusConfig;
            const config = statusConfig[key];
            const Icon = config.icon;
            return (
              <button
                key={status}
                onClick={() => handleStatusFilter(key)}
                className={cn(
                  "rounded-xl border p-5 shadow-sm text-left transition-all",
                  statusFilter === key
                    ? "border-indigo-300 ring-1 ring-indigo-300"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", config.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">{config.label}</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {statusCounts[status]}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar por nombre de producto..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          {statusFilter && (
            <button
              onClick={() => { setStatusFilter(""); setPage(1); }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Limpiar filtro
            </button>
          )}
        </div>

        {/* Codes Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Codigos ({total})
            </h2>
          </div>
          {codes.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <KeyRound className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">
                No se encontraron codigos con los filtros seleccionados.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      ID
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Producto
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Vendedor
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Expiracion
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Fecha venta
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Creado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {codes.map((code) => {
                    const config = statusConfig[code.status];
                    const Icon = config.icon;
                    return (
                      <tr key={code.id} className="transition-colors hover:bg-slate-50">
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="font-mono text-xs text-slate-500">
                            {code.id.slice(0, 8)}...
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-slate-900">
                            {code.productName}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                          {code.sellerStore}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                            config.color
                          )}>
                            <Icon className="h-3 w-3" />
                            {config.label}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                          {code.expiresAt ? formatDate(code.expiresAt) : "—"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                          {code.soldAt ? formatDate(code.soldAt) : "—"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                          {formatDate(code.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3">
              <p className="text-sm text-slate-500">
                Pagina {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
