"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Star,
  Zap,
  Clock,
  BadgeCheck,
  Gift,
} from "lucide-react";
import { Product } from "@/types";
import { formatCurrency, cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  viewMode?: "grid" | "list";
}

export default function ProductCard({
  product,
  viewMode = "grid",
}: ProductCardProps) {
  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : 0;

  const isManual = product.deliveryType === "manual";

  if (viewMode === "list") {
    return (
      <div className="group bg-white rounded-xl border border-surface-200 overflow-hidden hover:shadow-md transition-shadow flex">
        {/* Image */}
        <div className="relative w-44 shrink-0 bg-surface-100">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Gift className="w-10 h-10 text-surface-300" />
            </div>
          )}
          {product.isFeatured && (
            <span className="absolute top-2 left-2 bg-primary-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
              PROMOCIONADO
            </span>
          )}
          {discountPercent > 0 && (
            <span className="absolute top-2 right-2 bg-accent-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                {product.categoryName}
              </span>
              {product.region && (
                <span className="text-xs text-surface-400">{product.region}</span>
              )}
              {isManual ? (
                <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Manual
                </span>
              ) : (
                <span className="text-xs font-medium text-accent-600 bg-accent-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Instantaneo
                </span>
              )}
            </div>
            <Link href={`/products/${product.id}`}>
              <h3 className="font-semibold text-surface-900 group-hover:text-primary-600 transition-colors line-clamp-1 mb-1">
                {product.name}
              </h3>
            </Link>
            <p className="text-xs text-surface-400">
              {product.soldCount} Vendidos
            </p>
          </div>

          <div className="flex items-end justify-between mt-3">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-surface-900">
                  {formatCurrency(product.price)}
                </span>
                {product.originalPrice && discountPercent > 0 && (
                  <span className="text-sm text-surface-400 line-through">
                    {formatCurrency(product.originalPrice)}
                  </span>
                )}
              </div>
              {/* Seller */}
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xs text-surface-500">{product.sellerName}</span>
                {product.sellerVerified && <BadgeCheck className="w-3.5 h-3.5 text-primary-500" />}
                {product.sellerRating > 0 && (
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs text-surface-500">{product.sellerRating}</span>
                  </div>
                )}
              </div>
            </div>
            <Link
              href={`/products/${product.id}`}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors",
                product.stockCount > 0
                  ? "bg-primary-600 hover:bg-primary-700 text-white"
                  : "bg-surface-200 text-surface-400 pointer-events-none"
              )}
            >
              <ArrowRight className="w-4 h-4" />
              {product.stockCount > 0 ? "Ver producto" : "Agotado"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // GRID VIEW (default)
  // ============================================
  return (
    <div className="group bg-white rounded-xl border border-surface-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
      {/* Image */}
      <div className="relative aspect-square bg-surface-100 overflow-hidden">
        {product.image ? (
          <Link href={`/products/${product.id}`}>
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </Link>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Gift className="w-12 h-12 text-surface-300" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isFeatured && (
            <span className="bg-primary-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
              PROMOCIONADO
            </span>
          )}
          {isManual && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              MANUAL
            </span>
          )}
        </div>
        {discountPercent > 0 && (
          <span className="absolute top-2 right-2 bg-accent-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            -{discountPercent}%
          </span>
        )}
        {/* Region */}
        {product.region && (
          <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
            {product.region}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <div className="flex-1">
          <Link href={`/products/${product.id}`}>
            <h3 className="text-sm font-medium text-surface-900 line-clamp-2 mb-1 group-hover:text-primary-600 transition-colors">
              {product.name}
            </h3>
          </Link>
          <p className="text-xs text-surface-400 mb-2">
            {product.soldCount} Vendidos
          </p>
        </div>

        {/* Price */}
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-surface-900">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice && discountPercent > 0 && (
              <span className="text-xs text-surface-400 line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>
        </div>

        {/* View Product Button */}
        <Link
          href={`/products/${product.id}`}
          className={cn(
            "w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-lg transition-colors",
            product.stockCount > 0
              ? "bg-primary-600 hover:bg-primary-700 text-white"
              : "bg-surface-200 text-surface-400 pointer-events-none"
          )}
        >
          <ArrowRight className="w-3.5 h-3.5" />
          {product.stockCount > 0 ? "Ver producto" : "Agotado"}
        </Link>

        {/* Seller Info */}
        <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-surface-100">
          <span className="text-[11px] text-surface-500 truncate">
            {product.sellerName}
          </span>
          <BadgeCheck className="w-3.5 h-3.5 text-primary-500 shrink-0" />
          {product.sellerRating > 0 && (
            <div className="flex items-center gap-0.5 ml-auto">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-[11px] text-surface-500">
                {product.sellerRating}
              </span>
            </div>
          )}
        </div>

        {/* Low Stock */}
        {product.stockCount > 0 && product.stockCount <= 5 && (
          <p className="text-[10px] text-red-500 mt-1.5 font-medium">
            Solo quedan {product.stockCount}
          </p>
        )}
      </div>
    </div>
  );
}
