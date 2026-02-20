"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Send,
  Plus,
  X,
  TicketCheck,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Paperclip,
  ImageIcon,
  X as XIcon,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import type { Ticket, TicketStatus, Order } from "@/types";
import {
  formatDateTime,
  getStatusColor,
  getStatusLabel,
  cn,
} from "@/lib/utils";

type StatusFilter = "all" | TicketStatus;

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "Todos", value: "all" },
  { label: "Abierto", value: "open" },
  { label: "En progreso", value: "in_progress" },
  { label: "Resuelto", value: "resolved" },
  { label: "Cerrado", value: "closed" },
];

const priorityConfig: Record<string, { label: string; className: string }> = {
  low: { label: "Baja", className: "bg-surface-100 text-surface-600" },
  medium: { label: "Media", className: "bg-yellow-100 text-yellow-700" },
  high: { label: "Alta", className: "bg-red-100 text-red-700" },
};

const statusIconMap: Record<TicketStatus, typeof AlertCircle> = {
  open: AlertCircle,
  in_progress: Loader2,
  resolved: CheckCircle2,
  closed: XCircle,
};

export default function BuyerTicketsPage() {
  const [ticketsList, setTicketsList] = useState<Ticket[]>([]);
  const [buyerOrders, setBuyerOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [attachedFiles, setAttachedFiles] = useState<Record<string, string[]>>({});
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);

  // New ticket form state
  const [newTicketOrderId, setNewTicketOrderId] = useState("");
  const [newTicketSubject, setNewTicketSubject] = useState("");
  const [newTicketMessage, setNewTicketMessage] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/buyer/tickets");
      if (!res.ok) throw new Error("Failed to fetch tickets");
      const data: Ticket[] = await res.json();
      setTicketsList(data);
    } catch (err) {
      console.error("Error fetching tickets:", err);
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/buyer/orders");
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data: Order[] = await res.json();
      setBuyerOrders(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      await Promise.all([fetchTickets(), fetchOrders()]);
      setLoading(false);
    }
    loadData();
  }, [fetchTickets, fetchOrders]);

  const filteredTickets = useMemo(() => {
    return ticketsList.filter((ticket) => {
      const matchesStatus =
        statusFilter === "all" || ticket.status === statusFilter;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        ticket.subject.toLowerCase().includes(query) ||
        ticket.id.toLowerCase().includes(query) ||
        ticket.sellerName.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [ticketsList, searchQuery, statusFilter]);

  const toggleExpand = (ticketId: string) => {
    setExpandedTicket((prev) => (prev === ticketId ? null : ticketId));
  };

  useEffect(() => {
    if (expandedTicket && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [expandedTicket, ticketsList]);

  const handleSendReply = async (ticketId: string) => {
    const text = (replyText[ticketId] || "").trim();
    if (!text) return;

    try {
      const res = await fetch(`/api/buyer/tickets/${ticketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) throw new Error("Failed to send reply");

      const updatedTicket: Ticket = await res.json();
      setTicketsList((prev) =>
        prev.map((t) => (t.id === ticketId ? updatedTicket : t))
      );
      setReplyText((prev) => ({ ...prev, [ticketId]: "" }));
    } catch (err) {
      console.error("Error sending reply:", err);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicketOrderId || !newTicketSubject.trim() || !newTicketMessage.trim())
      return;

    try {
      const res = await fetch("/api/buyer/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: newTicketOrderId,
          subject: newTicketSubject.trim(),
          message: newTicketMessage.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to create ticket");

      const newTicket: Ticket = await res.json();
      setTicketsList((prev) => [newTicket, ...prev]);
      setNewTicketOrderId("");
      setNewTicketSubject("");
      setNewTicketMessage("");
      setShowNewTicketModal(false);
      setExpandedTicket(newTicket.id);
    } catch (err) {
      console.error("Error creating ticket:", err);
    }
  };

  const handleAttachFile = (ticketId: string) => {
    const demoFiles = ["captura_pantalla.png", "comprobante_pago.jpg", "evidencia.png", "foto_error.jpg"];
    const existing = attachedFiles[ticketId] || [];
    const nextFile = demoFiles[existing.length % demoFiles.length];
    setAttachedFiles((prev) => ({
      ...prev,
      [ticketId]: [...(prev[ticketId] || []), nextFile],
    }));
  };

  const removeAttachedFile = (ticketId: string, index: number) => {
    setAttachedFiles((prev) => ({
      ...prev,
      [ticketId]: (prev[ticketId] || []).filter((_, i) => i !== index),
    }));
  };

  const handleReplyKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    ticketId: string
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply(ticketId);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="buyer">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="buyer">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-surface-900">
              Tickets de Soporte
            </h1>
            <p className="mt-1 text-sm text-surface-500">
              Gestiona tus consultas y reclamos con los vendedores.
            </p>
          </div>
          <button
            onClick={() => setShowNewTicketModal(true)}
            className="flex items-center gap-2 self-start rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 active:bg-primary-800"
          >
            <Plus className="h-4 w-4" />
            Nuevo ticket
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="Buscar por asunto, ID o vendedor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-surface-200 bg-white py-2.5 pl-10 pr-4 text-sm text-surface-900 placeholder:text-surface-400 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-surface-200 bg-surface-50 p-1">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={cn(
                  "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
                  statusFilter === filter.value
                    ? "bg-white text-surface-900 shadow-sm"
                    : "text-surface-500 hover:text-surface-700"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-surface-500">
          Mostrando{" "}
          <span className="font-medium text-surface-700">
            {filteredTickets.length}
          </span>{" "}
          {filteredTickets.length === 1 ? "ticket" : "tickets"}
        </p>

        {/* Tickets List */}
        {filteredTickets.length === 0 ? (
          <div className="rounded-xl border border-surface-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-100">
              <TicketCheck className="h-6 w-6 text-surface-400" />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-surface-900">
              No se encontraron tickets
            </h3>
            <p className="mt-1 text-sm text-surface-500">
              Intenta con otros filtros o crea un nuevo ticket.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => {
              const isExpanded = expandedTicket === ticket.id;
              const StatusIcon = statusIconMap[ticket.status];
              const priority = priorityConfig[ticket.priority];

              return (
                <div
                  key={ticket.id}
                  className="rounded-xl border border-surface-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Ticket Header */}
                  <button
                    onClick={() => toggleExpand(ticket.id)}
                    className="w-full p-4 sm:p-5 text-left"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div
                          className={cn(
                            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                            ticket.status === "open"
                              ? "bg-red-50"
                              : ticket.status === "in_progress"
                              ? "bg-blue-50"
                              : ticket.status === "resolved"
                              ? "bg-green-50"
                              : "bg-surface-100"
                          )}
                        >
                          <StatusIcon
                            className={cn(
                              "h-4.5 w-4.5",
                              ticket.status === "open"
                                ? "text-red-500"
                                : ticket.status === "in_progress"
                                ? "text-blue-500"
                                : ticket.status === "resolved"
                                ? "text-green-500"
                                : "text-surface-400"
                            )}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-surface-900">
                              {ticket.subject}
                            </h3>
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                                getStatusColor(ticket.status)
                              )}
                            >
                              {getStatusLabel(ticket.status)}
                            </span>
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                                priority.className
                              )}
                            >
                              {priority.label}
                            </span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-surface-500">
                            <span>{ticket.id}</span>
                            <span className="hidden sm:inline">--</span>
                            <span>Pedido: {ticket.orderId}</span>
                            <span className="hidden sm:inline">--</span>
                            <span>Vendedor: {ticket.sellerName}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-surface-400">
                            <Clock className="h-3 w-3" />
                            <span>
                              Actualizado: {formatDateTime(ticket.updatedAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
                        <span className="flex items-center gap-1 text-xs text-surface-400">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {ticket.messages.length}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-4.5 w-4.5 text-surface-400" />
                        ) : (
                          <ChevronDown className="h-4.5 w-4.5 text-surface-400" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded: Message Thread */}
                  {isExpanded && (
                    <div className="border-t border-surface-100">
                      {/* Chat Messages */}
                      <div className="max-h-96 overflow-y-auto px-4 py-4 sm:px-5 space-y-4">
                        {ticket.messages.map((msg) => {
                          const isBuyer = msg.senderRole === "buyer";
                          return (
                            <div
                              key={msg.id}
                              className={cn(
                                "flex",
                                isBuyer ? "justify-end" : "justify-start"
                              )}
                            >
                              <div
                                className={cn(
                                  "max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3",
                                  isBuyer
                                    ? "bg-primary-600 text-white rounded-br-md"
                                    : "bg-surface-100 text-surface-800 rounded-bl-md"
                                )}
                              >
                                {/* Sender Info */}
                                <div
                                  className={cn(
                                    "mb-1.5 flex items-center gap-2",
                                    isBuyer ? "justify-end" : "justify-start"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "text-xs font-semibold",
                                      isBuyer
                                        ? "text-primary-100"
                                        : "text-surface-700"
                                    )}
                                  >
                                    {msg.senderName}
                                  </span>
                                  <span
                                    className={cn(
                                      "inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                                      isBuyer
                                        ? "bg-primary-500/40 text-primary-100"
                                        : msg.senderRole === "seller"
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-amber-100 text-amber-700"
                                    )}
                                  >
                                    {msg.senderRole === "buyer"
                                      ? "Comprador"
                                      : msg.senderRole === "seller"
                                      ? "Vendedor"
                                      : "Admin"}
                                  </span>
                                </div>

                                {/* Message Text */}
                                <p
                                  className={cn(
                                    "text-sm leading-relaxed",
                                    isBuyer ? "text-white" : "text-surface-700"
                                  )}
                                >
                                  {msg.message}
                                </p>

                                {/* Timestamp */}
                                <p
                                  className={cn(
                                    "mt-1.5 text-[11px]",
                                    isBuyer
                                      ? "text-primary-200 text-right"
                                      : "text-surface-400"
                                  )}
                                >
                                  {formatDateTime(msg.createdAt)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Reply Input */}
                      {(ticket.status === "open" ||
                        ticket.status === "in_progress") && (
                        <div className="border-t border-surface-100 p-4 sm:p-5">
                          <div className="flex gap-3">
                            <textarea
                              value={replyText[ticket.id] || ""}
                              onChange={(e) =>
                                setReplyText((prev) => ({
                                  ...prev,
                                  [ticket.id]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) =>
                                handleReplyKeyDown(e, ticket.id)
                              }
                              placeholder="Escribe tu respuesta..."
                              rows={2}
                              className="flex-1 resize-none rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                            />
                            <div className="flex flex-col gap-1 self-end">
                              <button
                                onClick={() => handleAttachFile(ticket.id)}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600"
                                aria-label="Adjuntar archivo"
                                type="button"
                              >
                                <Paperclip className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleSendReply(ticket.id)}
                                disabled={!(replyText[ticket.id] || "").trim()}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-surface-200 disabled:text-surface-400"
                                aria-label="Enviar respuesta"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          {/* Attached files */}
                          {(attachedFiles[ticket.id] || []).length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {attachedFiles[ticket.id].map((file, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs text-primary-700"
                                >
                                  <ImageIcon className="h-3 w-3" />
                                  {file}
                                  <button
                                    onClick={() => removeAttachedFile(ticket.id, idx)}
                                    className="ml-0.5 text-primary-400 hover:text-primary-700 transition-colors"
                                    type="button"
                                  >
                                    <XIcon className="h-3 w-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="mt-1.5 text-[11px] text-surface-400">
                            Presiona Enter para enviar, Shift+Enter para salto de linea.
                          </p>
                        </div>
                      )}

                      {/* Closed/Resolved notice */}
                      {(ticket.status === "resolved" ||
                        ticket.status === "closed") && (
                        <div className="border-t border-surface-100 px-4 py-3 sm:px-5">
                          <p className="text-center text-xs text-surface-500">
                            Este ticket esta{" "}
                            {ticket.status === "resolved"
                              ? "resuelto"
                              : "cerrado"}
                            . No es posible enviar nuevos mensajes.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Ticket Modal */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-surface-900/50 backdrop-blur-sm"
            onClick={() => setShowNewTicketModal(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-lg rounded-2xl border border-surface-200 bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-surface-100 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50">
                  <TicketCheck className="h-4.5 w-4.5 text-primary-600" />
                </div>
                <h2 className="text-lg font-semibold text-surface-900">
                  Nuevo ticket de soporte
                </h2>
              </div>
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600"
                aria-label="Cerrar modal"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 px-6 py-5">
              {/* Select Order */}
              <div>
                <label
                  htmlFor="ticketOrder"
                  className="block text-sm font-medium text-surface-700 mb-1.5"
                >
                  Pedido relacionado
                </label>
                <select
                  id="ticketOrder"
                  value={newTicketOrderId}
                  onChange={(e) => setNewTicketOrderId(e.target.value)}
                  className="w-full rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                >
                  <option value="">Selecciona un pedido...</option>
                  {buyerOrders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.id} - {order.productName} ({order.sellerName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label
                  htmlFor="ticketSubject"
                  className="block text-sm font-medium text-surface-700 mb-1.5"
                >
                  Asunto
                </label>
                <input
                  id="ticketSubject"
                  type="text"
                  value={newTicketSubject}
                  onChange={(e) => setNewTicketSubject(e.target.value)}
                  placeholder="Describe brevemente tu consulta..."
                  className="w-full rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="ticketMessage"
                  className="block text-sm font-medium text-surface-700 mb-1.5"
                >
                  Mensaje
                </label>
                <textarea
                  id="ticketMessage"
                  value={newTicketMessage}
                  onChange={(e) => setNewTicketMessage(e.target.value)}
                  placeholder="Explica en detalle tu problema o consulta..."
                  rows={4}
                  className="w-full resize-none rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-surface-100 px-6 py-4">
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="rounded-lg border border-surface-200 bg-white px-4 py-2 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateTicket}
                disabled={
                  !newTicketOrderId ||
                  !newTicketSubject.trim() ||
                  !newTicketMessage.trim()
                }
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-surface-200 disabled:text-surface-400"
              >
                Crear ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
