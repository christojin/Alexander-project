"use client";

import { useMemo } from "react";
import {
  DollarSign,
  Percent,
  Wallet,
  Clock,
  BarChart3,
  Info,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { StatsCard, Badge } from "@/components/ui";
import { orders } from "@/data/mock/orders";
import {
  formatCurrency,
  formatDate,
  cn,
} from "@/lib/utils";

const SELLER_ID = "seller-1";
const COMMISSION_RATE = 10;

const monthlyEarningsData = [
  { month: "Sep", earnings: 1850 },
  { month: "Oct", earnings: 2400 },
  { month: "Nov", earnings: 2100 },
  { month: "Dic", earnings: 3200 },
  { month: "Ene", earnings: 2800 },
  { month: "Feb", earnings: 1600 },
];

export default function SellerEarningsPage() {
  const sellerOrders = useMemo(
    () => orders.filter((o) => o.sellerId === SELLER_ID),
    []
  );

  const totalRevenue = sellerOrders.reduce(
    (sum, o) => sum + o.totalAmount,
    0
  );
  const totalCommissions = sellerOrders.reduce(
    (sum, o) => sum + o.commissionAmount,
    0
  );
  const netBalance = sellerOrders.reduce(
    (sum, o) => sum + o.sellerEarnings,
    0
  );
  const pendingPayment = sellerOrders
    .filter((o) => o.status === "pending" || o.status === "under_review")
    .reduce((sum, o) => sum + o.sellerEarnings, 0);

  const transactionHistory = useMemo(() => {
    return [...sellerOrders].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [sellerOrders]);

  const maxMonthlyEarnings = Math.max(
    ...monthlyEarningsData.map((d) => d.earnings)
  );

  return (
    <DashboardLayout role="seller">
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">
            Ganancias
          </h1>
          <p className="mt-1 text-sm text-surface-500">
            Resumen financiero de tu tienda
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            icon={<DollarSign />}
            label="Ingresos totales"
            value={formatCurrency(totalRevenue)}
            trend={{ value: 15, direction: "up" }}
          />
          <StatsCard
            icon={<Percent />}
            label="Comisiones pagadas"
            value={formatCurrency(totalCommissions)}
          />
          <StatsCard
            icon={<Wallet />}
            label="Balance neto"
            value={formatCurrency(netBalance)}
            trend={{ value: 12, direction: "up" }}
          />
          <StatsCard
            icon={<Clock />}
            label="Pendiente de pago"
            value={formatCurrency(pendingPayment)}
          />
        </div>

        {/* Commission Rate Info */}
        <div className="flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
            <Info className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary-900">
              Tu tasa de comision: {COMMISSION_RATE}%
            </p>
            <p className="mt-0.5 text-xs text-primary-700">
              Configurada por el administrador. Se aplica a todas tus ventas
              completadas.
            </p>
          </div>
        </div>

        {/* Monthly Earnings Chart */}
        <div className="rounded-xl border border-surface-200 bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-surface-900">
                Ganancias mensuales
              </h2>
              <p className="mt-0.5 text-sm text-surface-500">
                Ultimos 6 meses de ganancias netas
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-surface-500">
              <BarChart3 className="size-4" />
              <span>USD neto</span>
            </div>
          </div>

          <div className="flex items-end justify-between gap-4 h-56">
            {monthlyEarningsData.map((d) => {
              const heightPercent = (d.earnings / maxMonthlyEarnings) * 100;
              return (
                <div
                  key={d.month}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <span className="text-xs font-medium text-surface-600">
                    {formatCurrency(d.earnings)}
                  </span>
                  <div className="w-full flex justify-center">
                    <div
                      className="w-full max-w-[56px] rounded-t-lg bg-gradient-to-t from-accent-600 to-accent-400 transition-all duration-500 ease-out hover:from-accent-700 hover:to-accent-500"
                      style={{ height: `${heightPercent}%`, minHeight: "8px" }}
                    />
                  </div>
                  <span className="text-xs font-medium text-surface-500">
                    {d.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transaction History Table */}
        <div className="rounded-xl border border-surface-200 bg-white">
          <div className="border-b border-surface-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-surface-900">
              Historial de transacciones
            </h2>
            <p className="mt-0.5 text-sm text-surface-500">
              Desglose detallado de cada venta y comision
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-surface-100 bg-surface-50/80">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    ID Pedido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Monto venta
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Comision %
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Comision
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-surface-500">
                    Ganancia neta
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {transactionHistory.map((order, index) => (
                  <tr
                    key={order.id}
                    className={cn(
                      "transition-colors hover:bg-primary-50/40",
                      index % 2 === 1 && "bg-surface-50/40"
                    )}
                  >
                    <td className="px-6 py-3.5 text-surface-600">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="font-medium text-surface-900">
                        {order.id}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-surface-700">
                      {order.productName}
                    </td>
                    <td className="px-6 py-3.5 text-right font-medium text-surface-900">
                      {formatCurrency(order.totalAmount)}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <Badge variant="neutral" size="sm">
                        {order.commissionRate}%
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 text-right font-medium text-red-600">
                      -{formatCurrency(order.commissionAmount)}
                    </td>
                    <td className="px-6 py-3.5 text-right font-bold text-green-700">
                      {formatCurrency(order.sellerEarnings)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-surface-200 bg-surface-50">
                  <td
                    colSpan={3}
                    className="px-6 py-4 text-sm font-semibold text-surface-900"
                  >
                    Totales
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-surface-900">
                    {formatCurrency(totalRevenue)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge variant="neutral" size="sm">
                      {COMMISSION_RATE}%
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-red-600">
                    -{formatCurrency(totalCommissions)}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-green-700">
                    {formatCurrency(netBalance)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
