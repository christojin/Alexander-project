"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  DollarSign,
  TicketCheck,
  KeyRound,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  ArrowRight,
  Package,
  Clock,
  Loader2,
  Wallet,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import type { Order } from "@/types";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
  cn,
} from "@/lib/utils";

interface DashboardData {
  totalPurchases: number;
  totalSpent: number;
  openTickets: number;
  codesReceived: number;
  recentOrders: Order[];
}

export default function BuyerDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [revealedCodes, setRevealedCodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/buyer/dashboard");
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        const json: DashboardData = await res.json();
        setData(json);
      } catch (err) {
        console.error("Error fetching dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    async function fetchWalletBalance() {
      try {
        const res = await fetch("/api/buyer/wallet");
        if (res.ok) {
          const json = await res.json();
          setWalletBalance(json.balance ?? 0);
        }
      } catch {
        // Wallet balance is non-critical
      }
    }

    fetchDashboard();
    fetchWalletBalance();
  }, []);

  if (loading) {
    return (
      <DashboardLayout role="buyer">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      </DashboardLayout>
    );
  }

  const totalPurchases = data?.totalPurchases ?? 0;
  const totalSpent = data?.totalSpent ?? 0;
  const openTickets = data?.openTickets ?? 0;
  const codesReceived = data?.codesReceived ?? 0;
  const recentOrders = data?.recentOrders ?? [];

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

  const statCards = [
    {
      label: "Total compras",
      value: totalPurchases.toString(),
      icon: ShoppingBag,
      iconBg: "bg-primary-100",
      iconColor: "text-primary-600",
    },
    {
      label: "Monto total gastado",
      value: formatCurrency(totalSpent),
      icon: DollarSign,
      iconBg: "bg-accent-100",
      iconColor: "text-accent-600",
    },
    {
      label: "Saldo billetera",
      value: formatCurrency(walletBalance),
      icon: Wallet,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      href: "/buyer/wallet",
    },
    {
      label: "Tickets abiertos",
      value: openTickets.toString(),
      icon: TicketCheck,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      label: "Codigos recibidos",
      value: codesReceived.toString(),
      icon: KeyRound,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
  ];

  return (
    <DashboardLayout role="buyer">
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-surface-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-surface-500">
            Bienvenido de vuelta. Aqui tienes un resumen de tu actividad.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            const cardContent = (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-surface-500">
                    {stat.label}
                  </p>
                  <p className="mt-1.5 text-2xl font-bold text-surface-900">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-lg",
                    stat.iconBg
                  )}
                >
                  <Icon className={cn("h-5.5 w-5.5", stat.iconColor)} />
                </div>
              </div>
            );

            if (stat.href) {
              return (
                <Link
                  key={stat.label}
                  href={stat.href}
                  className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md hover:border-primary-200"
                >
                  {cardContent}
                </Link>
              );
            }

            return (
              <div
                key={stat.label}
                className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                {cardContent}
              </div>
            );
          })}
        </div>

        {/* Recent Orders Table */}
        <div className="rounded-xl border border-surface-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-surface-100 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50">
                <Clock className="h-4.5 w-4.5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-surface-900">
                  Pedidos recientes
                </h2>
                <p className="text-xs text-surface-500">
                  Tus ultimas compras en la plataforma
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50/50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    ID
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Producto
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Vendedor
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Monto
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Estado
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Fecha
                  </th>
                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Detalle
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {recentOrders.map((order) => {
                  const isExpanded = expandedOrder === order.id;
                  const isRevealed = revealedCodes.has(order.id);
                  return (
                    <Fragment key={order.id}>
                      <tr className="transition-colors hover:bg-surface-50/50">
                        <td className="px-5 py-3.5 text-sm font-medium text-surface-900">
                          {order.orderNumber}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-100">
                              <Package className="h-4.5 w-4.5 text-surface-500" />
                            </div>
                            <span className="text-sm font-medium text-surface-800">
                              {order.productName}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-surface-600">
                          {order.sellerName}
                        </td>
                        <td className="px-5 py-3.5 text-right text-sm font-semibold text-surface-900">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                              getStatusColor(order.status)
                            )}
                          >
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right text-sm text-surface-500">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button
                            onClick={() => toggleExpand(order.id)}
                            className="inline-flex items-center justify-center rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600"
                            aria-label={isExpanded ? "Ocultar detalle" : "Ver detalle"}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4.5 w-4.5" />
                            ) : (
                              <ChevronDown className="h-4.5 w-4.5" />
                            )}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="bg-surface-50/80 px-5 py-4">
                            <div className="rounded-lg border border-surface-200 bg-white p-4">
                              <h4 className="text-sm font-semibold text-surface-800 mb-3">
                                Codigos digitales
                              </h4>
                              {order.status === "completed" &&
                              order.digitalCodes.length > 0 ? (
                                <div className="space-y-2">
                                  {order.digitalCodes.map((code, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between rounded-lg border border-surface-200 bg-surface-50 px-4 py-2.5"
                                    >
                                      <code className="text-sm font-mono text-surface-700">
                                        {isRevealed ? code : maskCode(code)}
                                      </code>
                                      <button
                                        onClick={() =>
                                          toggleRevealCode(order.id)
                                        }
                                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-primary-600 transition-colors hover:bg-primary-50"
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
                                  Los codigos estaran disponibles cuando el pedido sea completado.
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-surface-100">
            {recentOrders.map((order) => {
              const isExpanded = expandedOrder === order.id;
              const isRevealed = revealedCodes.has(order.id);
              return (
                <div key={order.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-surface-400">
                          {order.orderNumber}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                            getStatusColor(order.status)
                          )}
                        >
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-surface-900 truncate">
                        {order.productName}
                      </p>
                      <p className="text-xs text-surface-500">
                        {order.sellerName}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-surface-900">
                        {formatCurrency(order.totalAmount)}
                      </p>
                      <p className="text-xs text-surface-400">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleExpand(order.id)}
                    className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-surface-50 py-1.5 text-xs font-medium text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700"
                  >
                    {isExpanded ? "Ocultar detalle" : "Ver detalle"}
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="mt-3 rounded-lg border border-surface-200 bg-white p-3">
                      <h4 className="text-xs font-semibold text-surface-800 mb-2">
                        Codigos digitales
                      </h4>
                      {order.status === "completed" &&
                      order.digitalCodes.length > 0 ? (
                        <div className="space-y-2">
                          {order.digitalCodes.map((code, idx) => (
                            <div
                              key={idx}
                              className="flex flex-col gap-1.5 rounded-lg border border-surface-200 bg-surface-50 px-3 py-2"
                            >
                              <code className="text-xs font-mono text-surface-700 break-all">
                                {isRevealed ? code : maskCode(code)}
                              </code>
                              <button
                                onClick={() => toggleRevealCode(order.id)}
                                className="flex items-center gap-1 self-end text-xs font-medium text-primary-600"
                              >
                                {isRevealed ? (
                                  <>
                                    <EyeOff className="h-3 w-3" />
                                    Ocultar
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-3 w-3" />
                                    Revelar
                                  </>
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : order.digitalCodes.length === 0 ? (
                        <p className="text-xs text-surface-500 italic">
                          Aun no hay codigos disponibles.
                        </p>
                      ) : (
                        <p className="text-xs text-surface-500 italic">
                          Disponible al completar el pedido.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/buyer/orders"
            className="group flex items-center justify-between rounded-xl border border-surface-200 bg-white p-5 shadow-sm transition-all hover:border-primary-200 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 transition-colors group-hover:bg-primary-100">
                <ShoppingBag className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-surface-900">
                  Ver todos mis pedidos
                </p>
                <p className="text-xs text-surface-500">
                  Historial completo de tus compras
                </p>
              </div>
            </div>
            <ArrowRight className="h-4.5 w-4.5 text-surface-400 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-500" />
          </Link>

          <Link
            href="/buyer/tickets"
            className="group flex items-center justify-between rounded-xl border border-surface-200 bg-white p-5 shadow-sm transition-all hover:border-primary-200 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 transition-colors group-hover:bg-orange-100">
                <TicketCheck className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-surface-900">
                  Abrir ticket de soporte
                </p>
                <p className="text-xs text-surface-500">
                  Contacta al vendedor o al soporte
                </p>
              </div>
            </div>
            <ArrowRight className="h-4.5 w-4.5 text-surface-400 transition-transform group-hover:translate-x-0.5 group-hover:text-primary-500" />
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
