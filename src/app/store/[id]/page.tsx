"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Star,
  BadgeCheck,
  ShoppingBag,
  Calendar,
  MapPin,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  MessageCircle,
  LayoutGrid,
  List,
  ArrowUpDown,
  ChevronDown,
  Clock,
} from "lucide-react";
import { Header } from "@/components/layout";
import { Footer } from "@/components/layout";
import ProductCard from "@/components/products/ProductCard";
import { useApp } from "@/context/AppContext";
import { toFrontendProducts } from "@/lib/api-transforms";
import type { Product } from "@/types";

interface BusinessHour {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

interface SellerInfo {
  id: string;
  storeName: string;
  slug: string | null;
  storePhoto: string | null;
  storeDescription: string | null;
  rating: number;
  totalReviews: number;
  totalSales: number;
  isVerified: boolean;
  marketType: string;
  createdAt: string;
  user: {
    name: string;
    avatar: string | null;
    createdAt: string;
  };
  country: {
    name: string;
    code: string;
    flagEmoji: string | null;
  } | null;
  businessHours: BusinessHour[];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-BO", {
    year: "numeric",
    month: "long",
  });
}

const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

function isOpenNow(businessHours: BusinessHour[]): boolean {
  const now = new Date();
  const currentDay = now.getDay(); // 0=Sunday
  const currentTime =
    now.getHours().toString().padStart(2, "0") +
    ":" +
    now.getMinutes().toString().padStart(2, "0");

  const todayHours = businessHours.find((h) => h.dayOfWeek === currentDay);
  if (!todayHours || todayHours.isClosed) return false;
  return currentTime >= todayHours.openTime && currentTime < todayHours.closeTime;
}

export default function SellerStorePage() {
  const params = useParams();
  const { addToCart } = useApp();
  const [seller, setSeller] = useState<SellerInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    if (!params.id) return;
    setLoading(true);

    fetch(`/api/store/${params.id}?sort=${sortBy}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setSeller(data.seller);
        setProducts(toFrontendProducts(data.products));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.id, sortBy]);

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

  if (notFound || !seller) {
    return (
      <div className="min-h-screen bg-surface-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <AlertTriangle className="w-16 h-16 text-surface-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-surface-900 mb-2">
            Tienda no encontrada
          </h1>
          <p className="text-surface-500 mb-6">
            La tienda que buscas no existe
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

  return (
    <div className="min-h-screen bg-surface-50">
      <Header />

      {/* Store Header */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar */}
            {seller.storePhoto ? (
              <div className="h-20 w-20 shrink-0 rounded-full overflow-hidden ring-4 ring-white/25">
                <Image
                  src={seller.storePhoto}
                  alt={seller.storeName}
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-3xl font-bold ring-4 ring-white/25">
                {seller.storeName.charAt(0)}
              </div>
            )}

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold">
                  {seller.storeName}
                </h1>
                {seller.isVerified && (
                  <BadgeCheck className="w-6 h-6 text-primary-200" />
                )}
              </div>
              {seller.storeDescription && (
                <p className="text-primary-100 text-sm max-w-2xl mb-3">
                  {seller.storeDescription}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-primary-200">
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-white">
                    {seller.rating.toFixed(1)}
                  </span>
                  <span>({seller.totalReviews} resenas)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4" />
                  <span>{seller.totalSales.toLocaleString()} ventas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>Miembro desde {formatDate(seller.user.createdAt)}</span>
                </div>
                {seller.country && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {seller.country.flagEmoji} {seller.country.name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Button */}
            <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20 font-semibold transition-colors">
              <MessageCircle className="w-4 h-4" />
              Contactar
            </button>
          </div>
        </div>
      </div>

      {/* Business Hours Section */}
      {seller.businessHours.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="bg-white rounded-xl border border-surface-200 p-6 max-w-md">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-surface-500" />
                <h3 className="text-lg font-semibold text-surface-900">
                  Horario de Atencion
                </h3>
              </div>
              {isOpenNow(seller.businessHours) ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Abierto ahora
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  Cerrado ahora
                </span>
              )}
            </div>
            <ul className="space-y-1.5">
              {DAY_NAMES.map((dayName, index) => {
                const hours = seller.businessHours.find(
                  (h) => h.dayOfWeek === index
                );
                const today = new Date().getDay() === index;
                return (
                  <li
                    key={index}
                    className={`flex items-center justify-between text-sm py-1 px-2 rounded ${
                      today
                        ? "bg-primary-50 font-medium text-primary-700"
                        : "text-surface-600"
                    }`}
                  >
                    <span>{dayName}</span>
                    <span>
                      {!hours || hours.isClosed
                        ? "Cerrado"
                        : `${hours.openTime} - ${hours.closeTime}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h2 className="text-xl font-bold text-surface-900">
            Productos ({products.length})
          </h2>
          <div className="flex items-center gap-2">
            {/* Sort */}
            <div className="relative">
              <div className="flex items-center gap-1.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <ArrowUpDown className="w-4 h-4 text-surface-400" />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-9 pr-8 py-2 bg-white border border-surface-200 rounded-lg text-sm text-surface-600 hover:border-surface-300 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer transition-all"
              >
                <option value="newest">Mas recientes</option>
                <option value="popular">Mas vendidos</option>
                <option value="price_asc">Menor precio</option>
                <option value="price_desc">Mayor precio</option>
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
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {products.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-16 h-16 text-surface-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-surface-700 mb-1">
              Esta tienda aun no tiene productos
            </h3>
            <p className="text-surface-500 text-sm">
              Vuelve pronto para ver las novedades
            </p>
          </div>
        ) : viewMode === "list" ? (
          <div className="flex flex-col gap-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                viewMode="list"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                viewMode="grid"
              />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
