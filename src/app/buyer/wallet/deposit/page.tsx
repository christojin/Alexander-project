"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  Copy,
  Check,
  Loader2,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { cn, formatCurrency } from "@/lib/utils";

interface DepositInfo {
  depositId: string;
  depositAddress: string;
  coin: string;
  network: string;
  memoCode: string;
  amount: number;
  expiresAt: string;
  sandbox: boolean;
}

export default function WalletDepositPage() {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [depositInfo, setDepositInfo] = useState<DepositInfo | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>("");
  const [status, setStatus] = useState<
    "input" | "pending" | "completed" | "expired"
  >("input");
  const [completedData, setCompletedData] = useState<{
    amount: number;
    newBalance: number;
  } | null>(null);

  const quickAmounts = [5, 10, 25, 50, 100];

  // -- Create deposit request --
  const handleCreateDeposit = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 1 || numAmount > 10000) {
      setError("El monto debe ser entre $1 y $10,000");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/buyer/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numAmount }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al crear el deposito");
        return;
      }

      setDepositInfo(data);
      setStatus("pending");
    } catch {
      setError("Error de conexion. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // -- Poll for deposit status --
  useEffect(() => {
    if (status !== "pending" || !depositInfo) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/buyer/wallet/deposit?depositId=${depositInfo.depositId}`
        );
        const data = await res.json();

        if (data.status === "completed") {
          setStatus("completed");
          setCompletedData({
            amount: data.amount ?? depositInfo.amount,
            newBalance: data.newBalance,
          });
          clearInterval(interval);
        } else if (data.status === "expired") {
          setStatus("expired");
          clearInterval(interval);
        }
      } catch {
        // Silently retry on next interval
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [status, depositInfo]);

  // -- Countdown timer --
  useEffect(() => {
    if (status !== "pending" || !depositInfo?.expiresAt) return;

    const tick = () => {
      const now = Date.now();
      const expires = new Date(depositInfo.expiresAt).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setCountdown("00:00");
        setStatus("expired");
        return;
      }

      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setCountdown(
        `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
      );
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [status, depositInfo?.expiresAt]);

  // -- Copy to clipboard --
  const handleCopy = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Fallback: ignore
    }
  }, []);

  // -- Manual confirm (sandbox) --
  const handleManualConfirm = async () => {
    if (!depositInfo) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/buyer/wallet/deposit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ depositId: depositInfo.depositId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al confirmar");
        return;
      }

      setStatus("completed");
      setCompletedData({
        amount: data.amount ?? depositInfo.amount,
        newBalance: data.newBalance,
      });
    } catch {
      setError("Error de conexion. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const CopyButton = ({
    text,
    field,
  }: {
    text: string;
    field: string;
  }) => (
    <button
      onClick={() => handleCopy(text, field)}
      className="ml-2 p-1 rounded hover:bg-surface-100 transition-colors"
      title="Copiar"
    >
      {copiedField === field ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4 text-surface-400" />
      )}
    </button>
  );

  return (
    <DashboardLayout role="buyer">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/buyer/wallet")}
            className="p-2 rounded-lg hover:bg-surface-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-surface-900">
              Recargar Billetera
            </h1>
            <p className="text-surface-500 text-sm">
              Deposita USDT via Binance para recargar tu saldo
            </p>
          </div>
        </div>

        {/* == STEP 1: Amount Input == */}
        {status === "input" && (
          <div className="space-y-6">
            {/* Amount card */}
            <div className="bg-white rounded-xl border border-surface-200 p-6 space-y-4">
              <label className="block text-sm font-medium text-surface-700">
                Monto a depositar (USD)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 text-lg font-medium">
                  $
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setError(null);
                  }}
                  placeholder="0.00"
                  min="1"
                  max="10000"
                  step="0.01"
                  className="w-full pl-8 pr-4 py-3 text-2xl font-semibold border border-surface-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>

              {/* Quick amounts */}
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((qa) => (
                  <button
                    key={qa}
                    onClick={() => {
                      setAmount(qa.toString());
                      setError(null);
                    }}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                      amount === qa.toString()
                        ? "bg-brand-50 border-brand-300 text-brand-700"
                        : "border-surface-200 text-surface-600 hover:bg-surface-50"
                    )}
                  >
                    ${qa}
                  </button>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 space-y-1">
                <p className="font-medium">Informacion importante</p>
                <p>
                  Se generara un codigo de memo unico. Debes incluir este codigo
                  al enviar la transferencia desde Binance para que el deposito
                  sea detectado automaticamente.
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={handleCreateDeposit}
              disabled={loading || !amount}
              className="w-full py-3 px-4 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generando instrucciones...
                </>
              ) : (
                <>
                  <Wallet className="h-5 w-5" />
                  Generar instrucciones de deposito
                </>
              )}
            </button>
          </div>
        )}

        {/* == STEP 2: Deposit Instructions == */}
        {status === "pending" && depositInfo && (
          <div className="space-y-4">
            {/* Timer */}
            <div className="bg-white rounded-xl border border-surface-200 p-4 flex items-center justify-between">
              <span className="text-sm text-surface-600">
                Tiempo restante
              </span>
              <span
                className={cn(
                  "text-lg font-mono font-bold",
                  countdown <= "05:00"
                    ? "text-red-500"
                    : "text-surface-900"
                )}
              >
                {countdown}
              </span>
            </div>

            {/* Deposit details */}
            <div className="bg-white rounded-xl border border-surface-200 divide-y divide-surface-100">
              {/* Amount */}
              <div className="p-4 flex items-center justify-between">
                <span className="text-sm text-surface-500">Monto exacto</span>
                <div className="flex items-center">
                  <span className="text-xl font-bold text-surface-900">
                    {depositInfo.amount.toFixed(2)} {depositInfo.coin}
                  </span>
                  <CopyButton
                    text={depositInfo.amount.toFixed(2)}
                    field="amount"
                  />
                </div>
              </div>

              {/* Network */}
              <div className="p-4 flex items-center justify-between">
                <span className="text-sm text-surface-500">Red</span>
                <span className="font-medium text-surface-900">
                  {depositInfo.network}
                </span>
              </div>

              {/* Address */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-surface-500">
                    Direccion de deposito
                  </span>
                  <CopyButton
                    text={depositInfo.depositAddress}
                    field="address"
                  />
                </div>
                <p className="text-sm font-mono text-surface-900 break-all bg-surface-50 rounded-lg p-2">
                  {depositInfo.depositAddress}
                </p>
              </div>

              {/* Memo Code - PROMINENT */}
              <div className="p-4 bg-amber-50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-amber-800">
                    Codigo MEMO (obligatorio)
                  </span>
                  <CopyButton
                    text={depositInfo.memoCode}
                    field="memo"
                  />
                </div>
                <p className="text-2xl font-mono font-bold text-amber-900 tracking-wider text-center py-2">
                  {depositInfo.memoCode}
                </p>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div className="text-sm text-red-800 space-y-1">
                <p className="font-medium">
                  IMPORTANTE: Incluye el codigo MEMO
                </p>
                <p>
                  Debes pegar el codigo MEMO exacto en el campo de nota/memo al
                  realizar la transferencia. Sin este codigo, tu deposito no
                  podra ser detectado automaticamente.
                </p>
              </div>
            </div>

            {/* Waiting spinner */}
            <div className="flex items-center justify-center gap-3 py-4 text-surface-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Esperando deposito...</span>
            </div>

            {/* Sandbox confirm */}
            {depositInfo.sandbox && (
              <button
                onClick={handleManualConfirm}
                disabled={loading}
                className="w-full py-3 px-4 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Confirmando...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    Confirmar manualmente (Sandbox)
                  </>
                )}
              </button>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        )}

        {/* == STEP 3: Completed == */}
        {status === "completed" && (
          <div className="bg-white rounded-xl border border-surface-200 p-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-surface-900">
              Deposito exitoso
            </h2>
            {completedData && (
              <div className="space-y-2">
                <p className="text-surface-600">
                  Se acreditaron{" "}
                  <span className="font-semibold text-green-600">
                    {formatCurrency(completedData.amount)}
                  </span>{" "}
                  a tu billetera.
                </p>
                <p className="text-sm text-surface-500">
                  Nuevo saldo:{" "}
                  <span className="font-medium">
                    {formatCurrency(completedData.newBalance)}
                  </span>
                </p>
              </div>
            )}
            <button
              onClick={() => router.push("/buyer/wallet")}
              className="mt-4 px-6 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors"
            >
              Ir a mi billetera
            </button>
          </div>
        )}

        {/* == Expired == */}
        {status === "expired" && (
          <div className="bg-white rounded-xl border border-surface-200 p-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-surface-900">
              Deposito expirado
            </h2>
            <p className="text-surface-600">
              El tiempo para completar el deposito ha expirado. Por favor, crea
              un nuevo deposito.
            </p>
            <button
              onClick={() => {
                setStatus("input");
                setDepositInfo(null);
                setError(null);
              }}
              className="mt-4 px-6 py-2 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors"
            >
              Intentar de nuevo
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
