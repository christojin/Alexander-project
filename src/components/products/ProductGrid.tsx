"use client";

import { Search } from "lucide-react";
import { Product } from "@/types";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  onAddToCart?: (product: Product) => void;
  viewMode?: "grid" | "list";
}

export default function ProductGrid({
  products,
  onAddToCart,
  viewMode = "grid",
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-surface-300" />
        </div>
        <h3 className="text-lg font-semibold text-surface-700 mb-1">
          No se encontraron productos
        </h3>
        <p className="text-surface-500 text-sm">
          Intenta ajustar los filtros de busqueda
        </p>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="flex flex-col gap-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            viewMode="list"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          viewMode="grid"
        />
      ))}
    </div>
  );
}
