"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  History,
  Plus,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { formatCurrency, formatDateTime, cn } from "@/lib/utils";

interface Transaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  orderId: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface WalletData {
  balance: number;
  transactions: Transaction[];
  pagination: Pagination;
}

const ITEMS_PER_PAGE = 20;

export default function BuyerWalletPage() {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchWallet = useCallback(async (pageNum: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/api/buyer/wallet?page=${pageNum}&limit=${ITEMS_PER_PAGE}`
      );
      if (!res.ok) {
        throw new Error("Error al cargar los datos de la billetera");
      }
      const json: WalletData = await res.json();
      setData(json);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error al cargar los datos de la billetera"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet(page);
  }, [page, fetchWallet]);

  const handlePreviousPage = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  const handleNextPage = () => {
    if (data && page < data.pagination.totalPages) {
      setPage((p) => p + 1);
    }
  };

  // --- Loading skeleton ---
  if (loading && !data) {
    return (
      <DashboardLayout role="buyer">
        <div className="space-y-6">
          {/* Header skeleton */}
          <div>
            <div className="h-7 w-40 rounded-lg bg-surface-200 animate-pulse" />
            <div className="mt-2 h-4 w-72 rounded-lg bg-surface-100 animate-pulse" />
          </div>

          {/* Balance card skeleton */}
          <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-surface-100 animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-28 rounded bg-surface-100 animate-pulse" />
                <div className="h-9 w-44 rounded bg-surface-200 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Table skeleton */}
          <div className="rounded-xl border border-surface-200 bg-white shadow-sm">
            <div className="border-b border-surface-100 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-surface-100 animate-pulse" />
                <div className="space-y-1.5">
                  <div className="h-4 w-44 rounded bg-surface-200 animate-pulse" />
                  <div className="h-3 w-56 rounded bg-surface-100 animate-pulse" />
                </div>
              </div>
            </div>
            <div className="divide-y divide-surface-100">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className="h-8 w-8 rounded-full bg-surface-100 animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-48 rounded bg-surface-200 animate-pulse" />
                    <div className="h-3 w-32 rounded bg-surface-100 animate-pulse" />
                  </div>
                  <div className="h-4 w-20 rounded bg-surface-100 animate-pulse" />
                  <div className="h-4 w-20 rounded bg-surface-100 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // --- Error state ---
  if (error) {
    return (
      <DashboardLayout role="buyer">
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <Wallet className="h-6 w-6 text-red-500" />
          </div>
          <p className="mt-4 text-sm text-red-600">{error}</p>
          <button
            onClick={() => fetchWallet(page)}
            className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            Reintentar
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const balance = data?.balance ?? 0;
  const transactions = data?.transactions ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 1,
  };

  const startItem = (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <DashboardLayout role="buyer">
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Mi Billetera</h1>
          <p className="mt-1 text-sm text-surface-500">
            Consulta tu saldo y el historial de movimientos de tu billetera.
          </p>
        </div>

        {/* Balance Card */}
        <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-green-100">
                <Wallet className="h-7 w-7 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700">
                  Saldo disponible
                </p>
                <p className="mt-0.5 text-3xl font-bold text-green-900 tracking-tight">
                  {formatCurrency(balance)}
                </p>
              </div>
            </div>
            <Link
              href="/buyer/wallet/deposit"
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
              Recargar
            </Link>
          </div>
        </div>

        {/* Transaction History */}
        <div className="rounded-xl border border-surface-200 bg-white shadow-sm">
          {/* Section Header */}
          <div className="flex items-center justify-between border-b border-surface-100 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50">
                <History className="h-4.5 w-4.5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-surface-900">
                  Historial de movimientos
                </h2>
                <p className="text-xs text-surface-500">
                  Todos los creditos y debitos de tu billetera
                </p>
              </div>
            </div>
            {pagination.total > 0 && (
              <p className="hidden text-xs text-surface-400 sm:block">
                {pagination.total}{" "}
                {pagination.total === 1 ? "movimiento" : "movimientos"} en total
              </p>
            )}
          </div>

          {/* Empty State */}
          {transactions.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-100">
                <History className="h-6 w-6 text-surface-400" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-surface-900">
                Sin movimientos
              </h3>
              <p className="mt-1 text-sm text-surface-500">
                Aun no tienes movimientos registrados en tu billetera.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-100 bg-surface-50/50">
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                        Fecha
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                        Tipo
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-surface-500">
                        Descripcion
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-surface-500">
                        Monto
                      </th>
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-surface-500">
                        Saldo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {transactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="transition-colors hover:bg-surface-50/50"
                      >
                        {/* Fecha */}
                        <td className="px-5 py-3.5 text-sm text-surface-500 whitespace-nowrap">
                          {formatDateTime(tx.createdAt)}
                        </td>

                        {/* Tipo */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            {tx.type === "credit" ? (
                              <ArrowUpCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <ArrowDownCircle className="h-5 w-5 text-red-500" />
                            )}
                            <span
                              className={cn(
                                "text-sm font-medium",
                                tx.type === "credit"
                                  ? "text-green-700"
                                  : "text-red-700"
                              )}
                            >
                              {tx.type === "credit" ? "Credito" : "Debito"}
                            </span>
                          </div>
                        </td>

                        {/* Descripcion */}
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-medium text-surface-800">
                            {tx.description}
                          </p>
                          {tx.orderId && (
                            <p className="mt-0.5 text-xs text-surface-400">
                              Pedido: {tx.orderId}
                            </p>
                          )}
                        </td>

                        {/* Monto */}
                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <span
                            className={cn(
                              "text-sm font-semibold",
                              tx.type === "credit"
                                ? "text-green-600"
                                : "text-red-600"
                            )}
                          >
                            {tx.type === "credit" ? "+" : "-"}
                            {formatCurrency(tx.amount)}
                          </span>
                        </td>

                        {/* Saldo */}
                        <td className="px-5 py-3.5 text-right text-sm font-medium text-surface-700 whitespace-nowrap">
                          {formatCurrency(tx.balanceAfter)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-surface-100">
                {transactions.map((tx) => (
                  <div key={tx.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div
                          className={cn(
                            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                            tx.type === "credit"
                              ? "bg-green-100"
                              : "bg-red-100"
                          )}
                        >
                          {tx.type === "credit" ? (
                            <ArrowUpCircle className="h-4.5 w-4.5 text-green-600" />
                          ) : (
                            <ArrowDownCircle className="h-4.5 w-4.5 text-red-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-surface-900 truncate">
                            {tx.description}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span
                              className={cn(
                                "text-xs font-medium",
                                tx.type === "credit"
                                  ? "text-green-600"
                                  : "text-red-600"
                              )}
                            >
                              {tx.type === "credit" ? "Credito" : "Debito"}
                            </span>
                            {tx.orderId && (
                              <span className="text-xs text-surface-400">
                                {tx.orderId}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-surface-400">
                            {formatDateTime(tx.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className={cn(
                            "text-sm font-semibold",
                            tx.type === "credit"
                              ? "text-green-600"
                              : "text-red-600"
                          )}
                        >
                          {tx.type === "credit" ? "+" : "-"}
                          {formatCurrency(tx.amount)}
                        </p>
                        <p className="mt-0.5 text-xs text-surface-500">
                          Saldo: {formatCurrency(tx.balanceAfter)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex flex-col items-center justify-between gap-3 border-t border-surface-100 px-5 py-4 sm:flex-row">
                  <p className="text-sm text-surface-500">
                    Mostrando{" "}
                    <span className="font-medium text-surface-700">
                      {startItem}
                    </span>{" "}
                    a{" "}
                    <span className="font-medium text-surface-700">
                      {endItem}
                    </span>{" "}
                    de{" "}
                    <span className="font-medium text-surface-700">
                      {pagination.total}
                    </span>{" "}
                    movimientos
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePreviousPage}
                      disabled={page <= 1}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                        page <= 1
                          ? "cursor-not-allowed border-surface-200 text-surface-300"
                          : "border-surface-200 text-surface-700 hover:bg-surface-50 hover:border-surface-300"
                      )}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: pagination.totalPages },
                        (_, i) => i + 1
                      )
                        .filter((p) => {
                          // Show first, last, and pages around current
                          if (p === 1 || p === pagination.totalPages) return true;
                          if (Math.abs(p - page) <= 1) return true;
                          return false;
                        })
                        .reduce<(number | "ellipsis")[]>((acc, p, idx, arr) => {
                          if (idx > 0) {
                            const prev = arr[idx - 1];
                            if (p - prev > 1) {
                              acc.push("ellipsis");
                            }
                          }
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((item, idx) =>
                          item === "ellipsis" ? (
                            <span
                              key={`ellipsis-${idx}`}
                              className="px-1 text-sm text-surface-400"
                            >
                              ...
                            </span>
                          ) : (
                            <button
                              key={item}
                              onClick={() => setPage(item)}
                              className={cn(
                                "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors",
                                page === item
                                  ? "bg-primary-600 text-white shadow-sm"
                                  : "text-surface-600 hover:bg-surface-100"
                              )}
                            >
                              {item}
                            </button>
                          )
                        )}
                    </div>
                    <button
                      onClick={handleNextPage}
                      disabled={page >= pagination.totalPages}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                        page >= pagination.totalPages
                          ? "cursor-not-allowed border-surface-200 text-surface-300"
                          : "border-surface-200 text-surface-700 hover:bg-surface-50 hover:border-surface-300"
                      )}
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

        {/* Loading overlay for page changes */}
        {loading && data && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-xl border border-surface-200 bg-white px-6 py-4 shadow-lg">
              <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
              <span className="text-sm font-medium text-surface-700">
                Cargando movimientos...
              </span>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
