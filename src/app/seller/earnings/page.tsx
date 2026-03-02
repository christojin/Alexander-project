"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  Percent,
  Wallet,
  Clock,
  BarChart3,
  Info,
  ArrowDownToLine,
  X,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { StatsCard, Badge } from "@/components/ui";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { Order } from "@/types";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  cn,
} from "@/lib/utils";
import {
  withdrawalMethodLabels,
  withdrawalStatusLabels,
  withdrawalStatusColors,
} from "@/lib/constants";

interface EarningsData {
  commissionRate: number;
  totalRevenue: number;
  totalCommissions: number;
  netBalance: number;
  pendingPayment: number;
  availableBalance: number;
  pendingWithdrawals: number;
  transactions: Order[];
}

interface WithdrawalRecord {
  id: string;
  amount: number;
  method: string;
  status: string;
  reviewNote: string | null;
  createdAt: string;
  completedAt: string | null;
}

interface WithdrawalPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const monthlyEarningsData = [
  { month: "Sep", earnings: 1850 },
  { month: "Oct", earnings: 2400 },
  { month: "Nov", earnings: 2100 },
  { month: "Dic", earnings: 3200 },
  { month: "Ene", earnings: 2800 },
  { month: "Feb", earnings: 1600 },
];

/* ---- Account info field config per method ---- */
const accountFields: Record<string, { key: string; label: string; placeholder: string }[]> = {
  bank_transfer: [
    { key: "bankName", label: "Nombre del banco", placeholder: "Ej: Banco Mercantil Santa Cruz" },
    { key: "accountNumber", label: "Numero de cuenta", placeholder: "Ej: 1234567890" },
    { key: "accountHolder", label: "Titular de la cuenta", placeholder: "Nombre completo del titular" },
  ],
  binance_pay: [
    { key: "binanceId", label: "Binance ID o Email", placeholder: "Ej: 123456789 o user@email.com" },
  ],
  qr_bolivia: [
    { key: "phoneNumber", label: "Numero de telefono", placeholder: "Ej: 70012345" },
    { key: "bankName", label: "Banco/App", placeholder: "Ej: BNB, Banco Union, Tigo Money" },
  ],
};

export default function SellerEarningsPage() {
  /* ---- Withdraw modal state ---- */
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("qr_bolivia");
  const [withdrawAccountInfo, setWithdrawAccountInfo] = useState<Record<string, string>>({});
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");

  /* ---- Earnings data ---- */
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  /* ---- Withdrawal history ---- */
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [wPagination, setWPagination] = useState<WithdrawalPagination | null>(null);
  const [wPage, setWPage] = useState(1);
  const [wLoading, setWLoading] = useState(false);

  useEffect(() => {
    async function fetchEarnings() {
      try {
        const res = await fetch("/api/seller/earnings");
        if (!res.ok) throw new Error("Failed to fetch earnings");
        const json: EarningsData = await res.json();
        setData(json);
      } catch (err) {
        console.error("Error fetching seller earnings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchEarnings();
  }, []);

  const fetchWithdrawals = useCallback(async () => {
    setWLoading(true);
    try {
      const res = await fetch(`/api/seller/withdrawals?page=${wPage}&limit=10`);
      if (!res.ok) throw new Error("Failed to fetch withdrawals");
      const json = await res.json();
      setWithdrawals(json.withdrawals);
      setWPagination(json.pagination);
    } catch (err) {
      console.error("Error fetching withdrawals:", err);
    } finally {
      setWLoading(false);
    }
  }, [wPage]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const commissionRate = data?.commissionRate ?? 10;
  const totalRevenue = data?.totalRevenue ?? 0;
  const totalCommissions = data?.totalCommissions ?? 0;
  const netBalance = data?.netBalance ?? 0;
  const pendingPayment = data?.pendingPayment ?? 0;
  const availableBalance = data?.availableBalance ?? 0;
  const transactions = data?.transactions ?? [];

  const maxMonthlyEarnings = Math.max(
    ...monthlyEarningsData.map((d) => d.earnings)
  );

  /* ---- Modal helpers ---- */
  const resetModal = () => {
    setWithdrawAmount("");
    setWithdrawMethod("qr_bolivia");
    setWithdrawAccountInfo({});
    setWithdrawError("");
    setWithdrawSuccess(false);
    setWithdrawSubmitting(false);
  };

  const closeModal = () => {
    if (!withdrawSubmitting) {
      setWithdrawModalOpen(false);
      resetModal();
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0 || amount > availableBalance) return;

    setWithdrawSubmitting(true);
    setWithdrawError("");

    try {
      const res = await fetch("/api/seller/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          method: withdrawMethod,
          accountInfo: withdrawAccountInfo,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setWithdrawError(err.error || "Error al procesar el retiro");
        setWithdrawSubmitting(false);
        return;
      }

      setWithdrawSuccess(true);
      // Refresh data
      const [earningsRes] = await Promise.all([
        fetch("/api/seller/earnings"),
        fetchWithdrawals(),
      ]);
      if (earningsRes.ok) {
        setData(await earningsRes.json());
      }
      setTimeout(() => {
        setWithdrawModalOpen(false);
        resetModal();
      }, 2500);
    } catch {
      setWithdrawError("Error de conexion. Intenta de nuevo.");
      setWithdrawSubmitting(false);
    }
  };

  const currentFields = accountFields[withdrawMethod] || [];

  if (loading) {
    return (
      <DashboardLayout role="seller">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-accent-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="seller">
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 tracking-tight">
              Ganancias
            </h1>
            <p className="mt-1 text-sm text-surface-500">
              Resumen financiero de tu tienda
            </p>
          </div>
          <button
            onClick={() => setWithdrawModalOpen(true)}
            className="flex items-center gap-2 self-start rounded-lg bg-accent-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-accent-700 active:bg-accent-800"
          >
            <ArrowDownToLine className="h-4 w-4" />
            Solicitar Retiro
          </button>
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
            label="Balance disponible"
            value={formatCurrency(availableBalance)}
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
              Tu tasa de comision: {commissionRate}%
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

        {/* Withdrawal History */}
        <div className="rounded-xl border border-surface-200 bg-white">
          <div className="border-b border-surface-100 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-surface-900">
                Historial de retiros
              </h2>
              <p className="mt-0.5 text-sm text-surface-500">
                Solicitudes de retiro y su estado actual
              </p>
            </div>
            {wLoading && <Loader2 className="h-5 w-5 animate-spin text-accent-500" />}
          </div>

          {withdrawals.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <ArrowDownToLine className="mx-auto h-10 w-10 text-surface-300" />
              <p className="mt-3 text-sm font-medium text-surface-900">
                Sin retiros aun
              </p>
              <p className="mt-1 text-sm text-surface-500">
                Solicita tu primer retiro cuando tengas balance disponible.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-sm">
                  <thead>
                    <tr className="border-b border-surface-100 bg-surface-50/80">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-surface-500">
                        Monto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                        Metodo
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-surface-500">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                        Nota
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {withdrawals.map((w) => (
                      <tr key={w.id} className="transition-colors hover:bg-primary-50/40">
                        <td className="px-6 py-3.5 text-surface-600">
                          {formatDateTime(w.createdAt)}
                        </td>
                        <td className="px-6 py-3.5 text-right font-semibold text-surface-900">
                          {formatCurrency(w.amount)}
                        </td>
                        <td className="px-6 py-3.5 text-surface-700">
                          {withdrawalMethodLabels[w.method] || w.method}
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          <StatusBadge
                            status={w.status}
                            colorMap={withdrawalStatusColors}
                            labelMap={withdrawalStatusLabels}
                          />
                        </td>
                        <td className="px-6 py-3.5 text-surface-500 text-xs max-w-[200px] truncate">
                          {w.reviewNote || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {wPagination && wPagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-surface-100 px-6 py-3">
                  <p className="text-sm text-surface-500">
                    Pagina {wPagination.page} de {wPagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setWPage((p) => Math.max(1, p - 1))}
                      disabled={wPage === 1}
                      className="inline-flex items-center gap-1 rounded-lg border border-surface-200 px-3 py-1.5 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </button>
                    <button
                      onClick={() => setWPage((p) => Math.min(wPagination.totalPages, p + 1))}
                      disabled={wPage === wPagination.totalPages}
                      className="inline-flex items-center gap-1 rounded-lg border border-surface-200 px-3 py-1.5 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50 disabled:opacity-50"
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
                {transactions.map((order, index) => (
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
                        {order.orderNumber}
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
                      {commissionRate}%
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

      {/* Withdrawal Request Modal */}
      {withdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-surface-900/50 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-surface-200 bg-white shadow-2xl">
            {withdrawSuccess ? (
              <div className="px-6 py-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-7 w-7 text-green-600" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-surface-900">
                  Solicitud enviada
                </h3>
                <p className="mt-2 text-sm text-surface-500">
                  Tu solicitud de retiro por{" "}
                  {formatCurrency(parseFloat(withdrawAmount))} ha sido enviada.
                  El administrador la revisara en las proximas 24 horas.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-surface-100 px-6 py-4">
                  <h2 className="text-lg font-semibold text-surface-900">
                    Solicitar retiro
                  </h2>
                  <button
                    onClick={closeModal}
                    disabled={withdrawSubmitting}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 disabled:opacity-50"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                <div className="space-y-5 px-6 py-5 max-h-[70vh] overflow-y-auto">
                  <div className="rounded-lg bg-accent-50 border border-accent-200 px-4 py-3">
                    <p className="text-xs font-medium text-accent-600">
                      Balance disponible
                    </p>
                    <p className="text-2xl font-bold text-accent-700">
                      {formatCurrency(availableBalance)}
                    </p>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                      Monto a retirar (USD)
                    </label>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      min="1"
                      max={availableBalance}
                      step="0.01"
                      className="w-full rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    />
                    {parseFloat(withdrawAmount) > availableBalance && (
                      <p className="mt-1 text-xs text-red-500">
                        El monto no puede superar tu balance disponible.
                      </p>
                    )}
                  </div>

                  {/* Method */}
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                      Metodo de pago
                    </label>
                    <select
                      value={withdrawMethod}
                      onChange={(e) => {
                        setWithdrawMethod(e.target.value);
                        setWithdrawAccountInfo({});
                      }}
                      className="w-full rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                    >
                      <option value="qr_bolivia">QR Bolivia</option>
                      <option value="bank_transfer">Transferencia Bancaria</option>
                      <option value="binance_pay">Binance Pay</option>
                    </select>
                  </div>

                  {/* Dynamic account info fields */}
                  {currentFields.length > 0 && (
                    <div className="space-y-3 rounded-lg border border-surface-200 bg-surface-50/50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-surface-500">
                        Datos de la cuenta
                      </p>
                      {currentFields.map((field) => (
                        <div key={field.key}>
                          <label className="block text-sm font-medium text-surface-700 mb-1">
                            {field.label}
                          </label>
                          <input
                            type="text"
                            value={withdrawAccountInfo[field.key] || ""}
                            onChange={(e) =>
                              setWithdrawAccountInfo((prev) => ({
                                ...prev,
                                [field.key]: e.target.value,
                              }))
                            }
                            placeholder={field.placeholder}
                            className="w-full rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Error message */}
                  {withdrawError && (
                    <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                      <p className="text-sm text-red-700">{withdrawError}</p>
                    </div>
                  )}

                  <p className="text-xs text-surface-400">
                    El retiro sera procesado en 24-48 horas habiles.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-surface-100 px-6 py-4">
                  <button
                    onClick={closeModal}
                    disabled={withdrawSubmitting}
                    className="rounded-lg border border-surface-200 bg-white px-4 py-2 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleWithdraw}
                    disabled={
                      withdrawSubmitting ||
                      !withdrawAmount ||
                      parseFloat(withdrawAmount) <= 0 ||
                      parseFloat(withdrawAmount) > availableBalance ||
                      currentFields.some((f) => !withdrawAccountInfo[f.key]?.trim())
                    }
                    className="flex items-center gap-2 rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-700 disabled:cursor-not-allowed disabled:bg-surface-200 disabled:text-surface-400"
                  >
                    {withdrawSubmitting && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    Confirmar retiro
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
