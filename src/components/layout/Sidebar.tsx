"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  ShoppingBag,
  TicketCheck,
  UserCircle,
  Package,
  ClipboardList,
  DollarSign,
  Store,
  Users,
  Grid3X3,
  Percent,
  Plug,
  Settings,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

type Role = "buyer" | "seller" | "admin";

interface SidebarProps {
  role: Role;
}

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navigationByRole: Record<Role, NavItem[]> = {
  buyer: [
    { label: "Dashboard", href: "/dashboard/comprador", icon: LayoutDashboard },
    { label: "Mis Compras", href: "/dashboard/comprador/compras", icon: ShoppingBag },
    { label: "Tickets de Soporte", href: "/dashboard/comprador/tickets", icon: TicketCheck },
    { label: "Mi Perfil", href: "/dashboard/comprador/perfil", icon: UserCircle },
  ],
  seller: [
    { label: "Dashboard", href: "/dashboard/vendedor", icon: LayoutDashboard },
    { label: "Mis Productos", href: "/dashboard/vendedor/productos", icon: Package },
    { label: "Pedidos", href: "/dashboard/vendedor/pedidos", icon: ClipboardList },
    { label: "Ganancias", href: "/dashboard/vendedor/ganancias", icon: DollarSign },
    { label: "Tickets", href: "/dashboard/vendedor/tickets", icon: TicketCheck },
    { label: "Mi Tienda", href: "/dashboard/vendedor/tienda", icon: Store },
  ],
  admin: [
    { label: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
    { label: "Usuarios", href: "/dashboard/admin/usuarios", icon: Users },
    { label: "Productos", href: "/dashboard/admin/productos", icon: Package },
    { label: "Categorias", href: "/dashboard/admin/categorias", icon: Grid3X3 },
    { label: "Comisiones", href: "/dashboard/admin/comisiones", icon: Percent },
    { label: "Integraciones API", href: "/dashboard/admin/integraciones", icon: Plug },
    { label: "Configuracion", href: "/dashboard/admin/configuracion", icon: Settings },
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

export default function Sidebar({ role }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const navItems = navigationByRole[role];
  const badge = roleBadgeConfig[role];

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
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white">
            <Shield className="h-4.5 w-4.5" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-surface-900 whitespace-nowrap">
              Vendor<span className="text-primary-600">Vault</span>
            </span>
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
                  {active && !collapsed && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-500" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom section */}
      {!collapsed && (
        <div className="border-t border-surface-100 p-4">
          <p className="text-[11px] text-surface-400">
            VendorVault v1.0
          </p>
        </div>
      )}
    </aside>
  );
}
