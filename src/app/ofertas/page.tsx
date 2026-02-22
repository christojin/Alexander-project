"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  ArrowUpDown,
  Tag,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/layout";
import { Footer } from "@/components/layout";
import ProductCard from "@/components/products/ProductCard";
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

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function getFlagUrl(code: string): string | null {
  if (code.length === 2) return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
  return null;
}

function FlagIcon({ code, flagEmoji, size = 16 }: { code: string; flagEmoji: string; size?: number }) {
  const url = getFlagUrl(code);
  if (url) {
    /* eslint-disable @next/next/no-img-element */
    return (
      <img
        src={url}
        alt=""
        width={size}
        height={Math.round(size * 0.75)}
        className="inline-block object-contain"
        style={{ width: size, height: Math.round(size * 0.75) }}
        loading="lazy"
      />
    );
  }
  return <span className="text-sm leading-none">{flagEmoji}</span>;
}

const ITEMS_PER_PAGE = 25;

function OfertasContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [regions, setRegions] = useState<CatalogRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 0,
  });

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [deliveryFilter, setDeliveryFilter] = useState<DeliveryFilter>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [currentPage, setCurrentPage] = useState(
    Math.max(1, parseInt(searchParams.get("page") ?? "1"))
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

  // Fetch offers with filters and pagination
  const fetchOffers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("offers", "true");
    if (searchQuery) params.set("search", searchQuery);
    if (selectedRegion) params.set("region", selectedRegion);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    params.set("sort", sortBy);
    params.set("page", String(currentPage));
    params.set("limit", String(ITEMS_PER_PAGE));

    fetch(`/api/products?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(toFrontendProducts(data.products));
        if (data.pagination) setPagination(data.pagination);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [searchQuery, sortBy, selectedRegion, minPrice, maxPrice, currentPage]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  // Sync page to URL
  useEffect(() => {
    const url = new URL(window.location.href);
    if (currentPage > 1) {
      url.searchParams.set("page", String(currentPage));
    } else {
      url.searchParams.delete("page");
    }
    router.replace(url.pathname + url.search, { scroll: false });
  }, [currentPage, router]);

  // Scroll to top on page change
  useEffect(() => {
    if (currentPage > 1) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentPage]);

  // Reset to page 1 when filters change
  const handleFilterChange = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // Wrapped setters that reset page
  const updateCategory = (val: string | null) => {
    setSelectedCategory(val);
    handleFilterChange();
  };
  const updateRegion = (val: string | null) => {
    setSelectedRegion(val);
    handleFilterChange();
  };
  const updateSort = (val: SortOption) => {
    setSortBy(val);
    handleFilterChange();
  };
  const updateSearch = (val: string) => {
    setSearchQuery(val);
    handleFilterChange();
  };
  const updateMinPrice = (val: string) => {
    setMinPrice(val);
    handleFilterChange();
  };
  const updateMaxPrice = (val: string) => {
    setMaxPrice(val);
    handleFilterChange();
  };
  const updateDelivery = (val: DeliveryFilter) => {
    setDeliveryFilter(val);
    handleFilterChange();
  };

  // Client-side filtering for category and delivery type
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
    minPrice,
    maxPrice,
  ].filter(Boolean).length;

  // Generate page numbers for pagination
  const getPageNumbers = (): (number | "ellipsis")[] => {
    const { totalPages } = pagination;
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const pages: (number | "ellipsis")[] = [1];
    if (currentPage > 3) pages.push("ellipsis");

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (currentPage < totalPages - 2) pages.push("ellipsis");
    pages.push(totalPages);

    return pages;
  };

  return (
    <>
      {/* Page Header */}
      <div className="bg-white border-b border-surface-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <Tag className="w-7 h-7 text-accent-500" />
                <h1 className="text-2xl font-bold text-surface-900">
                  Ofertas del d&iacute;a
                </h1>
              </div>
              <p className="text-sm text-surface-500 mt-1">
                {loading
                  ? "Cargando..."
                  : `${pagination.total} ofertas disponibles`}
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                type="text"
                placeholder="Buscar ofertas..."
                value={searchQuery}
                onChange={(e) => updateSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-surface-50 border border-surface-200 rounded-lg text-sm text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => updateSearch("")}
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
          </div>

          <div className="flex items-center gap-2">
            {/* Sort */}
            <div className="relative">
              <div className="flex items-center gap-1.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <ArrowUpDown className="w-4 h-4 text-surface-400" />
              </div>
              <select
                value={sortBy}
                onChange={(e) => updateSort(e.target.value as SortOption)}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Categories */}
              <div>
                <h3 className="text-sm font-semibold text-surface-900 mb-3">
                  Categorias
                </h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => updateCategory(null)}
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
                      onClick={() => updateCategory(cat.id)}
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
                    onClick={() => updateRegion(null)}
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
                      onClick={() => updateRegion(region.code)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selectedRegion === region.code
                          ? "bg-primary-600 text-white"
                          : "bg-surface-100 text-surface-600 hover:bg-surface-200"
                      }`}
                    >
                      <FlagIcon code={region.code} flagEmoji={region.flagEmoji} size={16} />
                      {region.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="text-sm font-semibold text-surface-900 mb-3">
                  Rango de precio (USD)
                </h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => updateMinPrice(e.target.value)}
                    min={0}
                    step={0.01}
                    className="w-full px-3 py-1.5 rounded-lg border border-surface-200 bg-white text-sm text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <span className="text-surface-400 text-sm">—</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => updateMaxPrice(e.target.value)}
                    min={0}
                    step={0.01}
                    className="w-full px-3 py-1.5 rounded-lg border border-surface-200 bg-white text-sm text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
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
                      onClick={() => updateDelivery(opt.value as DeliveryFilter)}
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
        {(selectedCategory || selectedRegion || searchQuery || deliveryFilter !== "all" || minPrice || maxPrice) && (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="text-xs text-surface-500">Filtros:</span>
            {selectedCategory && (
              <button
                onClick={() => updateCategory(null)}
                className="flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors"
              >
                {selectedCategoryName}
                <X className="w-3 h-3" />
              </button>
            )}
            {selectedRegion && (
              <button
                onClick={() => updateRegion(null)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors"
              >
                <FlagIcon
                  code={selectedRegion}
                  flagEmoji={selectedRegionFlag ?? ""}
                  size={14}
                />
                {selectedRegionName}
                <X className="w-3 h-3" />
              </button>
            )}
            {searchQuery && (
              <button
                onClick={() => updateSearch("")}
                className="flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors"
              >
                &quot;{searchQuery}&quot;
                <X className="w-3 h-3" />
              </button>
            )}
            {deliveryFilter !== "all" && (
              <button
                onClick={() => updateDelivery("all")}
                className="flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors"
              >
                {deliveryFilter === "instant" ? "Instantanea" : "Manual"}
                <X className="w-3 h-3" />
              </button>
            )}
            {(minPrice || maxPrice) && (
              <button
                onClick={() => { updateMinPrice(""); updateMaxPrice(""); }}
                className="flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium hover:bg-primary-100 transition-colors"
              >
                Precio: {minPrice ? `$${minPrice}` : "$0"} — {maxPrice ? `$${maxPrice}` : "∞"}
                <X className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSelectedRegion(null);
                setSearchQuery("");
                setDeliveryFilter("all");
                setMinPrice("");
                setMaxPrice("");
                setCurrentPage(1);
              }}
              className="text-xs text-surface-500 hover:text-surface-700 underline ml-1"
            >
              Limpiar todo
            </button>
          </div>
        )}

        {/* Products Grid / List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Tag className="w-8 h-8 text-surface-300" />
            </div>
            <h3 className="text-lg font-semibold text-surface-700 mb-1">
              No se encontraron ofertas
            </h3>
            <p className="text-surface-500 text-sm">
              Intenta ajustar los filtros de busqueda
            </p>
          </div>
        ) : viewMode === "list" ? (
          <div className="flex flex-col gap-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} viewMode="list" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} viewMode="grid" />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && !loading && (
          <div className="flex items-center justify-center gap-1.5 mt-10 pb-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-surface-200 bg-white text-sm font-medium text-surface-600 hover:bg-surface-50 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Anterior</span>
            </button>

            {getPageNumbers().map((page, idx) =>
              page === "ellipsis" ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-10 h-10 flex items-center justify-center text-surface-400 text-sm"
                >
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? "bg-primary-600 text-white"
                      : "border border-surface-200 bg-white text-surface-600 hover:bg-surface-50"
                  }`}
                >
                  {page}
                </button>
              )
            )}

            <button
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={currentPage === pagination.totalPages}
              className="flex items-center gap-1 px-3 py-2 rounded-lg border border-surface-200 bg-white text-sm font-medium text-surface-600 hover:bg-surface-50 transition-colors disabled:opacity-40 disabled:pointer-events-none"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default function OfertasPage() {
  return (
    <div className="min-h-screen bg-surface-50">
      <Header />
      <Suspense>
        <OfertasContent />
      </Suspense>
      <Footer />
    </div>
  );
}
