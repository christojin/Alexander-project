"use client";

import { AlertTriangle, CheckCircle, Info, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info" | "success";
  loading?: boolean;
  /** Optional extra content (e.g. textarea for reviewNote) */
  children?: React.ReactNode;
}

const variantConfig = {
  danger: {
    icon: AlertTriangle,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    btnClass: "bg-red-600 hover:bg-red-700 active:bg-red-800",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    btnClass: "bg-amber-600 hover:bg-amber-700 active:bg-amber-800",
  },
  info: {
    icon: Info,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    btnClass: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800",
  },
  success: {
    icon: CheckCircle,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    btnClass: "bg-green-600 hover:bg-green-700 active:bg-green-800",
  },
};

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  loading = false,
  children,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const cfg = variantConfig[variant];
  const Icon = cfg.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-surface-900/50 backdrop-blur-sm"
        onClick={loading ? undefined : onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-surface-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg",
                cfg.iconBg,
                cfg.iconColor
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold text-surface-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 disabled:opacity-50"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-surface-600">{message}</p>
          {children}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-surface-100 px-6 py-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-surface-200 bg-white px-4 py-2 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-70",
              cfg.btnClass
            )}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
