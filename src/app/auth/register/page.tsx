"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
  AlertCircle,
} from "lucide-react";
import { signIn } from "next-auth/react";
import { registerUser, loginWithGoogle } from "@/lib/auth-actions";
import { cn } from "@/lib/utils";

type RegisterRole = "BUYER" | "SELLER";

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  );
}

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || undefined;
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<RegisterRole>("BUYER");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validations
    if (!fullName.trim() || !email || !password || !confirmPassword) {
      setError("Todos los campos son requeridos");
      return;
    }

    if (password.length < 8) {
      setError("La contrasena debe tener al menos 8 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contrasenas no coinciden");
      return;
    }

    if (!acceptTerms) {
      setError("Debes aceptar los terminos y condiciones");
      return;
    }

    setIsLoading(true);
    try {
      // Step 1: Create user account via server action
      const result = await registerUser({
        name: fullName.trim(),
        email,
        password,
        role: selectedRole,
      });

      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      // Step 2: Sign in via client-side Auth.js
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError("Cuenta creada. Inicia sesion manualmente.");
        setIsLoading(false);
        return;
      }

      // Step 3: Redirect to callback URL or role-based dashboard
      if (callbackUrl) {
        router.push(callbackUrl);
      } else {
        const dashboardUrl = selectedRole === "SELLER"
          ? "/seller/dashboard"
          : "/buyer/dashboard";
        router.push(dashboardUrl);
      }
    } catch {
      setError("Error al crear la cuenta. Intenta de nuevo.");
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle(
        callbackUrl || (selectedRole === "SELLER" ? "/seller/dashboard" : "/buyer/dashboard")
      );
    } catch {
      setIsGoogleLoading(false);
    }
  };

  const roleOptions: {
    role: RegisterRole;
    label: string;
    description: string;
    icon: typeof User;
  }[] = [
    {
      role: "BUYER",
      label: "Comprador",
      description: "Quiero comprar productos digitales",
      icon: ShoppingBag,
    },
    {
      role: "SELLER",
      label: "Vendedor",
      description: "Quiero vender mis productos digitales",
      icon: Store,
    },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950">
        <div className="absolute inset-0">
          <div className="absolute top-32 right-20 w-80 h-80 bg-accent-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-32 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/3 w-48 h-48 bg-primary-400/5 rounded-full blur-2xl" />
        </div>
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image
              src="/images/brand/logo-full.png"
              alt="VirtuMall"
              width={200}
              height={50}
              className="h-11 w-auto brightness-0 invert"
              priority
            />
          </Link>

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

          <p className="text-sm text-primary-400">
            Unete a mas de 5,000 usuarios registrados
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-8 lg:p-12 bg-white overflow-y-auto">
        <div className="w-full max-w-md space-y-5">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-4">
            <Link href="/">
              <Image
                src="/images/brand/logo-full.png"
                alt="VirtuMall"
                width={180}
                height={45}
                className="h-10 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-surface-900">
              Crear Cuenta
            </h2>
            <p className="mt-2 text-sm text-surface-500">
              Completa el formulario para registrarte en VirtuMall
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Role Selector */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-2">
              Tipo de cuenta
            </label>
            <div className="grid grid-cols-2 gap-3">
              {roleOptions.map(({ role, label, description, icon: Icon }) => (
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
                      selectedRole === role ? "text-primary-900" : "text-surface-800"
                    )}
                  >
                    {label}
                  </p>
                  <p className="text-xs text-surface-500 mt-0.5">{description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={isGoogleLoading}
            className={cn(
              "flex w-full items-center justify-center gap-3 rounded-lg border border-surface-300 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 transition-all duration-200",
              "hover:bg-surface-50 hover:border-surface-400",
              "disabled:opacity-50 disabled:pointer-events-none",
              "cursor-pointer"
            )}
          >
            {isGoogleLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-surface-400/30 border-t-surface-600" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            Registrarse con Google
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-surface-400">o con email</span>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-surface-700 mb-1.5">
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

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-surface-700 mb-1.5">
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

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-surface-700 mb-1.5">
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-surface-700 mb-1.5">
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

            {/* Terms */}
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
                <Link href="#" className="font-medium text-primary-600 hover:text-primary-700 transition-colors">
                  terminos y condiciones
                </Link>{" "}
                y la{" "}
                <Link href="#" className="font-medium text-primary-600 hover:text-primary-700 transition-colors">
                  politica de privacidad
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-primary-600/25 transition-all duration-200",
                "hover:bg-primary-700 active:bg-primary-800",
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

          {/* Seller Note */}
          {selectedRole === "SELLER" && (
            <div className="bg-primary-50 border border-primary-100 rounded-lg px-4 py-3">
              <p className="text-xs text-primary-700">
                Al registrarte como vendedor, tu cuenta pasara por un proceso de verificacion KYC.
                Podras empezar a vender una vez aprobada por un administrador.
              </p>
            </div>
          )}

          {/* Login Link */}
          <p className="text-center text-sm text-surface-500">
            Ya tienes una cuenta?{" "}
            <Link
              href={callbackUrl ? `/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/auth/login"}
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
