"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Camera,
  Save,
  Loader2,
  Store,
  Clock,
  Globe,
  MapPin,
  CheckCircle2,
  Gift,
  Tv,
  Gamepad2,
  Monitor,
  LayoutGrid,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { cn } from "@/lib/utils";

// ============================================
// TYPES
// ============================================

interface BusinessHour {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

interface Region {
  id: string;
  name: string;
  flagEmoji: string;
}

interface SellerProfile {
  id: string;
  storeName: string;
  slug: string;
  storePhoto: string | null;
  storeDescription: string;
  marketType: string;
  status: string;
  isVerified: boolean;
  user: {
    name: string;
    email: string;
    avatar: string | null;
  };
  country: {
    id: string;
    name: string;
    code: string;
    flagEmoji: string;
  } | null;
  businessHours: BusinessHour[];
}

// ============================================
// CONSTANTS
// ============================================

const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
];

const MARKET_TYPES = [
  {
    value: "GIFT_CARDS",
    label: "Gift Cards",
    description: "Tarjetas de regalo digitales",
    icon: Gift,
  },
  {
    value: "STREAMING",
    label: "Streaming",
    description: "Cuentas y suscripciones",
    icon: Tv,
  },
  {
    value: "GAMING",
    label: "Gaming",
    description: "Codigos y top-ups",
    icon: Gamepad2,
  },
  {
    value: "SOFTWARE",
    label: "Software",
    description: "Licencias y claves",
    icon: Monitor,
  },
  {
    value: "MIXED",
    label: "Mixto",
    description: "Varios tipos de productos",
    icon: LayoutGrid,
  },
];

const DEFAULT_HOURS: BusinessHour[] = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i,
  openTime: "09:00",
  closeTime: "18:00",
  isClosed: i === 0,
}));

// ============================================
// HELPERS
// ============================================

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ============================================
// COMPONENT
// ============================================

export default function SellerProfilePage() {
  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [storeName, setStoreName] = useState("");
  const [slug, setSlug] = useState("");
  const [storePhoto, setStorePhoto] = useState<string | null>(null);
  const [storeDescription, setStoreDescription] = useState("");
  const [countryId, setCountryId] = useState("");
  const [marketType, setMarketType] = useState("MIXED");
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>(DEFAULT_HOURS);
  const [sellerName, setSellerName] = useState("");

  // Catalog data
  const [regions, setRegions] = useState<Region[]>([]);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================
  // FETCH DATA ON MOUNT
  // ============================================

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/seller/profile");
      if (!res.ok) throw new Error("Error al cargar perfil");
      const data = await res.json();
      const seller: SellerProfile = data.seller;

      setStoreName(seller.storeName);
      setSlug(seller.slug);
      setStorePhoto(seller.storePhoto);
      setStoreDescription(seller.storeDescription);
      setMarketType(seller.marketType);
      setSellerName(seller.user.name || seller.storeName);

      if (seller.country) {
        setCountryId(seller.country.id);
      }

      if (seller.businessHours && seller.businessHours.length > 0) {
        const sorted = [...seller.businessHours].sort(
          (a, b) => a.dayOfWeek - b.dayOfWeek
        );
        setBusinessHours(sorted);
      }
    } catch {
      // Keep defaults on error
    }
  }, []);

  const fetchRegions = useCallback(async () => {
    try {
      const res = await fetch("/api/catalog");
      if (!res.ok) throw new Error("Error al cargar catalogo");
      const data = await res.json();
      setRegions(data.regions || []);
    } catch {
      // Keep empty regions on error
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchProfile(), fetchRegions()]).finally(() =>
      setLoading(false)
    );
  }, [fetchProfile, fetchRegions]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleStoreNameChange = (value: string) => {
    setStoreName(value);
    setSlug(generateSlug(value));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) return;

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "avatars");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Error al subir foto");

      const data = await res.json();
      setStorePhoto(data.url);
    } catch {
      // Silently fail — user can retry
    } finally {
      setUploadingPhoto(false);
      // Reset file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleHourChange = (
    dayOfWeek: number,
    field: "openTime" | "closeTime" | "isClosed",
    value: string | boolean
  ) => {
    setBusinessHours((prev) =>
      prev.map((h) =>
        h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccessMessage(null);

    try {
      const [profileRes, hoursRes] = await Promise.all([
        fetch("/api/seller/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storeName,
            storeDescription,
            storePhoto,
            countryId: countryId || undefined,
            marketType,
          }),
        }),
        fetch("/api/seller/profile/business-hours", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hours: businessHours.map((h) => ({
              dayOfWeek: h.dayOfWeek,
              openTime: h.openTime,
              closeTime: h.closeTime,
              isClosed: h.isClosed,
            })),
          }),
        }),
      ]);

      if (!profileRes.ok || !hoursRes.ok) {
        throw new Error("Error al guardar cambios");
      }

      // Update slug from server response
      const profileData = await profileRes.json();
      if (profileData.seller?.slug) {
        setSlug(profileData.seller.slug);
      }

      setSuccessMessage("Cambios guardados exitosamente");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setSuccessMessage(null);
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // LOADING STATE
  // ============================================

  if (loading) {
    return (
      <DashboardLayout role="seller">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-100">
            <Loader2 className="h-8 w-8 animate-spin text-surface-400" />
          </div>
          <p className="mt-4 text-sm text-surface-500">
            Cargando perfil de tienda...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <DashboardLayout role="seller">
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Mi Tienda
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestiona la informacion de tu tienda
          </p>
        </div>

        {/* Profile Photo Section */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">
            Foto de la tienda
          </h2>
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="relative h-[120px] w-[120px] overflow-hidden rounded-full border-4 border-slate-100">
                {storePhoto ? (
                  <Image
                    src={storePhoto}
                    alt={storeName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary-100 text-primary-600">
                    <span className="text-3xl font-bold">
                      {getInitials(sellerName || storeName || "T")}
                    </span>
                  </div>
                )}

                {/* Upload overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-surface-900/0 transition-all group-hover:bg-surface-900/50 cursor-pointer"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                    {uploadingPhoto ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
                    ) : (
                      <Camera className="h-5 w-5 text-slate-700" />
                    )}
                  </div>
                </button>
              </div>

              {uploadingPhoto && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/60">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700">
                Cambiar foto de perfil
              </p>
              <p className="mt-1 text-xs text-slate-500">
                JPG, PNG o WebP. Maximo 5MB.
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Store Information Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Informacion de la tienda
              </h2>
              <p className="text-sm text-slate-500">
                Datos publicos visibles para los compradores
              </p>
            </div>
          </div>

          <div className="space-y-5 max-w-2xl">
            {/* Store Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Nombre de la tienda
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => handleStoreNameChange(e.target.value)}
                placeholder="Mi Tienda Digital"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
              {slug && (
                <p className="mt-1.5 text-xs text-slate-500">
                  Tu tienda se vera como:{" "}
                  <span className="font-medium text-primary-600">
                    /store/{slug}
                  </span>
                </p>
              )}
            </div>

            {/* Store Description */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Descripcion de la tienda
              </label>
              <textarea
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
                placeholder="Describe brevemente que productos vendes y por que los compradores deberian elegir tu tienda..."
                rows={4}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm resize-none focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
              <div className="mt-1 flex justify-between">
                <p
                  className={cn(
                    "text-xs",
                    storeDescription.length > 0 &&
                      storeDescription.length < 20
                      ? "text-red-500"
                      : "text-slate-400"
                  )}
                >
                  {storeDescription.length > 0 &&
                    storeDescription.length < 20 &&
                    "Minimo 20 caracteres"}
                </p>
                <p className="text-xs text-slate-400">
                  {storeDescription.length}/500
                </p>
              </div>
            </div>

            {/* Country Select */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Pais
              </label>
              <div className="relative">
                <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={countryId}
                  onChange={(e) => setCountryId(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="">Seleccionar pais</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.flagEmoji} {region.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Market Type */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Tipo de mercado
              </label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {MARKET_TYPES.map((type) => {
                  const TypeIcon = type.icon;
                  const isSelected = marketType === type.value;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setMarketType(type.value)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all cursor-pointer",
                        isSelected
                          ? "border-primary-500 bg-primary-50 ring-2 ring-primary-500/20"
                          : "border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <TypeIcon
                        className={cn(
                          "h-6 w-6",
                          isSelected
                            ? "text-primary-600"
                            : "text-slate-400"
                        )}
                      />
                      <div>
                        <p
                          className={cn(
                            "text-sm font-medium",
                            isSelected
                              ? "text-primary-700"
                              : "text-slate-800"
                          )}
                        >
                          {type.label}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {type.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Business Hours Section */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Horario de atencion
              </h2>
              <p className="text-sm text-slate-500">
                Define en que horarios esta disponible tu tienda
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {businessHours.map((hour) => (
              <div
                key={hour.dayOfWeek}
                className={cn(
                  "flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center",
                  hour.isClosed
                    ? "border-slate-100 bg-slate-50/50"
                    : "border-slate-200"
                )}
              >
                {/* Day label */}
                <div className="flex w-28 shrink-0 items-center gap-2">
                  <MapPin
                    className={cn(
                      "h-4 w-4",
                      hour.isClosed ? "text-slate-300" : "text-slate-400"
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm font-medium",
                      hour.isClosed ? "text-slate-400" : "text-slate-700"
                    )}
                  >
                    {DAY_NAMES[hour.dayOfWeek]}
                  </span>
                </div>

                {/* Time inputs */}
                <div className="flex flex-1 items-center gap-2">
                  <input
                    type="time"
                    value={hour.openTime}
                    onChange={(e) =>
                      handleHourChange(
                        hour.dayOfWeek,
                        "openTime",
                        e.target.value
                      )
                    }
                    disabled={hour.isClosed}
                    className={cn(
                      "w-full rounded-lg border px-3 py-2 text-sm sm:w-32 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20",
                      hour.isClosed
                        ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                        : "border-slate-300 bg-white text-slate-700"
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm shrink-0",
                      hour.isClosed ? "text-slate-300" : "text-slate-400"
                    )}
                  >
                    -
                  </span>
                  <input
                    type="time"
                    value={hour.closeTime}
                    onChange={(e) =>
                      handleHourChange(
                        hour.dayOfWeek,
                        "closeTime",
                        e.target.value
                      )
                    }
                    disabled={hour.isClosed}
                    className={cn(
                      "w-full rounded-lg border px-3 py-2 text-sm sm:w-32 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20",
                      hour.isClosed
                        ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                        : "border-slate-300 bg-white text-slate-700"
                    )}
                  />
                </div>

                {/* Cerrado toggle */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      handleHourChange(
                        hour.dayOfWeek,
                        "isClosed",
                        !hour.isClosed
                      )
                    }
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer",
                      hour.isClosed ? "bg-red-400" : "bg-slate-300"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                        hour.isClosed ? "translate-x-6" : "translate-x-1"
                      )}
                    />
                  </button>
                  <span
                    className={cn(
                      "text-xs font-medium",
                      hour.isClosed ? "text-red-500" : "text-slate-400"
                    )}
                  >
                    Cerrado
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Success message */}
        {successMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            <p className="text-sm font-medium text-green-700">
              {successMessage}
            </p>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end pb-8">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2.5 font-medium text-white shadow-sm transition-all hover:bg-primary-700 cursor-pointer",
              "disabled:opacity-50 disabled:pointer-events-none"
            )}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar cambios
              </>
            )}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
