"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  ShoppingCart,
  Package,
  TicketCheck,
  Percent,
  Plus,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { StatsCard, Badge, Button } from "@/components/ui";
import { orders } from "@/data/mock/orders";
import { products } from "@/data/mock/products";
import { tickets } from "@/data/mock/tickets";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
  cn,
} from "@/lib/utils";

const SELLER_ID = "seller-1";
const COMMISSION_RATE = 10;

const dailySalesData = [
  { day: "Lun", amount: 85 },
  { day: "Mar", amount: 120 },
  { day: "Mie", amount: 65 },
  { day: "Jue", amount: 95 },
  { day: "Vie", amount: 150 },
  { day: "Sab", amount: 110 },
  { day: "Dom", amount: 75 },
];

export default function SellerDashboardPage() {
  const sellerOrders = orders.filter((o) => o.sellerId === SELLER_ID);
  const sellerProducts = products.filter((p) => p.sellerId === SELLER_ID);
  const sellerTickets = tickets.filter((t) => t.sellerId === SELLER_ID);

  const totalSales = sellerOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCommission = sellerOrders.reduce(
    (sum, o) => sum + o.commissionAmount,
    0
  );
  const netEarnings = sellerOrders.reduce(
    (sum, o) => sum + o.sellerEarnings,
    0
  );
  const activeProducts = sellerProducts.filter((p) => p.isActive).length;
  const pendingTickets = sellerTickets.filter(
    (t) => t.status === "open" || t.status === "in_progress"
  ).length;

  const recentOrders = [...sellerOrders]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  const maxDailyAmount = Math.max(...dailySalesData.map((d) => d.amount));

  return (
    <DashboardLayout role="seller">
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-surface-500">
            Resumen de tu tienda DigitalKeys Bolivia
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatsCard
            icon={<ShoppingCart />}
            label="Ventas totales"
            value={formatCurrency(totalSales)}
            trend={{ value: 12, direction: "up" }}
          />
          <StatsCard
            icon={<DollarSign />}
            label="Ingresos netos"
            value={formatCurrency(netEarnings)}
            trend={{ value: 8, direction: "up" }}
          />
          <StatsCard
            icon={<Percent />}
            label="Comision pagada"
            value={formatCurrency(totalCommission)}
          />
          <StatsCard
            icon={<Package />}
            label="Productos activos"
            value={activeProducts}
            trend={{ value: 2, direction: "up" }}
          />
          <StatsCard
            icon={<TicketCheck />}
            label="Tickets pendientes"
            value={pendingTickets}
          />
        </div>

        {/* Revenue Chart */}
        <div className="rounded-xl border border-surface-200 bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-surface-900">
                Ventas ultimos 7 dias
              </h2>
              <p className="mt-0.5 text-sm text-surface-500">
                Ingresos diarios de la semana
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-surface-500">
              <BarChart3 className="size-4" />
              <span>Ventas en USD</span>
            </div>
          </div>

          <div className="flex items-end justify-between gap-3 h-48">
            {dailySalesData.map((d) => {
              const heightPercent = (d.amount / maxDailyAmount) * 100;
              return (
                <div
                  key={d.day}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <span className="text-xs font-medium text-surface-600">
                    {formatCurrency(d.amount)}
                  </span>
                  <div className="w-full flex justify-center">
                    <div
                      className="w-full max-w-[48px] rounded-t-lg bg-gradient-to-t from-primary-600 to-primary-400 transition-all duration-500 ease-out hover:from-primary-700 hover:to-primary-500"
                      style={{ height: `${heightPercent}%`, minHeight: "8px" }}
                    />
                  </div>
                  <span className="text-xs font-medium text-surface-500">
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="rounded-xl border border-surface-200 bg-white">
          <div className="flex items-center justify-between border-b border-surface-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-surface-900">
              Pedidos recientes
            </h2>
            <Link href="/seller/orders">
              <Button variant="ghost" size="sm" iconRight={<ArrowRight />}>
                Ver todos los pedidos
              </Button>
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50/80">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Comprador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Comision
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Neto
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {recentOrders.map((order, index) => (
                  <tr
                    key={order.id}
                    className={cn(
                      "transition-colors hover:bg-primary-50/40",
                      index % 2 === 1 && "bg-surface-50/40"
                    )}
                  >
                    <td className="px-6 py-3.5 font-medium text-surface-900">
                      {order.id}
                    </td>
                    <td className="px-6 py-3.5 text-surface-700">
                      {order.buyerName}
                    </td>
                    <td className="px-6 py-3.5 text-surface-700">
                      {order.productName}
                    </td>
                    <td className="px-6 py-3.5 text-right font-medium text-surface-900">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-6 py-3.5 text-right text-red-600">
                      -{formatCurrency(order.commissionAmount)}
                    </td>
                    <td className="px-6 py-3.5 text-right font-medium text-green-700">
                      {formatCurrency(order.sellerEarnings)}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                          getStatusColor(order.status)
                        )}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link href="/seller/products">
            <div className="group flex items-center gap-4 rounded-xl border border-surface-200 bg-white p-6 transition-all duration-200 hover:border-primary-200 hover:shadow-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-100">
                <Plus className="size-6" />
              </div>
              <div>
                <h3 className="font-semibold text-surface-900">
                  Agregar producto
                </h3>
                <p className="text-sm text-surface-500">
                  Publica un nuevo producto en tu tienda
                </p>
              </div>
              <ArrowRight className="ml-auto size-5 text-surface-400 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <Link href="/seller/orders">
            <div className="group flex items-center gap-4 rounded-xl border border-surface-200 bg-white p-6 transition-all duration-200 hover:border-primary-200 hover:shadow-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600 transition-colors group-hover:bg-accent-100">
                <ShoppingCart className="size-6" />
              </div>
              <div>
                <h3 className="font-semibold text-surface-900">
                  Ver todos los pedidos
                </h3>
                <p className="text-sm text-surface-500">
                  Gestiona y revisa todos tus pedidos
                </p>
              </div>
              <ArrowRight className="ml-auto size-5 text-surface-400 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
