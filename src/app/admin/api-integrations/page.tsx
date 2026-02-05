"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout";
import { cn, generateId } from "@/lib/utils";
import {
  Plug,
  Plus,
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Zap,
  Globe,
  RefreshCw,
  Trash2,
  Loader2,
} from "lucide-react";

interface ApiProvider {
  id: string;
  name: string;
  description: string;
  supportedProducts: string;
  status: "connected" | "disconnected";
  apiKey: string;
  apiUrl: string;
}

const initialProviders: ApiProvider[] = [
  {
    id: "api-1",
    name: "GiftCardAPI Global",
    description:
      "Proveedor global de gift cards digitales con soporte para mas de 500 marcas en 50+ paises. Entrega instantanea mediante API REST.",
    supportedProducts: "Netflix, Spotify, Amazon, Google Play, iTunes",
    status: "connected",
    apiKey: "gca_sk_live_4x8Km2pN9rW3vB7hQ",
    apiUrl: "https://api.giftcardapi.com/v2",
  },
  {
    id: "api-2",
    name: "DigitalRiver",
    description:
      "Plataforma de comercio digital con inventario de codigos para gaming y entretenimiento. API robusta con webhooks.",
    supportedProducts: "Steam, PlayStation, Xbox, Nintendo, Roblox",
    status: "connected",
    apiKey: "dr_prod_7yT2kM9pLx4wR6nB",
    apiUrl: "https://api.digitalriver.com/v1",
  },
  {
    id: "api-3",
    name: "Reloadly",
    description:
      "API para recargas moviles y gift cards digitales. Especializado en mercados emergentes y Latinoamerica.",
    supportedProducts: "Free Fire, PUBG Mobile, Recargas moviles, Tigo Money",
    status: "disconnected",
    apiKey: "",
    apiUrl: "https://giftcards-sandbox.reloadly.com",
  },
];

export default function AdminApiIntegrationsPage() {
  const [providers, setProviders] = useState<ApiProvider[]>(initialProviders);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [testingConnection, setTestingConnection] = useState<string | null>(
    null
  );
  const [testResult, setTestResult] = useState<Record<string, "success" | "error" | null>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [newProvider, setNewProvider] = useState({
    name: "",
    description: "",
    apiUrl: "",
    apiKey: "",
    supportedProducts: "",
  });

  const toggleConnection = (providerId: string) => {
    setProviders((prev) =>
      prev.map((p) =>
        p.id === providerId
          ? {
              ...p,
              status:
                p.status === "connected" ? "disconnected" : "connected",
            }
          : p
      )
    );
    setTestResult((prev) => ({ ...prev, [providerId]: null }));
  };

  const handleTestConnection = (providerId: string) => {
    setTestingConnection(providerId);
    setTestResult((prev) => ({ ...prev, [providerId]: null }));
    setTimeout(() => {
      const provider = providers.find((p) => p.id === providerId);
      const success = provider?.apiKey && provider.apiKey.length > 5;
      setTestResult((prev) => ({
        ...prev,
        [providerId]: success ? "success" : "error",
      }));
      setTestingConnection(null);
    }, 1500);
  };

  const handleAddProvider = () => {
    const provider: ApiProvider = {
      id: `api-${generateId()}`,
      name: newProvider.name,
      description: newProvider.description,
      supportedProducts: newProvider.supportedProducts,
      status: "disconnected",
      apiKey: newProvider.apiKey,
      apiUrl: newProvider.apiUrl,
    };
    setProviders((prev) => [...prev, provider]);
    setShowAddModal(false);
    setNewProvider({
      name: "",
      description: "",
      apiUrl: "",
      apiKey: "",
      supportedProducts: "",
    });
  };

  const handleUpdateApiKey = (providerId: string, key: string) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === providerId ? { ...p, apiKey: key } : p))
    );
  };

  const handleDeleteProvider = (providerId: string) => {
    setProviders((prev) => prev.filter((p) => p.id !== providerId));
    setDeleteConfirm(null);
  };

  const toggleShowApiKey = (providerId: string) => {
    setShowApiKey((prev) => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const maskApiKey = (key: string) => {
    if (!key) return "";
    if (key.length <= 8) return "*".repeat(key.length);
    return key.slice(0, 4) + "*".repeat(key.length - 8) + key.slice(-4);
  };

  const connectedCount = providers.filter(
    (p) => p.status === "connected"
  ).length;

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Integraciones API
            </h1>
            <p className="mt-1 text-slate-500">
              Gestiona proveedores de gift cards y codigos digitales
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Nueva integracion
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <Plug className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total integraciones</p>
                <p className="text-2xl font-bold text-slate-900">
                  {providers.length}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Conectadas</p>
                <p className="text-2xl font-bold text-green-600">
                  {connectedCount}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Desconectadas</p>
                <p className="text-2xl font-bold text-slate-600">
                  {providers.length - connectedCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Provider Cards */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className={cn(
                "rounded-xl border bg-white shadow-sm transition-all hover:shadow-md",
                provider.status === "connected"
                  ? "border-green-200"
                  : "border-slate-200"
              )}
            >
              {/* Card Header */}
              <div className="border-b border-slate-100 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl",
                        provider.status === "connected"
                          ? "bg-green-100 text-green-600"
                          : "bg-slate-100 text-slate-400"
                      )}
                    >
                      <Globe className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {provider.name}
                      </h3>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-xs font-medium",
                          provider.status === "connected"
                            ? "text-green-600"
                            : "text-slate-400"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            provider.status === "connected"
                              ? "bg-green-500"
                              : "bg-slate-300"
                          )}
                        />
                        {provider.status === "connected"
                          ? "Conectado"
                          : "Desconectado"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleConnection(provider.id)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      provider.status === "connected"
                        ? "bg-green-500"
                        : "bg-slate-300"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                        provider.status === "connected"
                          ? "translate-x-6"
                          : "translate-x-1"
                      )}
                    />
                  </button>
                </div>
                <p className="mt-3 text-sm text-slate-600 line-clamp-2">
                  {provider.description}
                </p>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">
                    Productos soportados
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {provider.supportedProducts
                      .split(",")
                      .map((product, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                        >
                          {product.trim()}
                        </span>
                      ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">
                    API Key
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type={showApiKey[provider.id] ? "text" : "password"}
                      value={
                        showApiKey[provider.id]
                          ? provider.apiKey
                          : maskApiKey(provider.apiKey)
                      }
                      onChange={(e) =>
                        handleUpdateApiKey(provider.id, e.target.value)
                      }
                      className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="Ingresa tu API key"
                    />
                    <button
                      onClick={() => toggleShowApiKey(provider.id)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                      {showApiKey[provider.id] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-slate-500">
                    API URL
                  </label>
                  <p className="font-mono text-xs text-slate-500">
                    {provider.apiUrl}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestConnection(provider.id)}
                    disabled={testingConnection === provider.id}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                      testResult[provider.id] === "success"
                        ? "bg-green-100 text-green-700"
                        : testResult[provider.id] === "error"
                        ? "bg-red-100 text-red-700"
                        : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                    )}
                  >
                    {testingConnection === provider.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : testResult[provider.id] === "success" ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : testResult[provider.id] === "error" ? (
                      <XCircle className="h-3 w-3" />
                    ) : (
                      <Zap className="h-3 w-3" />
                    )}
                    {testingConnection === provider.id
                      ? "Probando..."
                      : testResult[provider.id] === "success"
                      ? "Conexion exitosa"
                      : testResult[provider.id] === "error"
                      ? "Error de conexion"
                      : "Probar conexion"}
                  </button>
                </div>
                <button
                  onClick={() => setDeleteConfirm(provider.id)}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Integration Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Nueva integracion
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Nombre del proveedor
                </label>
                <input
                  type="text"
                  value={newProvider.name}
                  onChange={(e) =>
                    setNewProvider((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Nombre del proveedor"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Descripcion
                </label>
                <textarea
                  value={newProvider.description}
                  onChange={(e) =>
                    setNewProvider((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Descripcion del servicio"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  API URL
                </label>
                <input
                  type="url"
                  value={newProvider.apiUrl}
                  onChange={(e) =>
                    setNewProvider((prev) => ({
                      ...prev,
                      apiUrl: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="https://api.ejemplo.com/v1"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  API Key
                </label>
                <input
                  type="text"
                  value={newProvider.apiKey}
                  onChange={(e) =>
                    setNewProvider((prev) => ({
                      ...prev,
                      apiKey: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 font-mono text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="sk_live_..."
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Productos soportados
                </label>
                <input
                  type="text"
                  value={newProvider.supportedProducts}
                  onChange={(e) =>
                    setNewProvider((prev) => ({
                      ...prev,
                      supportedProducts: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Netflix, Spotify, Amazon (separados por coma)"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddProvider}
                disabled={!newProvider.name || !newProvider.apiUrl}
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Agregar integracion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              Eliminar integracion
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Esta seguro de que desea eliminar esta integracion? Los productos
              asociados dejaran de funcionar con este proveedor.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteProvider(deleteConfirm)}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
