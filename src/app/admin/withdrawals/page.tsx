"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout";
import { StatsCard } from "@/components/ui";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import {
  formatCurrency,
  formatDateTime,
  cn,
} from "@/lib/utils";
import {
  withdrawalMethodLabels,
  withdrawalStatusLabels,
  withdrawalStatusColors,
} from "@/lib/constants";
import {
  ArrowDownToLine,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCheck,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Seller {
  id: string;
  storeName: string;
  user: { name: string; email: string };
}

interface Withdrawal {
  id: string;
  sellerId: string;
  amount: number;
  method: string;
  accountInfo: Record<string, string>;
  status: string;
  reviewNote: string | null;
  reviewedBy: string | null;
  createdAt: string;
  completedAt: string | null;
  seller: Seller;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Stats {
  pending: number;
  pendingAmount: number;
  approved: number;
  approvedAmount: number;
  completed: number;
  completedAmount: number;
  rejected: number;
  totalAmount: number;
}

/* ------------------------------------------------------------------ */
/*  Tabs                                                               */
/* ------------------------------------------------------------------ */

type TabKey = "all" | "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";

const tabs: { key: TabKey; label: string; icon: typeof Clock }[] = [
  { key: "all", label: "Todos", icon: ArrowDownToLine },
  { key: "PENDING", label: "Pendientes", icon: Clock },
  { key: "APPROVED", label: "Aprobados", icon: CheckCircle },
  { key: "REJECTED", label: "Rechazados", icon: XCircle },
  { key: "COMPLETED", label: "Completados", icon: CheckCheck },
];

/* ================================================================== */

export default function AdminWithdrawalsPage() {
  /* ---- Data state ---- */
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  /* ---- UI state ---- */
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  /* ---- Action modal state ---- */
  const [actionTarget, setActionTarget] = useState<Withdrawal | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | "complete" | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  /* ---- Fetch data ---- */
  const fetchWithdrawals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== "all") params.set("status", activeTab);
      params.set("page", page.toString());
      params.set("limit", limit.toString());

      const res = await fetch(`/api/admin/withdrawals?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setWithdrawals(data.withdrawals);
      setPagination(data.pagination);
      setStats(data.stats);
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  /* ---- Tab change ---- */
  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    setPage(1);
  };

  /* ---- Action handlers ---- */
  const openAction = (w: Withdrawal, type: "approve" | "reject" | "complete") => {
    setActionTarget(w);
    setActionType(type);
    setReviewNote("");
  };

  const closeAction = () => {
    setActionTarget(null);
    setActionType(null);
    setReviewNote("");
  };

  const handleAction = async () => {
    if (!actionTarget || !actionType) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/withdrawals/${actionTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionType, reviewNote: reviewNote || undefined }),
      });
      if (res.ok) {
        closeAction();
        fetchWithdrawals();
      }
    } catch (error) {
      console.error("Error performing action:", error);
    } finally {
      setActionLoading(false);
    }
  };

  /* ---- Computed ---- */
  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? 0;

  /* ---- Account info renderer ---- */
  const renderAccountInfo = (info: Record<string, string>) => {
    const entries = Object.entries(info).filter(([, v]) => v);
    if (entries.length === 0) return "—";
    return entries.map(([, v]) => v).join(" · ");
  };

  /* ---- Loading skeleton ---- */
  if (loading && withdrawals.length === 0) {
    return (
      <DashboardLayout role="admin">
        <div className="space-y-8">
          <div>
            <div className="h-9 w-72 animate-pulse rounded-lg bg-slate-200" />
            <div className="mt-2 h-5 w-96 animate-pulse rounded-lg bg-slate-100" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-200" />
            ))}
          </div>
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex-1 h-10 animate-pulse rounded-lg bg-slate-200" />
            ))}
          </div>
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="divide-y divide-slate-100">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
                  <div className="h-6 w-20 animate-pulse rounded-full bg-slate-100" />
                  <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
                </div>
              ))}
            </div>
          </div>
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
            Gestion de retiros
          </h1>
          <p className="mt-1 text-slate-500">
            Revisa y administra las solicitudes de retiro de los vendedores
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              icon={<Clock />}
              label="Pendientes"
              value={`${stats.pending}`}
            />
            <StatsCard
              icon={<DollarSign />}
              label="Monto pendiente"
              value={formatCurrency(stats.pendingAmount)}
            />
            <StatsCard
              icon={<CheckCircle />}
              label="Aprobados"
              value={`${stats.approved}`}
            />
            <StatsCard
              icon={<CheckCheck />}
              label="Completados"
              value={formatCurrency(stats.completedAmount)}
            />
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
                activeTab === tab.key
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Withdrawals Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Retiros ({total})
            </h2>
            {loading && <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />}
          </div>

          {withdrawals.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <ArrowDownToLine className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-sm font-medium text-slate-900">
                No se encontraron retiros
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {activeTab === "all"
                  ? "Aun no hay solicitudes de retiro."
                  : `No hay retiros con estado "${tabs.find((t) => t.key === activeTab)?.label}".`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Vendedor
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Metodo
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Datos de cuenta
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="transition-colors hover:bg-slate-50">
                      {/* Seller */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {w.seller.storeName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {w.seller.user.email}
                          </p>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="text-sm font-semibold text-slate-900">
                          {formatCurrency(w.amount)}
                        </span>
                      </td>

                      {/* Method */}
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                        {withdrawalMethodLabels[w.method] || w.method}
                      </td>

                      {/* Account Info */}
                      <td className="px-6 py-4 text-xs text-slate-500 max-w-[180px] truncate">
                        {renderAccountInfo(w.accountInfo)}
                      </td>

                      {/* Status */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <StatusBadge
                          status={w.status}
                          colorMap={withdrawalStatusColors}
                          labelMap={withdrawalStatusLabels}
                        />
                        {w.reviewNote && (
                          <p className="mt-1 text-[11px] text-slate-400 max-w-[150px] truncate">
                            {w.reviewNote}
                          </p>
                        )}
                      </td>

                      {/* Date */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <p className="text-sm text-slate-600">
                          {formatDateTime(w.createdAt)}
                        </p>
                        {w.completedAt && (
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            Completado: {formatDateTime(w.completedAt)}
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex gap-2">
                          {w.status === "PENDING" && (
                            <>
                              <button
                                onClick={() => openAction(w, "approve")}
                                className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-100"
                              >
                                Aprobar
                              </button>
                              <button
                                onClick={() => openAction(w, "reject")}
                                className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
                              >
                                Rechazar
                              </button>
                            </>
                          )}
                          {w.status === "APPROVED" && (
                            <button
                              onClick={() => openAction(w, "complete")}
                              className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                            >
                              Marcar completado
                            </button>
                          )}
                          {(w.status === "COMPLETED" || w.status === "REJECTED") && (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
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

      {/* Action Confirmation Modal */}
      <ConfirmModal
        isOpen={!!actionTarget && !!actionType}
        onClose={closeAction}
        onConfirm={handleAction}
        loading={actionLoading}
        title={
          actionType === "approve"
            ? "Aprobar retiro"
            : actionType === "reject"
              ? "Rechazar retiro"
              : "Marcar como completado"
        }
        message={
          actionTarget
            ? actionType === "approve"
              ? `Aprobar retiro de ${formatCurrency(actionTarget.amount)} para ${actionTarget.seller.storeName}. El vendedor sera notificado.`
              : actionType === "reject"
                ? `Rechazar retiro de ${formatCurrency(actionTarget.amount)} para ${actionTarget.seller.storeName}. El monto sera devuelto al balance del vendedor.`
                : `Marcar como completado el retiro de ${formatCurrency(actionTarget.amount)} para ${actionTarget.seller.storeName}. Confirma que el pago ya fue enviado.`
            : ""
        }
        confirmLabel={
          actionType === "approve"
            ? "Aprobar"
            : actionType === "reject"
              ? "Rechazar"
              : "Completar"
        }
        variant={
          actionType === "approve"
            ? "success"
            : actionType === "reject"
              ? "danger"
              : "info"
        }
      >
        {actionType === "reject" && (
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">
              Motivo del rechazo (opcional)
            </label>
            <textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={3}
              placeholder="Escribe el motivo del rechazo..."
              className="w-full rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100 resize-none"
            />
          </div>
        )}
        {actionType === "approve" && (
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">
              Nota (opcional)
            </label>
            <input
              type="text"
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="Nota interna..."
              className="w-full rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>
        )}
      </ConfirmModal>
    </DashboardLayout>
  );
}
