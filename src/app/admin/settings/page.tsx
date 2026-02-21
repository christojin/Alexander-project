"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout";
import { cn } from "@/lib/utils";
import {
  Settings,
  Globe,
  CreditCard,
  Shield,
  Code,
  Save,
  CheckCircle2,
  QrCode,
  Wallet,
  Bell,
  Mail,
  MessageCircle,
  ShoppingBag,
  AlertTriangle,
  UserPlus,
  TicketCheck,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [siteName, setSiteName] = useState("VirtuMall");
  const [siteDescription, setSiteDescription] = useState(
    "Marketplace de gift cards y codigos digitales en Bolivia"
  );

  const [enableQrBolivia, setEnableQrBolivia] = useState(true);
  const [enableStripe, setEnableStripe] = useState(true);
  const [enableBinancePay, setEnableBinancePay] = useState(false);
  const [enableCrypto, setEnableCrypto] = useState(false);

  const [deliveryDelay, setDeliveryDelay] = useState(30);
  const [highValueThreshold, setHighValueThreshold] = useState(500);

  const [emailNotifs, setEmailNotifs] = useState(true);
  const [whatsappNotifs, setWhatsappNotifs] = useState(false);
  const [notifNewOrder, setNotifNewOrder] = useState(true);
  const [notifHighValue, setNotifHighValue] = useState(true);
  const [notifNewSeller, setNotifNewSeller] = useState(true);
  const [notifTicketEscalated, setNotifTicketEscalated] = useState(true);
  const [notifWithdrawRequest, setNotifWithdrawRequest] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("+591 ");

  const [footerHtml, setFooterHtml] = useState(
    `<footer style="background-color: #1e293b; color: #cbd5e1; padding: 2rem; text-align: center;">\n  <p style="margin: 0 0 0.5rem 0; font-weight: 600; color: white;">VirtuMall</p>\n  <p style="margin: 0; font-size: 0.875rem;">Marketplace de gift cards y codigos digitales</p>\n  <p style="margin: 0.5rem 0 0; font-size: 0.75rem; color: #94a3b8;">2026 VirtuMall. Todos los derechos reservados.</p>\n</footer>`
  );

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load settings from API on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        if (!res.ok) return;
        const data = await res.json();
        if (data.siteName != null) setSiteName(data.siteName);
        if (data.footerHtml !== undefined && data.footerHtml !== null) setFooterHtml(data.footerHtml);
        setEnableQrBolivia(data.enableQrBolivia ?? true);
        setEnableStripe(data.enableStripe ?? true);
        setEnableBinancePay(data.enableBinancePay ?? false);
        setEnableCrypto(data.enableCrypto ?? false);
        setDeliveryDelay(data.deliveryDelayMinutes ?? 30);
        setHighValueThreshold(data.highValueThreshold ?? 500);
      } catch {
        // Keep defaults on error
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteName,
          footerHtml,
          enableQrBolivia,
          enableStripe,
          enableBinancePay,
          enableCrypto,
          deliveryDelayMinutes: deliveryDelay,
          highValueThreshold,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch {
      // Show error state could be added here
    } finally {
      setSaving(false);
    }
  };

  const paymentMethods = [
    {
      id: "qr_bolivia",
      name: "QR Bolivia",
      description:
        "Pagos mediante codigo QR compatible con bancos bolivianos",
      icon: QrCode,
      enabled: enableQrBolivia,
      toggle: setEnableQrBolivia,
      color: "bg-emerald-100 text-emerald-600",
    },
    {
      id: "stripe",
      name: "Stripe",
      description:
        "Pagos con tarjeta de credito y debito internacionales",
      icon: CreditCard,
      enabled: enableStripe,
      toggle: setEnableStripe,
      color: "bg-indigo-100 text-indigo-600",
    },
    {
      id: "binance_pay",
      name: "Binance Pay",
      description:
        "Pagos mediante cuenta Binance Pay",
      icon: Wallet,
      enabled: enableBinancePay,
      toggle: setEnableBinancePay,
      color: "bg-amber-100 text-amber-600",
    },
    {
      id: "crypto",
      name: "Criptomonedas",
      description:
        "Pagos con Bitcoin, USDT, USDC y mas",
      icon: Globe,
      enabled: enableCrypto,
      toggle: setEnableCrypto,
      color: "bg-purple-100 text-purple-600",
    },
  ];

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Configuracion de la plataforma
            </h1>
            <p className="mt-1 text-slate-500">
              Ajustes generales, pagos, seguridad y personalizacion
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all disabled:opacity-50",
              saved
                ? "bg-green-500"
                : "bg-indigo-600 hover:bg-indigo-700"
            )}
          >
            {saved ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Guardando..." : saved ? "Guardado" : "Guardar configuracion"}
          </button>
        </div>

        {/* General Settings */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">General</h2>
              <p className="text-sm text-slate-500">
                Informacion basica de la plataforma
              </p>
            </div>
          </div>
          <div className="space-y-4 max-w-2xl">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Nombre del sitio
              </label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Descripcion del sitio
              </label>
              <textarea
                value={siteDescription}
                onChange={(e) => setSiteDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Metodos de pago
              </h2>
              <p className="text-sm text-slate-500">
                Activa o desactiva metodos de pago disponibles
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {paymentMethods.map((method) => {
              const IconComp = method.icon;
              return (
                <div
                  key={method.id}
                  className={cn(
                    "rounded-xl border p-5 transition-all",
                    method.enabled
                      ? "border-green-200 bg-green-50/50"
                      : "border-slate-200 bg-slate-50/50"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg",
                          method.color
                        )}
                      >
                        <IconComp className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {method.name}
                        </h3>
                      </div>
                    </div>
                    <button
                      onClick={() => method.toggle(!method.enabled)}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        method.enabled ? "bg-green-500" : "bg-slate-300"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                          method.enabled
                            ? "translate-x-6"
                            : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    {method.description}
                  </p>
                  <div className="mt-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        method.enabled
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {method.enabled ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security Settings */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Seguridad
              </h2>
              <p className="text-sm text-slate-500">
                Configuracion de seguridad y proteccion contra fraude
              </p>
            </div>
          </div>
          <div className="space-y-6 max-w-2xl">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Retraso de entrega para compras sospechosas (minutos)
              </label>
              <p className="mb-2 text-xs text-slate-500">
                Tiempo de espera antes de entregar codigos en compras marcadas
                como sospechosas
              </p>
              <input
                type="number"
                value={deliveryDelay}
                onChange={(e) => setDeliveryDelay(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                min={0}
                max={1440}
              />
              <div className="mt-2 flex gap-2">
                {[15, 30, 60, 120].map((val) => (
                  <button
                    key={val}
                    onClick={() => setDeliveryDelay(val)}
                    className={cn(
                      "rounded-lg border px-3 py-1 text-xs font-medium transition-all",
                      deliveryDelay === val
                        ? "border-amber-500 bg-amber-50 text-amber-700"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    )}
                  >
                    {val} min
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Umbral de alto valor ($)
              </label>
              <p className="mb-2 text-xs text-slate-500">
                Compras por encima de este monto requieren revision manual
              </p>
              <input
                type="number"
                value={highValueThreshold}
                onChange={(e) =>
                  setHighValueThreshold(Number(e.target.value))
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                min={0}
                step={50}
              />
              <div className="mt-2 flex gap-2">
                {[100, 250, 500, 1000].map((val) => (
                  <button
                    key={val}
                    onClick={() => setHighValueThreshold(val)}
                    className={cn(
                      "rounded-lg border px-3 py-1 text-xs font-medium transition-all",
                      highValueThreshold === val
                        ? "border-amber-500 bg-amber-50 text-amber-700"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    )}
                  >
                    ${val}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Notificaciones
              </h2>
              <p className="text-sm text-slate-500">
                Configura canales y eventos de notificacion automatica
              </p>
            </div>
          </div>

          {/* Channels */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Canales de notificacion</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className={cn(
                "rounded-xl border p-5 transition-all",
                emailNotifs ? "border-violet-200 bg-violet-50/50" : "border-slate-200 bg-slate-50/50"
              )}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">Email</h4>
                      <p className="text-sm text-slate-500">Notificaciones por correo electronico</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEmailNotifs(!emailNotifs)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      emailNotifs ? "bg-violet-500" : "bg-slate-300"
                    )}
                  >
                    <span className={cn(
                      "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                      emailNotifs ? "translate-x-6" : "translate-x-1"
                    )} />
                  </button>
                </div>
              </div>

              <div className={cn(
                "rounded-xl border p-5 transition-all",
                whatsappNotifs ? "border-green-200 bg-green-50/50" : "border-slate-200 bg-slate-50/50"
              )}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                      <MessageCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">WhatsApp</h4>
                      <p className="text-sm text-slate-500">Alertas via WhatsApp Business</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setWhatsappNotifs(!whatsappNotifs)}
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                      whatsappNotifs ? "bg-green-500" : "bg-slate-300"
                    )}
                  >
                    <span className={cn(
                      "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                      whatsappNotifs ? "translate-x-6" : "translate-x-1"
                    )} />
                  </button>
                </div>
                {whatsappNotifs && (
                  <div className="mt-4">
                    <label className="mb-1 block text-xs font-medium text-slate-600">Numero de WhatsApp</label>
                    <input
                      type="text"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="+591 7XXXXXXX"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Events */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Eventos que generan notificacion</h3>
            <div className="space-y-3">
              {[
                { label: "Nueva compra realizada", desc: "Notificar al vendedor y admin cuando se realiza una compra", icon: ShoppingBag, color: "text-indigo-500", enabled: notifNewOrder, toggle: setNotifNewOrder },
                { label: "Compra de alto valor", desc: "Alerta cuando una compra supera el umbral configurado", icon: AlertTriangle, color: "text-amber-500", enabled: notifHighValue, toggle: setNotifHighValue },
                { label: "Nuevo vendedor registrado", desc: "Notificar al admin cuando un vendedor se registra", icon: UserPlus, color: "text-blue-500", enabled: notifNewSeller, toggle: setNotifNewSeller },
                { label: "Ticket de soporte escalado", desc: "Alerta cuando un ticket es marcado como urgente", icon: TicketCheck, color: "text-red-500", enabled: notifTicketEscalated, toggle: setNotifTicketEscalated },
                { label: "Solicitud de retiro", desc: "Notificar cuando un vendedor solicita un retiro de fondos", icon: Wallet, color: "text-emerald-500", enabled: notifWithdrawRequest, toggle: setNotifWithdrawRequest },
              ].map((event) => {
                const Icon = event.icon;
                return (
                  <div key={event.label} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Icon className={cn("h-4.5 w-4.5", event.color)} />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{event.label}</p>
                        <p className="text-xs text-slate-500">{event.desc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => event.toggle(!event.enabled)}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        event.enabled ? "bg-violet-500" : "bg-slate-300"
                      )}
                    >
                      <span className={cn(
                        "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                        event.enabled ? "translate-x-6" : "translate-x-1"
                      )} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer HTML Editor */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
              <Code className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Footer HTML
              </h2>
              <p className="text-sm text-slate-500">
                Personaliza el pie de pagina con HTML
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Codigo HTML
              </label>
              <textarea
                value={footerHtml}
                onChange={(e) => setFooterHtml(e.target.value)}
                rows={8}
                className="w-full rounded-lg border border-slate-200 bg-slate-900 px-4 py-3 font-mono text-sm text-green-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                spellCheck={false}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Vista previa
              </label>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <div dangerouslySetInnerHTML={{ __html: footerHtml }} />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Save Button */}
        <div className="flex justify-end pb-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium text-white shadow-sm transition-all disabled:opacity-50",
              saved
                ? "bg-green-500"
                : "bg-indigo-600 hover:bg-indigo-700"
            )}
          >
            {saved ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Guardando..." : saved ? "Configuracion guardada" : "Guardar toda la configuracion"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
