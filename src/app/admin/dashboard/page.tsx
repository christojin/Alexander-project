"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout";
import { Order } from "@/types";
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
  Loader2,
} from "lucide-react";

interface TopSeller {
  id: string;
  name: string;
  email: string;
  storeName: string;
  commissionRate: number;
  totalSales: number;
  revenue: number;
  commissions: number;
  orderCount: number;
}

interface WeeklyRevenue {
  label: string;
  revenue: number;
  commissions: number;
}

interface DashboardData {
  totalRevenue: number;
  totalCommissions: number;
  totalUsers: number;
  activeProducts: number;
  activeSellers: number;
  openTickets: number;
  ordersToday: number;
  newUsersThisWeek: number;
  averageOrderValue: number;
  topSellers: TopSeller[];
  weeklyRevenue: WeeklyRevenue[];
  recentOrders: Order[];
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/admin/dashboard");
        if (!res.ok) throw new Error("Failed to fetch dashboard data");
        const json: DashboardData = await res.json();
        setData(json);
      } catch (error) {
        console.error("Error fetching admin dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const maxWeekRevenue = Math.max(
    ...(data?.weeklyRevenue?.map((w) => w.revenue) ?? []),
    1
  );

  const statsCards = [
    {
      label: "Ingresos totales",
      value: formatCurrency(data?.totalRevenue ?? 0),
      icon: DollarSign,
      color: "bg-indigo-500",
      trend: "+12.5%",
      trendUp: true,
    },
    {
      label: "Comisiones ganadas",
      value: formatCurrency(data?.totalCommissions ?? 0),
      icon: Percent,
      color: "bg-green-500",
      trend: "+8.2%",
      trendUp: true,
    },
    {
      label: "Usuarios totales",
      value: (data?.totalUsers ?? 0).toString(),
      icon: Users,
      color: "bg-blue-500",
      trend: "+3",
      trendUp: true,
    },
    {
      label: "Productos activos",
      value: (data?.activeProducts ?? 0).toString(),
      icon: Package,
      color: "bg-purple-500",
      trend: "+2",
      trendUp: true,
    },
    {
      label: "Vendedores activos",
      value: (data?.activeSellers ?? 0).toString(),
      icon: Store,
      color: "bg-amber-500",
      trend: "0",
      trendUp: true,
    },
    {
      label: "Tickets abiertos",
      value: (data?.openTickets ?? 0).toString(),
      icon: TicketCheck,
      color: "bg-red-500",
      trend: "-1",
      trendUp: false,
    },
  ];

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      </DashboardLayout>
    );
  }

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
              {(data?.weeklyRevenue ?? []).map((week, i) => (
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
                    {data?.ordersToday ?? 0}
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
                    {data?.newUsersThisWeek ?? 0}
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
                    {formatCurrency(data?.averageOrderValue ?? 0)}
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
                {(data?.topSellers ?? []).map((seller) => (
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
                {(data?.recentOrders ?? []).map((order) => (
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
