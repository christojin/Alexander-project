"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Package,
  Search,
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
  productType: "GIFT_CARD" | "STREAMING";
  digitalCodes: string;
  streamingEmail: string;
  streamingUsername: string;
  streamingPassword: string;
  streamingExpiration: string;
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
  streamingEmail: "",
  streamingUsername: "",
  streamingPassword: "",
  streamingExpiration: "",
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
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFileName, setImportFileName] = useState("");
  const [promotionQuota, setPromotionQuota] = useState(0);
  const [promotionUsed, setPromotionUsed] = useState(0);
  const [offersQuota, setOffersQuota] = useState(0);
  const [offersUsed, setOffersUsed] = useState(0);
  const [togglingPromotion, setTogglingPromotion] = useState<string | null>(null);
  const [togglingOffer, setTogglingOffer] = useState<string | null>(null);

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
      productType: product.productType === "STREAMING" ? "STREAMING" : "GIFT_CARD",
      digitalCodes: "",
      streamingEmail: "",
      streamingUsername: "",
      streamingPassword: "",
      streamingExpiration: "",
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
      const productData = {
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
      if (form.productType === "GIFT_CARD" && form.digitalCodes.trim()) {
        const codes = form.digitalCodes
          .split("\n")
          .map((c) => c.trim())
          .filter(Boolean);

        if (codes.length > 0) {
          const codesRes = await fetch(
            `/api/seller/products/${savedProduct.id}/codes`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ codes }),
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
            <Button variant="outline" iconLeft={<FileSpreadsheet />} onClick={() => setImportModalOpen(true)}>
              Importar CSV
            </Button>
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
                      variant={product.productType === "STREAMING" ? "warning" : "info"}
                      size="sm"
                    >
                      {product.productType === "STREAMING" ? (
                        <span className="flex items-center gap-1"><Tv className="size-3" /> Streaming</span>
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
                  <div className="mt-3 flex items-center gap-2 border-t border-surface-100 pt-3">
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto text-red-600 hover:bg-red-50 hover:text-red-700"
                      iconLeft={<Trash2 />}
                      onClick={() => setDeleteConfirm(product.id)}
                    >
                      Eliminar
                    </Button>
                  </div>
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
              <div className="grid grid-cols-2 gap-3">
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
                    <div className="text-sm font-semibold">Gift Card / Codigo</div>
                    <div className="text-xs opacity-70">Codigos digitales unicos</div>
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
                    <div className="text-xs opacity-70">Credenciales de cuenta</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Type-specific stock entry */}
            {form.productType === "GIFT_CARD" ? (
              <div>
                <Textarea
                  label="Codigos digitales"
                  placeholder="Pega los codigos aqui, uno por linea..."
                  helperText="Un codigo por linea. Se sumaran al stock actual del producto."
                  value={form.digitalCodes}
                  onChange={(e) => updateForm("digitalCodes", e.target.value)}
                  className="min-h-[120px] font-mono text-xs"
                />
              </div>
            ) : (
              <div className="space-y-3 rounded-xl border border-surface-200 bg-surface-50 p-4">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-surface-700">
                  <Lock className="size-4" />
                  Credenciales de streaming
                </h4>
                <p className="text-xs text-surface-500">
                  Ingresa las credenciales de la cuenta que se entregara al comprador.
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
              Estas seguro de que deseas eliminar este producto? Esta accion no
              se puede deshacer.
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

        {/* CSV/Excel Import Modal */}
        <Modal
          open={importModalOpen}
          onClose={() => {
            setImportModalOpen(false);
            setImportFileName("");
          }}
          title="Importar productos"
          size="md"
        >
          <div className="space-y-5">
            <p className="text-sm text-surface-600">
              Sube un archivo CSV o Excel con los datos de tus productos. El archivo debe contener las columnas: nombre, precio, categoria, region, plataforma, tipo de entrega.
            </p>

            {/* Drop zone */}
            <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-surface-300 bg-surface-50 px-6 py-10 transition-colors hover:border-primary-400 hover:bg-primary-50/30">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 text-surface-400">
                <Upload className="h-6 w-6" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-surface-700">
                  Arrastra tu archivo aqui o haz clic para seleccionar
                </p>
                <p className="mt-1 text-xs text-surface-400">
                  Formatos aceptados: .csv, .xlsx
                </p>
              </div>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={() => setImportFileName("productos_catalogo.csv")}
              />
            </label>

            {/* Selected file */}
            {importFileName && (
              <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                <span className="text-sm font-medium text-green-800">{importFileName}</span>
                <button
                  onClick={() => setImportFileName("")}
                  className="ml-auto text-green-500 hover:text-green-700 transition-colors"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <a href="#" className="inline-flex text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
              Descargar plantilla de ejemplo
            </a>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setImportModalOpen(false);
                  setImportFileName("");
                }}
              >
                Cancelar
              </Button>
              <Button
                disabled={!importFileName}
                onClick={() => {
                  setImportModalOpen(false);
                  setImportFileName("");
                }}
              >
                Importar productos
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
