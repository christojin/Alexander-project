"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Search,
  ShoppingCart,
  Menu,
  X,
  User,
  LogIn,
  UserPlus,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  Store,
  Tag,
  Shield,
  Loader2,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

interface NavLink {
  label: string;
  href: string;
  highlight?: boolean;
  icon?: typeof Store;
}

const navLinks: NavLink[] = [
  { label: "Categorias", href: "/products" },
  { label: "Juegos", href: "/products?category=juegos" },
  { label: "Marcas", href: "/products?view=brands" },
  { label: "Tienda Oficial", href: "/products?seller=official", highlight: true, icon: Store },
  { label: "Ofertas", href: "/products?promoted=true", highlight: true, icon: Tag },
];

const roleDashboardMap: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  SELLER: "/seller/dashboard",
  BUYER: "/buyer/dashboard",
};

const roleLabelMap: Record<string, string> = {
  ADMIN: "Administrador",
  SELLER: "Vendedor",
  BUYER: "Comprador",
};

export default function Header() {
  const { data: session, status } = useSession();
  const { cartTotalItems } = useApp();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = status === "authenticated";
  const user = session?.user;
  const userRole = user?.role ?? "BUYER";
  const dashboardHref = roleDashboardMap[userRole] ?? "/buyer/dashboard";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    setLoggingOut(true);
    setUserDropdownOpen(false);
    signOut({ callbackUrl: "/" }).catch(() => {
      window.location.href = "/";
    });
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-surface-900/95 backdrop-blur-lg shadow-lg"
          : "bg-surface-900"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2 group">
            <Image
              src="/images/brand/logo-icon.png"
              alt="VirtuMall"
              width={44}
              height={44}
              className="sm:hidden"
              priority
            />
            <Image
              src="/images/brand/logo-full.png"
              alt="VirtuMall"
              width={200}
              height={50}
              className="hidden sm:block h-12 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  link.highlight
                    ? "text-primary-300 hover:bg-primary-500/20 hover:text-primary-200"
                    : "text-surface-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {link.icon && <link.icon className="h-4 w-4" />}
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-sm mx-4"
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar productos..."
                className="w-full rounded-lg border border-surface-700 bg-surface-800 py-2 pl-10 pr-4 text-sm text-white placeholder:text-surface-400 transition-colors focus:border-primary-500 focus:bg-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            {/* Cart */}
            <Link
              href="/cart"
              className="relative rounded-lg p-2 text-surface-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartTotalItems > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent-500 text-[10px] font-bold text-white">
                  {cartTotalItems > 99 ? "99+" : cartTotalItems}
                </span>
              )}
            </Link>

            {/* User Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className={`flex items-center gap-1.5 rounded-lg p-2 transition-colors ${
                  isAuthenticated
                    ? "text-primary-300 hover:bg-primary-500/20 hover:text-primary-200"
                    : "text-surface-300 hover:bg-white/10 hover:text-white"
                }`}
                aria-expanded={userDropdownOpen}
                aria-haspopup="true"
              >
                {status === "loading" ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isAuthenticated && user?.image ? (
                  <Image
                    src={user.image}
                    alt={user.name ?? ""}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                ) : (
                  <User className="h-5 w-5" />
                )}
                <ChevronDown
                  className={`hidden sm:block h-3.5 w-3.5 transition-transform duration-200 ${
                    userDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 origin-top-right rounded-xl border border-surface-200 bg-white p-1.5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                  {isAuthenticated && user ? (
                    <>
                      <div className="border-b border-surface-100 px-3 py-2.5 mb-1">
                        <p className="text-sm font-semibold text-surface-900">
                          {user.name}
                        </p>
                        <p className="text-xs text-surface-500">
                          {user.email}
                        </p>
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-700">
                          {userRole === "ADMIN" && <Shield className="h-3 w-3" />}
                          {roleLabelMap[userRole] ?? userRole}
                        </span>
                      </div>
                      <Link
                        href={dashboardHref}
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-surface-700 transition-colors hover:bg-surface-50"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                      <div className="my-1 border-t border-surface-100" />
                      <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                      >
                        {loggingOut ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <LogOut className="h-4 w-4" />
                        )}
                        {loggingOut ? "Cerrando..." : "Cerrar Sesion"}
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/auth/login"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-surface-700 transition-colors hover:bg-surface-50"
                      >
                        <LogIn className="h-4 w-4" />
                        Iniciar Sesion
                      </Link>
                      <Link
                        href="/auth/register"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-surface-700 transition-colors hover:bg-surface-50"
                      >
                        <UserPlus className="h-4 w-4" />
                        Registrarse
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-surface-300 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
              aria-label={mobileMenuOpen ? "Cerrar menu" : "Abrir menu"}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-surface-800 bg-surface-900 lg:hidden">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
            {/* Mobile Search */}
            <form onSubmit={handleSearchSubmit} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar productos..."
                  className="w-full rounded-lg border border-surface-700 bg-surface-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-surface-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </form>

            {/* Mobile Nav Links */}
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    link.highlight
                      ? "text-primary-300 hover:bg-primary-500/20"
                      : "text-surface-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {link.icon && <link.icon className="h-4 w-4" />}
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
