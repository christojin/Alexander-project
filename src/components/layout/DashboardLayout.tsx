"use client";

import { useState } from "react";
import {
  Bell,
  Menu,
  X,
  UserCircle,
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

export default function DashboardLayout({ role, children }: DashboardLayoutProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

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
            <button
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-700"
              aria-label="Notificaciones"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent-500" />
            </button>

            {/* User Avatar / Name */}
            <div className="ml-2 flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-50">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                <UserCircle className="h-5 w-5" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-surface-900 leading-tight">
                  Usuario Demo
                </p>
                <p className="text-[11px] text-surface-500 leading-tight">
                  demo@vendorvault.bo
                </p>
              </div>
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
