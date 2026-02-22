"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout";
import {
  formatCurrency,
  formatDateTime,
  getRefundStatusLabel,
  getRefundStatusColor,
  getPaymentMethodLabel,
  cn,
} from "@/lib/utils";
import {
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Calculator,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types matching the API response from GET /api/admin/refunds        */
/* ------------------------------------------------------------------ */

interface Seller {
  storeName: string;
}

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  commissionRate: number;
  paymentMethod: string;
  seller: Seller;
}

interface Buyer {
  id: string;
  name: string;
  email: string;
}

interface Refund {
  id: string;
  orderId: string;
  buyerId: string;
  refundType: "FULL" | "PARTIAL_PRORATED";
  originalAmount: number;
  refundAmount: number;
  reason: string | null;
  status: string;
  totalDays: number | null;
  usedDays: number | null;
  remainingDays: number | null;
  processedAt: string | null;
  createdAt: string;
  order: Order;
  buyer: Buyer;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/* ------------------------------------------------------------------ */
/*  Filter tab configuration                                           */
/* ------------------------------------------------------------------ */

type TabKey = "all" | "processed" | "pending" | "rejected";

const tabs: {
  key: TabKey;
  label: string;
  apiStatus: string | undefined;
  icon: typeof RotateCcw;
}[] = [
  { key: "all", label: "Todos", apiStatus: undefined, icon: RotateCcw },
  { key: "processed", label: "Procesados", apiStatus: "PROCESSED", icon: CheckCircle },
  { key: "pending", label: "Pendientes", apiStatus: "PENDING", icon: Clock },
  { key: "rejected", label: "Rechazados", apiStatus: "REJECTED", icon: XCircle },
];

/* ------------------------------------------------------------------ */
/*  Refund type labels                                                 */
/* ------------------------------------------------------------------ */

function getRefundTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    FULL: "Completo",
    PARTIAL_PRORATED: "Prorrateado",
  };
  return labels[type] || type;
}

/* ================================================================== */

export default function AdminRefundsPage() {
  /* ---- API data state ---- */
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  /* ---- UI state ---- */
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  /* ---- Fetch refunds from API ---- */
  const fetchRefunds = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      const tab = tabs.find((t) => t.key === activeTab);
      if (tab?.apiStatus) params.set("status", tab.apiStatus);
      params.set("page", page.toString());
      params.set("limit", limit.toString());

      const res = await fetch(`/api/admin/refunds?${params}`);
      if (!res.ok) throw new Error("Failed to fetch refunds");
      const data = await res.json();
      setRefunds(data.refunds);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching refunds:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page]);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  /* ---- Tab change handler ---- */
  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    setPage(1);
  };

  /* ---- Computed values ---- */
  const totalPages = pagination?.totalPages ?? 1;
  const total = pagination?.total ?? 0;

  /* ---- Status icon mapping ---- */
  const getStatusIcon = (status: string) => {
    const icons: Record<string, typeof CheckCircle> = {
      processed: CheckCircle,
      pending: Clock,
      rejected: XCircle,
    };
    return icons[status] || RotateCcw;
  };

  /* ---- Loading skeleton ---- */
  if (loading && refunds.length === 0) {
    return (
      <DashboardLayout role="admin">
        <div className="space-y-8">
          {/* Header skeleton */}
          <div>
            <div className="h-9 w-72 animate-pulse rounded-lg bg-slate-200" />
            <div className="mt-2 h-5 w-96 animate-pulse rounded-lg bg-slate-100" />
          </div>

          {/* Tabs skeleton */}
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex-1 h-10 animate-pulse rounded-lg bg-slate-200"
              />
            ))}
          </div>

          {/* Table skeleton */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
              <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
            </div>
            <div className="divide-y divide-slate-100">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
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
            Gestion de reembolsos
          </h1>
          <p className="mt-1 text-slate-500">
            Visualiza todos los reembolsos procesados en la plataforma
          </p>
        </div>

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

        {/* Refunds Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Reembolsos ({total})
            </h2>
            {loading && (
              <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
            )}
          </div>

          {refunds.length === 0 ? (
            /* Empty state */
            <div className="px-6 py-16 text-center">
              <RotateCcw className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-sm font-medium text-slate-900">
                No se encontraron reembolsos
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {activeTab === "all"
                  ? "Aun no se han registrado reembolsos en la plataforma."
                  : `No hay reembolsos con estado "${tabs.find((t) => t.key === activeTab)?.label}" actualmente.`}
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
                      # Orden
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Comprador
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Vendedor
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Monto Original
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Reembolso
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {refunds.map((refund) => {
                    const StatusIcon = getStatusIcon(refund.status.toLowerCase());
                    const isProrated = refund.refundType === "PARTIAL_PRORATED";

                    return (
                      <tr
                        key={refund.id}
                        className="transition-colors hover:bg-slate-50"
                      >
                        {/* ID */}
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="font-mono text-xs text-slate-500">
                            {refund.id.slice(0, 8)}...
                          </span>
                        </td>

                        {/* Order Number */}
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="text-sm font-medium text-slate-900">
                            #{refund.order.orderNumber}
                          </span>
                        </td>

                        {/* Buyer */}
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {refund.buyer.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {refund.buyer.email}
                            </p>
                          </div>
                        </td>

                        {/* Seller */}
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                          {refund.order.seller.storeName}
                        </td>

                        {/* Refund Type */}
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                                isProrated
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-blue-100 text-blue-700"
                              )}
                            >
                              {getRefundTypeLabel(refund.refundType)}
                            </span>
                          </div>
                          {/* Prorated calculation details */}
                          {isProrated &&
                            refund.totalDays !== null &&
                            refund.usedDays !== null &&
                            refund.remainingDays !== null && (
                              <div className="mt-1.5 flex items-start gap-1.5">
                                <Calculator className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
                                <span className="text-[11px] leading-tight text-slate-500">
                                  {refund.totalDays}d total, {refund.usedDays}d
                                  usados, {refund.remainingDays}d restantes
                                </span>
                              </div>
                            )}
                        </td>

                        {/* Original Amount */}
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                          {formatCurrency(refund.originalAmount)}
                        </td>

                        {/* Refund Amount */}
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="text-sm font-semibold text-indigo-600">
                            {formatCurrency(refund.refundAmount)}
                          </span>
                          {isProrated && refund.originalAmount > 0 && (
                            <p className="mt-0.5 text-[11px] text-slate-400">
                              {Math.round(
                                (refund.refundAmount / refund.originalAmount) *
                                  100
                              )}
                              % del original
                            </p>
                          )}
                        </td>

                        {/* Status */}
                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                              getRefundStatusColor(refund.status.toLowerCase())
                            )}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {getRefundStatusLabel(refund.status.toLowerCase())}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="whitespace-nowrap px-6 py-4">
                          <div>
                            <p className="text-sm text-slate-600">
                              {formatDateTime(refund.createdAt)}
                            </p>
                            {refund.processedAt && (
                              <p className="mt-0.5 text-[11px] text-slate-400">
                                Procesado: {formatDateTime(refund.processedAt)}
                              </p>
                            )}
                          </div>
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

        {/* Info Card - Auto-approval notice */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Reembolsos automaticos
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Los reembolsos de productos de streaming se procesan
                automaticamente. El monto se calcula de forma prorrateada segun
                los dias restantes de la suscripcion. El reembolso se acredita
                directamente a la billetera del comprador.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
