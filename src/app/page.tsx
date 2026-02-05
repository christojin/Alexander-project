"use client";

import Link from "next/link";
import {
  Shield,
  Zap,
  QrCode,
  Star,
  ArrowRight,
  TrendingUp,
  Users,
  ShoppingBag,
  Lock,
  Headphones,
  ChevronRight,
} from "lucide-react";
import { Header } from "@/components/layout";
import { Footer } from "@/components/layout";
import { ProductCard } from "@/components/products";
import { CategoryCard } from "@/components/products";
import { useApp } from "@/context/AppContext";
import { products, categories } from "@/data/mock";

const featuredProducts = products.filter((p) => p.isFeatured).slice(0, 8);
const stats = [
  { label: "Productos disponibles", value: "500+", icon: ShoppingBag },
  { label: "Vendedores verificados", value: "50+", icon: Users },
  { label: "Ventas completadas", value: "10,000+", icon: TrendingUp },
  { label: "Satisfaccion del cliente", value: "98%", icon: Star },
];

export default function HomePage() {
  const { addToCart } = useApp();

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="relative gradient-hero text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-600/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
                <QrCode className="w-4 h-4 text-accent-400" />
                <span className="text-sm font-medium">
                  Paga con QR Bolivia - Rapido y seguro
                </span>
              </div>

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
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-accent-400" />
                  <span className="text-sm text-surface-300">
                    Codigos protegidos
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-accent-400" />
                  <span className="text-sm text-surface-300">
                    Entrega instantanea
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-accent-400" />
                  <span className="text-sm text-surface-300">
                    Pago seguro
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden lg:block relative">
              <div className="relative">
                {/* Floating product cards */}
                <div className="absolute -top-4 -left-4 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                      <span className="text-red-400 font-bold text-sm">N</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Netflix $50</p>
                      <p className="text-xs text-surface-400">Entregado</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { name: "Netflix", color: "bg-red-500/20", letter: "N" },
                      { name: "Spotify", color: "bg-green-500/20", letter: "S" },
                      { name: "Free Fire", color: "bg-orange-500/20", letter: "FF" },
                      { name: "Steam", color: "bg-blue-500/20", letter: "St" },
                    ].map((item) => (
                      <div
                        key={item.name}
                        className="bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:bg-white/10 transition-colors"
                      >
                        <div
                          className={`w-14 h-14 ${item.color} rounded-xl flex items-center justify-center mx-auto mb-2`}
                        >
                          <span className="font-bold text-white">
                            {item.letter}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{item.name}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="absolute -bottom-4 -right-4 bg-accent-500/20 backdrop-blur-lg border border-accent-400/30 rounded-2xl p-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-accent-400" />
                    <span className="text-sm font-semibold text-accent-300">
                      Entrega instantanea
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative -mt-8 z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-surface-200 p-6 text-center shadow-lg shadow-surface-900/5"
            >
              <stat.icon className="w-8 h-8 text-primary-600 mx-auto mb-3" />
              <p className="text-2xl font-bold text-surface-900 mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-surface-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-surface-900 mb-2">
              Categorias populares
            </h2>
            <p className="text-surface-500">
              Encuentra exactamente lo que necesitas
            </p>
          </div>
          <Link
            href="/products"
            className="hidden sm:flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium transition-colors"
          >
            Ver todas
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="bg-surface-100/50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-surface-900 mb-2">
                Productos destacados
              </h2>
              <p className="text-surface-500">
                Los mas vendidos y mejor valorados
              </p>
            </div>
            <Link
              href="/products"
              className="hidden sm:flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              Ver todos
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={addToCart}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-surface-900 mb-3">
            Como funciona
          </h2>
          <p className="text-surface-500 max-w-2xl mx-auto">
            Comprar productos digitales nunca fue tan facil y seguro
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              icon: ShoppingBag,
              title: "Elige tu producto",
              description:
                "Navega nuestro catalogo de gift cards, codigos y vouchers de las mejores marcas.",
            },
            {
              step: "02",
              icon: QrCode,
              title: "Paga con QR Bolivia",
              description:
                "Escanea el codigo QR con tu app bancaria o usa tarjeta de credito / PayPal.",
            },
            {
              step: "03",
              icon: Zap,
              title: "Recibe al instante",
              description:
                "Tu codigo digital se entrega automaticamente tras confirmar el pago. Seguro y protegido.",
            },
          ].map((item) => (
            <div key={item.step} className="relative text-center group">
              <div className="text-6xl font-black text-surface-100 absolute -top-4 left-1/2 -translate-x-1/2 select-none group-hover:text-primary-100 transition-colors">
                {item.step}
              </div>
              <div className="relative pt-8">
                <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:bg-primary-100 transition-colors">
                  <item.icon className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-surface-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-surface-500 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Section */}
      <section className="gradient-hero text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">
              Por que elegir VendorVault
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

      {/* CTA Section */}
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
