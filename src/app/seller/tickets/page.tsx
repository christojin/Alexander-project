"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  MessageSquare,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Send,
  Clock,
  AlertCircle,
  User,
  Store,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Button, Tabs, Badge, EmptyState } from "@/components/ui";
import { tickets as initialTickets } from "@/data/mock/tickets";
import type { Ticket, TicketMessage, TicketStatus } from "@/types";
import {
  formatDateTime,
  getStatusColor,
  getStatusLabel,
  cn,
  generateId,
} from "@/lib/utils";

const SELLER_ID = "seller-1";
const SELLER_NAME = "DigitalKeys Bolivia";

const statusTabs = [
  { key: "all", label: "Todos" },
  { key: "open", label: "Abiertos" },
  { key: "in_progress", label: "En progreso" },
  { key: "resolved", label: "Resueltos" },
  { key: "closed", label: "Cerrados" },
];

const priorityConfig: Record<
  string,
  { label: string; variant: "error" | "warning" | "info" }
> = {
  high: { label: "Alta", variant: "error" },
  medium: { label: "Media", variant: "warning" },
  low: { label: "Baja", variant: "info" },
};

export default function SellerTicketsPage() {
  const [ticketsList, setTicketsList] = useState<Ticket[]>(
    initialTickets.filter((t) => t.sellerId === SELLER_ID)
  );
  const [activeTab, setActiveTab] = useState("all");
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<Record<string, HTMLDivElement | null>>({});

  const tabsWithCounts = useMemo(() => {
    return statusTabs.map((tab) => ({
      ...tab,
      count:
        tab.key === "all"
          ? ticketsList.length
          : ticketsList.filter((t) => t.status === tab.key).length,
    }));
  }, [ticketsList]);

  const filteredTickets = useMemo(() => {
    const filtered =
      activeTab === "all"
        ? ticketsList
        : ticketsList.filter((t) => t.status === activeTab);
    return [...filtered].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [ticketsList, activeTab]);

  const toggleExpand = (ticketId: string) => {
    setExpandedTicket((prev) => (prev === ticketId ? null : ticketId));
  };

  const handleReply = (ticketId: string) => {
    const message = replyInputs[ticketId]?.trim();
    if (!message) return;

    const newMessage: TicketMessage = {
      id: `msg-${generateId()}`,
      senderId: SELLER_ID,
      senderName: SELLER_NAME,
      senderRole: "seller",
      message,
      createdAt: new Date().toISOString(),
    };

    setTicketsList((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
              ...t,
              messages: [...t.messages, newMessage],
              status:
                t.status === "open"
                  ? ("in_progress" as TicketStatus)
                  : t.status,
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );

    setReplyInputs((prev) => ({ ...prev, [ticketId]: "" }));
  };

  const handleStatusChange = (
    ticketId: string,
    newStatus: TicketStatus
  ) => {
    setTicketsList((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, status: newStatus, updatedAt: new Date().toISOString() }
          : t
      )
    );
  };

  const getStatusBadgeVariant = (
    status: string
  ): "success" | "warning" | "error" | "info" | "neutral" => {
    const variants: Record<
      string,
      "success" | "warning" | "error" | "info" | "neutral"
    > = {
      open: "error",
      in_progress: "info",
      resolved: "success",
      closed: "neutral",
    };
    return variants[status] || "neutral";
  };

  return (
    <DashboardLayout role="seller">
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-surface-900 tracking-tight">
            Tickets de soporte
          </h1>
          <p className="mt-1 text-sm text-surface-500">
            Gestiona las consultas y reclamos de tus compradores
          </p>
        </div>

        {/* Status Tabs */}
        <Tabs
          tabs={tabsWithCounts}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Tickets List */}
        {filteredTickets.length === 0 ? (
          <EmptyState
            icon={<MessageSquare />}
            title="No hay tickets"
            description="No se encontraron tickets con el filtro seleccionado."
          />
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => {
              const isExpanded = expandedTicket === ticket.id;
              const priority = priorityConfig[ticket.priority];

              return (
                <div
                  key={ticket.id}
                  className="rounded-xl border border-surface-200 bg-white transition-shadow hover:shadow-sm"
                >
                  {/* Ticket Header (clickable) */}
                  <button
                    onClick={() => toggleExpand(ticket.id)}
                    className="flex w-full items-center justify-between px-6 py-4 text-left cursor-pointer"
                  >
                    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
                      <span className="text-sm font-bold text-surface-900">
                        {ticket.id}
                      </span>
                      <h3 className="text-sm font-medium text-surface-800">
                        {ticket.subject}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={getStatusBadgeVariant(ticket.status)}
                          size="sm"
                          dot
                        >
                          {getStatusLabel(ticket.status)}
                        </Badge>
                        <Badge variant={priority.variant} size="sm">
                          {priority.label}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hidden text-right sm:block">
                        <p className="text-xs text-surface-500">
                          {ticket.buyerName}
                        </p>
                        <p className="text-xs text-surface-400">
                          Pedido: {ticket.orderId}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-surface-400">
                        <MessageSquare className="size-3.5" />
                        {ticket.messages.length}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="size-5 text-surface-400" />
                      ) : (
                        <ChevronDown className="size-5 text-surface-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded: Chat Thread + Actions */}
                  {isExpanded && (
                    <div className="border-t border-surface-100">
                      {/* Ticket Meta */}
                      <div className="flex flex-wrap items-center gap-4 border-b border-surface-100 bg-surface-50/50 px-6 py-3 text-xs text-surface-500">
                        <span className="flex items-center gap-1">
                          <User className="size-3.5" />
                          Comprador: {ticket.buyerName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5" />
                          Creado: {formatDateTime(ticket.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <AlertCircle className="size-3.5" />
                          Actualizado: {formatDateTime(ticket.updatedAt)}
                        </span>
                      </div>

                      {/* Messages Thread */}
                      <div className="space-y-4 px-6 py-5 max-h-[400px] overflow-y-auto">
                        {ticket.messages.map((msg) => {
                          const isSeller = msg.senderRole === "seller";
                          return (
                            <div
                              key={msg.id}
                              className={cn(
                                "flex",
                                isSeller ? "justify-end" : "justify-start"
                              )}
                            >
                              <div
                                className={cn(
                                  "max-w-[80%] rounded-2xl px-4 py-3",
                                  isSeller
                                    ? "rounded-br-md bg-primary-600 text-white"
                                    : "rounded-bl-md bg-surface-100 text-surface-800"
                                )}
                              >
                                <div
                                  className={cn(
                                    "mb-1.5 flex items-center gap-2 text-xs font-medium",
                                    isSeller
                                      ? "text-primary-200"
                                      : "text-surface-500"
                                  )}
                                >
                                  {isSeller ? (
                                    <Store className="size-3" />
                                  ) : (
                                    <User className="size-3" />
                                  )}
                                  {msg.senderName}
                                </div>
                                <p
                                  className={cn(
                                    "text-sm leading-relaxed",
                                    isSeller
                                      ? "text-white"
                                      : "text-surface-800"
                                  )}
                                >
                                  {msg.message}
                                </p>
                                <p
                                  className={cn(
                                    "mt-1.5 text-[11px]",
                                    isSeller
                                      ? "text-primary-300"
                                      : "text-surface-400"
                                  )}
                                >
                                  {formatDateTime(msg.createdAt)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Reply Input (only for non-closed/resolved tickets) */}
                      {ticket.status !== "closed" &&
                        ticket.status !== "resolved" && (
                          <div className="border-t border-surface-100 px-6 py-4">
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <textarea
                                  value={replyInputs[ticket.id] || ""}
                                  onChange={(e) =>
                                    setReplyInputs((prev) => ({
                                      ...prev,
                                      [ticket.id]: e.target.value,
                                    }))
                                  }
                                  placeholder="Escribe tu respuesta..."
                                  className="block w-full rounded-lg border border-surface-300 bg-white px-3.5 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 min-h-[80px] resize-y transition-all"
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && e.ctrlKey) {
                                      handleReply(ticket.id);
                                    }
                                  }}
                                />
                                <p className="mt-1 text-xs text-surface-400">
                                  Ctrl + Enter para enviar
                                </p>
                              </div>
                              <Button
                                size="md"
                                iconLeft={<Send />}
                                onClick={() => handleReply(ticket.id)}
                                disabled={
                                  !replyInputs[ticket.id]?.trim()
                                }
                              >
                                Enviar
                              </Button>
                            </div>
                          </div>
                        )}

                      {/* Status Actions */}
                      <div className="flex flex-wrap items-center gap-3 border-t border-surface-100 bg-surface-50/50 px-6 py-3">
                        {(ticket.status === "open" ||
                          ticket.status === "in_progress") && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              iconLeft={<CheckCircle />}
                              onClick={() =>
                                handleStatusChange(ticket.id, "resolved")
                              }
                            >
                              Marcar como resuelto
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              iconLeft={<XCircle />}
                              onClick={() =>
                                handleStatusChange(ticket.id, "closed")
                              }
                            >
                              Cerrar ticket
                            </Button>
                          </>
                        )}
                        {ticket.status === "resolved" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            iconLeft={<XCircle />}
                            onClick={() =>
                              handleStatusChange(ticket.id, "closed")
                            }
                          >
                            Cerrar ticket
                          </Button>
                        )}
                        {ticket.status === "closed" && (
                          <p className="text-xs text-surface-400">
                            Este ticket ha sido cerrado.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
