"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Shield,
  Zap,
  QrCode,
  ArrowRight,
  ChevronRight,
  Headphones,
  Gamepad2,
  CreditCard,
  Gift,
  Banknote,
  ShoppingCart,
  SlidersHorizontal,
  ArrowUpDown,
  LayoutGrid,
  List,
  BadgeCheck,
  ChevronLeft,
  Star,
} from "lucide-react";
import { Header } from "@/components/layout";
import { Footer } from "@/components/layout";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/utils";
import { toFrontendProducts } from "@/lib/api-transforms";
import type { Product } from "@/types";

// ============================================
// DATA
// ============================================

const categoryIcons = [
  { label: "Juegos", icon: Gamepad2, href: "/products?category=juegos" },
  { label: "eCards de Juegos", icon: Gift, href: "/products?category=ecards" },
  { label: "eTarjetas", icon: CreditCard, href: "/products?category=etarjetas" },
  { label: "Dinero electronico", icon: Banknote, href: "/products?category=dinero" },
  { label: "Steam", image: "/images/steam.svg", href: "/products?brand=steam" },
  { label: "Tarjetas Steam", image: "/images/steam.svg", href: "/products?brand=steam-cards" },
  { label: "PSN", image: "/images/playstation.svg", href: "/products?brand=psn" },
  { label: "Xbox", image: "/images/xbox.svg", href: "/products?brand=xbox" },
  { label: "Fortnite", image: "/images/fortnite.svg", href: "/products?brand=fortnite" },
  { label: "Amazon", image: "/images/amazon.svg", href: "/products?brand=amazon" },
];

const popularCategories = [
  { name: "PlayStation", image: "/images/playstation.svg", color: "from-blue-600 to-blue-800", href: "/products?brand=playstation" },
  { name: "Valorant", image: "/images/valorant.svg", color: "from-red-500 to-red-700", href: "/products?brand=valorant" },
  { name: "Xbox", image: "/images/xbox.svg", color: "from-green-600 to-green-800", href: "/products?brand=xbox" },
  { name: "Riot Access", image: "/images/riot.svg", color: "from-red-600 to-red-800", href: "/products?brand=riot" },
  { name: "Uber", image: "/images/uber.svg", color: "from-gray-800 to-black", href: "/products?brand=uber" },
  { name: "Razer Gold", image: "/images/razer.svg", color: "from-green-500 to-green-700", href: "/products?brand=razer" },
  { name: "Spotify", image: "/images/spotify.svg", color: "from-green-500 to-green-700", href: "/products?brand=spotify" },
  { name: "Netflix", image: "/images/netflix.svg", color: "from-red-600 to-red-800", href: "/products?brand=netflix" },
  { name: "Nintendo", image: "/images/nintendo.svg", color: "from-red-500 to-red-700", href: "/products?brand=nintendo" },
  { name: "Fortnite", image: "/images/fortnite.svg", color: "from-blue-500 to-purple-700", href: "/products?brand=fortnite" },
  { name: "Amazon", image: "/images/amazon.svg", color: "from-orange-500 to-orange-700", href: "/products?brand=amazon" },
  { name: "Google Play", image: "/images/google-play.svg", color: "from-blue-500 to-green-500", href: "/products?brand=google-play" },
];

const bannerSlides = [
  {
    id: 1,
    title: "Recarga Directa por ID",
    subtitle: "Vemper Games",
    description: "Free Fire, Genshin Impact, Honor of Kings y mas",
    bgColor: "from-purple-700 via-indigo-700 to-blue-800",
    brands: ["/images/freefire.svg", "/images/pubg.svg", "/images/fortnite.svg", "/images/roblox.svg"],
  },
  {
    id: 2,
    title: "Gift Cards Internacionales",
    subtitle: "Las mejores marcas",
    description: "Netflix, Spotify, PlayStation, Steam y mas",
    bgColor: "from-blue-700 via-cyan-700 to-teal-800",
    brands: ["/images/netflix.svg", "/images/spotify.svg", "/images/playstation.svg", "/images/steam.svg"],
  },
  {
    id: 3,
    title: "Paga con QR Bolivia",
    subtitle: "Metodo principal",
    description: "Sin necesidad de dolares ni tarjeta internacional",
    bgColor: "from-green-700 via-emerald-700 to-teal-800",
    brands: ["/images/amazon.svg", "/images/xbox.svg", "/images/disney.svg", "/images/google-play.svg"],
  },
];

// ============================================
// COMPONENT
// ============================================

export default function HomePage() {
  const { addToCart } = useApp();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [promotedProducts, setPromotedProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/api/products?promoted=true&limit=12")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.products)) {
          setPromotedProducts(toFrontendProducts(data.products));
        }
      })
      .catch(console.error);
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
  }, []);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length);
  };

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  return (
    <div className="min-h-screen bg-surface-50">
      <Header />

      {/* ============================================ */}
      {/* HERO SECTION */}
      {/* ============================================ */}
      <section className="relative bg-gradient-to-br from-surface-900 via-primary-900 to-surface-900 text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Tu marketplace
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-accent-400">
                  seguro
                </span>
                de productos digitales
              </h1>

              <p className="text-lg text-surface-300 mb-8 max-w-lg">
                Gift cards, codigos digitales y vouchers con entrega
                instantanea. Compra Netflix, Free Fire, PlayStation y mas
                con total confianza.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-primary-500/30"
                >
                  Explorar productos
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200"
                >
                  Vender productos
                </Link>
              </div>

              <div className="flex items-center gap-6 mt-10">
                {[
                  { icon: Shield, text: "Codigos protegidos" },
                  { icon: Zap, text: "Entregas instantaneas" },
                  { icon: QrCode, text: "Pago seguro" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2">
                    <item.icon className="w-5 h-5 text-accent-400" />
                    <span className="text-sm text-surface-300">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Banner Slider */}
            <div className="hidden lg:block relative">
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
                {bannerSlides.map((slide, index) => (
                  <div
                    key={slide.id}
                    className={`absolute inset-0 transition-opacity duration-700 bg-gradient-to-br ${slide.bgColor} p-8 flex flex-col justify-between ${
                      index === currentSlide ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <div>
                      <span className="inline-block bg-white/20 backdrop-blur-sm text-xs font-semibold px-3 py-1 rounded-full mb-4">
                        {slide.subtitle}
                      </span>
                      <h3 className="text-3xl font-bold mb-2">{slide.title}</h3>
                      <p className="text-white/70">{slide.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {slide.brands.map((src) => (
                        <div key={src} className="w-14 h-14 bg-white/10 rounded-lg flex items-center justify-center p-2">
                          <Image src={src} alt="" width={32} height={32} className="brightness-0 invert opacity-80" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Slider Controls */}
                <button
                  onClick={prevSlide}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center transition-colors z-10"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center transition-colors z-10"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Dots */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {bannerSlides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentSlide
                          ? "bg-white w-6"
                          : "bg-white/40 hover:bg-white/60"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* CATEGORY ICONS BAR */}
      {/* ============================================ */}
      <section className="bg-white border-b border-surface-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 py-4 overflow-x-auto scrollbar-hide">
            {categoryIcons.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col items-center gap-1.5 min-w-[72px] group"
              >
                <div className="w-10 h-10 rounded-lg bg-surface-100 flex items-center justify-center group-hover:bg-primary-50 transition-colors">
                  {item.image ? (
                    <Image src={item.image} alt={item.label} width={24} height={24} className="opacity-60 group-hover:opacity-100 transition-opacity" />
                  ) : item.icon ? (
                    <item.icon className="w-5 h-5 text-surface-500 group-hover:text-primary-600 transition-colors" />
                  ) : null}
                </div>
                <span className="text-[11px] font-medium text-surface-500 group-hover:text-surface-900 transition-colors text-center whitespace-nowrap">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* POPULAR CATEGORIES */}
      {/* ============================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-2xl font-bold text-surface-900">
            Categorias populares
          </h2>
          <Link
            href="/products"
            className="hidden sm:flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors"
          >
            Ver todas
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {popularCategories.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="group relative rounded-xl overflow-hidden aspect-[4/3] bg-gradient-to-br hover:shadow-lg transition-shadow"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-90`} />
              <div className="relative h-full flex flex-col items-center justify-center p-4">
                {cat.image && (
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    width={48}
                    height={48}
                    className="mb-2 brightness-0 invert opacity-90"
                  />
                )}
                <span className="text-sm font-semibold text-white">{cat.name}</span>
                <ChevronRight className="w-4 h-4 text-white/60 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ============================================ */}
      {/* PROMOTED PRODUCTS */}
      {/* ============================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Section Header with Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h2 className="text-2xl font-bold text-surface-900">
            Productos promocionados
          </h2>
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-surface-200 bg-white text-sm font-medium text-surface-600 hover:bg-surface-50 transition-colors">
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-surface-200 bg-white text-sm font-medium text-surface-600 hover:bg-surface-50 transition-colors">
              <ArrowUpDown className="w-4 h-4" />
              Ordenar
            </button>
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
        <div className={
          viewMode === "grid"
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
            : "flex flex-col gap-3"
        }>
          {promotedProducts.map((product) => (
            <div
              key={product.id}
              className={`bg-white rounded-xl border border-surface-200 overflow-hidden hover:shadow-md transition-shadow group ${
                viewMode === "list" ? "flex flex-row" : ""
              }`}
            >
              {/* Product Image */}
              <div className={`relative bg-surface-100 ${
                viewMode === "list" ? "w-40 shrink-0" : "aspect-square"
              }`}>
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Gift className="w-12 h-12 text-surface-300" />
                  </div>
                )}
                {/* Promotion Badge */}
                <div className="absolute top-2 left-2 flex gap-1">
                  <span className="bg-primary-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    PROMOCIONADO
                  </span>
                </div>
                {/* Discount Badge */}
                {product.originalPrice && product.originalPrice > product.price && (
                  <div className="absolute top-2 right-2">
                    <span className="bg-accent-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                    </span>
                  </div>
                )}
                {/* Region Flag */}
                {product.region && (
                  <div className="absolute bottom-2 left-2">
                    <span className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                      {product.region}
                    </span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className={`p-3 flex flex-col ${viewMode === "list" ? "flex-1 justify-between" : ""}`}>
                <div>
                  <h3 className="text-sm font-medium text-surface-900 line-clamp-2 mb-1 group-hover:text-primary-600 transition-colors">
                    <Link href={`/products/${product.id}`}>
                      {product.name}
                    </Link>
                  </h3>
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
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-xs text-surface-400 line-through">
                        {formatCurrency(product.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Buy Button */}
                <button
                  onClick={() => addToCart(product)}
                  className="w-full flex items-center justify-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  Comprar ahora
                </button>

                {/* Seller Info */}
                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-surface-100">
                  <span className="text-[11px] text-surface-500 truncate">
                    {product.sellerName}
                  </span>
                  <BadgeCheck className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                  {product.sellerRating > 0 && (
                    <div className="flex items-center gap-0.5 ml-auto">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-[11px] text-surface-500">{product.sellerRating}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================ */}
      {/* TRUST SECTION */}
      {/* ============================================ */}
      <section className="bg-gradient-to-br from-surface-900 via-primary-900 to-surface-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">
              Por que elegir VirtuMall
            </h2>
            <p className="text-surface-400 max-w-2xl mx-auto">
              La plataforma mas segura para comprar y vender productos digitales
              en Bolivia
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Codigos protegidos",
                description:
                  "Tus codigos estan encriptados y solo se revelan tras confirmar el pago. Sin riesgo de fraude.",
              },
              {
                icon: QrCode,
                title: "QR Bolivia nativo",
                description:
                  "Paga directamente con tu banco boliviano via QR. Sin necesidad de dolares ni tarjeta internacional.",
              },
              {
                icon: Headphones,
                title: "Soporte garantizado",
                description:
                  "Sistema de tickets directo con el vendedor. Si tu codigo no funciona, te resolvemos.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-primary-500/20 rounded-2xl flex items-center justify-center mb-5">
                  <item.icon className="w-7 h-7 text-primary-300" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-surface-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* CTA SECTION */}
      {/* ============================================ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-primary-600 to-primary-500 rounded-3xl p-10 lg:p-16 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>
          <div className="relative">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Empieza a vender tus productos digitales hoy
            </h2>
            <p className="text-primary-100 mb-8 max-w-2xl mx-auto text-lg">
              Registrate como vendedor, sube tus codigos y empieza a ganar.
              Comisiones transparentes y pagos automaticos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-primary-600 font-semibold px-8 py-4 rounded-xl hover:bg-surface-50 transition-all duration-200 shadow-lg"
              >
                Crear cuenta de vendedor
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 bg-white/20 backdrop-blur-sm text-white font-semibold px-8 py-4 rounded-xl hover:bg-white/30 transition-all duration-200"
              >
                Ver productos
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
