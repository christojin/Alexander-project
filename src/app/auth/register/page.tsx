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
  ShoppingBag,
  Zap,
  Globe,
  CheckCircle2,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

type RegisterRole = "buyer" | "seller";

export default function RegisterPage() {
  const { login } = useApp();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<RegisterRole>("buyer");
  const [storeName, setStoreName] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    login(selectedRole);
    setTimeout(() => {
      const routes: Record<RegisterRole, string> = {
        buyer: "/buyer/dashboard",
        seller: "/seller/dashboard",
      };
      window.location.href = routes[selectedRole];
    }, 600);
  };

  const roleOptions: {
    role: RegisterRole;
    label: string;
    description: string;
    icon: typeof User;
    features: string[];
  }[] = [
    {
      role: "buyer",
      label: "Comprador",
      description: "Quiero comprar productos digitales",
      icon: ShoppingBag,
      features: ["Acceso a miles de productos", "Entrega instantanea", "Soporte al comprador"],
    },
    {
      role: "seller",
      label: "Vendedor",
      description: "Quiero vender mis productos digitales",
      icon: Store,
      features: ["Panel de vendedor completo", "Multiples metodos de pago", "Herramientas de analisis"],
    },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-32 right-20 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-32 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/3 w-48 h-48 bg-primary-400/5 rounded-full blur-2xl" />
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
                Unete a la comunidad
                <br />
                de comercio digital
              </h1>
              <p className="mt-4 text-lg text-primary-200 leading-relaxed max-w-md">
                Crea tu cuenta y empieza a comprar o vender productos digitales
                de forma segura.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-500/20 text-accent-400">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Registro rapido</p>
                  <p className="text-sm text-primary-300">Empieza en menos de un minuto</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500/20 text-primary-300">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">100% seguro</p>
                  <p className="text-sm text-primary-300">Datos protegidos y encriptados</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500/20 text-primary-300">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Comunidad activa</p>
                  <p className="text-sm text-primary-300">Miles de compradores y vendedores</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <p className="text-sm text-primary-400">
            Unete a mas de 5,000 usuarios registrados
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-8 lg:p-12 bg-white overflow-y-auto">
        <div className="w-full max-w-md space-y-6">
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
              Crear Cuenta
            </h2>
            <p className="mt-2 text-sm text-surface-500">
              Completa el formulario para registrarte en VendorVault
            </p>
          </div>

          {/* Role Selector */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-3">
              Tipo de cuenta
            </label>
            <div className="grid grid-cols-2 gap-3">
              {roleOptions.map(({ role, label, description, icon: Icon, features }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={cn(
                    "relative flex flex-col items-center rounded-xl border-2 p-4 text-center transition-all duration-200 cursor-pointer",
                    selectedRole === role
                      ? "border-primary-500 bg-primary-50/50 shadow-sm shadow-primary-500/10"
                      : "border-surface-200 bg-white hover:border-surface-300 hover:bg-surface-50/50"
                  )}
                >
                  {selectedRole === role && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="h-4 w-4 text-primary-600" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-lg transition-colors mb-2",
                      selectedRole === role
                        ? "bg-primary-100 text-primary-600"
                        : "bg-surface-100 text-surface-500"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <p
                    className={cn(
                      "text-sm font-semibold transition-colors",
                      selectedRole === role
                        ? "text-primary-900"
                        : "text-surface-800"
                    )}
                  >
                    {label}
                  </p>
                  <p className="text-xs text-surface-500 mt-0.5">{description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-surface-700 mb-1.5"
              >
                Nombre completo
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-surface-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Juan Perez"
                  className="block w-full rounded-lg border border-surface-300 bg-white py-2.5 pl-10 pr-3.5 text-sm text-surface-900 placeholder:text-surface-400 transition-all duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>

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

            {/* Store Name (Seller only) */}
            {selectedRole === "seller" && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label
                  htmlFor="storeName"
                  className="block text-sm font-medium text-surface-700 mb-1.5"
                >
                  Nombre de tu tienda
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-surface-400">
                    <Store className="h-4 w-4" />
                  </div>
                  <input
                    id="storeName"
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Mi Tienda Digital"
                    className="block w-full rounded-lg border border-surface-300 bg-white py-2.5 pl-10 pr-3.5 text-sm text-surface-900 placeholder:text-surface-400 transition-all duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>
            )}

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
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimo 8 caracteres"
                  className="block w-full rounded-lg border border-surface-300 bg-white py-2.5 pl-10 pr-3.5 text-sm text-surface-900 placeholder:text-surface-400 transition-all duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-surface-700 mb-1.5"
              >
                Confirmar contrasena
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-surface-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu contrasena"
                  className="block w-full rounded-lg border border-surface-300 bg-white py-2.5 pl-10 pr-3.5 text-sm text-surface-900 placeholder:text-surface-400 transition-all duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start gap-2.5">
              <input
                id="terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
              />
              <label htmlFor="terms" className="text-sm text-surface-600 leading-snug cursor-pointer">
                Acepto los{" "}
                <Link
                  href="/terminos"
                  className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                  terminos y condiciones
                </Link>{" "}
                y la{" "}
                <Link
                  href="/privacidad"
                  className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                  politica de privacidad
                </Link>
              </label>
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
                  Crear Cuenta
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center text-sm text-surface-500">
            Ya tienes una cuenta?{" "}
            <Link
              href="/auth/login"
              className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              Iniciar sesion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
