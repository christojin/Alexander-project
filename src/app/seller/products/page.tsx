"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Package,
  ImageIcon,
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  X as XIcon,
  Tv,
  Gift,
  Mail,
  User,
  Lock,
  CalendarDays,
  Loader2,
  AlertCircle,
  Megaphone,
  Star,
  Tag,
  ShieldAlert,
  Ban,
  Eye,
  Hash,
  CircleDot,
  Users,
  PauseCircle,
  PlayCircle,
  Monitor,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import {
  Button,
  Modal,
  Input,
  Select,
  Textarea,
  SearchBar,
  Badge,
  EmptyState,
} from "@/components/ui";
import { formatCurrency, cn } from "@/lib/utils";

// ---------- Types for API data ----------

interface CatalogItem {
  id: string;
  name: string;
  slug: string;
}

interface SellerProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice: number | null;
  productType: "GIFT_CARD" | "STREAMING" | "TOP_UP" | "MANUAL";
  deliveryType: "INSTANT" | "MANUAL";
  streamingMode: "COMPLETE_ACCOUNT" | "PROFILE" | null;
  profileCount: number | null;
  duration: number | null;
  image: string | null;
  stockCount: number;
  soldCount: number;
  isActive: boolean;
  isPromoted: boolean;
  createdAt: string;
  categoryId: string;
  brandId: string | null;
  regionId: string | null;
  category: CatalogItem;
  brand: CatalogItem | null;
  region: { id: string; name: string; code: string } | null;
  _count?: {
    giftCardCodes: number;
    streamingAccounts: number;
    orderItems: number;
  };
}

interface ProductForm {
  name: string;
  description: string;
  price: string;
  originalPrice: string;
  categoryId: string;
  brandId: string;
  regionId: string;
  deliveryType: "INSTANT" | "MANUAL";
  productType: "GIFT_CARD" | "STREAMING" | "MANUAL";
  digitalCodes: string;
  singleCode: string;
  codeExpiration: string;
  streamingEmail: string;
  streamingUsername: string;
  streamingPassword: string;
  streamingExpiration: string;
  streamingMode: "COMPLETE_ACCOUNT" | "PROFILE";
  profileCount: string;
  duration: string;
  manualStock: string;
}

interface CodeSummary {
  total: number;
  available: number;
  sold: number;
  reserved: number;
  expired: number;
}

interface CodeItem {
  id: string;
  status: string;
  expiresAt: string | null;
  soldAt: string | null;
  createdAt: string;
}

interface AccountSummary {
  total: number;
  available: number;
  sold: number;
  suspended: number;
  expired: number;
}

interface AccountItem {
  id: string;
  status: string;
  email: string | null;
  username: string | null;
  maxProfiles: number;
  soldProfiles: number;
  expiresAt: string | null;
  soldAt: string | null;
  createdAt: string;
  profiles: { id: string; profileNumber: number; buyerId: string | null; assignedAt: string | null }[];
}

const emptyForm: ProductForm = {
  name: "",
  description: "",
  price: "",
  originalPrice: "",
  categoryId: "",
  brandId: "",
  regionId: "",
  deliveryType: "INSTANT",
  productType: "GIFT_CARD",
  digitalCodes: "",
  singleCode: "",
  codeExpiration: "",
  streamingEmail: "",
  streamingUsername: "",
  streamingPassword: "",
  streamingExpiration: "",
  streamingMode: "COMPLETE_ACCOUNT",
  profileCount: "",
  duration: "",
  manualStock: "",
};

const deliveryOptions = [
  { value: "INSTANT", label: "Instantanea" },
  { value: "MANUAL", label: "Manual" },
];

export default function SellerProductsPage() {
  // Data state
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [categories, setCategories] = useState<CatalogItem[]>([]);
  const [brands, setBrands] = useState<CatalogItem[]>([]);
  const [regions, setRegions] = useState<{ id: string; name: string; code: string }[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SellerProduct | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [promotionQuota, setPromotionQuota] = useState(0);
  const [promotionUsed, setPromotionUsed] = useState(0);
  const [offersQuota, setOffersQuota] = useState(0);
  const [offersUsed, setOffersUsed] = useState(0);
  const [togglingPromotion, setTogglingPromotion] = useState<string | null>(null);
  const [togglingOffer, setTogglingOffer] = useState<string | null>(null);

  // Code management modal state
  const [codesModalProduct, setCodesModalProduct] = useState<SellerProduct | null>(null);
  const [codesList, setCodesList] = useState<CodeItem[]>([]);
  const [codesSummary, setCodesSummary] = useState<CodeSummary | null>(null);
  const [codesLoading, setCodesLoading] = useState(false);
  const [codesStatusFilter, setCodesStatusFilter] = useState("");

  // CSV upload state
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvResult, setCsvResult] = useState<string | null>(null);

  // Streaming account management modal state
  const [accountsModalProduct, setAccountsModalProduct] = useState<SellerProduct | null>(null);
  const [accountsList, setAccountsList] = useState<AccountItem[]>([]);
  const [accountsSummary, setAccountsSummary] = useState<AccountSummary | null>(null);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsStatusFilter, setAccountsStatusFilter] = useState("");
  const [editingAccount, setEditingAccount] = useState<AccountItem | null>(null);
  const [accountForm, setAccountForm] = useState({ email: "", username: "", password: "", expiresAt: "" });
  const [accountSaving, setAccountSaving] = useState(false);

  // ---------- Data Fetching ----------

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/seller/products");
      if (!res.ok) throw new Error("Error al cargar productos");
      const data = await res.json();
      setProducts(data.products);
      if (data.promotion) {
        setPromotionQuota(data.promotion.quota);
        setPromotionUsed(data.promotion.used);
      }
      if (data.offers) {
        setOffersQuota(data.offers.quota);
        setOffersUsed(data.offers.used);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  }, []);

  const fetchCatalog = useCallback(async () => {
    try {
      const res = await fetch("/api/catalog");
      if (!res.ok) throw new Error("Error al cargar catalogo");
      const data = await res.json();
      setCategories(data.categories);
      setBrands(data.brands);
      setRegions(data.regions);
    } catch (err) {
      console.error("Catalog fetch error:", err);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchProducts(), fetchCatalog()]).finally(() =>
      setLoading(false)
    );
  }, [fetchProducts, fetchCatalog]);

  // ---------- Filtering ----------

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.brand?.name ?? "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        !categoryFilter || p.categoryId === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, categoryFilter]);

  // ---------- Modal Handlers ----------

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (product: SellerProduct) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() ?? "",
      categoryId: product.categoryId,
      brandId: product.brandId ?? "",
      regionId: product.regionId ?? "",
      deliveryType: product.deliveryType,
      productType: product.productType === "STREAMING" ? "STREAMING" : product.productType === "MANUAL" ? "MANUAL" : "GIFT_CARD",
      digitalCodes: "",
      streamingEmail: "",
      streamingUsername: "",
      streamingPassword: "",
      streamingExpiration: "",
      singleCode: "",
      codeExpiration: "",
      streamingMode: product.streamingMode === "PROFILE" ? "PROFILE" : "COMPLETE_ACCOUNT",
      profileCount: product.profileCount?.toString() ?? "",
      duration: product.duration?.toString() ?? "",
      manualStock: product.stockCount?.toString() ?? "",
    });
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.categoryId || !form.description) {
      setError("Nombre, descripcion, precio y categoria son requeridos");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const productData: Record<string, unknown> = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : null,
        productType: form.productType,
        deliveryType: form.deliveryType,
        categoryId: form.categoryId,
        brandId: form.brandId || null,
        regionId: form.regionId || null,
      };

      // Add streaming-specific fields
      if (form.productType === "STREAMING") {
        productData.streamingMode = form.streamingMode;
        productData.profileCount = form.profileCount ? parseInt(form.profileCount) : null;
      }

      // Add manual-specific fields
      if (form.productType === "MANUAL") {
        productData.deliveryType = "MANUAL";
        productData.duration = form.duration ? parseInt(form.duration) : null;
        productData.stockCount = form.manualStock ? parseInt(form.manualStock) : 0;
      }

      let savedProduct: SellerProduct;

      if (editingProduct) {
        // Update
        const res = await fetch(`/api/seller/products/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Error al actualizar");
        }
        const data = await res.json();
        savedProduct = data.product;
      } else {
        // Create
        const res = await fetch("/api/seller/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Error al crear producto");
        }
        const data = await res.json();
        savedProduct = data.product;
      }

      // Upload codes if gift card type and codes provided
      if (form.productType === "GIFT_CARD") {
        const allCodes: string[] = [];

        // Individual code
        if (form.singleCode.trim()) {
          allCodes.push(form.singleCode.trim());
        }

        // Bulk codes
        if (form.digitalCodes.trim()) {
          const bulkCodes = form.digitalCodes
            .split("\n")
            .map((c) => c.trim())
            .filter(Boolean);
          allCodes.push(...bulkCodes);
        }

        if (allCodes.length > 0) {
          const codesRes = await fetch(
            `/api/seller/products/${savedProduct.id}/codes`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                codes: allCodes,
                expiresAt: form.codeExpiration || undefined,
              }),
            }
          );
          if (!codesRes.ok) {
            const errData = await codesRes.json();
            console.error("Code upload error:", errData.error);
          }
        }
      }

      // Upload streaming account if provided
      if (
        form.productType === "STREAMING" &&
        form.streamingEmail &&
        form.streamingPassword
      ) {
        const accountRes = await fetch(
          `/api/seller/products/${savedProduct.id}/accounts`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: form.streamingEmail,
              username: form.streamingUsername || undefined,
              password: form.streamingPassword,
              expiresAt: form.streamingExpiration || undefined,
            }),
          }
        );
        if (!accountRes.ok) {
          const errData = await accountRes.json();
          console.error("Account upload error:", errData.error);
        }
      }

      // Refresh product list
      await fetchProducts();
      setModalOpen(false);
      setEditingProduct(null);
      setForm(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      const res = await fetch(`/api/seller/products/${productId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Error al eliminar");
      }
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setDeleteConfirm(null);
    }
  };

  const toggleActive = async (product: SellerProduct) => {
    try {
      const res = await fetch(`/api/seller/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !product.isActive }),
      });
      if (!res.ok) throw new Error("Error al cambiar estado");
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, isActive: !p.isActive } : p
        )
      );
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  const togglePromotion = async (product: SellerProduct) => {
    setTogglingPromotion(product.id);
    try {
      const res = await fetch(`/api/seller/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPromoted: !product.isPromoted }),
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || "Error al cambiar promocion");
        return;
      }
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, isPromoted: !p.isPromoted } : p
        )
      );
      setPromotionUsed((prev) => prev + (product.isPromoted ? -1 : 1));
    } catch {
      alert("Error de conexion");
    } finally {
      setTogglingPromotion(null);
    }
  };

  const toggleOffer = async (product: SellerProduct) => {
    setTogglingOffer(product.id);
    try {
      const isCurrentlyOffer =
        product.originalPrice !== null && product.originalPrice > product.price;
      const newOriginalPrice = isCurrentlyOffer
        ? null
        : Math.round(product.price * 1.25);

      const res = await fetch(`/api/seller/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalPrice: newOriginalPrice }),
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || "Error al cambiar oferta");
        return;
      }
      await fetchProducts();
    } catch {
      alert("Error de conexion");
    } finally {
      setTogglingOffer(null);
    }
  };

  // ---------- Code Management ----------

  const fetchCodes = async (productId: string) => {
    setCodesLoading(true);
    try {
      const res = await fetch(`/api/seller/products/${productId}/codes`);
      if (!res.ok) throw new Error("Error al cargar codigos");
      const data = await res.json();
      setCodesList(data.codes ?? []);
      setCodesSummary(data.summary ?? null);
    } catch (err) {
      console.error("Fetch codes error:", err);
    } finally {
      setCodesLoading(false);
    }
  };

  const openCodesModal = (product: SellerProduct) => {
    setCodesModalProduct(product);
    setCodesStatusFilter("");
    fetchCodes(product.id);
  };

  const handleAddSingleCode = async () => {
    if (!codesModalProduct || !form.singleCode.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/seller/products/${codesModalProduct.id}/codes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codes: [form.singleCode.trim()],
          expiresAt: form.codeExpiration || undefined,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Error al agregar codigo");
      }
      setForm((prev) => ({ ...prev, singleCode: "", codeExpiration: "" }));
      await fetchCodes(codesModalProduct.id);
      await fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile || !codesModalProduct) return;
    setCsvUploading(true);
    setCsvResult(null);
    try {
      const text = await csvFile.text();
      const codes: string[] = [];

      // Parse CSV: support comma-separated, semicolon-separated, or one per line
      const lines = text.split(/\r?\n/);
      for (const line of lines) {
        // Try comma or semicolon separated
        const parts = line.split(/[,;]/).map((p) => p.trim().replace(/^["']|["']$/g, ""));
        for (const part of parts) {
          if (part.length > 0) codes.push(part);
        }
      }

      if (codes.length === 0) {
        setCsvResult("No se encontraron codigos validos en el archivo");
        return;
      }

      const res = await fetch(`/api/seller/products/${codesModalProduct.id}/codes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codes }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Error al importar");
      }
      const data = await res.json();
      setCsvResult(`${data.added} codigos importados exitosamente`);
      setCsvFile(null);
      await fetchCodes(codesModalProduct.id);
      await fetchProducts();
    } catch (err) {
      setCsvResult(err instanceof Error ? err.message : "Error al procesar archivo");
    } finally {
      setCsvUploading(false);
    }
  };

  const filteredCodes = useMemo(() => {
    if (!codesStatusFilter) return codesList;
    return codesList.filter((c) => c.status === codesStatusFilter);
  }, [codesList, codesStatusFilter]);

  // ---------- Streaming Account Management ----------

  const fetchAccounts = async (productId: string) => {
    setAccountsLoading(true);
    try {
      const res = await fetch(`/api/seller/products/${productId}/accounts`);
      if (!res.ok) throw new Error("Error al cargar cuentas");
      const data = await res.json();
      setAccountsList(data.accounts ?? []);
      setAccountsSummary(data.summary ?? null);
    } catch (err) {
      console.error("Fetch accounts error:", err);
    } finally {
      setAccountsLoading(false);
    }
  };

  const openAccountsModal = (product: SellerProduct) => {
    setAccountsModalProduct(product);
    setAccountsStatusFilter("");
    setEditingAccount(null);
    fetchAccounts(product.id);
  };

  const handleAccountEdit = async () => {
    if (!accountsModalProduct || !editingAccount) return;
    setAccountSaving(true);
    try {
      const res = await fetch(`/api/seller/products/${accountsModalProduct.id}/accounts`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: editingAccount.id,
          email: accountForm.email || undefined,
          username: accountForm.username || undefined,
          password: accountForm.password || undefined,
          expiresAt: accountForm.expiresAt || undefined,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Error al actualizar");
      }
      setEditingAccount(null);
      setAccountForm({ email: "", username: "", password: "", expiresAt: "" });
      await fetchAccounts(accountsModalProduct.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setAccountSaving(false);
    }
  };

  const handleAccountAction = async (accountId: string, action: "suspend" | "resume") => {
    if (!accountsModalProduct) return;
    setAccountSaving(true);
    try {
      const res = await fetch(`/api/seller/products/${accountsModalProduct.id}/accounts`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, action }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Error al cambiar estado");
      }
      await fetchAccounts(accountsModalProduct.id);
      await fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setAccountSaving(false);
    }
  };

  const startEditAccount = (account: AccountItem) => {
    setEditingAccount(account);
    setAccountForm({
      email: account.email ?? "",
      username: account.username ?? "",
      password: "",
      expiresAt: account.expiresAt ? account.expiresAt.split("T")[0] : "",
    });
  };

  const filteredAccounts = useMemo(() => {
    if (!accountsStatusFilter) return accountsList;
    return accountsList.filter((a) => a.status === accountsStatusFilter);
  }, [accountsList, accountsStatusFilter]);

  const updateForm = (field: keyof ProductForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // ---------- Dropdown options from DB ----------

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const brandOptions = brands.map((b) => ({
    value: b.id,
    label: b.name,
  }));

  const regionOptions = regions.map((r) => ({
    value: r.id,
    label: `${r.name}`,
  }));

  // ---------- Render ----------

  if (loading) {
    return (
      <DashboardLayout role="seller">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="seller">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 tracking-tight">
              Mis Productos
            </h1>
            <p className="mt-1 text-sm text-surface-500">
              Gestiona tu catalogo de productos digitales
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button iconLeft={<Plus />} onClick={openCreateModal}>
              Agregar producto
            </Button>
          </div>
        </div>

        {/* Promotion Quota Banner */}
        {promotionQuota > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-3">
            <Megaphone className="h-5 w-5 shrink-0 text-indigo-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-indigo-900">
                Productos promocionados: {promotionUsed}/{promotionQuota}
              </p>
              <p className="text-xs text-indigo-600">
                Puedes promocionar hasta {promotionQuota} productos. Los productos promocionados aparecen destacados en la pagina principal.
              </p>
            </div>
            <div className="flex h-8 items-center rounded-full bg-indigo-100 px-3">
              <span className={cn(
                "text-sm font-bold",
                promotionUsed >= promotionQuota ? "text-red-600" : "text-indigo-700"
              )}>
                {promotionQuota - promotionUsed} disponibles
              </span>
            </div>
          </div>
        )}

        {/* Offers Quota Banner */}
        {offersQuota > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3">
            <Tag className="h-5 w-5 shrink-0 text-emerald-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-emerald-900">
                Productos en oferta: {offersUsed}/{offersQuota}
              </p>
              <p className="text-xs text-emerald-600">
                Puedes poner hasta {offersQuota} productos en oferta con descuento. Aparecen en la seccion &quot;Ofertas del dia&quot;.
              </p>
            </div>
            <div className="flex h-8 items-center rounded-full bg-emerald-100 px-3">
              <span className={cn(
                "text-sm font-bold",
                offersUsed >= offersQuota ? "text-red-600" : "text-emerald-700"
              )}>
                {offersQuota - offersUsed} disponibles
              </span>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && !modalOpen && (
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="shrink-0 text-red-400 hover:text-red-600">
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Search and Filters */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Buscar productos..."
          filterDropdown={
            <Select
              options={[
                { value: "", label: "Todas las categorias" },
                ...categoryOptions,
              ]}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="min-w-[180px]"
            />
          }
        />

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <EmptyState
            icon={<Package />}
            title="No se encontraron productos"
            description="Ajusta los filtros de busqueda o agrega un nuevo producto."
            action={
              <Button iconLeft={<Plus />} onClick={openCreateModal}>
                Agregar producto
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={cn(
                  "rounded-xl border bg-white transition-all duration-200 hover:shadow-md",
                  product.isActive
                    ? "border-surface-200"
                    : "border-surface-200 opacity-60"
                )}
              >
                {/* Product Image Area */}
                <div className="relative flex h-40 items-center justify-center rounded-t-xl bg-surface-50">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-surface-100 text-surface-400">
                    <ImageIcon className="size-8" />
                  </div>
                  <div className="absolute left-3 top-3">
                    <Badge
                      variant={product.productType === "STREAMING" ? "warning" : product.productType === "MANUAL" ? "neutral" : "info"}
                      size="sm"
                    >
                      {product.productType === "STREAMING" ? (
                        <span className="flex items-center gap-1"><Tv className="size-3" /> Streaming</span>
                      ) : product.productType === "MANUAL" ? (
                        <span className="flex items-center gap-1"><Package className="size-3" /> Manual</span>
                      ) : (
                        <span className="flex items-center gap-1"><Gift className="size-3" /> Gift Card</span>
                      )}
                    </Badge>
                  </div>
                  <div className="absolute right-3 top-3 flex gap-2">
                    {product.isPromoted && (
                      <Badge variant="warning" size="sm">
                        <span className="flex items-center gap-1"><Star className="size-3 fill-current" /> Promo</span>
                      </Badge>
                    )}
                    {product.originalPrice && product.originalPrice > product.price && (
                      <Badge variant="success" size="sm">
                        <span className="flex items-center gap-1"><Tag className="size-3" /> Oferta</span>
                      </Badge>
                    )}
                    <Badge
                      variant={product.isActive ? "success" : "neutral"}
                      size="sm"
                      dot
                    >
                      {product.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="mb-1 text-xs font-medium text-primary-600">
                    {product.category.name}
                  </div>
                  <h3 className="font-semibold text-surface-900 leading-snug">
                    {product.name}
                  </h3>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-lg font-bold text-surface-900">
                      {formatCurrency(product.price)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-surface-400 line-through">
                        {formatCurrency(product.originalPrice)}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-4 text-xs text-surface-500">
                    <span>Stock: {product.stockCount}</span>
                    <span>Vendidos: {product.soldCount}</span>
                    {product.region && <span>{product.region.name}</span>}
                  </div>

                  {/* Gift Card: Code management button */}
                  {product.productType === "GIFT_CARD" && (
                    <button
                      onClick={() => openCodesModal(product)}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-100"
                    >
                      <Eye className="size-3.5" />
                      Gestionar codigos ({product._count?.giftCardCodes ?? 0} disponibles)
                    </button>
                  )}

                  {/* Streaming: Account management button */}
                  {product.productType === "STREAMING" && (
                    <button
                      onClick={() => openAccountsModal(product)}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100"
                    >
                      <Tv className="size-3.5" />
                      Gestionar cuentas ({product._count?.streamingAccounts ?? 0} disponibles)
                    </button>
                  )}

                  {/* Promotion & Offer Toggles */}
                  {(promotionQuota > 0 || offersQuota > 0) && product.isActive && (
                    <div className="mt-3 flex flex-col gap-2 border-t border-surface-100 pt-3">
                      {promotionQuota > 0 && (
                        <button
                          onClick={() => togglePromotion(product)}
                          disabled={togglingPromotion === product.id || (!product.isPromoted && promotionUsed >= promotionQuota)}
                          className={cn(
                            "flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                            product.isPromoted
                              ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                              : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                          )}
                        >
                          {togglingPromotion === product.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Megaphone className="size-3.5" />
                          )}
                          {product.isPromoted ? "Quitar promocion" : "Promocionar"}
                        </button>
                      )}
                      {offersQuota > 0 && (
                        <button
                          onClick={() => toggleOffer(product)}
                          disabled={togglingOffer === product.id || (!(product.originalPrice !== null && product.originalPrice > product.price) && offersUsed >= offersQuota)}
                          className={cn(
                            "flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                            product.originalPrice !== null && product.originalPrice > product.price
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          )}
                        >
                          {togglingOffer === product.id ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Tag className="size-3.5" />
                          )}
                          {product.originalPrice !== null && product.originalPrice > product.price
                            ? "Quitar oferta"
                            : "Poner en oferta"}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {(() => {
                    const hasSales = product.soldCount > 0 || (product._count?.orderItems ?? 0) > 0;
                    return (
                      <div className="mt-3 flex flex-col gap-2 border-t border-surface-100 pt-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            iconLeft={<Pencil />}
                            onClick={() => openEditModal(product)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActive(product)}
                            iconLeft={
                              product.isActive ? <ToggleRight /> : <ToggleLeft />
                            }
                          >
                            {product.isActive ? "Desactivar" : "Activar"}
                          </Button>
                          {hasSales ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-auto text-surface-400 cursor-not-allowed"
                              iconLeft={<Ban className="size-3.5" />}
                              disabled
                            >
                              Eliminar
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-auto text-red-600 hover:bg-red-50 hover:text-red-700"
                              iconLeft={<Trash2 />}
                              onClick={() => setDeleteConfirm(product.id)}
                            >
                              Eliminar
                            </Button>
                          )}
                        </div>
                        {hasSales && (
                          <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
                            <ShieldAlert className="size-3.5 shrink-0" />
                            <span>Producto con ventas: solo se puede desactivar</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create / Edit Modal */}
        <Modal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingProduct(null);
            setForm(emptyForm);
            setError(null);
          }}
          title={editingProduct ? "Editar producto" : "Agregar producto"}
          size="lg"
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <Input
              label="Nombre del producto"
              placeholder="Ej: Netflix Gift Card $30"
              value={form.name}
              onChange={(e) => updateForm("name", e.target.value)}
            />
            <Textarea
              label="Descripcion"
              placeholder="Describe tu producto..."
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Precio (USD)"
                type="number"
                placeholder="0.00"
                value={form.price}
                onChange={(e) => updateForm("price", e.target.value)}
              />
              <Input
                label="Precio original (USD)"
                type="number"
                placeholder="Opcional, para mostrar descuento"
                value={form.originalPrice}
                onChange={(e) => updateForm("originalPrice", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Select
                label="Categoria"
                options={categoryOptions}
                placeholder="Selecciona una categoria"
                value={form.categoryId}
                onChange={(e) => updateForm("categoryId", e.target.value)}
              />
              <Select
                label="Marca"
                options={[{ value: "", label: "Sin marca" }, ...brandOptions]}
                value={form.brandId}
                onChange={(e) => updateForm("brandId", e.target.value)}
              />
              <Select
                label="Region"
                options={[{ value: "", label: "Sin region" }, ...regionOptions]}
                value={form.regionId}
                onChange={(e) => updateForm("regionId", e.target.value)}
              />
            </div>
            <Select
              label="Tipo de entrega"
              options={deliveryOptions}
              value={form.deliveryType}
              onChange={(e) => updateForm("deliveryType", e.target.value)}
            />

            {/* Product Type Selector */}
            <div>
              <label className="mb-2 block text-sm font-medium text-surface-700">
                Tipo de producto
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => updateForm("productType", "GIFT_CARD")}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all",
                    form.productType === "GIFT_CARD"
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-surface-200 bg-white text-surface-600 hover:border-surface-300"
                  )}
                >
                  <Gift className="size-5 shrink-0" />
                  <div>
                    <div className="text-sm font-semibold">Gift Card</div>
                    <div className="text-xs opacity-70">Codigos digitales</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => updateForm("productType", "STREAMING")}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all",
                    form.productType === "STREAMING"
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-surface-200 bg-white text-surface-600 hover:border-surface-300"
                  )}
                >
                  <Tv className="size-5 shrink-0" />
                  <div>
                    <div className="text-sm font-semibold">Streaming</div>
                    <div className="text-xs opacity-70">Credenciales</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => updateForm("productType", "MANUAL")}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all",
                    form.productType === "MANUAL"
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-surface-200 bg-white text-surface-600 hover:border-surface-300"
                  )}
                >
                  <Package className="size-5 shrink-0" />
                  <div>
                    <div className="text-sm font-semibold">Manual</div>
                    <div className="text-xs opacity-70">Entrega manual</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Type-specific stock entry */}
            {form.productType === "MANUAL" ? (
              <div className="space-y-3 rounded-xl border border-surface-200 bg-surface-50 p-4">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-surface-700">
                  <Package className="size-4" />
                  Producto de entrega manual
                </h4>
                <p className="text-xs text-surface-500">
                  Este producto se entrega manualmente por el vendedor. Se creara un chat automatico con el comprador al momento de la compra.
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    label="Cantidad en stock"
                    type="number"
                    placeholder="Ej: 10"
                    value={form.manualStock}
                    onChange={(e) => updateForm("manualStock", e.target.value)}
                    iconLeft={<Package className="size-4" />}
                  />
                  <Input
                    label="Duracion de entrega (dias)"
                    type="number"
                    placeholder="Ej: 1"
                    value={form.duration}
                    onChange={(e) => updateForm("duration", e.target.value)}
                    iconLeft={<CalendarDays className="size-4" />}
                  />
                </div>
              </div>
            ) : form.productType === "GIFT_CARD" ? (
              <div className="space-y-4">
                <div className="space-y-3 rounded-xl border border-surface-200 bg-surface-50 p-4">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-surface-700">
                    <Hash className="size-4" />
                    Codigos digitales
                  </h4>
                  <p className="text-xs text-surface-500">
                    Agrega codigos uno a uno o en lote. Se sumaran al stock actual del producto.
                  </p>

                  {/* Individual code entry */}
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <Input
                        label="Agregar codigo individual"
                        placeholder="Ej: ABCD-1234-EFGH-5678"
                        value={form.singleCode}
                        onChange={(e) => updateForm("singleCode", e.target.value)}
                        iconLeft={<Gift className="size-4" />}
                      />
                    </div>
                    <div className="w-[140px]">
                      <Input
                        label="Expiracion"
                        type="date"
                        value={form.codeExpiration}
                        onChange={(e) => updateForm("codeExpiration", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Bulk entry */}
                  <Textarea
                    label="O pega multiples codigos (uno por linea)"
                    placeholder={"CODIGO-001\nCODIGO-002\nCODIGO-003"}
                    value={form.digitalCodes}
                    onChange={(e) => updateForm("digitalCodes", e.target.value)}
                    className="min-h-[100px] font-mono text-xs"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Streaming Mode Selector */}
                <div className="space-y-3 rounded-xl border border-surface-200 bg-surface-50 p-4">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-surface-700">
                    <Tv className="size-4" />
                    Modo de compartir
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => updateForm("streamingMode", "COMPLETE_ACCOUNT")}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all",
                        form.streamingMode === "COMPLETE_ACCOUNT"
                          ? "border-amber-500 bg-amber-50 text-amber-700"
                          : "border-surface-200 bg-white text-surface-600 hover:border-surface-300"
                      )}
                    >
                      <Monitor className="size-5 shrink-0" />
                      <div>
                        <div className="text-sm font-semibold">Cuenta completa</div>
                        <div className="text-xs opacity-70">Se vende la cuenta entera</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateForm("streamingMode", "PROFILE")}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all",
                        form.streamingMode === "PROFILE"
                          ? "border-amber-500 bg-amber-50 text-amber-700"
                          : "border-surface-200 bg-white text-surface-600 hover:border-surface-300"
                      )}
                    >
                      <Users className="size-5 shrink-0" />
                      <div>
                        <div className="text-sm font-semibold">Por perfil</div>
                        <div className="text-xs opacity-70">Se venden perfiles individuales</div>
                      </div>
                    </button>
                  </div>
                  {form.streamingMode === "PROFILE" && (
                    <Input
                      label="Cantidad de perfiles por cuenta"
                      type="number"
                      placeholder="Ej: 5"
                      value={form.profileCount}
                      onChange={(e) => updateForm("profileCount", e.target.value)}
                      iconLeft={<Users className="size-4" />}
                    />
                  )}
                </div>

                {/* Streaming Credentials */}
                <div className="space-y-3 rounded-xl border border-surface-200 bg-surface-50 p-4">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-surface-700">
                    <Lock className="size-4" />
                    Credenciales de streaming
                  </h4>
                  <p className="text-xs text-surface-500">
                    Ingresa las credenciales de la cuenta que se entregara al comprador. Puedes agregar mas cuentas despues.
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Input
                      label="Correo electronico"
                      placeholder="cuenta@email.com"
                      value={form.streamingEmail}
                      onChange={(e) => updateForm("streamingEmail", e.target.value)}
                      iconLeft={<Mail className="size-4" />}
                    />
                    <Input
                      label="Usuario"
                      placeholder="nombre_usuario"
                      value={form.streamingUsername}
                      onChange={(e) => updateForm("streamingUsername", e.target.value)}
                      iconLeft={<User className="size-4" />}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Input
                      label="Contrasena"
                      placeholder="********"
                      value={form.streamingPassword}
                      onChange={(e) => updateForm("streamingPassword", e.target.value)}
                      iconLeft={<Lock className="size-4" />}
                    />
                    <Input
                      label="Fecha de expiracion"
                      type="date"
                      value={form.streamingExpiration}
                      onChange={(e) => updateForm("streamingExpiration", e.target.value)}
                      iconLeft={<CalendarDays className="size-4" />}
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setModalOpen(false);
                  setEditingProduct(null);
                  setForm(emptyForm);
                  setError(null);
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Guardando...
                  </span>
                ) : editingProduct ? (
                  "Guardar cambios"
                ) : (
                  "Crear producto"
                )}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          open={deleteConfirm !== null}
          onClose={() => setDeleteConfirm(null)}
          title="Confirmar eliminacion"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-surface-600">
              Estas seguro de que deseas eliminar este producto? El producto sera marcado como eliminado y no aparecera en tu catalogo. Este registro se mantendra en el sistema.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              >
                Eliminar producto
              </Button>
            </div>
          </div>
        </Modal>

        {/* Code Management Modal */}
        <Modal
          open={codesModalProduct !== null}
          onClose={() => {
            setCodesModalProduct(null);
            setCodesList([]);
            setCodesSummary(null);
            setCsvFile(null);
            setCsvResult(null);
            setForm((prev) => ({ ...prev, singleCode: "", codeExpiration: "" }));
          }}
          title={`Codigos: ${codesModalProduct?.name ?? ""}`}
          size="lg"
        >
          <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
            {/* Summary Stats */}
            {codesSummary && (
              <div className="grid grid-cols-5 gap-2">
                {[
                  { label: "Total", value: codesSummary.total, color: "text-surface-900 bg-surface-50" },
                  { label: "Disponible", value: codesSummary.available, color: "text-green-700 bg-green-50" },
                  { label: "Vendido", value: codesSummary.sold, color: "text-blue-700 bg-blue-50" },
                  { label: "Reservado", value: codesSummary.reserved, color: "text-amber-700 bg-amber-50" },
                  { label: "Expirado", value: codesSummary.expired, color: "text-red-700 bg-red-50" },
                ].map((stat) => (
                  <div key={stat.label} className={cn("rounded-lg p-2.5 text-center", stat.color)}>
                    <div className="text-lg font-bold">{stat.value}</div>
                    <div className="text-[10px] font-medium uppercase tracking-wide opacity-70">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Individual Code */}
            <div className="space-y-3 rounded-xl border border-surface-200 bg-surface-50 p-4">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-surface-700">
                <Plus className="size-4" />
                Agregar codigo
              </h4>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    label="Codigo"
                    placeholder="Ej: ABCD-1234-EFGH"
                    value={form.singleCode}
                    onChange={(e) => updateForm("singleCode", e.target.value)}
                    iconLeft={<Gift className="size-4" />}
                  />
                </div>
                <div className="w-[140px]">
                  <Input
                    label="Expiracion"
                    type="date"
                    value={form.codeExpiration}
                    onChange={(e) => updateForm("codeExpiration", e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleAddSingleCode}
                  disabled={saving || !form.singleCode.trim()}
                  className="shrink-0"
                >
                  {saving ? <Loader2 className="size-4 animate-spin" /> : "Agregar"}
                </Button>
              </div>
            </div>

            {/* CSV/Excel Upload */}
            <div className="space-y-3 rounded-xl border border-surface-200 bg-surface-50 p-4">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-surface-700">
                <FileSpreadsheet className="size-4" />
                Importar desde archivo
              </h4>
              <p className="text-xs text-surface-500">
                Sube un archivo CSV o de texto con codigos (uno por linea, o separados por comas).
              </p>
              <div className="flex items-center gap-3">
                <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-surface-300 bg-white px-4 py-2.5 text-sm transition-colors hover:border-primary-400 hover:bg-primary-50/30">
                  <Upload className="size-4 shrink-0 text-surface-400" />
                  <span className="text-surface-600">
                    {csvFile ? csvFile.name : "Seleccionar archivo (.csv, .txt, .xlsx)"}
                  </span>
                  <input
                    type="file"
                    accept=".csv,.txt,.xlsx,.xls"
                    className="hidden"
                    onChange={(e) => {
                      setCsvFile(e.target.files?.[0] ?? null);
                      setCsvResult(null);
                    }}
                  />
                </label>
                {csvFile && (
                  <button onClick={() => { setCsvFile(null); setCsvResult(null); }} className="text-surface-400 hover:text-surface-600">
                    <XIcon className="size-4" />
                  </button>
                )}
                <Button
                  onClick={handleCsvUpload}
                  disabled={!csvFile || csvUploading}
                  variant="outline"
                >
                  {csvUploading ? <Loader2 className="size-4 animate-spin" /> : "Importar"}
                </Button>
              </div>
              {csvResult && (
                <div className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-xs",
                  csvResult.includes("exitosamente") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                )}>
                  {csvResult.includes("exitosamente") ? <CheckCircle2 className="size-3.5 shrink-0" /> : <AlertCircle className="size-3.5 shrink-0" />}
                  {csvResult}
                </div>
              )}
            </div>

            {/* Codes List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-surface-700">
                  Listado de codigos
                </h4>
                <select
                  value={codesStatusFilter}
                  onChange={(e) => setCodesStatusFilter(e.target.value)}
                  className="rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs text-surface-700 focus:border-primary-500 focus:outline-none"
                >
                  <option value="">Todos</option>
                  <option value="AVAILABLE">Disponible</option>
                  <option value="SOLD">Vendido</option>
                  <option value="RESERVED">Reservado</option>
                  <option value="EXPIRED">Expirado</option>
                </select>
              </div>

              {codesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="size-6 animate-spin text-primary-500" />
                </div>
              ) : filteredCodes.length === 0 ? (
                <div className="rounded-lg border border-surface-200 bg-surface-50 py-8 text-center text-sm text-surface-400">
                  {codesList.length === 0 ? "No hay codigos registrados" : "No hay codigos con este estado"}
                </div>
              ) : (
                <div className="rounded-lg border border-surface-200 bg-white">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-surface-100 bg-surface-50/50">
                        <th className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-surface-500">#</th>
                        <th className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-surface-500">Estado</th>
                        <th className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-surface-500">Expiracion</th>
                        <th className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-surface-500">Fecha creacion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-100">
                      {filteredCodes.slice(0, 100).map((code, idx) => (
                        <tr key={code.id} className="text-xs">
                          <td className="px-4 py-2 text-surface-500">{idx + 1}</td>
                          <td className="px-4 py-2">
                            <span className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              code.status === "AVAILABLE" && "bg-green-100 text-green-700",
                              code.status === "SOLD" && "bg-blue-100 text-blue-700",
                              code.status === "RESERVED" && "bg-amber-100 text-amber-700",
                              code.status === "EXPIRED" && "bg-red-100 text-red-700",
                            )}>
                              <CircleDot className="size-2.5" />
                              {code.status === "AVAILABLE" ? "Disponible" :
                               code.status === "SOLD" ? "Vendido" :
                               code.status === "RESERVED" ? "Reservado" : "Expirado"}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-surface-500">
                            {code.expiresAt ? new Date(code.expiresAt).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-4 py-2 text-surface-500">
                            {new Date(code.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredCodes.length > 100 && (
                    <div className="border-t border-surface-100 px-4 py-2 text-center text-xs text-surface-400">
                      Mostrando 100 de {filteredCodes.length} codigos
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => {
                setCodesModalProduct(null);
                setCodesList([]);
                setCodesSummary(null);
                setCsvFile(null);
                setCsvResult(null);
              }}>
                Cerrar
              </Button>
            </div>
          </div>
        </Modal>

        {/* Streaming Account Management Modal */}
        <Modal
          open={accountsModalProduct !== null}
          onClose={() => {
            setAccountsModalProduct(null);
            setAccountsList([]);
            setAccountsSummary(null);
            setEditingAccount(null);
            setAccountForm({ email: "", username: "", password: "", expiresAt: "" });
          }}
          title={`Cuentas: ${accountsModalProduct?.name ?? ""}`}
          size="lg"
        >
          <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
            {/* Summary Stats */}
            {accountsSummary && (
              <div className="grid grid-cols-5 gap-2">
                {[
                  { label: "Total", value: accountsSummary.total, color: "text-surface-900 bg-surface-50" },
                  { label: "Disponible", value: accountsSummary.available, color: "text-green-700 bg-green-50" },
                  { label: "Vendido", value: accountsSummary.sold, color: "text-blue-700 bg-blue-50" },
                  { label: "Suspendido", value: accountsSummary.suspended, color: "text-orange-700 bg-orange-50" },
                  { label: "Expirado", value: accountsSummary.expired, color: "text-red-700 bg-red-50" },
                ].map((stat) => (
                  <div key={stat.label} className={cn("rounded-lg p-2.5 text-center", stat.color)}>
                    <div className="text-lg font-bold">{stat.value}</div>
                    <div className="text-[10px] font-medium uppercase tracking-wide opacity-70">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Streaming Mode Info */}
            {accountsModalProduct && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
                {accountsModalProduct.streamingMode === "PROFILE" ? (
                  <>
                    <Users className="size-4 shrink-0" />
                    <span>Modo: <strong>Por perfil</strong> — cada cuenta tiene {accountsModalProduct.profileCount ?? "N"} perfiles vendibles</span>
                  </>
                ) : (
                  <>
                    <Monitor className="size-4 shrink-0" />
                    <span>Modo: <strong>Cuenta completa</strong> — cada cuenta se vende como unidad</span>
                  </>
                )}
              </div>
            )}

            {/* Edit Account Form */}
            {editingAccount && (
              <div className="space-y-3 rounded-xl border-2 border-amber-300 bg-amber-50/50 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                    <Pencil className="size-4" />
                    Editando cuenta
                  </h4>
                  <button
                    onClick={() => { setEditingAccount(null); setAccountForm({ email: "", username: "", password: "", expiresAt: "" }); }}
                    className="text-surface-400 hover:text-surface-600"
                  >
                    <XIcon className="size-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    label="Correo electronico"
                    placeholder="cuenta@email.com"
                    value={accountForm.email}
                    onChange={(e) => setAccountForm((prev) => ({ ...prev, email: e.target.value }))}
                    iconLeft={<Mail className="size-4" />}
                  />
                  <Input
                    label="Usuario"
                    placeholder="nombre_usuario"
                    value={accountForm.username}
                    onChange={(e) => setAccountForm((prev) => ({ ...prev, username: e.target.value }))}
                    iconLeft={<User className="size-4" />}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    label="Nueva contrasena"
                    placeholder="Dejar vacio para no cambiar"
                    value={accountForm.password}
                    onChange={(e) => setAccountForm((prev) => ({ ...prev, password: e.target.value }))}
                    iconLeft={<Lock className="size-4" />}
                  />
                  <Input
                    label="Fecha de expiracion"
                    type="date"
                    value={accountForm.expiresAt}
                    onChange={(e) => setAccountForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
                    iconLeft={<CalendarDays className="size-4" />}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setEditingAccount(null); setAccountForm({ email: "", username: "", password: "", expiresAt: "" }); }}>
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={handleAccountEdit} disabled={accountSaving}>
                    {accountSaving ? <Loader2 className="size-4 animate-spin" /> : "Guardar cambios"}
                  </Button>
                </div>
              </div>
            )}

            {/* Accounts List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-surface-700">
                  Listado de cuentas
                </h4>
                <select
                  value={accountsStatusFilter}
                  onChange={(e) => setAccountsStatusFilter(e.target.value)}
                  className="rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs text-surface-700 focus:border-primary-500 focus:outline-none"
                >
                  <option value="">Todos</option>
                  <option value="AVAILABLE">Disponible</option>
                  <option value="SOLD">Vendido</option>
                  <option value="SUSPENDED">Suspendido</option>
                  <option value="EXPIRED">Expirado</option>
                </select>
              </div>

              {accountsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="size-6 animate-spin text-primary-500" />
                </div>
              ) : filteredAccounts.length === 0 ? (
                <div className="rounded-lg border border-surface-200 bg-surface-50 py-8 text-center text-sm text-surface-400">
                  {accountsList.length === 0 ? "No hay cuentas registradas" : "No hay cuentas con este estado"}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAccounts.map((account) => (
                    <div
                      key={account.id}
                      className={cn(
                        "rounded-lg border bg-white p-3 transition-all",
                        account.status === "SUSPENDED" ? "border-orange-200 bg-orange-50/30" : "border-surface-200"
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-100 text-surface-500">
                            <Mail className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-surface-900">
                              {account.email ?? "—"}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-surface-500">
                              {account.username && <span>@{account.username}</span>}
                              {account.expiresAt && (
                                <span className="flex items-center gap-1">
                                  <CalendarDays className="size-3" />
                                  {new Date(account.expiresAt).toLocaleDateString()}
                                </span>
                              )}
                              {accountsModalProduct?.streamingMode === "PROFILE" && (
                                <span className="flex items-center gap-1">
                                  <Users className="size-3" />
                                  {account.soldProfiles}/{account.maxProfiles} perfiles
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            account.status === "AVAILABLE" && "bg-green-100 text-green-700",
                            account.status === "SOLD" && "bg-blue-100 text-blue-700",
                            account.status === "SUSPENDED" && "bg-orange-100 text-orange-700",
                            account.status === "EXPIRED" && "bg-red-100 text-red-700",
                          )}>
                            <CircleDot className="size-2.5" />
                            {account.status === "AVAILABLE" ? "Disponible" :
                             account.status === "SOLD" ? "Vendido" :
                             account.status === "SUSPENDED" ? "Suspendido" : "Expirado"}
                          </span>

                          {/* Edit button (not for sold accounts) */}
                          {account.status !== "SOLD" && (
                            <button
                              onClick={() => startEditAccount(account)}
                              className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-700"
                              title="Editar"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                          )}

                          {/* Suspend / Resume */}
                          {account.status === "AVAILABLE" && (
                            <button
                              onClick={() => handleAccountAction(account.id, "suspend")}
                              disabled={accountSaving}
                              className="rounded-lg p-1.5 text-orange-500 transition-colors hover:bg-orange-50 hover:text-orange-700"
                              title="Suspender"
                            >
                              <PauseCircle className="size-3.5" />
                            </button>
                          )}
                          {account.status === "SUSPENDED" && (
                            <button
                              onClick={() => handleAccountAction(account.id, "resume")}
                              disabled={accountSaving}
                              className="rounded-lg p-1.5 text-green-500 transition-colors hover:bg-green-50 hover:text-green-700"
                              title="Reactivar"
                            >
                              <PlayCircle className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => {
                setAccountsModalProduct(null);
                setAccountsList([]);
                setAccountsSummary(null);
                setEditingAccount(null);
              }}>
                Cerrar
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
