"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  AlertTriangle,
  ShoppingBag,
  ArrowRight,
  Package,
  Zap,
  Loader2,
} from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { useApp } from "@/context/AppContext";
import { cn, formatCurrency } from "@/lib/utils";

interface OrderData {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  paymentStatus: string;
  createdAt: string;
  seller: { storeName: string };
  items: Array<{
    id: string;
    productName: string;
    productType: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    deliveryType: string;
    isDelivered: boolean;
    product: {
      id: string;
      name: string;
      image: string | null;
      productType: string;
    };
    giftCardCodes: Array<{
      id: string;
      codeEncrypted: string;
      pin: string | null;
    }>;
    streamingProfiles: Array<{
      id: string;
      profileNumber: number;
      streamingAccount: {
        emailEncrypted: string;
        passwordEncrypted: string;
      };
    }>;
  }>;
  payment: {
    status: string;
    paymentMethod: string;
    completedAt: string | null;
  } | null;
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <>
          <Header />
          <main className="min-h-[calc(100vh-4rem)] bg-surface-50">
            <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-20">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
                <p className="text-sm text-surface-500">Cargando tu pedido...</p>
              </div>
            </div>
          </main>
          <Footer />
        </>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}

function CheckoutSuccessContent() {
  const { clearCart } = useApp();
  const searchParams = useSearchParams();
  const hasCleared = useRef(false);
  const hasFetched = useRef(false);

  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const sessionId = searchParams.get("session_id");
    const orderIds = searchParams.get("orderIds");

    let url = "/api/checkout/verify?";
    if (sessionId) {
      url += `session_id=${sessionId}`;
    } else if (orderIds) {
      url += `orderIds=${orderIds}`;
    } else {
      setError("No se encontro informacion del pedido");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al cargar el pedido");
        setIsLoading(false);
        return;
      }

      setOrders(data.orders || []);
    } catch {
      setError("Error de conexion");
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!hasCleared.current) {
      hasCleared.current = true;
      clearCart();
    }
    fetchOrders();
  }, [clearCart, fetchOrders]);

  const handleCopyCode = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Loading state
  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-[calc(100vh-4rem)] bg-surface-50">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-20">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
              <p className="text-sm text-surface-500">Cargando tu pedido...</p>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <Header />
        <main className="min-h-[calc(100vh-4rem)] bg-surface-50">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-20">
            <div className="flex flex-col items-center justify-center text-center space-y-4">
              <AlertTriangle className="h-10 w-10 text-amber-500" />
              <p className="text-sm text-surface-600">{error}</p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white"
              >
                Ir a productos
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const grandTotal = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const allOrderNumbers = orders.map((o) => o.orderNumber).join(", ");

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-4rem)] bg-surface-50">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="text-center space-y-6">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-accent-100">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-500 text-white shadow-lg shadow-accent-500/30">
                    <CheckCircle2 className="h-9 w-9" />
                  </div>
                </div>
                <div
                  className="absolute inset-0 -m-3 rounded-full border-2 border-accent-200/50 animate-ping"
                  style={{ animationDuration: "2s" }}
                />
                <div className="absolute inset-0 -m-1.5 rounded-full border border-accent-200/30" />
              </div>
            </div>

            {/* Heading */}
            <div>
              <h1 className="text-3xl font-bold text-surface-900">
                Compra realizada con exito!
              </h1>
              <p className="mt-2 text-surface-500">
                Tu pedido ha sido procesado correctamente
              </p>
            </div>

            {/* Order Numbers */}
            <div className="inline-flex items-center gap-2 rounded-lg bg-surface-100 px-4 py-2">
              <Package className="h-4 w-4 text-surface-500" />
              <span className="text-sm text-surface-600">
                {orders.length === 1 ? "Orden" : "Ordenes"}:{" "}
                <span className="font-semibold text-surface-900">
                  {allOrderNumbers}
                </span>
              </span>
            </div>
          </div>

          {/* Orders and Digital Codes */}
          {orders.map((order) => (
            <div
              key={order.id}
              className="mt-8 rounded-2xl border border-surface-200 bg-white shadow-sm overflow-hidden"
            >
              {/* Order header */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-4">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    <h2 className="text-lg font-bold">
                      {order.orderNumber}
                    </h2>
                  </div>
                  <span className="text-sm font-medium opacity-90">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
                <p className="text-sm text-white/80 mt-1">
                  Vendedor: {order.seller.storeName}
                </p>
              </div>

              <div className="p-6 sm:p-8 space-y-5">
                {/* Items */}
                {order.items.map((item) => (
                  <div key={item.id} className="space-y-3">
                    {/* Product info */}
                    <div className="flex items-center gap-3">
                      {item.product.image && (
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-100">
                          <Image
                            src={item.product.image}
                            alt={item.productName}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-900">
                          {item.productName}
                        </p>
                        <p className="text-xs text-surface-500">
                          Cant: {item.quantity} &times;{" "}
                          {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-surface-900">
                        {formatCurrency(item.totalPrice)}
                      </p>
                    </div>

                    {/* Digital codes */}
                    {item.giftCardCodes.length > 0 && (
                      <div className="space-y-2">
                        {item.giftCardCodes.map((code) => (
                          <div
                            key={code.id}
                            className="flex items-center justify-between rounded-xl border-2 border-dashed border-primary-200 bg-primary-50/50 p-3 sm:p-4"
                          >
                            <code className="text-sm sm:text-base font-mono font-bold tracking-wider text-primary-700">
                              {code.codeEncrypted}
                            </code>
                            <button
                              onClick={() =>
                                handleCopyCode(code.codeEncrypted, code.id)
                              }
                              className={cn(
                                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer",
                                copiedId === code.id
                                  ? "bg-accent-100 text-accent-700"
                                  : "bg-primary-100 text-primary-700 hover:bg-primary-200"
                              )}
                            >
                              {copiedId === code.id ? (
                                <>
                                  <Check className="h-3.5 w-3.5" />
                                  Copiado
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" />
                                  Copiar
                                </>
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Streaming credentials */}
                    {item.streamingProfiles.length > 0 && (
                      <div className="space-y-2">
                        {item.streamingProfiles.map((profile) => (
                          <div
                            key={profile.id}
                            className="rounded-xl border-2 border-dashed border-primary-200 bg-primary-50/50 p-3 sm:p-4 space-y-1"
                          >
                            <p className="text-xs text-primary-600 font-medium">
                              Perfil #{profile.profileNumber}
                            </p>
                            <div className="flex items-center justify-between">
                              <code className="text-sm font-mono text-primary-700">
                                {profile.streamingAccount.emailEncrypted}
                              </code>
                              <button
                                onClick={() =>
                                  handleCopyCode(
                                    profile.streamingAccount.emailEncrypted,
                                    `${profile.id}-email`
                                  )
                                }
                                className={cn(
                                  "flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-all cursor-pointer",
                                  copiedId === `${profile.id}-email`
                                    ? "bg-accent-100 text-accent-700"
                                    : "bg-primary-100 text-primary-700 hover:bg-primary-200"
                                )}
                              >
                                {copiedId === `${profile.id}-email` ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                            <div className="flex items-center justify-between">
                              <code className="text-sm font-mono text-primary-700">
                                {profile.streamingAccount.passwordEncrypted}
                              </code>
                              <button
                                onClick={() =>
                                  handleCopyCode(
                                    profile.streamingAccount
                                      .passwordEncrypted,
                                    `${profile.id}-pass`
                                  )
                                }
                                className={cn(
                                  "flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-all cursor-pointer",
                                  copiedId === `${profile.id}-pass`
                                    ? "bg-accent-100 text-accent-700"
                                    : "bg-primary-100 text-primary-700 hover:bg-primary-200"
                                )}
                              >
                                {copiedId === `${profile.id}-pass` ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Manual delivery notice */}
                    {item.deliveryType === "MANUAL" && !item.isDelivered && (
                      <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-3">
                        <Clock className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
                        <p className="text-xs text-amber-700">
                          Entrega manual: el vendedor te enviara el codigo en un plazo de 24 horas.
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                {/* Important Notice */}
                {order.items.some(
                  (i) => i.giftCardCodes.length > 0 || i.streamingProfiles.length > 0
                ) && (
                  <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">
                        Guarda estos codigos en un lugar seguro
                      </p>
                      <p className="mt-1 text-xs text-amber-700 leading-relaxed">
                        Puedes acceder a tus codigos en cualquier momento desde
                        tu panel de compras.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Summary */}
          {orders.length > 1 && (
            <div className="mt-6 flex items-center justify-between rounded-xl bg-surface-100 px-6 py-4">
              <span className="text-sm font-medium text-surface-600">
                Total ({orders.length} ordenes)
              </span>
              <span className="text-lg font-bold text-primary-600">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          )}

          {/* Trust Badges */}
          <div className="mt-8 flex items-center justify-center gap-6">
            <div className="flex items-center gap-1.5 text-xs text-surface-400">
              <ShieldCheck className="h-4 w-4" />
              <span>Transaccion segura</span>
            </div>
            <div className="h-3 w-px bg-surface-200" />
            <div className="flex items-center gap-1.5 text-xs text-surface-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Pago verificado</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/buyer/orders"
              className={cn(
                "inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm shadow-primary-600/25 transition-all duration-200",
                "hover:bg-primary-700 active:bg-primary-800"
              )}
            >
              <ShoppingBag className="h-4 w-4" />
              Ver mis compras
            </Link>
            <Link
              href="/products"
              className={cn(
                "inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-surface-300 bg-white px-6 py-2.5 text-sm font-medium text-surface-700 transition-all duration-200",
                "hover:bg-surface-50 active:bg-surface-100"
              )}
            >
              Seguir comprando
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
