"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout";
import { cn } from "@/lib/utils";
import {
  Bell,
  ShoppingBag,
  AlertTriangle,
  MessageSquare,
  CheckCircle2,
  Megaphone,
  Loader2,
  CheckCheck,
} from "lucide-react";

interface NotifItem {
  id: string;
  kind: "notification" | "announcement";
  type?: string;
  title: string;
  description: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

const typeToIcon: Record<string, "order" | "alert" | "message" | "success"> = {
  NEW_ORDER: "order",
  ORDER_COMPLETED: "success",
  STOCK_DEPLETED: "alert",
  NEW_TICKET: "message",
  TICKET_REPLY: "message",
  NEW_CHAT_MESSAGE: "message",
  WITHDRAWAL_APPROVED: "success",
  WITHDRAWAL_REJECTED: "alert",
  KYC_APPROVED: "success",
  KYC_REJECTED: "alert",
  SYSTEM: "alert",
  REFUND_PROCESSED: "success",
  WALLET_CREDITED: "success",
  ORDER_DELAYED: "alert",
};

const notificationIcons = {
  order: ShoppingBag,
  alert: AlertTriangle,
  message: MessageSquare,
  success: CheckCircle2,
  announcement: Megaphone,
};

const notificationIconColors = {
  order: "bg-primary-100 text-primary-600",
  alert: "bg-amber-100 text-amber-600",
  message: "bg-blue-100 text-blue-600",
  success: "bg-green-100 text-green-600",
  announcement: "bg-purple-100 text-purple-600",
};

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Ahora";
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} hora${hours > 1 ? "s" : ""}`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} dia${days > 1 ? "s" : ""}`;
}

export default function BuyerNotificationsPage() {
  const [items, setItems] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();

      const merged: NotifItem[] = [];

      for (const n of data.notifications ?? []) {
        merged.push({
          id: n.id,
          kind: "notification",
          type: n.type,
          title: n.title,
          description: n.message,
          link: n.link,
          read: n.isRead,
          createdAt: n.createdAt,
        });
      }

      for (const a of data.announcements ?? []) {
        merged.push({
          id: a.id,
          kind: "announcement",
          title: a.title,
          description: a.content,
          link: null,
          read: a.isRead,
          createdAt: a.createdAt,
        });
      }

      merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setItems(merged);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
    } catch {
      fetchNotifications();
    }
  };

  const markOneRead = async (item: NotifItem) => {
    if (item.read) return;
    setItems((prev) => prev.map((n) => (n.id === item.id && n.kind === item.kind ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          item.kind === "announcement"
            ? { announcementId: item.id }
            : { notificationId: item.id }
        ),
      });
    } catch {
      fetchNotifications();
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="buyer">
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="buyer">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Notificaciones</h1>
            <p className="mt-1 text-slate-500">
              {unreadCount > 0
                ? `Tienes ${unreadCount} notificacion${unreadCount > 1 ? "es" : ""} sin leer`
                : "Todas tus notificaciones al dia"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <CheckCheck className="h-4 w-4" />
              Marcar todo como leido
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          {items.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Bell className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">
                No tienes notificaciones
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((item) => {
                const iconKey = item.kind === "announcement" ? "announcement" : (typeToIcon[item.type ?? ""] ?? "alert");
                const IconComp = notificationIcons[iconKey];
                const iconColor = notificationIconColors[iconKey];
                return (
                  <button
                    key={`${item.kind}-${item.id}`}
                    onClick={() => markOneRead(item)}
                    className={cn(
                      "flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50",
                      !item.read && "bg-indigo-50/40"
                    )}
                  >
                    <div className={cn("mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", iconColor)}>
                      <IconComp className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={cn("text-sm leading-snug", !item.read ? "font-semibold text-slate-900" : "font-medium text-slate-700")}>
                          {item.title}
                        </p>
                        {item.kind === "announcement" && (
                          <span className="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                            Anuncio
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                        {item.description}
                      </p>
                      <p className="mt-1.5 text-xs text-slate-400">{timeAgo(item.createdAt)}</p>
                    </div>
                    {!item.read && (
                      <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-indigo-500" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
