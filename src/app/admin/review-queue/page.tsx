"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout";
import {
  formatCurrency,
  formatDateTime,
  getStatusColor,
  getStatusLabel,
  getPaymentMethodLabel,
  cn,
} from "@/lib/utils";
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types matching the API response                                    */
/* ------------------------------------------------------------------ */

interface OrderBuyer {
  name: string;
  email: string;
  createdAt: string;
}

interface OrderSeller {
  storeName: string;
}

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface OrderPayment {
  paymentMethod: string;
  amount: number;
  status: string;
}

interface ReviewOrder {
  id: string;
  orderNumber: string;
  buyerId: string;
  sellerId: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  isHighValue: boolean;
  requiresManualReview: boolean;
  deliveryScheduledAt: string | null;
  createdAt: string;
  buyer: OrderBuyer;
  seller: OrderSeller;
  items: OrderItem[];
  payment: OrderPayment;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/* ================================================================== */

export default function AdminReviewQueuePage() {
  /* ---- API data state ---- */
  const [orders, setOrders] = useState<ReviewOrder[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---- UI state ---- */
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [processingDelayed, setProcessingDelayed] = useState(false);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);

  const limit = 20;

  /* ---- Fetch orders ---- */
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", limit.toString());

      const res = await fetch(`/api/admin/review-queue?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Error ${res.status}`);
      }
      const data = await res.json();
      setOrders(data.orders);
      setPagination(data.pagination);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar la cola de revision"
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /* ---- Approve order ---- */
  const handleApprove = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      const res = await fetch(`/api/admin/review-queue/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.error || "Error al aprobar la orden");
        return;
      }
      // Remove from list optimistically
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch {
      alert("Error de conexion al aprobar la orden");
    } finally {
      setActionLoading(null);
    }
  };

  /* ---- Reject order ---- */
  const handleReject = async () => {
    if (!rejectModal) return;
    if (!rejectReason.trim()) {
      setRejectError("Debe ingresar un motivo de rechazo");
      return;
    }

    setActionLoading(rejectModal);
    setRejectError(null);
    try {
      const res = await fetch(`/api/admin/review-queue/${rejectModal}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason: rejectReason.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.error || "Error al rechazar la orden");
        return;
      }
      // Remove from list optimistically
      setOrders((prev) => prev.filter((o) => o.id !== rejectModal));
      closeRejectModal();
    } catch {
      alert("Error de conexion al rechazar la orden");
    } finally {
      setActionLoading(null);
    }
  };

  /* ---- Process delayed deliveries ---- */
  const handleProcessDelayed = async () => {
    setProcessingDelayed(true);
    try {
      const res = await fetch("/api/admin/process-delayed", {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.error || "Error al procesar entregas pendientes");
        return;
      }
      // Refresh the queue after processing
      fetchOrders();
    } catch {
      alert("Error de conexion al procesar entregas pendientes");
    } finally {
      setProcessingDelayed(false);
    }
  };

  /* ---- Modal helpers ---- */
  const openRejectModal = (orderId: string) => {
    setRejectModal(orderId);
    setRejectReason("");
    setRejectError(null);
  };

  const closeRejectModal = () => {
    setRejectModal(null);
    setRejectReason("");
    setRejectError(null);
  };

  /* ---- Derived ---- */
  const totalPages = pagination?.totalPages ?? 1;

  /* ---- Loading skeleton ---- */
  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="space-y-6">
          {/* Header skeleton */}
          <div>
            <div className="h-9 w-64 animate-pulse rounded-lg bg-slate-200" />
            <div className="mt-2 h-5 w-96 animate-pulse rounded-lg bg-slate-100" />
          </div>

          {/* Action bar skeleton */}
          <div className="flex items-center justify-between">
            <div className="h-10 w-56 animate-pulse rounded-lg bg-slate-200" />
          </div>

          {/* Table skeleton */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
              <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
            </div>
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4">
                  <div className="h-5 w-20 animate-pulse rounded bg-slate-100" />
                  <div className="h-5 w-32 animate-pulse rounded bg-slate-100" />
                  <div className="h-5 w-20 animate-pulse rounded bg-slate-100" />
                  <div className="h-5 w-24 animate-pulse rounded bg-slate-100" />
                  <div className="h-5 w-20 animate-pulse rounded bg-slate-100" />
                  <div className="h-5 w-28 animate-pulse rounded bg-slate-100" />
                  <div className="h-8 w-40 animate-pulse rounded bg-slate-100" />
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Cola de Revision
            </h1>
            <p className="mt-1 text-slate-500">
              Ordenes pendientes de revision manual y entregas demoradas
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleProcessDelayed}
              disabled={processingDelayed}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processingDelayed ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Procesar Entregas Pendientes
            </button>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={fetchOrders}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reintentar
            </button>
          </div>
        )}

        {/* Orders Table */}
        {!error && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Ordenes en revision
                  </h2>
                  <p className="text-sm text-slate-500">
                    {pagination?.total ?? 0} orden{(pagination?.total ?? 0) !== 1 ? "es" : ""} pendiente{(pagination?.total ?? 0) !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>

            {orders.length === 0 ? (
              /* Empty state */
              <div className="px-6 py-16 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-green-300" />
                <h3 className="mt-4 text-lg font-semibold text-slate-900">
                  Sin ordenes pendientes
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  No hay ordenes que requieran revision manual en este momento.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          # Orden
                        </th>
                        <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Comprador
                        </th>
                        <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Monto
                        </th>
                        <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                          Metodo Pago
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
                      {orders.map((order) => (
                        <tr
                          key={order.id}
                          className="transition-colors hover:bg-slate-50"
                        >
                          {/* # Orden */}
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-medium text-indigo-600">
                                {order.orderNumber}
                              </span>
                              {order.isHighValue && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                                  <AlertTriangle className="h-3 w-3" />
                                  Alto valor
                                </span>
                              )}
                              {order.requiresManualReview && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-700">
                                  <ShieldAlert className="h-3 w-3" />
                                  Manual
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Comprador */}
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
                                {order.buyer.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">
                                  {order.buyer.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {order.buyer.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Monto */}
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                            {formatCurrency(order.totalAmount)}
                          </td>

                          {/* Metodo Pago */}
                          <td className="whitespace-nowrap px-6 py-4">
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                              {getPaymentMethodLabel(order.paymentMethod)}
                            </span>
                          </td>

                          {/* Estado */}
                          <td className="whitespace-nowrap px-6 py-4">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                                getStatusColor(order.status)
                              )}
                            >
                              {order.status === "under_review" ? (
                                <ShieldAlert className="h-3 w-3" />
                              ) : (
                                <Clock className="h-3 w-3" />
                              )}
                              {getStatusLabel(order.status)}
                            </span>
                          </td>

                          {/* Fecha */}
                          <td className="whitespace-nowrap px-6 py-4">
                            <div>
                              <p className="text-sm text-slate-700">
                                {formatDateTime(order.createdAt)}
                              </p>
                              {order.deliveryScheduledAt && (
                                <p className="mt-0.5 text-xs text-amber-600">
                                  Entrega: {formatDateTime(order.deliveryScheduledAt)}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Acciones */}
                          <td className="whitespace-nowrap px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleApprove(order.id)}
                                disabled={actionLoading === order.id}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {actionLoading === order.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-3.5 w-3.5" />
                                )}
                                Aprobar y Entregar
                              </button>
                              <button
                                onClick={() => openRejectModal(order.id)}
                                disabled={actionLoading === order.id}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Rechazar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3">
                    <p className="text-sm text-slate-500">
                      Pagina {page} de {totalPages} ({pagination?.total ?? 0} ordenes)
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
              </>
            )}
          </div>
        )}
      </div>

      {/* Rejection Reason Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Rechazar orden
                </h3>
              </div>
              <button
                onClick={closeRejectModal}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Motivo del rechazo
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => {
                    setRejectReason(e.target.value);
                    if (rejectError) setRejectError(null);
                  }}
                  placeholder="Ingrese el motivo por el cual se rechaza esta orden..."
                  rows={4}
                  className={cn(
                    "w-full rounded-lg border px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1",
                    rejectError
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                  )}
                />
                {rejectError && (
                  <p className="mt-1.5 text-xs text-red-600">{rejectError}</p>
                )}
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <p className="text-sm text-amber-800">
                  Esta accion cancelara la orden y notificara al comprador con el
                  motivo proporcionado. Esta accion no se puede deshacer.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeRejectModal}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading === rejectModal}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading === rejectModal && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Confirmar rechazo
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
