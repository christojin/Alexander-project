"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout";
import { cn } from "@/lib/utils";
import {
  ArrowRightLeft,
  Plus,
  Save,
  Trash2,
  CheckCircle2,
  Loader2,
  Info,
  X,
} from "lucide-react";

interface Currency {
  id: string;
  name: string;
  code: string;
  symbol: string;
  exchangeRate: number;
  isActive: boolean;
  updatedAt: string;
}

export default function AdminExchangeRatesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [savedRows, setSavedRows] = useState<Record<string, boolean>>({});

  // Add modal state
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newSymbol, setNewSymbol] = useState("");
  const [newRate, setNewRate] = useState(1);
  const [addError, setAddError] = useState("");

  const fetchCurrencies = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/currencies");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCurrencies(data.currencies);
    } catch (error) {
      console.error("Error fetching currencies:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrencies();
  }, [fetchCurrencies]);

  const handleRateChange = (id: string, rate: number) => {
    setCurrencies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, exchangeRate: rate } : c))
    );
    setSavedRows((prev) => ({ ...prev, [id]: false }));
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/admin/currencies/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      setCurrencies((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isActive } : c))
      );
    } catch (error) {
      console.error("Error toggling currency:", error);
    }
  };

  const handleSaveRate = async (id: string) => {
    const currency = currencies.find((c) => c.id === id);
    if (!currency) return;

    try {
      await fetch(`/api/admin/currencies/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exchangeRate: currency.exchangeRate }),
      });
      setSavedRows((prev) => ({ ...prev, [id]: true }));
      setTimeout(() => setSavedRows((prev) => ({ ...prev, [id]: false })), 2000);
    } catch (error) {
      console.error("Error saving rate:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminar esta moneda?")) return;
    try {
      await fetch(`/api/admin/currencies/${id}`, { method: "DELETE" });
      setCurrencies((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Error deleting currency:", error);
    }
  };

  const handleAdd = async () => {
    setAddError("");
    if (!newName || !newCode || !newSymbol || newRate <= 0) {
      setAddError("Todos los campos son requeridos");
      return;
    }

    try {
      const res = await fetch("/api/admin/currencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          code: newCode.toUpperCase(),
          symbol: newSymbol,
          exchangeRate: newRate,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setAddError(err.error || "Error al crear moneda");
        return;
      }

      const data = await res.json();
      setCurrencies((prev) => [...prev, data.currency]);
      setShowAddModal(false);
      setNewName("");
      setNewCode("");
      setNewSymbol("");
      setNewRate(1);
    } catch {
      setAddError("Error de conexion");
    }
  };

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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Tasas de Cambio
            </h1>
            <p className="mt-1 text-slate-500">
              Administra las monedas y tasas de conversion
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Nueva moneda
          </button>
        </div>

        {/* Info Card */}
        <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              Todas las transacciones se procesan en USD
            </p>
            <p className="mt-0.5 text-sm text-blue-700">
              Las tasas de cambio se utilizan para mostrar precios en moneda local a los compradores.
            </p>
          </div>
        </div>

        {/* Currencies Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Monedas configuradas
            </h2>
          </div>
          {currencies.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <ArrowRightLeft className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">
                No hay monedas configuradas. Agrega una moneda para comenzar.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Moneda
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Codigo
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Simbolo
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Tasa (1 USD =)
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currencies.map((currency) => (
                    <tr key={currency.id} className="transition-colors hover:bg-slate-50">
                      <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900">
                        {currency.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                          {currency.code}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                        {currency.symbol}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={currency.exchangeRate}
                            onChange={(e) =>
                              handleRateChange(currency.id, Number(e.target.value))
                            }
                            className="w-28 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            min={0}
                            step={0.01}
                          />
                          <button
                            onClick={() => handleSaveRate(currency.id)}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                              savedRows[currency.id]
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600"
                            )}
                          >
                            {savedRows[currency.id] ? (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            ) : (
                              <Save className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(currency.id, !currency.isActive)}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                            currency.isActive ? "bg-green-500" : "bg-slate-300"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                              currency.isActive ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <button
                          onClick={() => handleDelete(currency.id)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Currency Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Agregar moneda
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Nombre
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Boliviano"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Codigo
                  </label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="BOB"
                    maxLength={5}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 uppercase focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Simbolo
                  </label>
                  <input
                    type="text"
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value)}
                    placeholder="Bs"
                    maxLength={5}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Tasa de cambio (1 USD = ?)
                </label>
                <input
                  type="number"
                  value={newRate}
                  onChange={(e) => setNewRate(Number(e.target.value))}
                  min={0}
                  step={0.01}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              {addError && (
                <p className="text-sm text-red-600">{addError}</p>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAdd}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                >
                  Agregar moneda
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
