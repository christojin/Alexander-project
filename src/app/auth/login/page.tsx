"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
  Zap,
  Globe,
  AlertCircle,
} from "lucide-react";
import { signIn } from "next-auth/react";
import { useApp } from "@/context/AppContext";
import { loginWithGoogle } from "@/lib/auth-actions";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const { login } = useApp();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || undefined;
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState(
    errorParam === "OAuthAccountNotLinked"
      ? "Este email ya esta registrado con otro metodo. Usa tu contrasena para iniciar sesion."
      : ""
  );
  const [loadingRole, setLoadingRole] = useState<UserRole | null>(null);

  // Demo login (development only)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Por favor ingresa tu email y contrasena");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email o contrasena incorrectos");
        setIsLoading(false);
        return;
      }

      // Redirect to callback URL or homepage
      window.location.href = callbackUrl || "/";
    } catch {
      setError("Error al iniciar sesion. Intenta de nuevo.");
      setIsLoading(false);
    }
  };

  // Handle error from redirected auth flows
  useEffect(() => {
    if (errorParam === "CredentialsSignin") {
      setError("Email o contrasena incorrectos");
    }
  }, [errorParam]);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle(callbackUrl);
    } catch {
      setIsGoogleLoading(false);
    }
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
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-400/5 rounded-full blur-2xl" />
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
                Tu marketplace seguro
                <br />
                de productos digitales
              </h1>
              <p className="mt-4 text-lg text-primary-200 leading-relaxed max-w-md">
                Compra y vende codigos digitales, licencias de software y mas
                con total seguridad en Bolivia.
              </p>
            </div>

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
                  <p className="text-sm text-primary-300">QR Bolivia, Stripe y Binance Pay</p>
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

          <p className="text-sm text-primary-400">
            Mas de 10,000 productos digitales disponibles
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-8 lg:p-12 bg-white">
        <div className="w-full max-w-md space-y-6">
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
              Iniciar Sesion
            </h2>
            <p className="mt-2 text-sm text-surface-500">
              Ingresa tus credenciales para acceder a tu cuenta
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className={cn(
              "flex w-full items-center justify-center gap-3 rounded-lg border border-surface-300 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 transition-all duration-200",
              "hover:bg-surface-50 hover:border-surface-400",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
              "disabled:opacity-50 disabled:pointer-events-none",
              "cursor-pointer"
            )}
          >
            {isGoogleLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-surface-400/30 border-t-surface-600" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Continuar con Google
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-surface-400">o</span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="flex items-center justify-end">
              <Link
                href="#"
                className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                Olvidaste tu contrasena?
              </Link>
            </div>

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

          {/* Demo Quick Login - Development Only */}
          {process.env.NODE_ENV === "development" && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-surface-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-surface-400">
                    Acceso rapido (demo)
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {demoButtons.map(({ role, label, icon: Icon, description }) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleDemoLogin(role)}
                    disabled={loadingRole !== null}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border border-surface-200 bg-white px-4 py-2.5 text-left transition-all duration-200",
                      "hover:border-primary-300 hover:bg-primary-50/50 hover:shadow-sm",
                      "disabled:opacity-50 disabled:pointer-events-none",
                      "cursor-pointer",
                      loadingRole === role && "border-primary-300 bg-primary-50/50"
                    )}
                  >
                    <div className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                      role === "buyer" && "bg-accent-100 text-accent-600",
                      role === "seller" && "bg-primary-100 text-primary-600",
                      role === "admin" && "bg-surface-100 text-surface-600"
                    )}>
                      {loadingRole === role ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900">{label}</p>
                      <p className="text-xs text-surface-500">{description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-surface-400" />
                  </button>
                ))}
              </div>
            </>
          )}

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
