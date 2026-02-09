"use client";

import { useState } from "react";
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
  Mail,
  Lock,
} from "lucide-react";
import { Header } from "@/components/layout";
import { Footer } from "@/components/layout";
import { ProductCard } from "@/components/products";
import { useApp } from "@/context/AppContext";
import { products } from "@/data/mock";
import { formatCurrency } from "@/lib/utils";

export default function ProductDetailPage() {
  const params = useParams();
  const { addToCart } = useApp();
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  const product = products.find((p) => p.id === params.id);

  if (!product) {
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

  const relatedProducts = products
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, 4);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-sm text-surface-500">
            <Link href="/" className="hover:text-primary-600 transition-colors">
              Inicio
            </Link>
            <span>/</span>
            <Link
              href="/products"
              className="hover:text-primary-600 transition-colors"
            >
              Productos
            </Link>
            <span>/</span>
            <span className="text-surface-900 font-medium">
              {product.name}
            </span>
          </div>
        </div>
      </div>

      {/* Product Detail */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="relative aspect-[16/10] bg-white rounded-2xl border border-surface-200 overflow-hidden">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
              />
              {product.originalPrice && (
                <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-full">
                  -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                </div>
              )}
            </div>

            {/* Product Badges */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-surface-200 rounded-xl p-4 text-center">
                <Zap className="w-6 h-6 text-accent-500 mx-auto mb-2" />
                <p className="text-xs font-medium text-surface-700">
                  Entrega instantanea
                </p>
              </div>
              <div className="bg-white border border-surface-200 rounded-xl p-4 text-center">
                {product.productType === "streaming" ? (
                  <>
                    <Lock className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                    <p className="text-xs font-medium text-surface-700">
                      Credenciales seguras
                    </p>
                  </>
                ) : (
                  <>
                    <Shield className="w-6 h-6 text-primary-500 mx-auto mb-2" />
                    <p className="text-xs font-medium text-surface-700">
                      Codigo protegido
                    </p>
                  </>
                )}
              </div>
              <div className="bg-white border border-surface-200 rounded-xl p-4 text-center">
                <QrCode className="w-6 h-6 text-primary-500 mx-auto mb-2" />
                <p className="text-xs font-medium text-surface-700">
                  Pago QR Bolivia
                </p>
              </div>
            </div>

            {/* Delivery Info by Type */}
            <div className="bg-white border border-surface-200 rounded-xl p-4">
              {product.productType === "streaming" ? (
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-surface-700">Entrega de credenciales</p>
                    <p className="text-xs text-surface-500 mt-1">
                      Al completar la compra recibiras correo, usuario, contrasena y fecha de expiracion de tu cuenta.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <Gift className="w-5 h-5 text-sky-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-surface-700">Entrega de codigos</p>
                    <p className="text-xs text-surface-500 mt-1">
                      Al completar la compra recibiras tus codigos digitales protegidos, listos para canjear.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-medium text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
                {product.categoryName}
              </span>
              <span className={`text-sm font-medium px-3 py-1 rounded-full flex items-center gap-1.5 ${
                product.productType === "streaming"
                  ? "text-amber-600 bg-amber-50"
                  : "text-sky-600 bg-sky-50"
              }`}>
                {product.productType === "streaming" ? <Tv className="w-3.5 h-3.5" /> : <Gift className="w-3.5 h-3.5" />}
                {product.productType === "streaming" ? "Streaming" : "Gift Card"}
              </span>
              {product.isFeatured && (
                <span className="text-sm font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3.5 h-3.5" />
                  Destacado
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-surface-900 mb-2">
              {product.name}
            </h1>

            {/* Seller Info */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-1.5">
                <Store className="w-4 h-4 text-surface-400" />
                <span className="text-sm text-surface-600">
                  {product.sellerName}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-medium text-surface-700">
                  {product.sellerRating}
                </span>
              </div>
              <span className="text-sm text-surface-400">
                {product.soldCount} vendidos
              </span>
            </div>

            {/* Price */}
            <div className="bg-surface-50 rounded-2xl p-6 mb-6">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-bold text-surface-900">
                  {formatCurrency(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-xl text-surface-400 line-through">
                    {formatCurrency(product.originalPrice)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-surface-500">
                <div className="flex items-center gap-1.5">
                  <Tag className="w-4 h-4" />
                  <span>Marca: {product.brand}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4" />
                  <span>Region: {product.region}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Package className="w-4 h-4" />
                  <span>{product.stockCount} en stock</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h3 className="font-semibold text-surface-900 mb-2">
                Descripcion
              </h3>
              <p className="text-surface-600 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center bg-white border border-surface-200 rounded-xl">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-3 text-surface-600 hover:text-surface-900 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 py-3 font-semibold text-surface-900 min-w-[48px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity(Math.min(product.stockCount, quantity + 1))
                  }
                  className="px-4 py-3 text-surface-600 hover:text-surface-900 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={product.stockCount === 0}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
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
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    Agregar al carrito
                  </>
                )}
              </button>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between bg-primary-50 rounded-xl px-6 py-4 mb-6">
              <span className="text-primary-700 font-medium">
                Total ({quantity} {quantity === 1 ? "unidad" : "unidades"})
              </span>
              <span className="text-2xl font-bold text-primary-700">
                {formatCurrency(product.price * quantity)}
              </span>
            </div>

            {/* Payment Methods */}
            <div className="border border-surface-200 rounded-xl p-4">
              <p className="text-sm font-medium text-surface-700 mb-3">
                Metodos de pago disponibles
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-surface-50 px-3 py-2 rounded-lg">
                  <QrCode className="w-4 h-4 text-primary-600" />
                  <span className="text-xs font-medium text-surface-600">
                    QR Bolivia
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-surface-50 px-3 py-2 rounded-lg">
                  <CreditCard className="w-4 h-4 text-primary-600" />
                  <span className="text-xs font-medium text-surface-600">
                    Tarjeta
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-surface-50 px-3 py-2 rounded-lg">
                  <span className="text-xs font-bold text-blue-600">P</span>
                  <span className="text-xs font-medium text-surface-600">
                    PayPal
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-surface-900 mb-8">
              Productos relacionados
            </h2>
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
