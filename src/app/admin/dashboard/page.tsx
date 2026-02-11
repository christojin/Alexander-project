"use client";

import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout";
import { orders } from "@/data/mock/orders";
import { sellers } from "@/data/mock/users";
import { allUsers } from "@/data/mock/users";
import { products } from "@/data/mock/products";
import { tickets } from "@/data/mock/tickets";
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
  cn,
} from "@/lib/utils";
import {
  DollarSign,
  Percent,
  Users,
  Package,
  Store,
  TicketCheck,
  TrendingUp,
  ShoppingCart,
  UserPlus,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export default function AdminDashboardPage() {
  const totalRevenue = useMemo(
    () => orders.reduce((sum, o) => sum + o.totalAmount, 0),
    []
  );
  const totalCommissions = useMemo(
    () => orders.reduce((sum, o) => sum + o.commissionAmount, 0),
    []
  );
  const totalUsers = allUsers.length;
  const activeProducts = products.filter((p) => p.isActive).length;
  const activeSellers = sellers.filter((s) => s.isActive).length;
  const openTickets = tickets.filter(
    (t) => t.status === "open" || t.status === "in_progress"
  ).length;

  const ordersToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return orders.filter((o) => o.createdAt.slice(0, 10) === today).length;
  }, []);

  const newUsersThisWeek = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return allUsers.filter((u) => new Date(u.createdAt) >= weekAgo).length;
  }, []);

  const averageOrderValue = useMemo(() => {
    if (orders.length === 0) return 0;
    return totalRevenue / orders.length;
  }, [totalRevenue]);

  const weeklyRevenue = useMemo(() => {
    const now = new Date();
    const weeks: { label: string; revenue: number; commissions: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(
        now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000
      );
      const weekEnd = new Date(
        now.getTime() - i * 7 * 24 * 60 * 60 * 1000
      );
      const weekOrders = orders.filter((o) => {
        const d = new Date(o.createdAt);
        return d >= weekStart && d < weekEnd;
      });
      const revenue = weekOrders.reduce((s, o) => s + o.totalAmount, 0);
      const commissions = weekOrders.reduce(
        (s, o) => s + o.commissionAmount,
        0
      );
      weeks.push({
        label: `Sem ${4 - i}`,
        revenue,
        commissions,
      });
    }
    return weeks;
  }, []);

  const maxWeekRevenue = useMemo(
    () => Math.max(...weeklyRevenue.map((w) => w.revenue), 1),
    [weeklyRevenue]
  );

  const topSellers = useMemo(() => {
    return sellers
      .map((s) => {
        const sellerOrders = orders.filter((o) => o.sellerId === s.id);
        const revenue = sellerOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const commissions = sellerOrders.reduce(
          (sum, o) => sum + o.commissionAmount,
          0
        );
        return { ...s, revenue, commissions, orderCount: sellerOrders.length };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, []);

  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    []
  );

  const statsCards = [
    {
      label: "Ingresos totales",
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: "bg-indigo-500",
      trend: "+12.5%",
      trendUp: true,
    },
    {
      label: "Comisiones ganadas",
      value: formatCurrency(totalCommissions),
      icon: Percent,
      color: "bg-green-500",
      trend: "+8.2%",
      trendUp: true,
    },
    {
      label: "Usuarios totales",
      value: totalUsers.toString(),
      icon: Users,
      color: "bg-blue-500",
      trend: "+3",
      trendUp: true,
    },
    {
      label: "Productos activos",
      value: activeProducts.toString(),
      icon: Package,
      color: "bg-purple-500",
      trend: "+2",
      trendUp: true,
    },
    {
      label: "Vendedores activos",
      value: activeSellers.toString(),
      icon: Store,
      color: "bg-amber-500",
      trend: "0",
      trendUp: true,
    },
    {
      label: "Tickets abiertos",
      value: openTickets.toString(),
      icon: TicketCheck,
      color: "bg-red-500",
      trend: "-1",
      trendUp: false,
    },
  ];

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Panel de Administracion
          </h1>
          <p className="mt-1 text-slate-500">
            Vista general de la plataforma VirtuMall
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {statsCards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg text-white",
                    card.color
                  )}
                >
                  <card.icon className="h-5 w-5" />
                </div>
                <span
                  className={cn(
                    "flex items-center gap-0.5 text-xs font-medium",
                    card.trendUp ? "text-green-600" : "text-red-600"
                  )}
                >
                  {card.trendUp ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {card.trend}
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">
                {card.value}
              </p>
              <p className="mt-1 text-sm text-slate-500">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Revenue Chart + Platform Health */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Revenue Overview */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Ingresos por semana
                </h2>
                <p className="text-sm text-slate-500">Ultimos 30 dias</p>
              </div>
              <TrendingUp className="h-5 w-5 text-indigo-500" />
            </div>
            <div className="flex items-end gap-6 h-64">
              {weeklyRevenue.map((week, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    {formatCurrency(week.revenue)}
                  </span>
                  <div className="w-full flex flex-col items-center gap-1" style={{ height: "180px" }}>
                    <div
                      className="w-full max-w-16 rounded-t-lg bg-indigo-500 transition-all duration-500"
                      style={{
                        height: `${(week.revenue / maxWeekRevenue) * 100}%`,
                        minHeight: week.revenue > 0 ? "8px" : "2px",
                      }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {week.label}
                  </span>
                  <span className="text-xs text-green-600 font-medium">
                    {formatCurrency(week.commissions)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-6 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm bg-indigo-500" />
                <span className="text-xs text-slate-500">Ingresos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-green-600 font-medium">$</span>
                <span className="text-xs text-slate-500">Comisiones</span>
              </div>
            </div>
          </div>

          {/* Platform Health */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">
              Salud de la plataforma
            </h2>
            <div className="space-y-5">
              <div className="flex items-center gap-4 rounded-lg bg-slate-50 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <ShoppingCart className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {ordersToday}
                  </p>
                  <p className="text-sm text-slate-500">Ordenes hoy</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-lg bg-slate-50 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600">
                  <UserPlus className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {newUsersThisWeek}
                  </p>
                  <p className="text-sm text-slate-500">
                    Nuevos usuarios esta semana
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-lg bg-slate-50 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                  <Calculator className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {formatCurrency(averageOrderValue)}
                  </p>
                  <p className="text-sm text-slate-500">Valor promedio de orden</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Sellers */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Top vendedores
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Vendedor
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Tienda
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Ventas totales
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Comision
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Ingresos generados
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topSellers.map((seller) => (
                  <tr
                    key={seller.id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
                          {seller.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {seller.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {seller.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                      {seller.storeName}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                      {seller.totalSales}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        {seller.commissionRate}%
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-indigo-600">
                      {formatCurrency(seller.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Ordenes recientes
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    ID
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Comprador
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Vendedor
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Comision
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
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-mono font-medium text-indigo-600">
                      {order.id}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                      {order.buyerName}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                      {order.sellerName}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-green-600 font-medium">
                      {formatCurrency(order.commissionAmount)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          getStatusColor(order.status)
                        )}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      {formatDate(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
