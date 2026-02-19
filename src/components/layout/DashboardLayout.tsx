"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import {
  Bell,
  Menu,
  X,
  UserCircle,
  ShoppingBag,
  AlertTriangle,
  MessageSquare,
  CheckCircle2,
  LogOut,
  Home,
  ChevronDown,
  Loader2,
} from "lucide-react";
import Sidebar from "./Sidebar";

type Role = "buyer" | "seller" | "admin";

interface DashboardLayoutProps {
  role: Role;
  children: React.ReactNode;
}

const roleGreeting: Record<Role, string> = {
  buyer: "Comprador",
  seller: "Vendedor",
  admin: "Administrador",
};

interface Notification {
  id: string;
  icon: "order" | "alert" | "message" | "success";
  title: string;
  description: string;
  time: string;
  read: boolean;
}

const mockNotifications: Record<Role, Notification[]> = {
  buyer: [
    { id: "n1", icon: "success", title: "Pedido entregado", description: "Tu codigo de Netflix ha sido enviado a tu correo.", time: "Hace 5 min", read: false },
    { id: "n2", icon: "order", title: "Nuevo pedido confirmado", description: "Pedido ORD-001 procesado exitosamente.", time: "Hace 1 hora", read: false },
    { id: "n3", icon: "message", title: "Respuesta en ticket", description: "El vendedor respondio a tu consulta.", time: "Hace 3 horas", read: true },
  ],
  seller: [
    { id: "n1", icon: "order", title: "Nueva venta", description: "Has vendido 1x Spotify Premium 3 meses.", time: "Hace 10 min", read: false },
    { id: "n2", icon: "message", title: "Nuevo ticket de soporte", description: "Un comprador abrio un reclamo.", time: "Hace 2 horas", read: false },
    { id: "n3", icon: "success", title: "Retiro procesado", description: "Tu retiro de $150.00 fue aprobado.", time: "Hace 1 dia", read: true },
  ],
  admin: [
    { id: "n1", icon: "alert", title: "Compra de alto valor", description: "Pedido de $750 requiere revision manual.", time: "Hace 15 min", read: false },
    { id: "n2", icon: "order", title: "Nuevo vendedor registrado", description: "GameStore Bolivia solicita aprobacion.", time: "Hace 1 hora", read: false },
    { id: "n3", icon: "message", title: "Ticket escalado", description: "Ticket TK-003 marcado como urgente.", time: "Hace 4 horas", read: true },
  ],
};

const notificationIcons = {
  order: ShoppingBag,
  alert: AlertTriangle,
  message: MessageSquare,
  success: CheckCircle2,
};

const notificationIconColors = {
  order: "bg-primary-100 text-primary-600",
  alert: "bg-amber-100 text-amber-600",
  message: "bg-blue-100 text-blue-600",
  success: "bg-green-100 text-green-600",
};

export default function DashboardLayout({ role, children }: DashboardLayoutProps) {
  const { data: session } = useSession();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications[role]);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const user = session?.user;
  const userName = user?.name ?? "Usuario";
  const userEmail = user?.email ?? "";

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    setUserMenuOpen(false);
    try {
      await signOut({ redirect: false });
    } catch {
      // signOut may throw — ignore and redirect anyway
    }
    window.location.href = "/";
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50">
      {/* Desktop Sidebar */}
      <div className="relative hidden lg:flex">
        <Sidebar role={role} />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-surface-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:hidden ${
          mobileDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="relative h-full">
          <Sidebar role={role} />
          <button
            onClick={() => setMobileDrawerOpen(false)}
            className="absolute right-2 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700"
            aria-label="Cerrar menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-surface-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700 lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Page Title Area */}
            <div>
              <p className="text-sm text-surface-500">
                Panel de {roleGreeting[role]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700"
                aria-label="Notificaciones"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent-500 text-[9px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 origin-top-right rounded-xl border border-surface-200 bg-white shadow-xl z-50">
                  <div className="flex items-center justify-between border-b border-surface-100 px-4 py-3">
                    <h3 className="text-sm font-semibold text-surface-900">Notificaciones</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                      >
                        Marcar todo como leido
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-surface-100">
                    {notifications.map((notif) => {
                      const IconComp = notificationIcons[notif.icon];
                      const iconColor = notificationIconColors[notif.icon];
                      return (
                        <div
                          key={notif.id}
                          className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-50 ${!notif.read ? "bg-primary-50/30" : ""}`}
                        >
                          <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconColor}`}>
                            <IconComp className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm leading-snug ${!notif.read ? "font-semibold text-surface-900" : "font-medium text-surface-700"}`}>
                              {notif.title}
                            </p>
                            <p className="mt-0.5 text-xs text-surface-500 leading-snug">
                              {notif.description}
                            </p>
                            <p className="mt-1 text-[11px] text-surface-400">{notif.time}</p>
                          </div>
                          {!notif.read && (
                            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary-500" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="border-t border-surface-100 px-4 py-2.5 text-center">
                    <button className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors">
                      Ver todas las notificaciones
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar / Name with Dropdown */}
            <div className="relative ml-2" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-50"
              >
                {user?.image ? (
                  <Image
                    src={user.image}
                    alt={userName}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                    <UserCircle className="h-5 w-5" />
                  </div>
                )}
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-surface-900 leading-tight">
                    {userName}
                  </p>
                  <p className="text-[11px] text-surface-500 leading-tight">
                    {userEmail}
                  </p>
                </div>
                <ChevronDown className={`hidden sm:block h-3.5 w-3.5 text-surface-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 origin-top-right rounded-xl border border-surface-200 bg-white p-1.5 shadow-xl z-50">
                  <div className="border-b border-surface-100 px-3 py-2.5 mb-1">
                    <p className="text-sm font-semibold text-surface-900 truncate">{userName}</p>
                    <p className="text-xs text-surface-500 truncate">{userEmail}</p>
                  </div>
                  <Link
                    href="/"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-surface-700 transition-colors hover:bg-surface-50"
                  >
                    <Home className="h-4 w-4" />
                    Ir al inicio
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
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
