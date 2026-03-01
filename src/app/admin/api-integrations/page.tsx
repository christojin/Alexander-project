"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout";
import { cn } from "@/lib/utils";
import {
  Plug,
  CheckCircle2,
  XCircle,
  Globe,
  CreditCard,
  QrCode,
  Gamepad2,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";

interface EnvVar {
  key: string;
  set: boolean;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  category: "payment" | "external";
  configured: boolean;
  envVars: EnvVar[];
  webhookUrl?: string;
}

interface IntegrationsData {
  integrations: Integration[];
  summary: {
    total: number;
    configured: number;
    unconfigured: number;
  };
}

const iconMap: Record<string, typeof Globe> = {
  stripe: CreditCard,
  qr_bolivia: QrCode,
  cryptomus: Globe,
  binance: Globe,
  vemper: Gamepad2,
};

export default function AdminApiIntegrationsPage() {
  const [data, setData] = useState<IntegrationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEnvVars, setShowEnvVars] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchIntegrations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/integrations");
      if (!res.ok) throw new Error("Error al cargar integraciones");
      const json = await res.json();
      setData(json);
    } catch {
      setError("No se pudieron cargar las integraciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout role="admin">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <XCircle className="h-10 w-10 text-red-400 mb-3" />
          <p className="text-sm text-surface-600">{error}</p>
          <button
            onClick={fetchIntegrations}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-surface-900">
              Integraciones API
            </h1>
            <p className="mt-1 text-surface-500">
              Estado de conexion de servicios externos y pasarelas de pago
            </p>
          </div>
          <button
            onClick={fetchIntegrations}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-surface-200 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 shadow-sm transition-colors hover:bg-surface-50 cursor-pointer"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Actualizar estado
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-surface-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                <Plug className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-surface-500">Total integraciones</p>
                <p className="text-2xl font-bold text-surface-900">
                  {data.summary.total}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-surface-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-surface-500">Configuradas</p>
                <p className="text-2xl font-bold text-green-600">
                  {data.summary.configured}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-surface-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-100 text-surface-600">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-surface-500">Sin configurar</p>
                <p className="text-2xl font-bold text-surface-600">
                  {data.summary.unconfigured}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Integrations */}
        <div>
          <h2 className="text-lg font-semibold text-surface-900 mb-4">
            Pasarelas de pago
          </h2>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {data.integrations
              .filter((i) => i.category === "payment")
              .map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  showEnvVars={showEnvVars[integration.id] ?? false}
                  onToggleEnvVars={() =>
                    setShowEnvVars((prev) => ({
                      ...prev,
                      [integration.id]: !prev[integration.id],
                    }))
                  }
                  copiedField={copiedField}
                  onCopy={handleCopy}
                />
              ))}
          </div>
        </div>

        {/* External API Integrations */}
        <div>
          <h2 className="text-lg font-semibold text-surface-900 mb-4">
            APIs externas
          </h2>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {data.integrations
              .filter((i) => i.category === "external")
              .map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  showEnvVars={showEnvVars[integration.id] ?? false}
                  onToggleEnvVars={() =>
                    setShowEnvVars((prev) => ({
                      ...prev,
                      [integration.id]: !prev[integration.id],
                    }))
                  }
                  copiedField={copiedField}
                  onCopy={handleCopy}
                />
              ))}
          </div>
        </div>

        {/* Info note */}
        <div className="rounded-xl border border-surface-200 bg-surface-50 p-4">
          <p className="text-xs text-surface-500 leading-relaxed">
            Las integraciones se configuran mediante variables de entorno en el
            servidor. Los servicios no configurados operan en modo sandbox
            (demo) automaticamente. Consulta el archivo{" "}
            <code className="rounded bg-surface-200 px-1 py-0.5 text-surface-700">
              .env.example
            </code>{" "}
            para ver las variables requeridas por cada integracion.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

function IntegrationCard({
  integration,
  showEnvVars,
  onToggleEnvVars,
  copiedField,
  onCopy,
}: {
  integration: Integration;
  showEnvVars: boolean;
  onToggleEnvVars: () => void;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}) {
  const Icon = iconMap[integration.id] ?? Globe;
  const allSet = integration.envVars.every((v) => v.set);
  const someSet = integration.envVars.some((v) => v.set);

  return (
    <div
      className={cn(
        "rounded-xl border bg-white shadow-sm transition-all",
        integration.configured ? "border-green-200" : "border-surface-200"
      )}
    >
      {/* Header */}
      <div className="border-b border-surface-100 p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl",
                integration.configured
                  ? "bg-green-100 text-green-600"
                  : "bg-surface-100 text-surface-400"
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-surface-900">
                {integration.name}
              </h3>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-medium",
                  integration.configured ? "text-green-600" : "text-surface-400"
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    integration.configured ? "bg-green-500" : "bg-surface-300"
                  )}
                />
                {integration.configured ? "Configurado" : "Sin configurar (modo sandbox)"}
              </span>
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm text-surface-600 leading-relaxed">
          {integration.description}
        </p>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* Environment Variables */}
        <div>
          <button
            type="button"
            onClick={onToggleEnvVars}
            className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-surface-500 hover:text-surface-700 transition-colors cursor-pointer"
          >
            {showEnvVars ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
            Variables de entorno ({integration.envVars.filter((v) => v.set).length}/{integration.envVars.length})
          </button>
          {showEnvVars && (
            <div className="mt-2 space-y-1.5">
              {integration.envVars.map((envVar) => (
                <div
                  key={envVar.key}
                  className="flex items-center gap-2 rounded-lg bg-surface-50 px-3 py-2"
                >
                  {envVar.set ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
                  )}
                  <code className="flex-1 text-xs font-mono text-surface-700">
                    {envVar.key}
                  </code>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      envVar.set ? "text-green-600" : "text-red-500"
                    )}
                  >
                    {envVar.set ? "OK" : "Falta"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Webhook URL */}
        {integration.webhookUrl && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-surface-500">
              URL de webhook
            </p>
            <div className="flex items-center gap-2 rounded-lg bg-surface-50 border border-surface-200 px-3 py-2">
              <code className="flex-1 text-xs font-mono text-surface-700 break-all">
                {integration.webhookUrl}
              </code>
              <button
                type="button"
                onClick={() =>
                  onCopy(integration.webhookUrl!, `webhook-${integration.id}`)
                }
                className="shrink-0 rounded p-1 text-surface-400 hover:bg-surface-200 hover:text-surface-600 transition-colors cursor-pointer"
              >
                {copiedField === `webhook-${integration.id}` ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer status bar */}
      <div className="border-t border-surface-100 px-5 py-3">
        <div className="flex items-center gap-2">
          {allSet ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Todas las variables configuradas
            </span>
          ) : someSet ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
              <XCircle className="h-3.5 w-3.5" />
              Configuracion incompleta
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-surface-400">
              <XCircle className="h-3.5 w-3.5" />
              No configurado — funciona en modo demo
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
