"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Package,
  TicketCheck,
  CreditCard,
  Calendar,
  Store,
  ShoppingBag,
  Tv,
  Gift,
  Mail,
  User,
  Lock,
  CalendarDays,
  Loader2,
  RotateCcw,
  Wallet,
  X,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import type { Order, OrderStatus } from "@/types";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getStatusColor,
  getStatusLabel,
  getPaymentMethodLabel,
  cn,
} from "@/lib/utils";

type StatusFilter = "all" | OrderStatus;

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "Todos", value: "all" },
  { label: "Pendiente", value: "pending" },
  { label: "Completado", value: "completed" },
  { label: "En revision", value: "under_review" },
  { label: "Cancelado", value: "cancelled" },
];

export default function BuyerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [revealedCodes, setRevealedCodes] = useState<Set<string>>(new Set());
  const [refundModal, setRefundModal] = useState<string | null>(null); // orderId
  const [refundReason, setRefundReason] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundResult, setRefundResult] = useState<Record<string, { status: string; amount: number; totalDays?: number; usedDays?: number; remainingDays?: number }>>({});

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/buyer/orders");
        if (!res.ok) {
          throw new Error("Error al cargar los pedidos");
        }
        const data: Order[] = await res.json();
        setOrders(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cargar los pedidos"
        );
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        order.productName.toLowerCase().includes(query) ||
        order.sellerName.toLowerCase().includes(query) ||
        order.orderNumber.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [orders, searchQuery, statusFilter]);

  const toggleExpand = (orderId: string) => {
    setExpandedOrder((prev) => (prev === orderId ? null : orderId));
  };

  const toggleRevealCode = (orderId: string) => {
    setRevealedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const maskCode = (code: string): string => {
    const parts = code.split("-");
    if (parts.length <= 1) return "****-****-" + code.slice(-4);
    const lastPart = parts[parts.length - 1];
    const maskedParts = parts.slice(0, -1).map(() => "****");
    return [...maskedParts, lastPart].join("-");
  };

  const handleRequestRefund = async (orderId: string) => {
    try {
      setRefundLoading(true);
      const res = await fetch(`/api/buyer/orders/${orderId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: refundReason || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Error al solicitar reembolso");
        return;
      }
      setRefundResult((prev) => ({
        ...prev,
        [orderId]: {
          status: "processed",
          amount: data.refund.refundAmount,
          totalDays: data.refund.totalDays,
          usedDays: data.refund.usedDays,
          remainingDays: data.refund.remainingDays,
        },
      }));
      setRefundModal(null);
      setRefundReason("");
      // Update order status in local state
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "refunded" as const } : o))
      );
    } catch {
      alert("Error al solicitar reembolso");
    } finally {
      setRefundLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="buyer">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="buyer">
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            Reintentar
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="buyer">
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Mis Pedidos</h1>
          <p className="mt-1 text-sm text-surface-500">
            Historial completo de todas tus compras en VirtuMall.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="Buscar por producto, vendedor o ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-surface-200 bg-white py-2.5 pl-10 pr-4 text-sm text-surface-900 placeholder:text-surface-400 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-surface-200 bg-surface-50 p-1">
            <Filter className="ml-2 h-4 w-4 shrink-0 text-surface-400 sm:ml-1" />
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={cn(
                  "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
                  statusFilter === filter.value
                    ? "bg-white text-surface-900 shadow-sm"
                    : "text-surface-500 hover:text-surface-700"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-surface-500">
          Mostrando{" "}
          <span className="font-medium text-surface-700">
            {filteredOrders.length}
          </span>{" "}
          {filteredOrders.length === 1 ? "pedido" : "pedidos"}
        </p>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="rounded-xl border border-surface-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-100">
              <ShoppingBag className="h-6 w-6 text-surface-400" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-surface-900">
              No se encontraron pedidos
            </h3>
            <p className="mt-1 text-sm text-surface-500">
              Intenta con otros filtros o terminos de busqueda.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const isExpanded = expandedOrder === order.id;
              const isRevealed = revealedCodes.has(order.id);
              return (
                <div
                  key={order.id}
                  className="rounded-xl border border-surface-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Order Card Header */}
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      {/* Left: Product Info */}
                      <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                        {/* Product Image Placeholder */}
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-surface-100">
                          <Package className="h-6 w-6 text-surface-400" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-surface-900">
                              {order.productName}
                            </h3>
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                                getStatusColor(order.status)
                              )}
                            >
                              {getStatusLabel(order.status)}
                            </span>
                          </div>

                          {/* Meta Info */}
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                            <span className="flex items-center gap-1.5 text-xs text-surface-500">
                              <Store className="h-3.5 w-3.5" />
                              {order.sellerName}
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-surface-500">
                              <CreditCard className="h-3.5 w-3.5" />
                              {getPaymentMethodLabel(order.paymentMethod)}
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-surface-500">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(order.createdAt)}
                            </span>
                          </div>

                          {/* Order Number */}
                          <p className="mt-1.5 text-xs text-surface-400">
                            {order.orderNumber}
                            {order.quantity > 1 && (
                              <span className="ml-2">
                                x{order.quantity} unidades
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Right: Price and Actions */}
                      <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-start gap-3">
                        <p className="text-lg font-bold text-surface-900">
                          {formatCurrency(order.totalAmount)}
                        </p>
                        <button
                          onClick={() => toggleExpand(order.id)}
                          className={cn(
                            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                            isExpanded
                              ? "bg-primary-50 text-primary-700"
                              : "bg-surface-100 text-surface-600 hover:bg-surface-200"
                          )}
                        >
                          {isExpanded ? "Ocultar" : "Ver detalle"}
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="border-t border-surface-100 bg-surface-50/50 p-4 sm:p-5">
                      <div className="space-y-4">
                        {/* Order Details Grid */}
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <div>
                            <p className="text-xs font-medium text-surface-400 uppercase tracking-wider">
                              Precio unitario
                            </p>
                            <p className="mt-0.5 text-sm font-semibold text-surface-800">
                              {formatCurrency(order.unitPrice)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-surface-400 uppercase tracking-wider">
                              Cantidad
                            </p>
                            <p className="mt-0.5 text-sm font-semibold text-surface-800">
                              {order.quantity}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-surface-400 uppercase tracking-wider">
                              Pago
                            </p>
                            <p className="mt-0.5 text-sm font-semibold text-surface-800">
                              {getPaymentMethodLabel(order.paymentMethod)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-surface-400 uppercase tracking-wider">
                              Fecha
                            </p>
                            <p className="mt-0.5 text-sm font-semibold text-surface-800">
                              {formatDateTime(order.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Delivery Info - type-specific */}
                        {order.productType === "streaming" ? (
                          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-surface-800 mb-3">
                              <Tv className="h-4 w-4 text-amber-500" />
                              Credenciales de streaming
                            </h4>
                            {order.status === "completed" && order.streamingCredentials ? (
                              <div className="space-y-2">
                                {[
                                  { icon: <Mail className="h-3.5 w-3.5" />, label: "Correo", value: order.streamingCredentials.email },
                                  { icon: <User className="h-3.5 w-3.5" />, label: "Usuario", value: order.streamingCredentials.username },
                                  { icon: <Lock className="h-3.5 w-3.5" />, label: "Contrasena", value: order.streamingCredentials.password },
                                  { icon: <CalendarDays className="h-3.5 w-3.5" />, label: "Expira", value: formatDate(order.streamingCredentials.expirationDate) },
                                ].map((field) => (
                                  <div
                                    key={field.label}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-surface-200 bg-white px-4 py-2.5"
                                  >
                                    <div className="flex items-center gap-2 text-xs text-surface-500">
                                      {field.icon}
                                      {field.label}
                                    </div>
                                    <code className="text-sm font-mono text-surface-700">
                                      {field.label === "Contrasena"
                                        ? isRevealed
                                          ? field.value
                                          : "••••••••"
                                        : field.value}
                                    </code>
                                  </div>
                                ))}
                                <button
                                  onClick={() => toggleRevealCode(order.id)}
                                  className="mt-1 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-50"
                                >
                                  {isRevealed ? (
                                    <>
                                      <EyeOff className="h-3.5 w-3.5" />
                                      Ocultar contrasena
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="h-3.5 w-3.5" />
                                      Revelar contrasena
                                    </>
                                  )}
                                </button>
                              </div>
                            ) : (
                              <p className="text-sm text-surface-500 italic">
                                Las credenciales estaran disponibles cuando el pedido sea completado.
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="rounded-lg border border-surface-200 bg-white p-4">
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-surface-800 mb-3">
                              <Gift className="h-4 w-4 text-sky-500" />
                              Codigos digitales
                            </h4>
                            {order.status === "completed" &&
                            order.digitalCodes.length > 0 ? (
                              <div className="space-y-2">
                                {order.digitalCodes.map((code, idx) => (
                                  <div
                                    key={idx}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5"
                                  >
                                    <code className="text-sm font-mono text-surface-700 break-all">
                                      {isRevealed ? code : maskCode(code)}
                                    </code>
                                    <button
                                      onClick={() =>
                                        toggleRevealCode(order.id)
                                      }
                                      className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-50"
                                    >
                                      {isRevealed ? (
                                        <>
                                          <EyeOff className="h-3.5 w-3.5" />
                                          Ocultar
                                        </>
                                      ) : (
                                        <>
                                          <Eye className="h-3.5 w-3.5" />
                                          Revelar
                                        </>
                                      )}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : order.digitalCodes.length === 0 ? (
                              <p className="text-sm text-surface-500 italic">
                                Aun no hay codigos disponibles para este pedido.
                              </p>
                            ) : (
                              <p className="text-sm text-surface-500 italic">
                                Los codigos estaran disponibles cuando el pedido
                                sea completado.
                              </p>
                            )}
                          </div>
                        )}

                        {/* Refund status display */}
                        {refundResult[order.id] && (
                          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-green-800">
                              <Wallet className="h-4 w-4" />
                              Reembolso de {formatCurrency(refundResult[order.id].amount)} acreditado a tu billetera
                            </div>
                            {refundResult[order.id].totalDays && (
                              <p className="mt-1 text-xs text-green-600">
                                Prorrateado: {refundResult[order.id].remainingDays}/{refundResult[order.id].totalDays} dias restantes
                              </p>
                            )}
                          </div>
                        )}

                        {/* Actions: Refund + Open Ticket */}
                        <div className="flex flex-wrap justify-end gap-2">
                          {/* Refund button: only for completed streaming orders without existing refund */}
                          {order.status === "completed" &&
                            order.productType === "streaming" &&
                            !refundResult[order.id] && (
                              <button
                                onClick={() => setRefundModal(order.id)}
                                className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:border-red-300 hover:bg-red-50"
                              >
                                <RotateCcw className="h-4 w-4" />
                                Solicitar reembolso
                              </button>
                            )}
                          <Link
                            href="/buyer/tickets"
                            className="flex items-center gap-2 rounded-lg border border-surface-200 bg-white px-4 py-2 text-sm font-medium text-surface-700 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                          >
                            <TicketCheck className="h-4 w-4" />
                            Abrir ticket
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Refund Confirmation Modal */}
      {refundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-surface-900">
                Solicitar Reembolso
              </h3>
              <button
                onClick={() => { setRefundModal(null); setRefundReason(""); }}
                className="rounded-lg p-1 text-surface-400 hover:bg-surface-100 hover:text-surface-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm text-amber-800">
                  El reembolso se calculara automaticamente en base a los dias restantes de tu suscripcion.
                  El monto sera acreditado a tu billetera de VirtuMall.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">
                  Motivo (opcional)
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Describe el motivo de tu reembolso..."
                  rows={3}
                  className="w-full rounded-lg border border-surface-200 px-3 py-2 text-sm text-surface-900 placeholder:text-surface-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setRefundModal(null); setRefundReason(""); }}
                  disabled={refundLoading}
                  className="rounded-lg border border-surface-200 bg-white px-4 py-2 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleRequestRefund(refundModal)}
                  disabled={refundLoading}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  {refundLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  Confirmar reembolso
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
