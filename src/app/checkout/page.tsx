"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart,
  CreditCard,
  CheckCircle2,
  QrCode,
  Smartphone,
  Lock,
  Shield,
  Headphones,
  ArrowLeft,
  ChevronRight,
  Globe,
  AlertCircle,
  Wallet,
  Copy,
  Check,
} from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { useApp } from "@/context/AppContext";
import { cn, formatCurrency } from "@/lib/utils";
import type { PaymentMethod } from "@/types";

const steps = [
  { number: 1, label: "Carrito", icon: ShoppingCart },
  { number: 2, label: "Pago", icon: CreditCard },
  { number: 3, label: "Confirmacion", icon: CheckCircle2 },
];

interface PaymentOption {
  id: PaymentMethod;
  label: string;
  description: string;
  icon: typeof QrCode;
  recommended?: boolean;
}

const basePaymentOptions: PaymentOption[] = [
  {
    id: "qr_bolivia",
    label: "QR Bolivia",
    description: "Paga con tu app bancaria boliviana",
    icon: QrCode,
    recommended: true,
  },
  {
    id: "stripe",
    label: "Tarjeta de credito",
    description: "Visa, Mastercard, American Express",
    icon: CreditCard,
  },
  {
    id: "binance_pay",
    label: "Transferencia Binance",
    description: "Envia USDT desde tu cuenta de Binance",
    icon: Globe,
  },
  {
    id: "crypto",
    label: "Criptomonedas",
    description: "Bitcoin, USDT, USDC y mas",
    icon: Globe,
  },
];

export default function CheckoutPage() {
  const { cartItems, cartTotalAmount, clearCart } = useApp();
  const [selectedPayment, setSelectedPayment] =
    useState<PaymentMethod>("qr_bolivia");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fee configuration
  const [feeConfig, setFeeConfig] = useState<{
    serviceFeeFixed: number;
    serviceFeePercent: number;
    gateways: Record<string, { feePercent: number; feeFixed: number }>;
  } | null>(null);

  // Vemper required fields per product (e.g., player_id)
  const [vemperFields, setVemperFields] = useState<
    Record<string, Record<string, string>>
  >({});
  const [productRequiredFields, setProductRequiredFields] = useState<
    Record<string, string[]>
  >({});

  // Fetch fee configuration
  useEffect(() => {
    fetch("/api/checkout/fees")
      .then((res) => res.json())
      .then((data) => {
        if (data.serviceFeeFixed !== undefined) {
          setFeeConfig(data);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch required fields for products in cart
  useEffect(() => {
    async function fetchVemperRequiredFields() {
      for (const { product } of cartItems) {
        try {
          const res = await fetch(`/api/products/${product.id}`);
          if (res.ok) {
            const data = await res.json();
            const fields = data.product?.vemperProduct?.requiredFields;
            if (fields && Array.isArray(fields) && fields.length > 0) {
              setProductRequiredFields((prev) => ({
                ...prev,
                [product.id]: fields,
              }));
            }
          }
        } catch {
          // Silently fail
        }
      }
    }
    if (cartItems.length > 0) fetchVemperRequiredFields();
  }, [cartItems]);

  // Wallet state
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletLoading, setWalletLoading] = useState(true);

  // QR Bolivia state
  const [qrState, setQrState] = useState<{
    reference: string;
    qrDataUrl?: string;
    amount: number;
    orderIds: string[];
    expiresAt?: string;
    sandbox?: boolean;
  } | null>(null);

  // Binance deposit state
  const [binanceState, setBinanceState] = useState<{
    depositAddress: string;
    coin: string;
    network: string;
    memoCode: string;
    amount: number;
    orderIds: string[];
    expiresAt?: string;
    sandbox?: boolean;
  } | null>(null);

  const [isConfirmingQr, setIsConfirmingQr] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "completed" | "expired">("pending");
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Fetch wallet balance on mount
  useEffect(() => {
    async function fetchWalletBalance() {
      try {
        const res = await fetch("/api/buyer/wallet");
        if (res.ok) {
          const data = await res.json();
          setWalletBalance(data.balance ?? 0);
        }
      } catch {
        // Silently fail — wallet option just won't show
      } finally {
        setWalletLoading(false);
      }
    }
    fetchWalletBalance();
  }, []);

  // Poll for payment status when QR or Binance deposit is active
  useEffect(() => {
    const activeOrderIds = qrState?.orderIds ?? binanceState?.orderIds;
    if (!activeOrderIds || paymentStatus !== "pending") return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch("/api/checkout/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderIds: activeOrderIds }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.status === "completed") {
            setPaymentStatus("completed");
            clearCart();
            const orderIdsParam = activeOrderIds.join(",");
            window.location.href = `/checkout/success?orderIds=${orderIdsParam}`;
          } else if (data.status === "expired") {
            setPaymentStatus("expired");
          }
        }
      } catch {
        // Silently fail — will retry on next poll
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [qrState, binanceState, paymentStatus, clearCart]);

  // Expiration countdown timer (QR Bolivia or Binance deposit)
  useEffect(() => {
    const activeExpiresAt = qrState?.expiresAt ?? binanceState?.expiresAt;
    if (!activeExpiresAt) return;

    const updateTimer = () => {
      const now = Date.now();
      const expiresAt = new Date(activeExpiresAt).getTime();
      const diff = expiresAt - now;

      if (diff <= 0) {
        setTimeRemaining("Expirado");
        setPaymentStatus("expired");
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
    return () => clearInterval(timerInterval);
  }, [qrState?.expiresAt, binanceState?.expiresAt]);

  // Build payment options dynamically (wallet shown if balance > 0)
  const paymentOptions: PaymentOption[] = [
    ...(!walletLoading && walletBalance > 0
      ? [
          {
            id: "wallet" as PaymentMethod,
            label: "Billetera VirtuMall",
            description: `Saldo disponible: ${formatCurrency(walletBalance)}`,
            icon: Wallet,
          },
        ]
      : []),
    ...basePaymentOptions,
  ];

  // Calculate fees based on selected payment method
  const platformFee = feeConfig
    ? feeConfig.serviceFeeFixed + cartTotalAmount * (feeConfig.serviceFeePercent / 100)
    : 0;
  const gatewayFeeConfig = feeConfig?.gateways[selectedPayment];
  const gatewayFee = gatewayFeeConfig
    ? gatewayFeeConfig.feeFixed + cartTotalAmount * (gatewayFeeConfig.feePercent / 100)
    : 0;
  const totalFees = platformFee + gatewayFee;
  const grandTotalDisplay = cartTotalAmount + totalFees;

  const currentStep = 2;

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems.map(({ product, quantity }) => ({
            productId: product.id,
            quantity,
            ...(vemperFields[product.id] &&
              Object.keys(vemperFields[product.id]).length > 0 && {
                vemperFields: vemperFields[product.id],
              }),
          })),
          paymentMethod: selectedPayment,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al procesar el pago");
        setIsProcessing(false);
        return;
      }

      // Handle response based on type
      if (data.type === "redirect" && data.url) {
        // Stripe: redirect to Stripe Checkout
        clearCart();
        window.location.href = data.url;
        return;
      }

      if (data.type === "qr") {
        // QR Bolivia: show QR and wait for confirmation
        setQrState({
          reference: data.reference,
          qrDataUrl: data.qrDataUrl,
          amount: data.amount,
          orderIds: data.orderIds,
          expiresAt: data.expiresAt,
          sandbox: data.sandbox,
        });
        setPaymentStatus("pending");
        setIsProcessing(false);
        return;
      }

      if (data.type === "binance_deposit") {
        // Binance transfer: show deposit instructions and wait
        setBinanceState({
          depositAddress: data.depositAddress,
          coin: data.coin,
          network: data.network,
          memoCode: data.memoCode,
          amount: data.amount,
          orderIds: data.orderIds,
          expiresAt: data.expiresAt,
          sandbox: data.sandbox,
        });
        setPaymentStatus("pending");
        setIsProcessing(false);
        return;
      }

      if (data.type === "crypto_redirect" && data.paymentUrl) {
        // Cryptomus: redirect to payment gateway
        clearCart();
        window.location.href = data.paymentUrl;
        return;
      }

      if (data.type === "wallet_complete" || data.type === "mock_complete") {
        // Wallet or mock payment completed instantly
        clearCart();
        const orderIdsParam = data.orderIds.join(",");
        window.location.href = `/checkout/success?orderIds=${orderIdsParam}`;
        return;
      }

      setError("Respuesta inesperada del servidor");
      setIsProcessing(false);
    } catch {
      setError("Error de conexion. Intenta nuevamente.");
      setIsProcessing(false);
    }
  };

  const handleConfirmQrPayment = async () => {
    if (!qrState) return;
    setIsConfirmingQr(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIds: qrState.orderIds,
          reference: qrState.reference,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al confirmar el pago");
        setIsConfirmingQr(false);
        return;
      }

      clearCart();
      const orderIdsParam = qrState.orderIds.join(",");
      window.location.href = `/checkout/success?orderIds=${orderIdsParam}`;
    } catch {
      setError("Error de conexion. Intenta nuevamente.");
      setIsConfirmingQr(false);
    }
  };

  const handleConfirmBinancePayment = async () => {
    if (!binanceState) return;
    setIsConfirmingQr(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIds: binanceState.orderIds,
          reference: binanceState.memoCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al confirmar el pago");
        setIsConfirmingQr(false);
        return;
      }

      clearCart();
      const orderIdsParam = binanceState.orderIds.join(",");
      window.location.href = `/checkout/success?orderIds=${orderIdsParam}`;
    } catch {
      setError("Error de conexion. Intenta nuevamente.");
      setIsConfirmingQr(false);
    }
  };

  const handleCopyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (cartItems.length === 0 && !qrState && !binanceState) {
    return (
      <>
        <Header />
        <main className="min-h-[calc(100vh-4rem)] bg-surface-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="inline-flex items-center justify-center rounded-2xl bg-surface-100 p-5 text-surface-400 mb-6">
                <ShoppingCart className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-bold text-surface-900">
                No hay productos en tu carrito
              </h2>
              <p className="mt-2 max-w-sm text-sm text-surface-500 leading-relaxed">
                Agrega productos a tu carrito antes de proceder al pago.
              </p>
              <Link
                href="/products"
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm shadow-primary-600/25 transition-all duration-200 hover:bg-primary-700"
              >
                Explorar productos
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-4rem)] bg-surface-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          {/* Step Indicator */}
          <div className="mb-10">
            <div className="flex items-center justify-center">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = step.number === currentStep;
                const isCompleted = step.number < currentStep;

                return (
                  <div key={step.number} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                          isCompleted
                            ? "border-accent-500 bg-accent-500 text-white"
                            : isActive
                            ? "border-primary-500 bg-primary-500 text-white shadow-md shadow-primary-500/25"
                            : "border-surface-300 bg-white text-surface-400"
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <StepIcon className="h-5 w-5" />
                        )}
                      </div>
                      <span
                        className={cn(
                          "mt-2 text-xs font-medium",
                          isActive
                            ? "text-primary-600"
                            : isCompleted
                            ? "text-accent-600"
                            : "text-surface-400"
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={cn(
                          "mx-3 sm:mx-6 h-0.5 w-12 sm:w-20 transition-colors duration-300 mb-6",
                          step.number < currentStep
                            ? "bg-accent-500"
                            : "bg-surface-200"
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Payment Section */}
            <div className="flex-1 space-y-6">
              {/* Back Link */}
              <Link
                href="/cart"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-500 hover:text-surface-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al carrito
              </Link>

              {/* Payment Method Selection */}
              {!qrState && !binanceState && (
                <div>
                  <h2 className="text-lg font-bold text-surface-900 mb-4">
                    Metodo de pago
                  </h2>
                  <div className="space-y-3">
                    {paymentOptions.map((option) => {
                      const OptionIcon = option.icon;
                      const isSelected = selectedPayment === option.id;

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setSelectedPayment(option.id)}
                          disabled={isProcessing}
                          className={cn(
                            "relative flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all duration-200 cursor-pointer",
                            isSelected
                              ? "border-primary-500 bg-primary-50/50 shadow-sm shadow-primary-500/10"
                              : "border-surface-200 bg-white hover:border-surface-300 hover:shadow-sm",
                            "disabled:opacity-50 disabled:pointer-events-none"
                          )}
                        >
                          {/* Radio indicator */}
                          <div
                            className={cn(
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                              isSelected
                                ? "border-primary-500"
                                : "border-surface-300"
                            )}
                          >
                            {isSelected && (
                              <div className="h-2.5 w-2.5 rounded-full bg-primary-500" />
                            )}
                          </div>

                          <div
                            className={cn(
                              "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors",
                              isSelected
                                ? "bg-primary-100 text-primary-600"
                                : "bg-surface-100 text-surface-500"
                            )}
                          >
                            <OptionIcon className="h-5 w-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-surface-900">
                                {option.label}
                              </p>
                              {option.recommended && (
                                <span className="rounded-md bg-accent-100 px-2 py-0.5 text-xs font-medium text-accent-700">
                                  Recomendado
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-surface-500 mt-0.5">
                              {option.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Payment Details based on selection */}
              <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
                {/* Binance Transfer — waiting for deposit */}
                {binanceState && (
                  <div className="flex flex-col items-center text-center space-y-5">
                    <div className="flex items-center gap-2 text-sm font-medium text-surface-700">
                      <Globe className="h-4 w-4 text-amber-500" />
                      Transferencia Binance
                    </div>

                    {paymentStatus === "expired" ? (
                      <div className="w-full rounded-xl bg-red-50 border border-red-200 p-6">
                        <AlertCircle className="h-10 w-10 mx-auto text-red-400 mb-3" />
                        <p className="text-sm text-red-600 font-medium">
                          Esta solicitud de pago ha expirado. Intenta nuevamente.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Deposit Address */}
                        <div className="w-full rounded-xl bg-surface-50 border border-surface-200 p-4 space-y-1">
                          <p className="text-xs text-surface-500 font-medium">Direccion de deposito ({binanceState.network})</p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 text-sm font-mono text-surface-800 break-all leading-relaxed">
                              {binanceState.depositAddress}
                            </code>
                            <button
                              type="button"
                              onClick={() => handleCopyToClipboard(binanceState.depositAddress, "address")}
                              className="shrink-0 flex items-center gap-1 rounded-lg bg-surface-200 px-2.5 py-1.5 text-xs font-medium text-surface-600 hover:bg-surface-300 transition-colors cursor-pointer"
                            >
                              {copiedField === "address" ? <Check className="h-3.5 w-3.5 text-accent-600" /> : <Copy className="h-3.5 w-3.5" />}
                              {copiedField === "address" ? "Copiado" : "Copiar"}
                            </button>
                          </div>
                        </div>

                        {/* Memo Code — CRITICAL */}
                        <div className="w-full rounded-xl bg-amber-50 border-2 border-amber-300 p-4 space-y-1">
                          <p className="text-xs text-amber-700 font-bold uppercase tracking-wider">Codigo Memo (OBLIGATORIO)</p>
                          <div className="flex items-center justify-center gap-3">
                            <code className="text-2xl font-mono font-bold text-amber-800 tracking-widest">
                              {binanceState.memoCode}
                            </code>
                            <button
                              type="button"
                              onClick={() => handleCopyToClipboard(binanceState.memoCode, "memo")}
                              className="shrink-0 flex items-center gap-1 rounded-lg bg-amber-200 px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-300 transition-colors cursor-pointer"
                            >
                              {copiedField === "memo" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                              {copiedField === "memo" ? "Copiado" : "Copiar"}
                            </button>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="w-full rounded-xl bg-surface-50 border border-surface-200 p-4">
                          <p className="text-xs text-surface-500 font-medium mb-1">Monto exacto a enviar</p>
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-3xl font-bold text-primary-600">
                              {binanceState.amount.toFixed(2)}
                            </span>
                            <span className="text-lg font-semibold text-primary-500">
                              {binanceState.coin}
                            </span>
                          </div>
                        </div>

                        {/* Warning */}
                        <div className="w-full flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 p-3">
                          <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                          <p className="text-xs text-red-700 text-left leading-relaxed">
                            <strong>Incluye el codigo memo exacto</strong> en la nota/memo de tu transferencia.
                            Sin el memo correcto, no podremos verificar tu pago automaticamente.
                            Envia exactamente el monto indicado.
                          </p>
                        </div>

                        {/* Status + Timer */}
                        {paymentStatus === "pending" && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-center gap-2 text-sm text-surface-600">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-300 border-t-amber-600" />
                              Esperando deposito...
                            </div>
                            {timeRemaining && (
                              <p className="text-xs text-surface-400">
                                Expira en:{" "}
                                <span className="font-mono font-medium text-surface-600">
                                  {timeRemaining}
                                </span>
                              </p>
                            )}
                          </div>
                        )}

                        {/* Sandbox: manual confirm button */}
                        {binanceState.sandbox && paymentStatus === "pending" && (
                          <>
                            <button
                              type="button"
                              onClick={handleConfirmBinancePayment}
                              disabled={isConfirmingQr}
                              className={cn(
                                "flex items-center justify-center gap-2 rounded-lg bg-accent-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200",
                                "hover:bg-accent-700 active:bg-accent-800",
                                "disabled:opacity-50 disabled:pointer-events-none",
                                "cursor-pointer"
                              )}
                            >
                              {isConfirmingQr ? (
                                <>
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                  Verificando deposito...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4" />
                                  Confirmar deposito realizado
                                </>
                              )}
                            </button>
                            <p className="text-xs text-surface-400">
                              Modo sandbox: haz clic para simular la confirmacion del deposito
                            </p>
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* QR Bolivia — waiting for payment */}
                {!binanceState && qrState && (
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-surface-700">
                      <Smartphone className="h-4 w-4 text-primary-500" />
                      Pago con QR Bolivia
                    </div>
                    {/* QR Code image */}
                    <div className="flex items-center justify-center w-56 h-56 rounded-2xl bg-white border-2 border-surface-200 p-4">
                      {paymentStatus === "expired" ? (
                        <div className="w-full h-full rounded-lg bg-surface-100 flex items-center justify-center">
                          <div className="text-center space-y-2">
                            <AlertCircle className="h-12 w-12 mx-auto text-red-400" />
                            <p className="text-xs text-red-500 font-medium">
                              QR expirado
                            </p>
                          </div>
                        </div>
                      ) : qrState.qrDataUrl ? (
                        <img
                          src={qrState.qrDataUrl}
                          alt="Codigo QR de pago"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full rounded-lg bg-surface-100 flex items-center justify-center">
                          <div className="text-center space-y-2">
                            <QrCode className="h-12 w-12 mx-auto text-surface-300" />
                            <p className="text-xs text-surface-400">
                              QR no disponible
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Status indicator */}
                    {paymentStatus === "pending" && (
                      <div className="flex items-center gap-2 text-sm text-surface-600">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-300 border-t-primary-600" />
                        Esperando pago...
                      </div>
                    )}

                    {/* Expiration timer */}
                    {paymentStatus === "pending" && timeRemaining && (
                      <p className="text-xs text-surface-400">
                        Expira en:{" "}
                        <span className="font-mono font-medium text-surface-600">
                          {timeRemaining}
                        </span>
                      </p>
                    )}

                    {paymentStatus === "expired" && (
                      <p className="text-sm text-red-600 font-medium">
                        Este codigo QR ha expirado. Intenta nuevamente.
                      </p>
                    )}

                    <div className="space-y-1">
                      <p className="text-sm font-medium text-surface-700">
                        Escanea el codigo QR con tu app bancaria
                      </p>
                      <p className="text-xs text-surface-500">
                        Referencia:{" "}
                        <span className="font-mono font-medium">
                          {qrState.reference}
                        </span>
                      </p>
                    </div>
                    <div className="text-2xl font-bold text-primary-600">
                      {formatCurrency(qrState.amount)}
                    </div>

                    {/* Manual confirm button — ONLY in sandbox mode */}
                    {qrState.sandbox && paymentStatus === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={handleConfirmQrPayment}
                          disabled={isConfirmingQr}
                          className={cn(
                            "flex items-center justify-center gap-2 rounded-lg bg-accent-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all duration-200",
                            "hover:bg-accent-700 active:bg-accent-800",
                            "disabled:opacity-50 disabled:pointer-events-none",
                            "cursor-pointer"
                          )}
                        >
                          {isConfirmingQr ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                              Verificando pago...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4" />
                              Confirmar pago realizado
                            </>
                          )}
                        </button>
                        <p className="text-xs text-surface-400">
                          Modo sandbox: haz clic para simular la confirmacion
                          del pago
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* QR Bolivia — initial view */}
                {!qrState && !binanceState && selectedPayment === "qr_bolivia" && (
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-surface-700">
                      <Smartphone className="h-4 w-4 text-primary-500" />
                      Pago con QR Bolivia
                    </div>
                    <div className="relative flex items-center justify-center w-56 h-56 rounded-2xl bg-white border-2 border-surface-200 p-4">
                      <div className="w-full h-full rounded-lg bg-surface-100 flex items-center justify-center">
                        <div className="text-center space-y-2">
                          <QrCode className="h-12 w-12 mx-auto text-surface-300" />
                          <p className="text-xs text-surface-400">
                            El QR se generara al confirmar
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-surface-700">
                        Se generara un codigo QR para tu pago
                      </p>
                      <p className="text-xs text-surface-500">
                        Compatible con todos los bancos bolivianos que soporten QR
                      </p>
                    </div>
                    <div className="text-2xl font-bold text-primary-600">
                      {formatCurrency(grandTotalDisplay)}
                    </div>
                  </div>
                )}

                {!qrState && !binanceState && selectedPayment === "stripe" && (
                  <div className="flex flex-col items-center text-center space-y-4 py-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                      <CreditCard className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-surface-700">
                        Pago seguro con tarjeta
                      </p>
                      <p className="text-xs text-surface-500">
                        Seras redirigido a Stripe para completar el pago de forma segura.
                        Aceptamos Visa, Mastercard y American Express.
                      </p>
                    </div>
                    <div className="text-2xl font-bold text-primary-600">
                      {formatCurrency(grandTotalDisplay)}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-surface-400">
                      <Lock className="h-3.5 w-3.5" />
                      Procesado por Stripe — tus datos estan seguros
                    </div>
                  </div>
                )}

                {!qrState && !binanceState && selectedPayment === "binance_pay" && (
                  <div className="flex flex-col items-center text-center space-y-4 py-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                      <Globe className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-surface-700">
                        Transferencia USDT via Binance
                      </p>
                      <p className="text-xs text-surface-500">
                        Envia USDT desde tu cuenta de Binance a nuestra billetera.
                        Se generaran las instrucciones al confirmar.
                      </p>
                    </div>
                    <div className="text-2xl font-bold text-amber-600">
                      {formatCurrency(grandTotalDisplay)}
                    </div>
                  </div>
                )}

                {!qrState && !binanceState && selectedPayment === "crypto" && (
                  <div className="flex flex-col items-center text-center space-y-4 py-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                      <Globe className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-surface-700">
                        Pago con criptomonedas
                      </p>
                      <p className="text-xs text-surface-500">
                        Se redirigira a la pasarela de pago donde podras
                        elegir Bitcoin, USDT, USDC u otra criptomoneda.
                      </p>
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCurrency(grandTotalDisplay)}
                    </div>
                  </div>
                )}

                {!qrState && !binanceState && selectedPayment === "wallet" && (
                  <div className="flex flex-col items-center text-center space-y-4 py-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-50 text-accent-600">
                      <Wallet className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-surface-700">
                        Pagar con billetera
                      </p>
                      <p className="text-xs text-surface-500">
                        Se descontara el monto total de tu saldo disponible.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-accent-600">
                        {formatCurrency(grandTotalDisplay)}
                      </div>
                      <p className="text-xs text-surface-500">
                        Saldo disponible:{" "}
                        <span className="font-semibold text-surface-700">
                          {formatCurrency(walletBalance)}
                        </span>
                      </p>
                    </div>
                    {walletBalance < grandTotalDisplay && (
                      <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5">
                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                        <p className="text-xs text-amber-700">
                          Saldo insuficiente. Necesitas{" "}
                          <span className="font-semibold">
                            {formatCurrency(grandTotalDisplay - walletBalance)}
                          </span>{" "}
                          adicionales.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Security Badges */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center gap-2 rounded-xl bg-white border border-surface-200 p-4 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
                    <Shield className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-medium text-surface-700">
                    Pago seguro
                  </p>
                </div>
                <div className="flex flex-col items-center gap-2 rounded-xl bg-white border border-surface-200 p-4 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                    <Lock className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-medium text-surface-700">
                    Codigo protegido
                  </p>
                </div>
                <div className="flex flex-col items-center gap-2 rounded-xl bg-white border border-surface-200 p-4 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-50 text-surface-600">
                    <Headphones className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-medium text-surface-700">
                    Soporte 24/7
                  </p>
                </div>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:w-96 shrink-0">
              <div className="sticky top-24 rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-surface-900 mb-5">
                  Resumen del pedido
                </h2>

                {/* Items */}
                <div className="space-y-3 mb-5">
                  {cartItems.map(({ product, quantity }) => (
                    <div key={product.id} className="flex items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-100">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-900 truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-surface-500">
                          Cant: {quantity}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-surface-900 shrink-0">
                        {formatCurrency(product.price * quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Vemper Required Fields */}
                {Object.keys(productRequiredFields).length > 0 && (
                  <div className="mb-5 space-y-3">
                    {cartItems
                      .filter(({ product }) => productRequiredFields[product.id])
                      .map(({ product }) => (
                        <div
                          key={`vemper-${product.id}`}
                          className="rounded-xl border border-amber-200 bg-amber-50 p-3"
                        >
                          <p className="text-xs font-semibold text-amber-800 mb-2">
                            Datos requeridos para: {product.name}
                          </p>
                          <div className="space-y-2">
                            {productRequiredFields[product.id].map((field) => {
                              const label =
                                field === "player_id"
                                  ? "ID del Jugador"
                                  : field === "server"
                                  ? "Servidor"
                                  : field === "phone_number"
                                  ? "Numero de telefono"
                                  : field;
                              return (
                                <div key={field}>
                                  <label className="text-xs text-amber-700 block mb-0.5">
                                    {label}
                                  </label>
                                  <input
                                    type="text"
                                    value={
                                      vemperFields[product.id]?.[field] ?? ""
                                    }
                                    onChange={(e) =>
                                      setVemperFields((prev) => ({
                                        ...prev,
                                        [product.id]: {
                                          ...(prev[product.id] ?? {}),
                                          [field]: e.target.value,
                                        },
                                      }))
                                    }
                                    placeholder={label}
                                    className="w-full rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-sm text-surface-800 placeholder:text-surface-400 outline-none focus:border-primary-400"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                <div className="border-t border-surface-200 pt-4 space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-surface-600">Subtotal</span>
                    <span className="font-medium text-surface-900">
                      {formatCurrency(cartTotalAmount)}
                    </span>
                  </div>
                  {platformFee > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-surface-600">Tarifa de servicio</span>
                      <span className="font-medium text-surface-700">
                        +{formatCurrency(platformFee)}
                      </span>
                    </div>
                  )}
                  {gatewayFee > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-surface-600">Comision pasarela</span>
                      <span className="font-medium text-surface-700">
                        +{formatCurrency(gatewayFee)}
                      </span>
                    </div>
                  )}
                  {totalFees === 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-surface-600">Cargos adicionales</span>
                      <span className="font-medium text-accent-600">Gratis</span>
                    </div>
                  )}
                  <div className="border-t border-surface-200 pt-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-surface-900">
                        Total
                      </span>
                      <span className="text-xl font-bold text-primary-600">
                        {formatCurrency(grandTotalDisplay)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Confirm Payment Button — hidden when QR or Binance is active */}
                {!qrState && !binanceState && (
                  <>
                    <button
                      type="button"
                      onClick={handleConfirmPayment}
                      disabled={isProcessing || (selectedPayment === "wallet" && walletBalance < grandTotalDisplay)}
                      className={cn(
                        "mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-3 text-sm font-medium text-white shadow-sm shadow-primary-600/25 transition-all duration-200",
                        "hover:bg-primary-700 active:bg-primary-800",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
                        "disabled:opacity-50 disabled:pointer-events-none",
                        "cursor-pointer"
                      )}
                    >
                      {isProcessing ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Procesando pago...
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          Confirmar Pago
                        </>
                      )}
                    </button>

                    <p className="mt-3 text-center text-xs text-surface-400">
                      Al confirmar, aceptas nuestros terminos de servicio
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
