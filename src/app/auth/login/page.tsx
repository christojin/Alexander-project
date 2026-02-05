"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Shield,
  Mail,
  Lock,
  ArrowRight,
  User,
  Store,
  Settings,
  Eye,
  EyeOff,
  ShoppingBag,
  Zap,
  Globe,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

export default function LoginPage() {
  const { login } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingRole, setLoadingRole] = useState<UserRole | null>(null);

  const handleDemoLogin = (role: UserRole) => {
    setLoadingRole(role);
    login(role);
    setTimeout(() => {
      const routes: Record<UserRole, string> = {
        buyer: "/buyer/dashboard",
        seller: "/seller/dashboard",
        admin: "/admin/dashboard",
      };
      window.location.href = routes[role];
    }, 600);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login - defaults to buyer
    login("buyer");
    setTimeout(() => {
      window.location.href = "/buyer/dashboard";
    }, 600);
  };

  const demoButtons: { role: UserRole; label: string; icon: typeof User; description: string }[] = [
    {
      role: "buyer",
      label: "Entrar como Comprador",
      icon: User,
      description: "Explorar y comprar productos",
    },
    {
      role: "seller",
      label: "Entrar como Vendedor",
      icon: Store,
      description: "Gestionar tu tienda digital",
    },
    {
      role: "admin",
      label: "Entrar como Admin",
      icon: Settings,
      description: "Administrar la plataforma",
    },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-400/5 rounded-full blur-2xl" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">
              Vendor<span className="text-primary-300">Vault</span>
            </span>
          </div>

          {/* Center content */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-white leading-tight">
                Tu marketplace seguro
                <br />
                de productos digitales
              </h1>
              <p className="mt-4 text-lg text-primary-200 leading-relaxed max-w-md">
                Compra y vende codigos digitales, licencias de software y mas
                con total seguridad en Bolivia.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-500/20 text-accent-400">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Entrega instantanea</p>
                  <p className="text-sm text-primary-300">Codigos digitales al instante</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500/20 text-primary-300">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Pagos seguros</p>
                  <p className="text-sm text-primary-300">QR Bolivia, Stripe y PayPal</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500/20 text-primary-300">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Alcance global</p>
                  <p className="text-sm text-primary-300">Productos de todo el mundo</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <p className="text-sm text-primary-400">
            Mas de 10,000 productos digitales disponibles
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-8 lg:p-12 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white">
              <Shield className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-surface-900">
              Vendor<span className="text-primary-600">Vault</span>
            </span>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-surface-900">
              Iniciar Sesion
            </h2>
            <p className="mt-2 text-sm text-surface-500">
              Ingresa tus credenciales para acceder a tu cuenta
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-surface-700 mb-1.5"
              >
                Correo electronico
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-surface-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="block w-full rounded-lg border border-surface-300 bg-white py-2.5 pl-10 pr-3.5 text-sm text-surface-900 placeholder:text-surface-400 transition-all duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-surface-700 mb-1.5"
              >
                Contrasena
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-surface-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contrasena"
                  className="block w-full rounded-lg border border-surface-300 bg-white py-2.5 pl-10 pr-10 text-sm text-surface-900 placeholder:text-surface-400 transition-all duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-surface-400 hover:text-surface-600 transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="flex items-center justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                Olvidaste tu contrasena?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-primary-600/25 transition-all duration-200",
                "hover:bg-primary-700 active:bg-primary-800",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
                "disabled:opacity-50 disabled:pointer-events-none",
                "cursor-pointer"
              )}
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  Iniciar Sesion
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-surface-400">
                Acceso rapido de demo
              </span>
            </div>
          </div>

          {/* Demo Quick Login Buttons */}
          <div className="space-y-3">
            {demoButtons.map(({ role, label, icon: Icon, description }) => (
              <button
                key={role}
                type="button"
                onClick={() => handleDemoLogin(role)}
                disabled={loadingRole !== null}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border border-surface-200 bg-white px-4 py-3 text-left transition-all duration-200",
                  "hover:border-primary-300 hover:bg-primary-50/50 hover:shadow-sm",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
                  "disabled:opacity-50 disabled:pointer-events-none",
                  "cursor-pointer",
                  loadingRole === role && "border-primary-300 bg-primary-50/50"
                )}
              >
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                  role === "buyer" && "bg-accent-100 text-accent-600",
                  role === "seller" && "bg-primary-100 text-primary-600",
                  role === "admin" && "bg-surface-100 text-surface-600"
                )}>
                  {loadingRole === role ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-900">
                    {label}
                  </p>
                  <p className="text-xs text-surface-500">{description}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-surface-400" />
              </button>
            ))}
          </div>

          {/* Register Link */}
          <p className="text-center text-sm text-surface-500">
            No tienes una cuenta?{" "}
            <Link
              href="/auth/register"
              className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              Crear cuenta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
