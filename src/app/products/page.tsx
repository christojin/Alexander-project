"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  LayoutGrid,
  List,
  ArrowUpDown,
  Tag,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/layout";
import { Footer } from "@/components/layout";
import ProductCard from "@/components/products/ProductCard";
import { useApp } from "@/context/AppContext";
import { toFrontendProducts } from "@/lib/api-transforms";
import type { Product } from "@/types";

type SortOption = "popular" | "price_asc" | "price_desc" | "newest";
type DeliveryFilter = "all" | "instant" | "manual";

interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
}

interface CatalogRegion {
  id: string;
  name: string;
  code: string;
  flagEmoji: string;
}

function ProductsContent() {
  const { addToCart } = useApp();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [regions, setRegions] = useState<CatalogRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [deliveryFilter, setDeliveryFilter] = useState<DeliveryFilter>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showPromotedOnly, setShowPromotedOnly] = useState(
    searchParams.get("promoted") === "true"
  );

  // Fetch categories and regions for filter panel
  useEffect(() => {
    fetch("/api/catalog")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data.categories ?? []);
        setRegions(data.regions ?? []);
      })
      .catch(console.error);
  }, []);

  // Build API query params and fetch products
  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (showPromotedOnly) params.set("promoted", "true");
    if (selectedRegion) params.set("region", selectedRegion);
    params.set("sort", sortBy);
    params.set("limit", "50");

    fetch(`/api/products?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setProducts(toFrontendProducts(data.products)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [searchQuery, sortBy, showPromotedOnly, selectedRegion]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Update search from URL params
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setSearchQuery(q);
    const promoted = searchParams.get("promoted");
    if (promoted === "true") setShowPromotedOnly(true);
  }, [searchParams]);

  // Client-side filtering on top of API results
  const filteredProducts = products.filter((p) => {
    if (selectedCategory && p.categoryId !== selectedCategory) return false;
    if (deliveryFilter === "instant" && p.deliveryType !== "instant") return false;
    if (deliveryFilter === "manual" && p.deliveryType !== "manual") return false;
    return true;
  });

  const selectedCategoryName = selectedCategory
    ? categories.find((c) => c.id === selectedCategory)?.name
    : null;

  const selectedRegionName = selectedRegion
    ? regions.find((r) => r.code === selectedRegion)?.name
    : null;

  const selectedRegionFlag = selectedRegion
    ? regions.find((r) => r.code === selectedRegion)?.flagEmoji
    : null;

  const activeFilterCount = [
    selectedCategory,
    selectedRegion,
    deliveryFilter !== "all",
    showPromotedOnly,
  ].filter(Boolean).length;

  return (
    <>
      {/* Page Header */}
      <div className="bg-white border-b border-surface-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-surface-900">
                {showPromotedOnly
                  ? "Productos en promocion"
                  : selectedCategoryName
                  ? `Productos de ${selectedCategoryName}`
                  : "Todos los productos"}
              </h1>
              <p className="text-sm text-surface-500 mt-1">
                {loading ? "Cargando..." : `${filteredProducts.length} productos disponibles`}
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-surface-50 border border-surface-200 rounded-lg text-sm text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                showFilters || activeFilterCount > 0
                  ? "border-primary-300 bg-primary-50 text-primary-700"
                  : "border-surface-200 bg-white text-surface-600 hover:bg-surface-50"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
              {activeFilterCount > 0 && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary-600 text-white text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Promoted Toggle */}
            <button
              onClick={() => setShowPromotedOnly(!showPromotedOnly)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                showPromotedOnly
                  ? "border-accent-300 bg-accent-50 text-accent-700"
                  : "border-surface-200 bg-white text-surface-600 hover:bg-surface-50"
              }`}
            >
              <Tag className="w-4 h-4" />
              Promociones
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort */}
            <div className="relative">
              <div className="flex items-center gap-1.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <ArrowUpDown className="w-4 h-4 text-surface-400" />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none pl-9 pr-8 py-2 bg-white border border-surface-200 rounded-lg text-sm text-surface-600 hover:border-surface-300 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer transition-all"
              >
                <option value="popular">Mas vendidos</option>
                <option value="price_asc">Menor precio</option>
                <option value="price_desc">Mayor precio</option>
                <option value="newest">Mas recientes</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
            </div>

            {/* View Mode */}
            <div className="hidden sm:flex items-center border border-surface-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 transition-colors ${
                  viewMode === "grid"
                    ? "bg-primary-50 text-primary-600"
                    : "bg-white text-surface-400 hover:text-surface-600"
                }`}
                title="Vista grilla"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 transition-colors ${
                  viewMode === "list"
                    ? "bg-primary-50 text-primary-600"
                    : "bg-white text-surface-400 hover:text-surface-600"
                }`}
                title="Vista lista"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white border border-surface-200 rounded-xl p-5 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Categories */}
              <div>
                <h3 className="text-sm font-semibold text-surface-900 mb-3">
                  Categorias
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      !selectedCategory
                        ? "bg-primary-600 text-white"
                        : "bg-surface-100 text-surface-600 hover:bg-surface-200"
                    }`}
                  >
                    Todas
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selectedCategory === cat.id
                          ? "bg-primary-600 text-white"
                          : "bg-surface-100 text-surface-600 hover:bg-surface-200"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Region / Country Flags */}
              <div>
                <h3 className="text-sm font-semibold text-surface-900 mb-3">
                  Region
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedRegion(null)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      !selectedRegion
                        ? "bg-primary-600 text-white"
                        : "bg-surface-100 text-surface-600 hover:bg-surface-200"
                    }`}
                  >
                    Todas
                  </button>
                  {regions.map((region) => (
                    <button
                      key={region.id}
                      onClick={() => setSelectedRegion(region.code)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selectedRegion === region.code
                          ? "bg-primary-600 text-white"
                          : "bg-surface-100 text-surface-600 hover:bg-surface-200"
                      }`}
                    >
                      <span className="text-sm leading-none">{region.flagEmoji}</span>
                      {region.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery Type */}
              <div>
                <h3 className="text-sm font-semibold text-surface-900 mb-3">
                  Tipo de entrega
                </h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "all", label: "Todos" },
                    { value: "instant", label: "Entrega instantanea" },
                    { value: "manual", label: "Entrega manual" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setDeliveryFilter(opt.value as DeliveryFilter)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        deliveryFilter === opt.value
                          ? "bg-primary-600 text-white"
                          : "bg-surface-100 text-surface-600 hover:bg-surface-200"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters */}
        {(selectedCategory || selectedRegion || searchQuery || deliveryFilter !== "all" || showPromotedOnly) && (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="text-xs text-surface-500">Filtros:</span>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors"
              >
                {selectedCategoryName}
                <X className="w-3 h-3" />
              </button>
            )}
            {selectedRegion && (
              <button
                onClick={() => setSelectedRegion(null)}
                className="flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors"
              >
                <span className="text-sm leading-none">{selectedRegionFlag}</span>
                {selectedRegionName}
                <X className="w-3 h-3" />
              </button>
            )}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors"
              >
                &quot;{searchQuery}&quot;
                <X className="w-3 h-3" />
              </button>
            )}
            {deliveryFilter !== "all" && (
              <button
                onClick={() => setDeliveryFilter("all")}
                className="flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors"
              >
                {deliveryFilter === "instant" ? "Instantanea" : "Manual"}
                <X className="w-3 h-3" />
              </button>
            )}
            {showPromotedOnly && (
              <button
                onClick={() => setShowPromotedOnly(false)}
                className="flex items-center gap-1 px-2.5 py-1 bg-accent-50 text-accent-700 rounded-lg text-xs font-medium hover:bg-accent-100 transition-colors"
              >
                Promociones
                <X className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSelectedRegion(null);
                setSearchQuery("");
                setDeliveryFilter("all");
                setShowPromotedOnly(false);
              }}
              className="text-xs text-surface-500 hover:text-surface-700 underline ml-1"
            >
              Limpiar todo
            </button>
          </div>
        )}

        {/* Products */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : filteredProducts.length === 0 ? (
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
        ) : viewMode === "list" ? (
          <div className="flex flex-col gap-3">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
                viewMode="list"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
                viewMode="grid"
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-surface-50">
      <Header />
      <Suspense>
        <ProductsContent />
      </Suspense>
      <Footer />
    </div>
  );
}
