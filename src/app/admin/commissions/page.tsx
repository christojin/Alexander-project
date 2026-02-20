"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout";
import { formatCurrency, cn } from "@/lib/utils";
import {
  Percent,
  DollarSign,
  Calculator,
  Save,
  TrendingUp,
  Store,
  CheckCircle2,
  Loader2,
} from "lucide-react";

interface SellerWithStats {
  id: string;
  name: string;
  email: string;
  storeName: string;
  commissionRate: number;
  totalSales: number;
  isVerified: boolean;
  calculatedTotalSales: number;
  calculatedCommissions: number;
}

const commissionPresets = [5, 10, 12, 15, 20, 25];

export default function AdminCommissionsPage() {
  const [sellerList, setSellerList] = useState<SellerWithStats[]>([]);
  const [defaultRate, setDefaultRate] = useState(10);
  const [totalCommissionsCollected, setTotalCommissionsCollected] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [calcAmount, setCalcAmount] = useState(52);
  const [calcRate, setCalcRate] = useState(10);
  const [savedRows, setSavedRows] = useState<Record<string, boolean>>({});
  const [defaultSaved, setDefaultSaved] = useState(false);

  const fetchCommissions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/commissions");
      if (!res.ok) throw new Error("Failed to fetch commissions");
      const data = await res.json();
      setSellerList(data.sellers);
      setDefaultRate(data.defaultRate);
      setTotalCommissionsCollected(data.totalCommissionsCollected);
      setTotalOrders(data.totalOrders);
    } catch (error) {
      console.error("Error fetching commissions:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommissions();
  }, [fetchCommissions]);

  const handleRateChange = (sellerId: string, rate: number) => {
    setSellerList((prev) =>
      prev.map((s) =>
        s.id === sellerId ? { ...s, commissionRate: rate } : s
      )
    );
    setSavedRows((prev) => ({ ...prev, [sellerId]: false }));
  };

  const handleSaveRow = async (sellerId: string) => {
    const seller = sellerList.find((s) => s.id === sellerId);
    if (!seller) return;

    try {
      const res = await fetch(`/api/admin/commissions/${sellerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionRate: seller.commissionRate }),
      });
      if (!res.ok) throw new Error("Failed to update commission rate");

      setSavedRows((prev) => ({ ...prev, [sellerId]: true }));
      setTimeout(() => {
        setSavedRows((prev) => ({ ...prev, [sellerId]: false }));
      }, 2000);
    } catch (error) {
      console.error("Error saving commission rate:", error);
    }
  };

  const handleSaveDefault = async () => {
    try {
      const res = await fetch("/api/admin/commissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultRate }),
      });
      if (!res.ok) throw new Error("Failed to update default rate");

      setDefaultSaved(true);
      setTimeout(() => setDefaultSaved(false), 2000);
    } catch (error) {
      console.error("Error saving default rate:", error);
    }
  };

  const handleBulkSave = async () => {
    try {
      for (const seller of sellerList) {
        const res = await fetch(`/api/admin/commissions/${seller.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ commissionRate: seller.commissionRate }),
        });
        if (!res.ok)
          throw new Error(`Failed to update rate for ${seller.storeName}`);
      }

      const newSaved: Record<string, boolean> = {};
      sellerList.forEach((s) => {
        newSaved[s.id] = true;
      });
      setSavedRows(newSaved);
      setTimeout(() => {
        setSavedRows({});
      }, 2000);
    } catch (error) {
      console.error("Error in bulk save:", error);
    }
  };

  const calcCommission = calcAmount * (calcRate / 100);
  const calcSellerReceives = calcAmount - calcCommission;

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Configuracion de comisiones
          </h1>
          <p className="mt-1 text-slate-500">
            Gestiona las tasas de comision por vendedor
          </p>
        </div>

        {/* Summary Card */}
        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-indigo-500 to-indigo-700 p-6 text-white shadow-lg">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-200">
                Total comisiones recaudadas
              </p>
              <p className="mt-1 text-4xl font-bold">
                {formatCurrency(totalCommissionsCollected)}
              </p>
              <p className="mt-2 text-sm text-indigo-200">
                De {totalOrders} ordenes procesadas
              </p>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
              <TrendingUp className="h-8 w-8" />
            </div>
          </div>
        </div>

        {/* Default Rate + Calculator */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Default Commission Rate */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <Percent className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Comision por defecto
                </h2>
                <p className="text-sm text-slate-500">
                  Aplica a nuevos vendedores
                </p>
              </div>
            </div>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Tasa (%)
                </label>
                <div className="flex gap-2">
                  {commissionPresets.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setDefaultRate(rate)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                        defaultRate === rate
                          ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      )}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
                <div className="mt-3">
                  <input
                    type="number"
                    value={defaultRate}
                    onChange={(e) => setDefaultRate(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    min={0}
                    max={100}
                    step={0.5}
                  />
                </div>
              </div>
              <button
                onClick={handleSaveDefault}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-all",
                  defaultSaved
                    ? "bg-green-500"
                    : "bg-indigo-600 hover:bg-indigo-700"
                )}
              >
                {defaultSaved ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {defaultSaved ? "Guardado" : "Guardar"}
              </button>
            </div>
          </div>

          {/* Interactive Calculator */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                <Calculator className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Calculadora de comisiones
                </h2>
                <p className="text-sm text-slate-500">
                  Simula una venta y ve la distribucion
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Monto de venta ($)
                  </label>
                  <input
                    type="number"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    min={0}
                    step={0.01}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Comision (%)
                  </label>
                  <select
                    value={calcRate}
                    onChange={(e) => setCalcRate(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {commissionPresets.map((rate) => (
                      <option key={rate} value={rate}>
                        {rate}%
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 space-y-2">
                <p className="text-sm text-slate-600">
                  Si venta ={" "}
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(calcAmount)}
                  </span>
                  , comision ({calcRate}%) ={" "}
                  <span className="font-semibold text-indigo-600">
                    {formatCurrency(calcCommission)}
                  </span>
                  , vendedor recibe ={" "}
                  <span className="font-semibold text-green-600">
                    {formatCurrency(calcSellerReceives)}
                  </span>
                </p>
                {/* Visual bar */}
                <div className="mt-3 h-4 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className="flex h-full">
                    <div
                      className="bg-green-500 transition-all duration-300"
                      style={{
                        width: `${100 - calcRate}%`,
                      }}
                    />
                    <div
                      className="bg-indigo-500 transition-all duration-300"
                      style={{ width: `${calcRate}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-green-600 font-medium">
                    Vendedor: {100 - calcRate}%
                  </span>
                  <span className="text-indigo-600 font-medium">
                    Plataforma: {calcRate}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sellers Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Comisiones por vendedor
            </h2>
            <button
              onClick={handleBulkSave}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              <Save className="h-4 w-4" />
              Guardar todo
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Tienda
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Vendedor
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Tasa de comision
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Ventas totales
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Comisiones ganadas
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sellerList.map((seller) => (
                  <tr
                    key={seller.id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                          <Store className="h-4 w-4" />
                        </div>
                        <span className="font-medium text-slate-900">
                          {seller.storeName}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                      {seller.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        <select
                          value={
                            commissionPresets.includes(seller.commissionRate)
                              ? seller.commissionRate
                              : "custom"
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val !== "custom") {
                              handleRateChange(seller.id, Number(val));
                            }
                          }}
                          className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          {commissionPresets.map((rate) => (
                            <option key={rate} value={rate}>
                              {rate}%
                            </option>
                          ))}
                          <option value="custom">Personalizado</option>
                        </select>
                        <input
                          type="number"
                          value={seller.commissionRate}
                          onChange={(e) =>
                            handleRateChange(
                              seller.id,
                              Number(e.target.value)
                            )
                          }
                          className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          min={0}
                          max={100}
                          step={0.5}
                        />
                        <span className="text-sm text-slate-400">%</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                      {formatCurrency(seller.calculatedTotalSales)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-green-600">
                      {formatCurrency(seller.calculatedCommissions)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <button
                        onClick={() => handleSaveRow(seller.id)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                          savedRows[seller.id]
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
                        )}
                      >
                        {savedRows[seller.id] ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {savedRows[seller.id] ? "Guardado" : "Guardar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Commission Preview per Seller */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Vista previa de comisiones
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {sellerList.map((seller) => {
              const sampleSale = 52.0;
              const commission = sampleSale * (seller.commissionRate / 100);
              const sellerReceives = sampleSale - commission;
              return (
                <div
                  key={seller.id}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <Store className="h-4 w-4 text-indigo-500" />
                    <span className="font-medium text-slate-900">
                      {seller.storeName}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    Si venta = {formatCurrency(sampleSale)}, comision (
                    {seller.commissionRate}%) ={" "}
                    <span className="font-semibold text-indigo-600">
                      {formatCurrency(commission)}
                    </span>
                    , vendedor recibe ={" "}
                    <span className="font-semibold text-green-600">
                      {formatCurrency(sellerReceives)}
                    </span>
                  </p>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="flex h-full">
                      <div
                        className="bg-green-400"
                        style={{
                          width: `${100 - seller.commissionRate}%`,
                        }}
                      />
                      <div
                        className="bg-indigo-400"
                        style={{ width: `${seller.commissionRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
