"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";

export default function CheckoutSuccessPage() {
  const { clearCart } = useApp();
  const [copied, setCopied] = useState(false);
  const hasCleared = useRef(false);

  // Generate a mock order ID and digital code
  const orderId = `ORD-${Math.random().toString(36).substring(2, 5).toUpperCase()}${Math.floor(Math.random() * 900 + 100)}`;
  const digitalCode = "XXVM-K9F2-4BHL-WNQT";

  useEffect(() => {
    if (!hasCleared.current) {
      hasCleared.current = true;
      clearCart();
    }
  }, [clearCart]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(digitalCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = digitalCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
                {/* Decorative rings */}
                <div className="absolute inset-0 -m-3 rounded-full border-2 border-accent-200/50 animate-ping" style={{ animationDuration: "2s" }} />
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

            {/* Order ID */}
            <div className="inline-flex items-center gap-2 rounded-lg bg-surface-100 px-4 py-2">
              <Package className="h-4 w-4 text-surface-500" />
              <span className="text-sm text-surface-600">
                Numero de orden:{" "}
                <span className="font-semibold text-surface-900">{orderId}</span>
              </span>
            </div>
          </div>

          {/* Digital Code Section */}
          <div className="mt-10 rounded-2xl border border-surface-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-4">
              <div className="flex items-center justify-center gap-2 text-white">
                <Zap className="h-5 w-5" />
                <h2 className="text-lg font-bold">Tu codigo digital</h2>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-5">
              {/* Code Display */}
              <div className="relative">
                <div className="flex items-center justify-between rounded-xl border-2 border-dashed border-primary-200 bg-primary-50/50 p-4 sm:p-5">
                  <code className="text-lg sm:text-xl font-mono font-bold tracking-wider text-primary-700">
                    {digitalCode}
                  </code>
                  <button
                    onClick={handleCopyCode}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 cursor-pointer",
                      copied
                        ? "bg-accent-100 text-accent-700"
                        : "bg-primary-100 text-primary-700 hover:bg-primary-200"
                    )}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copiar
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Important Notice */}
              <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 p-4">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    Guarda este codigo en un lugar seguro
                  </p>
                  <p className="mt-1 text-xs text-amber-700 leading-relaxed">
                    Este codigo es unico y no podra ser recuperado una vez que cierres esta pagina.
                    Te recomendamos guardarlo o tomar una captura de pantalla.
                  </p>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="flex items-start gap-3 rounded-xl bg-accent-50 border border-accent-200 p-4">
                <Clock className="h-5 w-5 shrink-0 text-accent-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-accent-800">
                    Codigo entregado instantaneamente
                  </p>
                  <p className="mt-1 text-xs text-accent-700 leading-relaxed">
                    Codigo entregado instantaneamente tras confirmar el pago.
                    Puedes acceder a tus codigos en cualquier momento desde tu panel de compras.
                  </p>
                </div>
              </div>
            </div>
          </div>

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
