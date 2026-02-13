"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart,
  Star,
  Zap,
  Shield,
  QrCode,
  CreditCard,
  ArrowLeft,
  Minus,
  Plus,
  Check,
  AlertTriangle,
  Tag,
  Globe,
  Store,
  Package,
  Tv,
  Gift,
  Lock,
  Clock,
  BadgeCheck,
  Users,
  Calendar,
  MessageCircle,
  ChevronRight,
  ArrowUpDown,
  Info,
  Coins,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/layout";
import { Footer } from "@/components/layout";
import { ProductCard } from "@/components/products";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/utils";
import { toFrontendProduct, toFrontendProducts } from "@/lib/api-transforms";
import type { Product } from "@/types";

// Service fee config (would come from admin settings)
const SERVICE_FEE_FIXED = 0.50;
const SERVICE_FEE_PERCENT = 3;

function getProductTypeLabel(type: string) {
  switch (type) {
    case "streaming": return "Streaming";
    case "gift_card": return "Gift Card";
    case "topup": return "Recarga / Top-Up";
    default: return type;
  }
}

function getProductTypeIcon(type: string) {
  switch (type) {
    case "streaming": return Tv;
    case "gift_card": return Gift;
    case "topup": return Coins;
    default: return Gift;
  }
}

function getProductTypeColor(type: string) {
  switch (type) {
    case "streaming": return "text-amber-600 bg-amber-50";
    case "gift_card": return "text-sky-600 bg-sky-50";
    case "topup": return "text-purple-600 bg-purple-50";
    default: return "text-surface-600 bg-surface-50";
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-BO", {
    year: "numeric",
    month: "short",
  });
}

export default function ProductDetailPage() {
  const params = useParams();
  const { addToCart } = useApp();
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    setLoading(true);
    fetch(`/api/products/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setProduct(toFrontendProduct(data.product));
        setRelatedProducts(toFrontendProducts(data.relatedProducts ?? []));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-surface-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <AlertTriangle className="w-16 h-16 text-surface-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-surface-900 mb-2">
            Producto no encontrado
          </h1>
          <p className="text-surface-500 mb-6">
            El producto que buscas no existe o fue removido
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al catalogo
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const TypeIcon = getProductTypeIcon(product.productType);

  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : 0;

  const subtotal = product.price * quantity;
  const serviceFee = SERVICE_FEE_FIXED + subtotal * (SERVICE_FEE_PERCENT / 100);
  const total = subtotal + serviceFee;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-surface-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-surface-500">
            <Link href="/" className="hover:text-primary-600 transition-colors">
              Inicio
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link
              href="/products"
              className="hover:text-primary-600 transition-colors"
            >
              Productos
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link
              href={`/products?category=${product.categoryId}`}
              className="hover:text-primary-600 transition-colors"
            >
              {product.categoryName}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-surface-900 font-medium truncate max-w-[200px]">
              {product.name}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* ================================ */}
          {/* LEFT COLUMN: Product Image + Info */}
          {/* ================================ */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Header */}
            <div className="bg-white rounded-2xl border border-surface-200 p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Image */}
                <div className="relative aspect-square bg-surface-50 rounded-xl overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-contain p-6"
                  />
                  {discountPercent > 0 && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                      -{discountPercent}%
                    </div>
                  )}
                  {product.deliveryType === "manual" && (
                    <div className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      MANUAL
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex flex-col">
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${getProductTypeColor(product.productType)}`}>
                      <TypeIcon className="w-3.5 h-3.5" />
                      {getProductTypeLabel(product.productType)}
                    </span>
                    {product.regionFlag && (
                      <span className="text-xs font-medium text-surface-600 bg-surface-100 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <span>{product.regionFlag}</span>
                        {product.region}
                      </span>
                    )}
                    {product.isFeatured && (
                      <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-500" />
                        Destacado
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl font-bold text-surface-900 mb-1">
                    {product.name}
                  </h1>

                  <p className="text-sm text-surface-500 mb-4">
                    {product.brand} &middot; {product.platform}
                  </p>

                  {/* Price */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-surface-900">
                        {formatCurrency(product.price)}
                      </span>
                      {product.originalPrice && (
                        <span className="text-lg text-surface-400 line-through">
                          {formatCurrency(product.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center gap-4 text-sm text-surface-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      <span>{product.stockCount} en stock</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ShoppingCart className="w-4 h-4" />
                      <span>{product.soldCount} vendidos</span>
                    </div>
                  </div>

                  {/* Delivery Type Badge */}
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                    product.deliveryType === "instant"
                      ? "bg-accent-50 text-accent-700"
                      : "bg-amber-50 text-amber-700"
                  }`}>
                    {product.deliveryType === "instant" ? (
                      <>
                        <Zap className="w-4 h-4" />
                        Entrega instantanea automatica
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4" />
                        Entrega manual: {product.manualDeliveryTime || "1-24 horas"}
                      </>
                    )}
                  </div>

                  {/* Streaming Mode Info */}
                  {product.productType === "streaming" && product.streamingMode && (
                    <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-50 text-sm">
                      {product.streamingMode === "complete_account" ? (
                        <>
                          <Lock className="w-4 h-4 text-primary-500" />
                          <span className="text-surface-700">
                            <strong>Cuenta completa</strong> &middot; {product.streamingDuration}
                          </span>
                        </>
                      ) : (
                        <>
                          <Users className="w-4 h-4 text-primary-500" />
                          <span className="text-surface-700">
                            <strong>Perfil compartido</strong> &middot; {product.streamingDuration}
                            {product.streamingMaxProfiles && (
                              <> &middot; Max {product.streamingMaxProfiles} perfiles</>
                            )}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-surface-200 p-6">
              <h2 className="text-lg font-semibold text-surface-900 mb-3">
                Descripcion del producto
              </h2>
              <p className="text-surface-600 leading-relaxed">
                {product.description}
              </p>

              {/* Streaming Details */}
              {product.productType === "streaming" && (
                <div className="mt-6 border-t border-surface-100 pt-5">
                  <h3 className="text-sm font-semibold text-surface-900 mb-3 flex items-center gap-2">
                    <Tv className="w-4 h-4 text-amber-500" />
                    Detalles de la cuenta
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 bg-surface-50 rounded-lg px-4 py-3">
                      <div className="text-surface-400">
                        {product.streamingMode === "complete_account" ? (
                          <Lock className="w-5 h-5" />
                        ) : (
                          <Users className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-surface-500">Tipo de acceso</p>
                        <p className="text-sm font-medium text-surface-900">
                          {product.streamingMode === "complete_account"
                            ? "Cuenta completa (uso exclusivo)"
                            : "Perfil individual (compartido)"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-surface-50 rounded-lg px-4 py-3">
                      <Calendar className="w-5 h-5 text-surface-400" />
                      <div>
                        <p className="text-xs text-surface-500">Duracion</p>
                        <p className="text-sm font-medium text-surface-900">
                          {product.streamingDuration || "1 mes"}
                        </p>
                      </div>
                    </div>
                    {product.streamingMode === "complete_account" && (
                      <div className="flex items-center gap-3 bg-surface-50 rounded-lg px-4 py-3">
                        <Shield className="w-5 h-5 text-surface-400" />
                        <div>
                          <p className="text-xs text-surface-500">Que recibiras</p>
                          <p className="text-sm font-medium text-surface-900">
                            Correo, usuario, contrasena y fecha de corte
                          </p>
                        </div>
                      </div>
                    )}
                    {product.streamingMode === "profile_sharing" && (
                      <>
                        <div className="flex items-center gap-3 bg-surface-50 rounded-lg px-4 py-3">
                          <Shield className="w-5 h-5 text-surface-400" />
                          <div>
                            <p className="text-xs text-surface-500">Que recibiras</p>
                            <p className="text-sm font-medium text-surface-900">
                              Acceso a tu perfil personal con PIN
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Manual Delivery Notice */}
              {product.deliveryType === "manual" && (
                <div className="mt-6 border-t border-surface-100 pt-5">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="text-sm font-semibold text-amber-800 mb-1">
                          Producto con entrega manual
                        </h4>
                        <p className="text-sm text-amber-700 leading-relaxed">
                          Este producto se entrega manualmente por el vendedor. El tiempo estimado
                          de entrega es de <strong>{product.manualDeliveryTime || "1-24 horas"}</strong>.
                          El vendedor procesara tu pedido durante su horario de atencion.
                          Si tienes dudas, puedes contactar al vendedor antes de comprar.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Top-up Details */}
              {product.productType === "topup" && product.deliveryType === "instant" && (
                <div className="mt-6 border-t border-surface-100 pt-5">
                  <h3 className="text-sm font-semibold text-surface-900 mb-3 flex items-center gap-2">
                    <Coins className="w-4 h-4 text-purple-500" />
                    Instrucciones de recarga
                  </h3>
                  <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                    <ol className="space-y-2 text-sm text-purple-800">
                      <li className="flex items-start gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-200 text-xs font-bold text-purple-700">1</span>
                        <span>Proporciona tu ID de jugador al momento de la compra</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-200 text-xs font-bold text-purple-700">2</span>
                        <span>La recarga se procesara automaticamente via Vemper</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-purple-200 text-xs font-bold text-purple-700">3</span>
                        <span>Recibiras confirmacion en tu correo</span>
                      </li>
                    </ol>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* ================================ */}
          {/* RIGHT COLUMN: Purchase + Seller */}
          {/* ================================ */}
          <div className="space-y-6">
            {/* Purchase Card */}
            <div className="bg-white rounded-2xl border border-surface-200 p-6 sticky top-20">
              <h3 className="font-semibold text-surface-900 mb-4">
                Comprar ahora
              </h3>

              {/* Quantity */}
              <div className="mb-4">
                <label className="text-sm text-surface-500 mb-2 block">
                  Cantidad
                </label>
                <div className="flex items-center border border-surface-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-3 text-surface-600 hover:bg-surface-50 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="flex-1 py-3 font-semibold text-surface-900 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity(Math.min(product.stockCount, quantity + 1))
                    }
                    className="px-4 py-3 text-surface-600 hover:bg-surface-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between text-surface-600">
                  <span>Subtotal ({quantity}x {formatCurrency(product.price)})</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-surface-500">
                  <span className="flex items-center gap-1">
                    Tarifa de servicio
                    <span className="text-xs text-surface-400">
                      ({SERVICE_FEE_PERCENT}% + {formatCurrency(SERVICE_FEE_FIXED)})
                    </span>
                  </span>
                  <span>{formatCurrency(serviceFee)}</span>
                </div>
                <div className="border-t border-surface-200 pt-2 flex justify-between font-semibold text-surface-900">
                  <span>Total</span>
                  <span className="text-xl">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={product.stockCount === 0}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold transition-all duration-200 ${
                  addedToCart
                    ? "bg-accent-500 text-white"
                    : product.stockCount > 0
                    ? "bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/30"
                    : "bg-surface-200 text-surface-400 cursor-not-allowed"
                }`}
              >
                {addedToCart ? (
                  <>
                    <Check className="w-5 h-5" />
                    Agregado al carrito
                  </>
                ) : product.stockCount > 0 ? (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    Agregar al carrito
                  </>
                ) : (
                  "Agotado"
                )}
              </button>

              {/* Stock Warning */}
              {product.stockCount > 0 && product.stockCount <= 5 && (
                <p className="text-xs text-amber-600 text-center mt-2 flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Solo quedan {product.stockCount} unidades
                </p>
              )}

              {/* Payment Methods */}
              <div className="mt-5 pt-5 border-t border-surface-100">
                <p className="text-xs font-medium text-surface-500 mb-2.5">
                  Metodos de pago
                </p>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 bg-surface-50 px-2.5 py-1.5 rounded-lg">
                    <QrCode className="w-3.5 h-3.5 text-primary-600" />
                    <span className="text-xs text-surface-600">QR Bolivia</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-surface-50 px-2.5 py-1.5 rounded-lg">
                    <CreditCard className="w-3.5 h-3.5 text-primary-600" />
                    <span className="text-xs text-surface-600">Stripe</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-surface-50 px-2.5 py-1.5 rounded-lg">
                    <span className="text-xs font-bold text-amber-600">B</span>
                    <span className="text-xs text-surface-600">Binance Pay</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-surface-50 px-2.5 py-1.5 rounded-lg">
                    <Coins className="w-3.5 h-3.5 text-primary-600" />
                    <span className="text-xs text-surface-600">Crypto</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Seller Card */}
            <div className="bg-white rounded-2xl border border-surface-200 p-6">
              <h3 className="font-semibold text-surface-900 mb-4 flex items-center gap-2">
                <Store className="w-5 h-5 text-primary-500" />
                Vendedor
              </h3>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold text-lg">
                  {product.sellerName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-surface-900">
                      {product.sellerName}
                    </span>
                    {product.sellerVerified && (
                      <BadgeCheck className="w-4.5 h-4.5 text-primary-500" />
                    )}
                  </div>
                  <p className="text-xs text-surface-500">
                    Miembro desde {formatDate(product.sellerJoined)}
                  </p>
                </div>
              </div>

              {/* Seller Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-surface-50 rounded-lg px-3 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1 text-amber-500 mb-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span className="text-sm font-bold text-surface-900">{product.sellerRating}</span>
                  </div>
                  <p className="text-[10px] text-surface-500 uppercase tracking-wider">Rating</p>
                </div>
                <div className="bg-surface-50 rounded-lg px-3 py-2.5 text-center">
                  <p className="text-sm font-bold text-surface-900 mb-0.5">
                    {product.sellerSales.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-surface-500 uppercase tracking-wider">Ventas</p>
                </div>
                <div className="bg-surface-50 rounded-lg px-3 py-2.5 text-center">
                  <p className="text-sm font-bold text-surface-900 mb-0.5">
                    {product.sellerVerified ? "Si" : "No"}
                  </p>
                  <p className="text-[10px] text-surface-500 uppercase tracking-wider">Verificado</p>
                </div>
              </div>

              {/* Contact Seller */}
              <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-surface-200 text-sm font-medium text-surface-700 hover:bg-surface-50 transition-colors">
                <MessageCircle className="w-4 h-4" />
                Contactar vendedor
              </button>
            </div>

            {/* Trust Badges */}
            <div className="bg-white rounded-2xl border border-surface-200 p-5">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
                    <Shield className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-900">Compra protegida</p>
                    <p className="text-xs text-surface-500">Garantia de reembolso si hay problemas</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                    <Lock className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-900">Codigos encriptados</p>
                    <p className="text-xs text-surface-500">AES-256 para proteger tus datos</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                    <Zap className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-900">Soporte 24/7</p>
                    <p className="text-xs text-surface-500">Sistema de tickets con respuesta rapida</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-14">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-surface-900">
                Productos relacionados
              </h2>
              <Link
                href={`/products?category=${product.categoryId}`}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
              >
                Ver todos
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} onAddToCart={addToCart} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
