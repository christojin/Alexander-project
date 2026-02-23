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
  LayoutGrid,
  List,
  ChevronLeft,
  Megaphone,
} from "lucide-react";
import { Header } from "@/components/layout";
import { Footer } from "@/components/layout";
import ProductCard from "@/components/products/ProductCard";
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

interface BannerSlide {
  id: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  imageUrl: string;
  linkUrl: string | null;
  bgColor: string | null;
  brandImages: string[] | null;
}

// ============================================
// COMPONENT
// ============================================

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [promotedProducts, setPromotedProducts] = useState<Product[]>([]);
  const [promotedPage, setPromotedPage] = useState(1);
  const [promotedTotalPages, setPromotedTotalPages] = useState(1);
  const [bannerSlides, setBannerSlides] = useState<BannerSlide[]>([]);

  // Fetch banners from database
  useEffect(() => {
    fetch("/api/banners")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.banners)) {
          setBannerSlides(data.banners);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch promoted products from database
  const fetchPromoted = useCallback((page = 1) => {
    fetch(`/api/products?promoted=true&limit=25&page=${page}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.products)) {
          setPromotedProducts(toFrontendProducts(data.products));
        }
        if (data.pagination?.totalPages) {
          setPromotedTotalPages(data.pagination.totalPages);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchPromoted(promotedPage);
  }, [fetchPromoted, promotedPage]);

  const slideCount = bannerSlides.length;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % (slideCount || 1));
  }, [slideCount]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + (slideCount || 1)) % (slideCount || 1));
  };

  useEffect(() => {
    if (slideCount === 0) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide, slideCount]);

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
            <div className="relative mt-8 lg:mt-0">
              <div className="relative rounded-2xl overflow-hidden aspect-[16/9] lg:aspect-[4/3]">
                {bannerSlides.map((slide, index) => {
                  const brands = Array.isArray(slide.brandImages) ? slide.brandImages : [];
                  return (
                    <Link
                      key={slide.id}
                      href={slide.linkUrl ?? "/products"}
                      className={`absolute inset-0 transition-opacity duration-700 bg-gradient-to-br ${slide.bgColor ?? "from-primary-700 to-primary-900"} p-5 lg:p-8 flex flex-col justify-between ${
                        index === currentSlide ? "opacity-100 z-[1]" : "opacity-0"
                      }`}
                    >
                      <div>
                        {slide.subtitle && (
                          <span className="inline-block bg-white/20 backdrop-blur-sm text-[10px] lg:text-xs font-semibold px-2 lg:px-3 py-0.5 lg:py-1 rounded-full mb-2 lg:mb-4">
                            {slide.subtitle}
                          </span>
                        )}
                        <h3 className="text-xl lg:text-3xl font-bold mb-1 lg:mb-2">{slide.title}</h3>
                        {slide.description && (
                          <p className="text-white/70 text-sm lg:text-base line-clamp-2">{slide.description}</p>
                        )}
                      </div>
                      {brands.length > 0 && (
                        <div className="flex items-center gap-2 lg:gap-3">
                          {brands.map((src) => (
                            <div key={src} className="w-10 h-10 lg:w-14 lg:h-14 bg-white/10 rounded-lg flex items-center justify-center p-1.5 lg:p-2">
                              <Image src={src} alt="" width={32} height={32} className="brightness-0 invert opacity-80" />
                            </div>
                          ))}
                        </div>
                      )}
                    </Link>
                  );
                })}

                {/* Slider Controls */}
                {bannerSlides.length > 1 && (
                  <>
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
                  </>
                )}
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
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 sm:gap-4 sm:overflow-visible sm:pb-0">
          {popularCategories.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="group relative rounded-xl overflow-hidden shrink-0 w-28 aspect-[4/3] sm:w-auto bg-gradient-to-br hover:shadow-lg transition-shadow"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-90`} />
              <div className="relative h-full flex flex-col items-center justify-center p-3 sm:p-4">
                {cat.image && (
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    width={48}
                    height={48}
                    className="mb-1.5 sm:mb-2 brightness-0 invert opacity-90 w-8 h-8 sm:w-12 sm:h-12"
                  />
                )}
                <span className="text-xs sm:text-sm font-semibold text-white text-center">{cat.name}</span>
                <ChevronRight className="w-4 h-4 text-white/60 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ============================================ */}
      {/* PROMOCIONES (Promoted Products) */}
      {/* ============================================ */}
      {promotedProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Megaphone className="w-6 h-6 text-primary-600" />
              <h2 className="text-2xl font-bold text-surface-900">
                Promociones
              </h2>
            </div>
            <div className="flex items-center gap-3">
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

          <div className={
            viewMode === "grid"
              ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4"
              : "flex flex-col gap-3"
          }>
            {promotedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                viewMode={viewMode}
              />
            ))}
          </div>

          {/* Pagination */}
          {promotedTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPromotedPage((p) => Math.max(1, p - 1))}
                disabled={promotedPage === 1}
                className="flex items-center gap-1 px-4 py-2 rounded-lg border border-surface-200 bg-white text-sm font-medium text-surface-600 hover:bg-surface-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>
              {Array.from({ length: promotedTotalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPromotedPage(p)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    p === promotedPage
                      ? "bg-primary-600 text-white"
                      : "border border-surface-200 bg-white text-surface-600 hover:bg-surface-50"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPromotedPage((p) => Math.min(promotedTotalPages, p + 1))}
                disabled={promotedPage === promotedTotalPages}
                className="flex items-center gap-1 px-4 py-2 rounded-lg border border-surface-200 bg-white text-sm font-medium text-surface-600 hover:bg-surface-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </section>
      )}

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
