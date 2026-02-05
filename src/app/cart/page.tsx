"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Tag,
  Info,
} from "lucide-react";
import { Header, Footer } from "@/components/layout";
import { useApp } from "@/context/AppContext";
import { cn, formatCurrency } from "@/lib/utils";

export default function CartPage() {
  const {
    cartItems,
    removeFromCart,
    updateCartQuantity,
    cartTotalItems,
    cartTotalAmount,
  } = useApp();

  const commissionRate = 0.05;
  const commissionInfo = cartTotalAmount * commissionRate;

  if (cartItems.length === 0) {
    return (
      <>
        <Header />
        <main className="min-h-[calc(100vh-4rem)] bg-surface-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="inline-flex items-center justify-center rounded-2xl bg-surface-100 p-5 text-surface-400 mb-6">
                <ShoppingBag className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-bold text-surface-900">
                Tu carrito esta vacio
              </h2>
              <p className="mt-2 max-w-sm text-sm text-surface-500 leading-relaxed">
                Explora nuestro catalogo de productos digitales y encuentra lo que necesitas.
              </p>
              <Link
                href="/products"
                className={cn(
                  "mt-8 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm shadow-primary-600/25 transition-all duration-200",
                  "hover:bg-primary-700 active:bg-primary-800"
                )}
              >
                Explorar productos
                <ArrowRight className="h-4 w-4" />
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
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-surface-900">
              Carrito de compras
            </h1>
            <p className="mt-1 text-sm text-surface-500">
              {cartTotalItems} {cartTotalItems === 1 ? "producto" : "productos"} en tu carrito
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart Items */}
            <div className="flex-1 space-y-4">
              {cartItems.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex gap-4 rounded-xl border border-surface-200 bg-white p-4 sm:p-5 shadow-sm transition-all duration-200 hover:shadow-md"
                >
                  {/* Product Image */}
                  <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-lg bg-surface-100">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-sm sm:text-base font-semibold text-surface-900 truncate">
                            {product.name}
                          </h3>
                          <p className="mt-0.5 text-xs text-surface-500">
                            {product.sellerName} -- {product.categoryName}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(product.id)}
                          className="shrink-0 rounded-lg p-1.5 text-surface-400 hover:bg-red-50 hover:text-red-500 transition-all duration-200 cursor-pointer"
                          aria-label="Eliminar producto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {product.deliveryType === "instant" && (
                        <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-700">
                          <Tag className="h-3 w-3" />
                          Entrega instantanea
                        </span>
                      )}
                    </div>

                    <div className="flex items-end justify-between gap-4 mt-3">
                      {/* Quantity Controls */}
                      <div className="flex items-center rounded-lg border border-surface-200 bg-surface-50">
                        <button
                          onClick={() =>
                            updateCartQuantity(product.id, Math.max(1, quantity - 1))
                          }
                          disabled={quantity <= 1}
                          className="flex h-8 w-8 items-center justify-center text-surface-600 hover:bg-surface-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed rounded-l-lg cursor-pointer"
                          aria-label="Disminuir cantidad"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="flex h-8 w-10 items-center justify-center text-sm font-medium text-surface-900 border-x border-surface-200">
                          {quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateCartQuantity(product.id, quantity + 1)
                          }
                          disabled={quantity >= product.stockCount}
                          className="flex h-8 w-8 items-center justify-center text-surface-600 hover:bg-surface-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed rounded-r-lg cursor-pointer"
                          aria-label="Aumentar cantidad"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        {product.originalPrice && product.originalPrice > product.price && (
                          <p className="text-xs text-surface-400 line-through">
                            {formatCurrency(product.originalPrice * quantity)}
                          </p>
                        )}
                        <p className="text-base font-bold text-surface-900">
                          {formatCurrency(product.price * quantity)}
                        </p>
                        {quantity > 1 && (
                          <p className="text-xs text-surface-500">
                            {formatCurrency(product.price)} c/u
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Continue Shopping */}
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors mt-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Seguir comprando
              </Link>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:w-96 shrink-0">
              <div className="sticky top-24 rounded-xl border border-surface-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-surface-900 mb-5">
                  Resumen del pedido
                </h2>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-surface-600">
                      Subtotal ({cartTotalItems} {cartTotalItems === 1 ? "producto" : "productos"})
                    </span>
                    <span className="font-medium text-surface-900">
                      {formatCurrency(cartTotalAmount)}
                    </span>
                  </div>

                  {/* Commission info */}
                  <div className="flex items-start gap-2 rounded-lg bg-surface-50 p-3">
                    <Info className="h-4 w-4 shrink-0 text-surface-400 mt-0.5" />
                    <div className="text-xs text-surface-500 leading-relaxed">
                      <span className="font-medium text-surface-600">Comision de plataforma:</span>{" "}
                      Un {(commissionRate * 100).toFixed(0)}% se aplica al vendedor como comision de servicio.
                      El precio que ves es el precio final para ti.
                    </div>
                  </div>

                  <div className="border-t border-surface-200 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-surface-900">
                        Total
                      </span>
                      <span className="text-xl font-bold text-primary-600">
                        {formatCurrency(cartTotalAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <Link
                  href="/checkout"
                  className={cn(
                    "mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-3 text-sm font-medium text-white shadow-sm shadow-primary-600/25 transition-all duration-200",
                    "hover:bg-primary-700 active:bg-primary-800"
                  )}
                >
                  Proceder al pago
                  <ArrowRight className="h-4 w-4" />
                </Link>

                {/* Security Badge */}
                <div className="mt-5 flex items-center justify-center gap-2 text-xs text-surface-400">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Pago seguro y encriptado</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
