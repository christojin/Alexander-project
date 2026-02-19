"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  User,
  Store,
  FileCheck,
  Upload,
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Camera,
  Building2,
  Globe,
  MapPin,
  Phone,
  FileText,
  Shield,
  BadgeCheck,
  Loader2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { Sidebar } from "@/components/layout";
import { cn } from "@/lib/utils";

// ============================================
// TYPES
// ============================================

interface PersonalInfo {
  fullName: string;
  phone: string;
  country: string;
  city: string;
  address: string;
}

interface BusinessInfo {
  storeName: string;
  storeDescription: string;
  marketType: string;
  website: string;
}

interface UploadedFile {
  name: string;
  size: number;
  preview: string;
  type: string;
  url?: string;
}

type KYCStep = 1 | 2 | 3;
type KYCStatus = "loading" | "form" | "pending" | "approved" | "rejected";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface ExistingSellerData {
  status: string;
  storeName?: string;
  storeDescription?: string;
  marketType?: string;
  website?: string;
  kycDocuments?: any[];
  rejectionReason?: string;
  [key: string]: any;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const MARKET_TYPES = [
  { value: "GIFT_CARDS", label: "Gift Cards", description: "Tarjetas de regalo digitales" },
  { value: "STREAMING", label: "Streaming", description: "Cuentas y perfiles de streaming" },
  { value: "GAMING", label: "Gaming", description: "Codigos de juegos, top-ups" },
  { value: "SOFTWARE", label: "Software", description: "Licencias y claves de software" },
  { value: "MIXED", label: "Mixto", description: "Varios tipos de productos" },
];

const COUNTRIES = [
  "Bolivia", "Argentina", "Brasil", "Chile", "Colombia", "Ecuador",
  "Mexico", "Paraguay", "Peru", "Uruguay", "Venezuela", "Otro",
];

// ============================================
// COMPONENT
// ============================================

export default function SellerKYCPage() {
  const [kycStatus, setKycStatus] = useState<KYCStatus>("loading");
  const [existingData, setExistingData] = useState<ExistingSellerData | null>(null);

  const [currentStep, setCurrentStep] = useState<KYCStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // File upload loading states
  const [uploadingIdentity, setUploadingIdentity] = useState(false);
  const [uploadingSelfie, setUploadingSelfie] = useState(false);
  const [uploadingBusiness, setUploadingBusiness] = useState(false);

  // Form state
  const [personal, setPersonal] = useState<PersonalInfo>({
    fullName: "",
    phone: "",
    country: "Bolivia",
    city: "",
    address: "",
  });

  const [business, setBusiness] = useState<BusinessInfo>({
    storeName: "",
    storeDescription: "",
    marketType: "MIXED",
    website: "",
  });

  const [identityDoc, setIdentityDoc] = useState<UploadedFile | null>(null);
  const [selfieDoc, setSelfieDoc] = useState<UploadedFile | null>(null);
  const [businessDoc, setBusinessDoc] = useState<UploadedFile | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const identityRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);
  const businessRef = useRef<HTMLInputElement>(null);

  // ============================================
  // FETCH KYC STATUS ON MOUNT
  // ============================================

  useEffect(() => {
    fetch("/api/seller/kyc")
      .then((res) => res.json())
      .then((data) => {
        if (data.seller) {
          const docs = data.seller.kycDocuments || [];
          if (data.seller.status === "APPROVED") setKycStatus("approved");
          else if (data.seller.status === "REJECTED") setKycStatus("rejected");
          else if (docs.length > 0) setKycStatus("pending");
          else setKycStatus("form");
          setExistingData(data.seller);
        } else {
          setKycStatus("form");
        }
      })
      .catch(() => setKycStatus("form"));
  }, []);

  // ============================================
  // HANDLERS
  // ============================================

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (file: UploadedFile | null) => void,
    setUploading: (v: boolean) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setErrors((prev) => ({ ...prev, file: "El archivo no debe superar 5MB" }));
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({ ...prev, file: "Solo se permiten JPG, PNG, WebP o PDF" }));
      return;
    }

    setErrors((prev) => {
      const next = { ...prev };
      delete next.file;
      return next;
    });

    const preview = file.type.startsWith("image/")
      ? URL.createObjectURL(file)
      : "";

    // Upload the file to /api/upload
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "kyc");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Error al subir el archivo");
      }

      const data = await res.json();

      setter({
        name: file.name,
        size: file.size,
        preview,
        type: file.type,
        url: data.url,
      });
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        file: err instanceof Error ? err.message : "Error al subir el archivo",
      }));
    } finally {
      setUploading(false);
    }
  };

  const validateStep = (step: KYCStep): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!personal.fullName.trim()) newErrors.fullName = "Nombre completo es requerido";
      if (!personal.phone.trim()) newErrors.phone = "Telefono es requerido";
      if (!personal.city.trim()) newErrors.city = "Ciudad es requerida";
    }

    if (step === 2) {
      if (!business.storeName.trim()) newErrors.storeName = "Nombre de tienda es requerido";
      if (!business.storeDescription.trim()) newErrors.storeDescription = "Descripcion es requerida";
      if (business.storeDescription.trim().length < 20)
        newErrors.storeDescription = "Minimo 20 caracteres";
    }

    if (step === 3) {
      if (!identityDoc) newErrors.identityDoc = "Documento de identidad es requerido";
      if (!selfieDoc) newErrors.selfieDoc = "Selfie con documento es requerida";
      if (identityDoc && !identityDoc.url) newErrors.identityDoc = "El documento aun se esta subiendo";
      if (selfieDoc && !selfieDoc.url) newErrors.selfieDoc = "La selfie aun se esta subiendo";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(3, prev + 1) as KYCStep);
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1) as KYCStep);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/seller/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personalInfo: {
            fullName: personal.fullName,
            phone: personal.phone,
            country: personal.country,
            city: personal.city,
            address: personal.address,
          },
          businessInfo: {
            storeName: business.storeName,
            storeDescription: business.storeDescription,
            marketType: business.marketType,
            website: business.website,
          },
          documents: {
            identityUrl: identityDoc?.url,
            selfieUrl: selfieDoc?.url,
            businessUrl: businessDoc?.url || undefined,
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || "Error al enviar la verificacion");
      }

      setIsSubmitted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Error al enviar la verificacion"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // LOADING STATE
  // ============================================

  if (kycStatus === "loading") {
    return (
      <div className="flex min-h-screen bg-surface-50">
        <Sidebar role="seller" />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-lg mx-auto mt-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-100 mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-surface-400 animate-spin" />
            </div>
            <p className="text-surface-500 text-sm">Cargando estado de verificacion...</p>
          </div>
        </main>
      </div>
    );
  }

  // ============================================
  // APPROVED STATE
  // ============================================

  if (kycStatus === "approved") {
    return (
      <div className="flex min-h-screen bg-surface-50">
        <Sidebar role="seller" />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-lg mx-auto mt-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-600 mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-surface-900 mb-3">
              Cuenta verificada
            </h1>
            <p className="text-surface-600 mb-8">
              Tu identidad ha sido verificada exitosamente. Ya puedes vender en VirtuMall.
            </p>

            <div className="bg-white border border-green-200 rounded-xl p-5 mb-8 text-left">
              <div className="flex items-center gap-3 mb-4">
                <BadgeCheck className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-surface-900">Estado: Verificado</span>
              </div>
              {existingData && (
                <div className="space-y-2 text-sm text-surface-600">
                  {existingData.storeName && (
                    <div className="flex justify-between">
                      <span>Tienda:</span>
                      <span className="font-medium text-surface-900">{existingData.storeName}</span>
                    </div>
                  )}
                  {existingData.marketType && (
                    <div className="flex justify-between">
                      <span>Tipo:</span>
                      <span className="font-medium text-surface-900">
                        {MARKET_TYPES.find((m) => m.value === existingData.marketType)?.label || existingData.marketType}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Link
              href="/seller/dashboard"
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-3 rounded-xl transition-colors"
            >
              Ir al dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // ============================================
  // PENDING STATE
  // ============================================

  if (kycStatus === "pending") {
    return (
      <div className="flex min-h-screen bg-surface-50">
        <Sidebar role="seller" />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-lg mx-auto mt-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-600 mx-auto mb-6">
              <Clock className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-surface-900 mb-3">
              Verificacion en revision
            </h1>
            <p className="text-surface-600 mb-2">
              Tu solicitud de verificacion KYC esta siendo revisada por nuestro equipo.
            </p>
            <p className="text-sm text-surface-500 mb-8">
              Este proceso puede tomar entre 24-48 horas. Te notificaremos por correo
              electronico cuando tu cuenta sea aprobada.
            </p>

            <div className="bg-white border border-amber-200 rounded-xl p-5 mb-8 text-left">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-medium text-surface-900">Estado: En revision</span>
              </div>
              {existingData && (
                <div className="space-y-2 text-sm text-surface-600">
                  {existingData.storeName && (
                    <div className="flex justify-between">
                      <span>Tienda:</span>
                      <span className="font-medium text-surface-900">{existingData.storeName}</span>
                    </div>
                  )}
                  {existingData.marketType && (
                    <div className="flex justify-between">
                      <span>Tipo:</span>
                      <span className="font-medium text-surface-900">
                        {MARKET_TYPES.find((m) => m.value === existingData.marketType)?.label || existingData.marketType}
                      </span>
                    </div>
                  )}
                  {existingData.kycDocuments && (
                    <div className="flex justify-between">
                      <span>Documentos:</span>
                      <span className="font-medium text-surface-900">
                        {existingData.kycDocuments.length} enviados
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Link
              href="/seller/dashboard"
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-3 rounded-xl transition-colors"
            >
              Ir al dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // ============================================
  // REJECTED STATE
  // ============================================

  if (kycStatus === "rejected") {
    return (
      <div className="flex min-h-screen bg-surface-50">
        <Sidebar role="seller" />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-lg mx-auto mt-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-600 mx-auto mb-6">
              <XCircle className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-surface-900 mb-3">
              Verificacion rechazada
            </h1>
            <p className="text-surface-600 mb-2">
              Tu solicitud de verificacion KYC ha sido rechazada.
            </p>
            {existingData?.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-left">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800 mb-1">Motivo del rechazo:</p>
                    <p className="text-sm text-red-700">{existingData.rejectionReason}</p>
                  </div>
                </div>
              </div>
            )}
            <p className="text-sm text-surface-500 mb-8">
              Puedes corregir los problemas y volver a enviar tu solicitud de verificacion.
            </p>

            <button
              onClick={() => setKycStatus("form")}
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-3 rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Volver a enviar documentos
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ============================================
  // SUCCESS STATE (after form submission)
  // ============================================

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen bg-surface-50">
        <Sidebar role="seller" />
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-lg mx-auto mt-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent-100 text-accent-600 mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-surface-900 mb-3">
              Verificacion enviada
            </h1>
            <p className="text-surface-600 mb-2">
              Tu solicitud de verificacion KYC ha sido enviada exitosamente.
            </p>
            <p className="text-sm text-surface-500 mb-8">
              Nuestro equipo revisara tus documentos en un plazo de 24-48 horas.
              Te notificaremos por correo electronico cuando tu cuenta sea aprobada.
            </p>

            <div className="bg-white border border-surface-200 rounded-xl p-5 mb-8 text-left">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-medium text-surface-900">Estado: En revision</span>
              </div>
              <div className="space-y-2 text-sm text-surface-600">
                <div className="flex justify-between">
                  <span>Tienda:</span>
                  <span className="font-medium text-surface-900">{business.storeName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tipo:</span>
                  <span className="font-medium text-surface-900">
                    {MARKET_TYPES.find((m) => m.value === business.marketType)?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Documentos:</span>
                  <span className="font-medium text-surface-900">
                    {[identityDoc, selfieDoc, businessDoc].filter(Boolean).length} enviados
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/seller/dashboard"
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-3 rounded-xl transition-colors"
            >
              Ir al dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // ============================================
  // STEPS CONFIG
  // ============================================

  const steps = [
    { number: 1, label: "Informacion personal", icon: User },
    { number: 2, label: "Informacion del negocio", icon: Store },
    { number: 3, label: "Documentos", icon: FileCheck },
  ];

  // ============================================
  // RENDER (form state)
  // ============================================

  return (
    <div className="flex min-h-screen bg-surface-50">
      <Sidebar role="seller" />

      <main className="flex-1 p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/seller/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-primary-600 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
              <BadgeCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-surface-900">
                Verificacion KYC
              </h1>
              <p className="text-sm text-surface-500">
                Completa tu verificacion para empezar a vender en VirtuMall
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl">
          {/* Step Progress */}
          <div className="flex items-center gap-2 mb-8">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              return (
                <div key={step.number} className="flex items-center gap-2 flex-1">
                  <div
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg transition-all flex-1",
                      isActive && "bg-primary-50 border border-primary-200",
                      isCompleted && "bg-accent-50 border border-accent-200",
                      !isActive && !isCompleted && "bg-surface-100"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        isActive && "bg-primary-600 text-white",
                        isCompleted && "bg-accent-500 text-white",
                        !isActive && !isCompleted && "bg-surface-300 text-white"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        step.number
                      )}
                    </div>
                    <div className="hidden sm:block min-w-0">
                      <p
                        className={cn(
                          "text-xs font-medium truncate",
                          isActive && "text-primary-700",
                          isCompleted && "text-accent-700",
                          !isActive && !isCompleted && "text-surface-500"
                        )}
                      >
                        {step.label}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "hidden sm:block w-8 h-0.5 shrink-0",
                        isCompleted ? "bg-accent-300" : "bg-surface-200"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl border border-surface-200 p-6 sm:p-8">
            {/* ============================================ */}
            {/* STEP 1: Personal Info */}
            {/* ============================================ */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-surface-900 mb-1">
                    Informacion personal
                  </h2>
                  <p className="text-sm text-surface-500">
                    Estos datos se usaran para verificar tu identidad
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">
                    Nombre completo *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input
                      type="text"
                      value={personal.fullName}
                      onChange={(e) => setPersonal({ ...personal, fullName: e.target.value })}
                      placeholder="Como aparece en tu documento de identidad"
                      className={cn(
                        "w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/20",
                        errors.fullName
                          ? "border-red-300 focus:border-red-500"
                          : "border-surface-300 focus:border-primary-500"
                      )}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                      Telefono *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                      <input
                        type="tel"
                        value={personal.phone}
                        onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
                        placeholder="+591 70000000"
                        className={cn(
                          "w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/20",
                          errors.phone
                            ? "border-red-300 focus:border-red-500"
                            : "border-surface-300 focus:border-primary-500"
                        )}
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                      Pais
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                      <select
                        value={personal.country}
                        onChange={(e) => setPersonal({ ...personal, country: e.target.value })}
                        className="w-full rounded-lg border border-surface-300 py-2.5 pl-10 pr-4 text-sm bg-white transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 appearance-none"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                      Ciudad *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                      <input
                        type="text"
                        value={personal.city}
                        onChange={(e) => setPersonal({ ...personal, city: e.target.value })}
                        placeholder="La Paz"
                        className={cn(
                          "w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/20",
                          errors.city
                            ? "border-red-300 focus:border-red-500"
                            : "border-surface-300 focus:border-primary-500"
                        )}
                      />
                    </div>
                    {errors.city && (
                      <p className="text-xs text-red-600 mt-1">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-1.5">
                      Direccion (opcional)
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                      <input
                        type="text"
                        value={personal.address}
                        onChange={(e) => setPersonal({ ...personal, address: e.target.value })}
                        placeholder="Calle, numero..."
                        className="w-full rounded-lg border border-surface-300 py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================ */}
            {/* STEP 2: Business Info */}
            {/* ============================================ */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-surface-900 mb-1">
                    Informacion del negocio
                  </h2>
                  <p className="text-sm text-surface-500">
                    Configura tu perfil de vendedor
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">
                    Nombre de tu tienda *
                  </label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input
                      type="text"
                      value={business.storeName}
                      onChange={(e) => setBusiness({ ...business, storeName: e.target.value })}
                      placeholder="Mi Tienda Digital"
                      className={cn(
                        "w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/20",
                        errors.storeName
                          ? "border-red-300 focus:border-red-500"
                          : "border-surface-300 focus:border-primary-500"
                      )}
                    />
                  </div>
                  {errors.storeName && (
                    <p className="text-xs text-red-600 mt-1">{errors.storeName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">
                    Descripcion de tu tienda *
                  </label>
                  <textarea
                    value={business.storeDescription}
                    onChange={(e) => setBusiness({ ...business, storeDescription: e.target.value })}
                    placeholder="Describe brevemente que productos vendes y tu experiencia..."
                    rows={3}
                    className={cn(
                      "w-full rounded-lg border py-2.5 px-4 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none",
                      errors.storeDescription
                        ? "border-red-300 focus:border-red-500"
                        : "border-surface-300 focus:border-primary-500"
                    )}
                  />
                  <div className="flex justify-between mt-1">
                    {errors.storeDescription ? (
                      <p className="text-xs text-red-600">{errors.storeDescription}</p>
                    ) : (
                      <span />
                    )}
                    <p className="text-xs text-surface-400">
                      {business.storeDescription.length}/500
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-2">
                    Tipo de mercado *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {MARKET_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setBusiness({ ...business, marketType: type.value })}
                        className={cn(
                          "flex flex-col items-start rounded-lg border-2 p-3 text-left transition-all cursor-pointer",
                          business.marketType === type.value
                            ? "border-primary-500 bg-primary-50/50"
                            : "border-surface-200 hover:border-surface-300"
                        )}
                      >
                        <p className={cn(
                          "text-sm font-medium",
                          business.marketType === type.value ? "text-primary-700" : "text-surface-800"
                        )}>
                          {type.label}
                        </p>
                        <p className="text-[11px] text-surface-500 mt-0.5">{type.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">
                    Sitio web (opcional)
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input
                      type="url"
                      value={business.website}
                      onChange={(e) => setBusiness({ ...business, website: e.target.value })}
                      placeholder="https://www.tutienda.com"
                      className="w-full rounded-lg border border-surface-300 py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ============================================ */}
            {/* STEP 3: Documents */}
            {/* ============================================ */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-surface-900 mb-1">
                    Documentos de verificacion
                  </h2>
                  <p className="text-sm text-surface-500">
                    Sube tus documentos para completar la verificacion. Formatos: JPG, PNG, WebP, PDF (max 5MB)
                  </p>
                </div>

                {errors.file && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errors.file}</span>
                  </div>
                )}

                {/* Identity Document */}
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-2">
                    Documento de identidad (CI / Pasaporte) *
                  </label>
                  {uploadingIdentity ? (
                    <div className="flex items-center gap-3 bg-primary-50 border border-primary-200 rounded-lg px-4 py-4">
                      <Loader2 className="w-5 h-5 text-primary-600 animate-spin shrink-0" />
                      <p className="text-sm text-primary-700">Subiendo documento...</p>
                    </div>
                  ) : identityDoc ? (
                    <div className="flex items-center gap-3 bg-accent-50 border border-accent-200 rounded-lg px-4 py-3">
                      <FileText className="w-5 h-5 text-accent-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-900 truncate">{identityDoc.name}</p>
                        <p className="text-xs text-surface-500">{(identityDoc.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <button
                        onClick={() => setIdentityDoc(null)}
                        className="text-surface-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => identityRef.current?.click()}
                      className={cn(
                        "w-full flex flex-col items-center gap-2 border-2 border-dashed rounded-xl p-6 transition-colors cursor-pointer",
                        errors.identityDoc
                          ? "border-red-300 bg-red-50/50"
                          : "border-surface-300 hover:border-primary-400 hover:bg-primary-50/30"
                      )}
                    >
                      <Upload className="w-8 h-8 text-surface-400" />
                      <p className="text-sm text-surface-600">
                        Sube la foto frontal de tu CI o pasaporte
                      </p>
                      <p className="text-xs text-surface-400">
                        Arrastra o haz clic para subir
                      </p>
                    </button>
                  )}
                  {errors.identityDoc && (
                    <p className="text-xs text-red-600 mt-1">{errors.identityDoc}</p>
                  )}
                  <input
                    ref={identityRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(e) => handleFileUpload(e, setIdentityDoc, setUploadingIdentity)}
                    className="hidden"
                  />
                </div>

                {/* Selfie with Document */}
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-2">
                    Selfie sosteniendo tu documento *
                  </label>
                  {uploadingSelfie ? (
                    <div className="flex items-center gap-3 bg-primary-50 border border-primary-200 rounded-lg px-4 py-4">
                      <Loader2 className="w-5 h-5 text-primary-600 animate-spin shrink-0" />
                      <p className="text-sm text-primary-700">Subiendo selfie...</p>
                    </div>
                  ) : selfieDoc ? (
                    <div className="flex items-center gap-3 bg-accent-50 border border-accent-200 rounded-lg px-4 py-3">
                      {selfieDoc.preview ? (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                          <Image
                            src={selfieDoc.preview}
                            alt="Selfie preview"
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <Camera className="w-5 h-5 text-accent-600 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-900 truncate">{selfieDoc.name}</p>
                        <p className="text-xs text-surface-500">{(selfieDoc.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <button
                        onClick={() => setSelfieDoc(null)}
                        className="text-surface-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => selfieRef.current?.click()}
                      className={cn(
                        "w-full flex flex-col items-center gap-2 border-2 border-dashed rounded-xl p-6 transition-colors cursor-pointer",
                        errors.selfieDoc
                          ? "border-red-300 bg-red-50/50"
                          : "border-surface-300 hover:border-primary-400 hover:bg-primary-50/30"
                      )}
                    >
                      <Camera className="w-8 h-8 text-surface-400" />
                      <p className="text-sm text-surface-600">
                        Toma una foto sosteniendo tu documento junto a tu rostro
                      </p>
                      <p className="text-xs text-surface-400">
                        Debe verse claramente tu rostro y el documento
                      </p>
                    </button>
                  )}
                  {errors.selfieDoc && (
                    <p className="text-xs text-red-600 mt-1">{errors.selfieDoc}</p>
                  )}
                  <input
                    ref={selfieRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => handleFileUpload(e, setSelfieDoc, setUploadingSelfie)}
                    className="hidden"
                  />
                </div>

                {/* Business Document (optional) */}
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-2">
                    Documento comercial (opcional)
                    <span className="text-xs text-surface-400 ml-1.5">NIT, licencia de negocio, etc.</span>
                  </label>
                  {uploadingBusiness ? (
                    <div className="flex items-center gap-3 bg-primary-50 border border-primary-200 rounded-lg px-4 py-4">
                      <Loader2 className="w-5 h-5 text-primary-600 animate-spin shrink-0" />
                      <p className="text-sm text-primary-700">Subiendo documento comercial...</p>
                    </div>
                  ) : businessDoc ? (
                    <div className="flex items-center gap-3 bg-surface-50 border border-surface-200 rounded-lg px-4 py-3">
                      <FileText className="w-5 h-5 text-surface-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-900 truncate">{businessDoc.name}</p>
                        <p className="text-xs text-surface-500">{(businessDoc.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <button
                        onClick={() => setBusinessDoc(null)}
                        className="text-surface-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => businessRef.current?.click()}
                      className="w-full flex flex-col items-center gap-2 border-2 border-dashed border-surface-300 rounded-xl p-6 hover:border-primary-400 hover:bg-primary-50/30 transition-colors cursor-pointer"
                    >
                      <Upload className="w-8 h-8 text-surface-400" />
                      <p className="text-sm text-surface-600">
                        Sube tu documento comercial (NIT, licencia, etc.)
                      </p>
                    </button>
                  )}
                  <input
                    ref={businessRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(e) => handleFileUpload(e, setBusinessDoc, setUploadingBusiness)}
                    className="hidden"
                  />
                </div>

                {/* Privacy note */}
                <div className="flex items-start gap-2.5 bg-surface-50 rounded-lg p-4">
                  <Shield className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-surface-600 leading-relaxed">
                    Tus documentos son almacenados de forma segura con cifrado AES-256 y solo
                    seran revisados por el equipo de verificacion de VirtuMall. Nunca compartiremos
                    tu informacion personal con terceros.
                  </p>
                </div>
              </div>
            )}

            {/* ============================================ */}
            {/* Navigation Buttons */}
            {/* ============================================ */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-surface-100">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center gap-2 text-sm font-medium text-surface-600 hover:text-surface-900 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Anterior
                </button>
              ) : (
                <span />
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Siguiente
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex flex-col items-end gap-2">
                  {submitError && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || uploadingIdentity || uploadingSelfie || uploadingBusiness}
                    className={cn(
                      "flex items-center gap-2 bg-accent-600 hover:bg-accent-700 text-white font-medium px-6 py-2.5 rounded-xl transition-colors cursor-pointer",
                      "disabled:opacity-50 disabled:pointer-events-none"
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Enviar verificacion
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
