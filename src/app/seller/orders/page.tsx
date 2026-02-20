"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  ShoppingCart,
  CheckCircle,
  AlertTriangle,
  Eye,
  Clock,
  CreditCard,
  Copy,
  Check,
  Loader2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Button, Tabs, Badge, EmptyState } from "@/components/ui";
import type { Order, OrderStatus } from "@/types";
import {
  formatCurrency,
  formatDateTime,
  getStatusColor,
  getStatusLabel,
  getPaymentMethodLabel,
  cn,
} from "@/lib/utils";

const statusTabs = [
  { key: "all", label: "Todos" },
  { key: "pending", label: "Pendientes" },
  { key: "processing", label: "Procesando" },
  { key: "under_review", label: "En revision" },
  { key: "completed", label: "Completados" },
  { key: "cancelled", label: "Cancelados" },
];

export default function SellerOrdersPage() {
  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/seller/orders");
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data: Order[] = await res.json();
      setOrdersList(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const tabsWithCounts = useMemo(() => {
    return statusTabs.map((tab) => ({
      ...tab,
      count:
        tab.key === "all"
          ? ordersList.length
          : ordersList.filter((o) => o.status === tab.key).length,
    }));
  }, [ordersList]);

  const filteredOrders = useMemo(() => {
    const filtered =
      activeTab === "all"
        ? ordersList
        : ordersList.filter((o) => o.status === activeTab);
    return [...filtered].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [ordersList, activeTab]);

  const handleApproveAndDeliver = async (orderId: string) => {
    try {
      const res = await fetch(`/api/seller/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (!res.ok) throw new Error("Failed to approve order");

      setOrdersList((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: "completed" as OrderStatus,
                paymentStatus: "completed",
                completedAt: new Date().toISOString(),
                digitalCodes:
                  o.digitalCodes.length > 0
                    ? o.digitalCodes
                    : [`AUTO-${orderId}-${Date.now()}`],
              }
            : o
        )
      );
    } catch (error) {
      console.error("Error approving order:", error);
    }
  };

  const handleMarkUnderReview = async (orderId: string) => {
    try {
      const res = await fetch(`/api/seller/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "under_review" }),
      });
      if (!res.ok) throw new Error("Failed to mark order under review");

      setOrdersList((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: "under_review" as OrderStatus }
            : o
        )
      );
    } catch (error) {
      console.error("Error marking order under review:", error);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getStatusBadgeVariant = (
    status: string
  ): "success" | "warning" | "error" | "info" | "neutral" => {
    const variants: Record<
      string,
      "success" | "warning" | "error" | "info" | "neutral"
    > = {
      completed: "success",
      pending: "warning",
      processing: "info",
      cancelled: "error",
      refunded: "neutral",
      under_review: "warning",
    };
    return variants[status] || "neutral";
  };

  if (loading) {
    return (
      <DashboardLayout role="seller">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-surface-400" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="seller">
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">
            Pedidos
          </h1>
          <p className="mt-1 text-sm text-surface-500">
            Gestiona y da seguimiento a los pedidos de tu tienda
          </p>
        </div>

        {/* Status Tabs */}
        <Tabs
          tabs={tabsWithCounts}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart />}
            title="No hay pedidos"
            description="No se encontraron pedidos con el filtro seleccionado."
          />
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-xl border border-surface-200 bg-white transition-shadow hover:shadow-sm"
              >
                {/* Order Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-100 px-6 py-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-surface-900">
                      {order.id}
                    </span>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                        getStatusColor(order.status)
                      )}
                    >
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-surface-500">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {formatDateTime(order.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <CreditCard className="size-3.5" />
                      {getPaymentMethodLabel(order.paymentMethod)}
                    </span>
                  </div>
                </div>

                {/* Order Body */}
                <div className="px-6 py-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    {/* Left: Buyer & Product Info */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-surface-400">
                          Comprador
                        </p>
                        <p className="mt-0.5 text-sm font-medium text-surface-900">
                          {order.buyerName}
                        </p>
                        <p className="text-xs text-surface-500">
                          {order.buyerEmail}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-surface-400">
                          Producto
                        </p>
                        <p className="mt-0.5 text-sm font-medium text-surface-900">
                          {order.productName}
                        </p>
                        <p className="text-xs text-surface-500">
                          Cantidad: {order.quantity}
                        </p>
                      </div>
                    </div>

                    {/* Right: Commission Breakdown */}
                    <div className="rounded-lg border border-surface-100 bg-surface-50 p-4 lg:min-w-[320px]">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-500">
                        Desglose de comision
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-surface-600">Venta:</span>
                          <span className="font-medium text-surface-900">
                            {formatCurrency(order.totalAmount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-surface-600">
                            Comision ({order.commissionRate}%):
                          </span>
                          <span className="font-medium text-red-600">
                            -{formatCurrency(order.commissionAmount)}
                          </span>
                        </div>
                        <div className="border-t border-surface-200 pt-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-semibold text-surface-900">
                              Tu ganancia:
                            </span>
                            <span className="text-lg font-bold text-green-700">
                              {formatCurrency(order.sellerEarnings)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Commission summary line */}
                      <div className="mt-3 rounded-md bg-white px-3 py-2 text-xs text-surface-500 border border-surface-200">
                        Venta: {formatCurrency(order.totalAmount)} | Comision (
                        {order.commissionRate}%):{" "}
                        {formatCurrency(order.commissionAmount)} | Tu ganancia:{" "}
                        {formatCurrency(order.sellerEarnings)}
                      </div>
                    </div>
                  </div>

                  {/* Digital Codes (for completed orders) */}
                  {order.status === "completed" &&
                    order.digitalCodes.length > 0 && (
                      <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-green-700">
                          Codigos entregados
                        </p>
                        <div className="space-y-1.5">
                          {order.digitalCodes.map((code, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between rounded-md bg-white px-3 py-2 border border-green-200"
                            >
                              <code className="text-sm font-mono text-surface-800">
                                {code}
                              </code>
                              <button
                                onClick={() => copyCode(code)}
                                className="ml-2 flex items-center gap-1 rounded-md px-2 py-1 text-xs text-surface-500 hover:bg-surface-100 hover:text-surface-700 transition-colors cursor-pointer"
                              >
                                {copiedCode === code ? (
                                  <>
                                    <Check className="size-3.5 text-green-600" />
                                    <span className="text-green-600">
                                      Copiado
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="size-3.5" />
                                    <span>Copiar</span>
                                  </>
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                {/* Order Actions (for pending / under_review) */}
                {(order.status === "pending" ||
                  order.status === "under_review") && (
                  <div className="flex items-center gap-3 border-t border-surface-100 px-6 py-4">
                    {order.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          iconLeft={<CheckCircle />}
                          onClick={() => handleApproveAndDeliver(order.id)}
                        >
                          Aprobar y entregar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          iconLeft={<AlertTriangle />}
                          onClick={() => handleMarkUnderReview(order.id)}
                        >
                          Marcar en revision
                        </Button>
                      </>
                    )}
                    {order.status === "under_review" && (
                      <Button
                        size="sm"
                        iconLeft={<CheckCircle />}
                        onClick={() => handleApproveAndDeliver(order.id)}
                      >
                        Aprobar y entregar
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
