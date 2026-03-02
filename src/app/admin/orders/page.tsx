"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  ShoppingCart,
  Clock,
  CreditCard,
  Copy,
  Check,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Tabs, EmptyState } from "@/components/ui";
import type { Order } from "@/types";
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

const statusToApi: Record<string, string> = {
  pending: "PENDING",
  processing: "PROCESSING",
  under_review: "UNDER_REVIEW",
  completed: "COMPLETED",
  cancelled: "CANCELLED",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== "all" && statusToApi[activeTab]) {
        params.set("status", statusToApi[activeTab]);
      }
      if (search) {
        params.set("search", search);
      }
      params.set("limit", "200");

      const res = await fetch(`/api/admin/orders?${params}`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data.orders);
      setTotal(data.total);
      setStatusCounts(data.statusCounts);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const tabsWithCounts = useMemo(() => {
    const allCount = Object.values(statusCounts).reduce((s, c) => s + c, 0);
    return statusTabs.map((tab) => ({
      ...tab,
      count: tab.key === "all" ? allCount : (statusCounts[tab.key] ?? 0),
    }));
  }, [statusCounts]);

  const handleSearch = () => {
    setSearch(searchInput.trim());
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 tracking-tight">
              Pedidos
            </h1>
            <p className="mt-1 text-sm text-surface-500">
              Todas las compras realizadas en la plataforma
            </p>
          </div>
          <div className="text-sm text-surface-500">
            {total} {total === 1 ? "pedido" : "pedidos"} en total
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Buscar por comprador, vendedor o ID..."
              className="w-full rounded-lg border border-surface-200 py-2.5 pl-10 pr-10 text-sm text-surface-900 placeholder:text-surface-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {searchInput && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Buscar
          </button>
        </div>

        {/* Status Tabs */}
        <Tabs
          tabs={tabsWithCounts}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-8 animate-spin text-surface-400" />
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart />}
            title="No hay pedidos"
            description={
              search
                ? `No se encontraron pedidos para "${search}".`
                : "No se encontraron pedidos con el filtro seleccionado."
            }
          />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-xl border border-surface-200 bg-white transition-shadow hover:shadow-sm"
              >
                {/* Order Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-100 px-6 py-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-surface-900">
                      {order.orderNumber}
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
                    {/* Left: Buyer, Seller & Product Info */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                          Vendedor
                        </p>
                        <p className="mt-0.5 text-sm font-medium text-surface-900">
                          {order.sellerName}
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
                        Desglose financiero
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
                          <span className="font-medium text-green-600">
                            +{formatCurrency(order.commissionAmount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-surface-600">
                            Ganancia vendedor:
                          </span>
                          <span className="font-medium text-surface-900">
                            {formatCurrency(order.sellerEarnings)}
                          </span>
                        </div>
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

                  {/* Streaming Credentials (for completed streaming orders) */}
                  {order.status === "completed" &&
                    order.streamingCredentials && (
                      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
                          Credenciales de streaming
                        </p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          {order.streamingCredentials.email && (
                            <div>
                              <p className="text-xs text-blue-600">Email</p>
                              <p className="text-sm font-mono text-surface-800">
                                {order.streamingCredentials.email}
                              </p>
                            </div>
                          )}
                          {order.streamingCredentials.username && (
                            <div>
                              <p className="text-xs text-blue-600">Usuario</p>
                              <p className="text-sm font-mono text-surface-800">
                                {order.streamingCredentials.username}
                              </p>
                            </div>
                          )}
                          {order.streamingCredentials.password && (
                            <div>
                              <p className="text-xs text-blue-600">Contrasena</p>
                              <p className="text-sm font-mono text-surface-800">
                                {order.streamingCredentials.password}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
