"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Star, Zap, Shield, Tv, Gift } from "lucide-react";
import { Product } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div className="group relative bg-white rounded-2xl border border-surface-200 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/10 hover:-translate-y-1">
      {product.originalPrice && (
        <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
          -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
        </div>
      )}
      {product.isFeatured && (
        <div className="absolute top-3 right-3 z-10 bg-primary-600 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
          <Star className="w-3 h-3" />
          Destacado
        </div>
      )}

      <Link href={`/products/${product.id}`}>
        <div className="relative h-48 bg-surface-100 overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
            {product.categoryName}
          </span>
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1",
            product.productType === "streaming"
              ? "text-amber-600 bg-amber-50"
              : "text-sky-600 bg-sky-50"
          )}>
            {product.productType === "streaming" ? <Tv className="w-3 h-3" /> : <Gift className="w-3 h-3" />}
            {product.productType === "streaming" ? "Streaming" : "Gift Card"}
          </span>
          <span className="text-xs text-surface-400">{product.region}</span>
        </div>

        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-surface-900 mb-1 group-hover:text-primary-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex items-center gap-0.5">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-medium text-surface-600">
              {product.sellerRating}
            </span>
          </div>
          <span className="text-surface-300">|</span>
          <span className="text-xs text-surface-500">{product.sellerName}</span>
        </div>

        <div className="flex items-center gap-1.5 mb-3">
          <Zap className="w-3.5 h-3.5 text-accent-500" />
          <span className="text-xs text-accent-600 font-medium">
            Entrega instantanea
          </span>
          {product.productType === "streaming" ? (
            <>
              <Tv className="w-3.5 h-3.5 text-amber-500 ml-1" />
              <span className="text-xs text-amber-600 font-medium">
                Credenciales
              </span>
            </>
          ) : (
            <>
              <Shield className="w-3.5 h-3.5 text-primary-400 ml-1" />
              <span className="text-xs text-primary-500 font-medium">
                Codigo protegido
              </span>
            </>
          )}
        </div>

        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-surface-900">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-surface-400 line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              onAddToCart?.(product);
            }}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
              product.stockCount > 0
                ? "bg-primary-600 text-white hover:bg-primary-700 hover:scale-105 active:scale-95"
                : "bg-surface-200 text-surface-400 cursor-not-allowed"
            )}
            disabled={product.stockCount === 0}
            title={product.stockCount > 0 ? "Agregar al carrito" : "Sin stock"}
          >
            <ShoppingCart className="w-4.5 h-4.5" />
          </button>
        </div>

        {product.stockCount <= 5 && product.stockCount > 0 && (
          <p className="text-xs text-red-500 mt-2 font-medium">
            Solo quedan {product.stockCount} disponibles
          </p>
        )}
        {product.stockCount === 0 && (
          <p className="text-xs text-surface-400 mt-2 font-medium">
            Agotado
          </p>
        )}
      </div>
    </div>
  );
}
