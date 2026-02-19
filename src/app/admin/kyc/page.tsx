"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { DashboardLayout } from "@/components/layout";
import { formatDate, cn } from "@/lib/utils";
import {
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  Loader2,
  FileText,
  Download,
  ShieldCheck,
  UserCircle,
  Store,
  FileImage,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

type KYCStatus = "PENDING" | "APPROVED" | "REJECTED";
type TabKey = "PENDING" | "APPROVED" | "REJECTED";

interface KYCDocument {
  id: string;
  documentType: string;
  documentUrl: string;
  status: string;
  reviewNote: string | null;
  createdAt: string;
}

interface KYCSeller {
  id: string;
  storeName: string;
  storeDescription: string;
  marketType: string;
  status: KYCStatus;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    createdAt: string;
  };
  country: {
    name: string;
    flagEmoji: string;
  } | null;
  kycDocuments: KYCDocument[];
}

// ============================================
// CONSTANTS
// ============================================

const MARKET_TYPE_LABELS: Record<string, string> = {
  GIFT_CARDS: "Gift Cards",
  STREAMING: "Streaming",
  GAMING: "Gaming",
  SOFTWARE: "Software",
  MIXED: "Mixto",
};

const STATUS_BADGE_STYLES: Record<KYCStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<KYCStatus, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
};

// ============================================
// COMPONENT
// ============================================

export default function AdminKYCPage() {
  const [sellers, setSellers] = useState<KYCSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("PENDING");
  const [search, setSearch] = useState("");
  const [selectedSeller, setSelectedSeller] = useState<KYCSeller | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [showRejectNote, setShowRejectNote] = useState(false);

  // Counts per status
  const [counts, setCounts] = useState<Record<TabKey, number>>({
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
  });

  // ============================================
  // FETCH
  // ============================================

  const fetchSellers = useCallback(async (status: TabKey) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/kyc?status=${status}`);
      const data = await res.json();
      setSellers(data.sellers ?? []);
    } catch (error) {
      console.error("Error fetching KYC sellers:", error);
      setSellers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCounts = useCallback(async () => {
    try {
      const [pending, approved, rejected] = await Promise.all([
        fetch("/api/admin/kyc?status=PENDING").then((r) => r.json()),
        fetch("/api/admin/kyc?status=APPROVED").then((r) => r.json()),
        fetch("/api/admin/kyc?status=REJECTED").then((r) => r.json()),
      ]);
      setCounts({
        PENDING: (pending.sellers ?? []).length,
        APPROVED: (approved.sellers ?? []).length,
        REJECTED: (rejected.sellers ?? []).length,
      });
    } catch (error) {
      console.error("Error fetching KYC counts:", error);
    }
  }, []);

  useEffect(() => {
    fetchSellers(activeTab);
    fetchCounts();
  }, [activeTab, fetchSellers, fetchCounts]);

  // ============================================
  // FILTER
  // ============================================

  const filteredSellers = useMemo(() => {
    if (!search.trim()) return sellers;
    const q = search.toLowerCase();
    return sellers.filter(
      (s) =>
        s.user.name.toLowerCase().includes(q) ||
        s.user.email.toLowerCase().includes(q) ||
        s.storeName.toLowerCase().includes(q)
    );
  }, [sellers, search]);

  // ============================================
  // ACTIONS
  // ============================================

  const handleAction = async (action: "approve" | "reject") => {
    if (!selectedSeller) return;
    if (action === "reject" && !showRejectNote) {
      setShowRejectNote(true);
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/kyc/${selectedSeller.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reviewNote: reviewNote.trim() || undefined,
        }),
      });

      if (res.ok) {
        setSelectedSeller(null);
        setReviewNote("");
        setShowRejectNote(false);
        fetchSellers(activeTab);
        fetchCounts();
      } else {
        const data = await res.json();
        console.error("Error:", data.error);
      }
    } catch (error) {
      console.error("Error performing KYC action:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedSeller(null);
    setReviewNote("");
    setShowRejectNote(false);
  };

  // ============================================
  // HELPERS
  // ============================================

  const isImageUrl = (url: string): boolean => {
    return /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
  };

  const getDocumentTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      identity: "Documento de identidad",
      selfie: "Selfie con documento",
      business: "Documento comercial",
    };
    return labels[type] || type;
  };

  // ============================================
  // TABS CONFIG
  // ============================================

  const tabs = [
    {
      key: "PENDING" as TabKey,
      label: "Pendientes",
      icon: Clock,
      count: counts.PENDING,
    },
    {
      key: "APPROVED" as TabKey,
      label: "Aprobados",
      icon: CheckCircle2,
      count: counts.APPROVED,
    },
    {
      key: "REJECTED" as TabKey,
      label: "Rechazados",
      icon: XCircle,
      count: counts.REJECTED,
    },
  ];

  // ============================================
  // RENDER
  // ============================================

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Verificacion KYC
          </h1>
          <p className="mt-1 text-slate-500">
            Revisa y gestiona las solicitudes de verificacion de vendedores
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
                activeTab === tab.key
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              <span
                className={cn(
                  "ml-1 rounded-full px-2 py-0.5 text-xs",
                  activeTab === tab.key
                    ? "bg-indigo-100 text-indigo-600"
                    : "bg-slate-200 text-slate-500"
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o tienda..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Vendedor
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Tienda
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Tipo de Mercado
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Documentos
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSellers.map((seller) => (
                    <tr
                      key={seller.id}
                      className="transition-colors hover:bg-slate-50"
                    >
                      {/* Vendedor: avatar + name + email */}
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-3">
                          {seller.user.avatar ? (
                            <img
                              src={seller.user.avatar}
                              alt={seller.user.name}
                              className="h-9 w-9 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
                              {seller.user.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-slate-900">
                              {seller.user.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {seller.user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Tienda */}
                      <td className="whitespace-nowrap px-6 py-3.5 text-sm text-slate-700">
                        {seller.storeName}
                      </td>

                      {/* Tipo de Mercado */}
                      <td className="whitespace-nowrap px-6 py-3.5">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                          {MARKET_TYPE_LABELS[seller.marketType] ||
                            seller.marketType}
                        </span>
                      </td>

                      {/* Documentos */}
                      <td className="whitespace-nowrap px-6 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <FileImage className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-700">
                            {seller.kycDocuments.length}
                          </span>
                        </div>
                      </td>

                      {/* Fecha */}
                      <td className="whitespace-nowrap px-6 py-3.5 text-sm text-slate-500">
                        {formatDate(seller.updatedAt)}
                      </td>

                      {/* Acciones */}
                      <td className="whitespace-nowrap px-6 py-3.5">
                        <button
                          onClick={() => setSelectedSeller(seller)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          <Eye className="h-4 w-4" />
                          Ver Detalles
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredSellers.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-sm text-slate-500"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <ShieldCheck className="h-10 w-10 text-slate-300" />
                          <div>
                            <p className="font-medium text-slate-600">
                              No se encontraron vendedores
                            </p>
                            <p className="mt-1 text-slate-400">
                              No hay solicitudes de verificacion{" "}
                              {activeTab === "PENDING"
                                ? "pendientes"
                                : activeTab === "APPROVED"
                                ? "aprobadas"
                                : "rechazadas"}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            {/* Modal Header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Detalle de verificacion
                  </h3>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      STATUS_BADGE_STYLES[selectedSeller.status]
                    )}
                  >
                    {STATUS_LABELS[selectedSeller.status]}
                  </span>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Personal Info */}
            <div className="mb-6 rounded-lg border border-slate-200 p-4">
              <div className="mb-3 flex items-center gap-2">
                <UserCircle className="h-4 w-4 text-indigo-500" />
                <h4 className="text-sm font-semibold text-slate-900">
                  Informacion personal
                </h4>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Nombre</p>
                  <p className="text-sm font-medium text-slate-900">
                    {selectedSeller.user.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="text-sm font-medium text-slate-900">
                    {selectedSeller.user.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Fecha de registro</p>
                  <p className="text-sm font-medium text-slate-900">
                    {formatDate(selectedSeller.user.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Business Info */}
            <div className="mb-6 rounded-lg border border-slate-200 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Store className="h-4 w-4 text-indigo-500" />
                <h4 className="text-sm font-semibold text-slate-900">
                  Informacion del negocio
                </h4>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Nombre de tienda</p>
                  <p className="text-sm font-medium text-slate-900">
                    {selectedSeller.storeName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Tipo de mercado</p>
                  <p className="text-sm font-medium text-slate-900">
                    {MARKET_TYPE_LABELS[selectedSeller.marketType] ||
                      selectedSeller.marketType}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Pais</p>
                  <p className="text-sm font-medium text-slate-900">
                    {selectedSeller.country
                      ? `${selectedSeller.country.flagEmoji} ${selectedSeller.country.name}`
                      : "No especificado"}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-500">Descripcion</p>
                  <p className="text-sm text-slate-700">
                    {selectedSeller.storeDescription || "Sin descripcion"}
                  </p>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="mb-6 rounded-lg border border-slate-200 p-4">
              <div className="mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-500" />
                <h4 className="text-sm font-semibold text-slate-900">
                  Documentos ({selectedSeller.kycDocuments.length})
                </h4>
              </div>
              {selectedSeller.kycDocuments.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No hay documentos cargados
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedSeller.kycDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileImage className="h-4 w-4 text-slate-500" />
                          <span className="text-sm font-medium text-slate-700">
                            {getDocumentTypeLabel(doc.documentType)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">
                            {formatDate(doc.createdAt)}
                          </span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-medium",
                              doc.status === "approved"
                                ? "bg-green-100 text-green-700"
                                : doc.status === "rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                            )}
                          >
                            {doc.status === "approved"
                              ? "Aprobado"
                              : doc.status === "rejected"
                              ? "Rechazado"
                              : "Pendiente"}
                          </span>
                        </div>
                      </div>

                      {/* Document preview */}
                      {isImageUrl(doc.documentUrl) ? (
                        <div className="mt-2 overflow-hidden rounded-lg border border-slate-200">
                          <img
                            src={doc.documentUrl}
                            alt={getDocumentTypeLabel(doc.documentType)}
                            className="h-48 w-full object-contain bg-white"
                          />
                        </div>
                      ) : (
                        <a
                          href={doc.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="mt-2 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
                        >
                          <Download className="h-4 w-4" />
                          Descargar PDF
                        </a>
                      )}

                      {doc.reviewNote && (
                        <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2">
                          <p className="text-xs text-amber-700">
                            <span className="font-medium">Nota: </span>
                            {doc.reviewNote}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Review Note Textarea (for rejection) */}
            {showRejectNote && (
              <div className="mb-6">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Motivo del rechazo (opcional)
                </label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  rows={3}
                  placeholder="Describe el motivo del rechazo para que el vendedor pueda corregirlo..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* Action Buttons */}
            {selectedSeller.status === "PENDING" && (
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  onClick={closeModal}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleAction("reject")}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading && showRejectNote ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {showRejectNote ? "Confirmar rechazo" : "Rechazar"}
                </button>
                <button
                  onClick={() => handleAction("approve")}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading && !showRejectNote ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Aprobar
                </button>
              </div>
            )}

            {/* Already reviewed - show note only */}
            {selectedSeller.status !== "PENDING" && (
              <div className="flex justify-end border-t border-slate-100 pt-4">
                <button
                  onClick={closeModal}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
