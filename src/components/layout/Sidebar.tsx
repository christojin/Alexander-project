"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  ShoppingBag,
  TicketCheck,
  Package,
  ClipboardList,
  DollarSign,
  Users,
  Grid3X3,
  Percent,
  Plug,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Home,
  Loader2,
  ImageIcon,
  FileCheck,
  Store,
  Bell,
  ArrowRightLeft,
  KeyRound,
  type LucideIcon,
} from "lucide-react";
import { logout } from "@/lib/auth-actions";

type Role = "buyer" | "seller" | "admin";

interface SidebarProps {
  role: Role;
}

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  badgeClass?: string;
}

const navigationByRole: Record<Role, NavItem[]> = {
  buyer: [
    { label: "Dashboard", href: "/buyer/dashboard", icon: LayoutDashboard },
    { label: "Mis Compras", href: "/buyer/orders", icon: ShoppingBag },
    { label: "Tickets de Soporte", href: "/buyer/tickets", icon: TicketCheck },
  ],
  seller: [
    { label: "Dashboard", href: "/seller/dashboard", icon: LayoutDashboard },
    { label: "Mi Tienda", href: "/seller/profile", icon: Store },
    { label: "Verificacion KYC", href: "/seller/kyc", icon: ShieldCheck },
    { label: "Mis Productos", href: "/seller/products", icon: Package },
    { label: "Pedidos", href: "/seller/orders", icon: ClipboardList },
    { label: "Ganancias", href: "/seller/earnings", icon: DollarSign },
    { label: "Tickets", href: "/seller/tickets", icon: TicketCheck },
  ],
  admin: [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Usuarios", href: "/admin/users", icon: Users },
    { label: "Verificacion KYC", href: "/admin/kyc", icon: FileCheck },
    { label: "Productos", href: "/admin/products", icon: Package },
    { label: "Banners", href: "/admin/banners", icon: ImageIcon },
    { label: "Categorias", href: "/admin/categories", icon: Grid3X3 },
    { label: "Comisiones", href: "/admin/commissions", icon: Percent },
    { label: "Notificaciones", href: "/admin/notifications", icon: Bell },
    { label: "Tasas de Cambio", href: "/admin/exchange-rates", icon: ArrowRightLeft },
    { label: "Codigos", href: "/admin/codes", icon: KeyRound },
    { label: "Integraciones API", href: "/admin/api-integrations", icon: Plug },
    { label: "Configuracion", href: "/admin/settings", icon: Settings },
  ],
};

const roleBadgeConfig: Record<Role, { label: string; className: string }> = {
  buyer: {
    label: "Comprador",
    className: "bg-accent-100 text-accent-700",
  },
  seller: {
    label: "Vendedor",
    className: "bg-primary-100 text-primary-700",
  },
  admin: {
    label: "Administrador",
    className: "bg-amber-100 text-amber-700",
  },
};

const kycStatusConfig: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pendiente", className: "bg-amber-100 text-amber-700" },
  APPROVED: { label: "Verificado", className: "bg-green-100 text-green-700" },
  REJECTED: { label: "Rechazado", className: "bg-red-100 text-red-700" },
  SUSPENDED: { label: "Suspendido", className: "bg-red-100 text-red-700" },
};

export default function Sidebar({ role }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const badge = roleBadgeConfig[role];

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
  };

  // Add KYC status badge dynamically for sellers
  const sellerStatus = session?.user?.sellerStatus;
  const navItems = navigationByRole[role].map((item) => {
    if (role === "seller" && item.href === "/seller/kyc" && sellerStatus) {
      const kycBadge = kycStatusConfig[sellerStatus];
      if (kycBadge) {
        return { ...item, badge: kycBadge.label, badgeClass: kycBadge.className };
      }
    }
    return item;
  });

  const isActive = (href: string) => {
    if (href === pathname) return true;
    // Match sub-routes but not sibling routes
    const navHrefs = navItems.map((item) => item.href);
    const isExactMatchForAnother = navHrefs.some(
      (navHref) => navHref !== href && pathname.startsWith(navHref) && navHref.length > href.length
    );
    if (isExactMatchForAnother) return false;
    return pathname.startsWith(href + "/");
  };

  return (
    <aside
      className={`flex h-full flex-col border-r border-surface-200 bg-white transition-all duration-300 ${
        collapsed ? "w-[72px]" : "w-64"
      }`}
    >
      {/* Logo & Toggle */}
      <div className="flex h-16 items-center justify-between border-b border-surface-100 px-4">
        <Link
          href="/"
          className={`flex items-center gap-2 overflow-hidden ${
            collapsed ? "justify-center w-full" : ""
          }`}
        >
          {collapsed ? (
            <Image
              src="/images/brand/logo-icon.png"
              alt="VirtuMall"
              width={32}
              height={32}
              className="h-8 w-8 shrink-0"
            />
          ) : (
            <Image
              src="/images/brand/logo-full.png"
              alt="VirtuMall"
              width={140}
              height={35}
              className="h-8 w-auto"
            />
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`hidden lg:flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 ${
            collapsed ? "absolute -right-3.5 top-4.5 z-10 border border-surface-200 bg-white shadow-sm" : ""
          }`}
          aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Role Badge */}
      {!collapsed && (
        <div className="px-4 py-3">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>
      )}
      {collapsed && (
        <div className="flex justify-center py-3">
          <span
            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold ${badge.className}`}
            title={badge.label}
          >
            {badge.label.charAt(0)}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`group flex items-center rounded-lg transition-colors ${
                    collapsed
                      ? "justify-center px-2 py-2.5"
                      : "gap-3 px-3 py-2.5"
                  } ${
                    active
                      ? "bg-primary-50 text-primary-700 font-medium"
                      : "text-surface-600 hover:bg-surface-50 hover:text-surface-900"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 shrink-0 ${
                      active
                        ? "text-primary-600"
                        : "text-surface-400 group-hover:text-surface-600"
                    }`}
                  />
                  {!collapsed && (
                    <span className="text-sm whitespace-nowrap">{item.label}</span>
                  )}
                  {!collapsed && item.badge && (
                    <span className={`ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-semibold leading-none ${item.badgeClass}`}>
                      {item.badge}
                    </span>
                  )}
                  {active && !collapsed && !item.badge && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-500" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="border-t border-surface-100 px-3 py-3 space-y-1">
        <Link
          href="/"
          title={collapsed ? "Ir al inicio" : undefined}
          className={`group flex items-center rounded-lg text-surface-600 hover:bg-surface-50 hover:text-surface-900 transition-colors ${
            collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"
          }`}
        >
          <Home className="h-5 w-5 shrink-0 text-surface-400 group-hover:text-surface-600" />
          {!collapsed && <span className="text-sm">Ir al inicio</span>}
        </Link>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title={collapsed ? "Cerrar Sesion" : undefined}
          className={`group flex items-center rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 w-full ${
            collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"
          }`}
        >
          {loggingOut ? (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
          ) : (
            <LogOut className="h-5 w-5 shrink-0" />
          )}
          {!collapsed && (
            <span className="text-sm">{loggingOut ? "Cerrando..." : "Cerrar Sesion"}</span>
          )}
        </button>
        {!collapsed && (
          <p className="text-[11px] text-surface-400 px-3 pt-1">
            VirtuMall v1.0
          </p>
        )}
      </div>
    </aside>
  );
}
