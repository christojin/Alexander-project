"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout";
import { cn, formatCurrency } from "@/lib/utils";
import {
  Gamepad2,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Upload,
  DollarSign,
  Package,
  TrendingUp,
  Gift,
  Coins,
  Edit3,
  ExternalLink,
} from "lucide-react";

interface VemperProductData {
  id: string;
  vemperProductId: string;
  name: string;
  type: "GIFT_CARD" | "TOP_UP";
  costPrice: number;
  salePrice: number;
  denominations: number[] | null;
  requiredFields: string[] | null;
  image: string | null;
  categoryId: string | null;
  regionId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { vemperOrders: number; products: number };
  products: { id: string; name: string; isActive: boolean; price: number; slug: string }[];
  stats: { totalProfit: number; totalOrders: number };
}

export default function AdminVemperPage() {
  const [products, setProducts] = useState<VemperProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    created: number;
    updated: number;
    total: number;
  } | null>(null);
  const [syncError, setSyncError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [publishing, setPublishing] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/vemper/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
      }
    } catch {
      // Failed silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    setSyncError("");
    try {
      const res = await fetch("/api/admin/vemper/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSyncResult(data);
        fetchProducts();
      } else {
        setSyncError(data.error ?? "Error al sincronizar");
      }
    } catch {
      setSyncError("Error de conexion");
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdatePrice = async (id: string) => {
    const salePrice = parseFloat(editPrice);
    if (isNaN(salePrice) || salePrice <= 0) return;

    try {
      const res = await fetch(`/api/admin/vemper/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salePrice }),
      });
      if (res.ok) {
        setEditingId(null);
        setEditPrice("");
        fetchProducts();
      }
    } catch {
      // Failed silently
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/admin/vemper/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      fetchProducts();
    } catch {
      // Failed silently
    }
  };

  const handlePublish = async (id: string) => {
    setPublishing(id);
    try {
      // Get first available seller and category for auto-publishing
      const [sellersRes, categoriesRes] = await Promise.all([
        fetch("/api/admin/users?role=seller&limit=1"),
        fetch("/api/admin/categories"),
      ]);

      let sellerId = "";
      let categoryId = "";

      if (sellersRes.ok) {
        const data = await sellersRes.json();
        const seller = data.users?.[0];
        if (seller?.sellerProfile?.id) {
          sellerId = seller.sellerProfile.id;
        }
      }

      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        const category = data.categories?.[0];
        if (category?.id) {
          categoryId = category.id;
        }
      }

      if (!sellerId || !categoryId) {
        alert(
          "Se necesita al menos un vendedor verificado y una categoria para publicar."
        );
        return;
      }

      const res = await fetch(`/api/admin/vemper/products/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId, categoryId }),
      });

      if (res.ok) {
        fetchProducts();
      } else {
        const data = await res.json();
        alert(data.error ?? "Error al publicar");
      }
    } catch {
      // Failed silently
    } finally {
      setPublishing(null);
    }
  };

  // Summary stats
  const totalProducts = products.length;
  const publishedProducts = products.filter((p) => p.products.length > 0).length;
  const totalProfit = products.reduce((sum, p) => sum + p.stats.totalProfit, 0);
  const totalOrders = products.reduce(
    (sum, p) => sum + p.stats.totalOrders,
    0
  );

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-surface-900 flex items-center gap-2">
              <Gamepad2 className="h-7 w-7 text-primary-500" />
              Vemper Games
            </h1>
            <p className="text-sm text-surface-500 mt-1">
              Catalogo de productos y ordenes de Vemper Games API
            </p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Sincronizar catalogo
          </button>
        </div>

        {/* Sync Result */}
        {syncResult && (
          <div className="flex items-center gap-3 rounded-xl bg-accent-50 border border-accent-200 px-4 py-3 text-sm text-accent-800">
            <CheckCircle2 className="h-5 w-5 text-accent-600 shrink-0" />
            <span>
              Sincronizacion exitosa: {syncResult.created} nuevos,{" "}
              {syncResult.updated} actualizados, {syncResult.total} total
            </span>
          </div>
        )}
        {syncError && (
          <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            <XCircle className="h-5 w-5 text-red-500 shrink-0" />
            <span>{syncError}</span>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-surface-200 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900">
                  {totalProducts}
                </p>
                <p className="text-xs text-surface-500">Productos Vemper</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-surface-200 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900">
                  {publishedProducts}
                </p>
                <p className="text-xs text-surface-500">Publicados</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-surface-200 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900">
                  {formatCurrency(totalProfit)}
                </p>
                <p className="text-xs text-surface-500">Ganancia total</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-surface-200 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-surface-900">
                  {totalOrders}
                </p>
                <p className="text-xs text-surface-500">Ordenes completadas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
          <div className="border-b border-surface-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-surface-900">
              Catalogo de productos
            </h2>
          </div>

          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Gamepad2 className="h-12 w-12 text-surface-200 mb-3" />
              <p className="text-sm font-medium text-surface-500">
                No hay productos Vemper
              </p>
              <p className="text-xs text-surface-400 mt-1">
                Haz clic en &quot;Sincronizar catalogo&quot; para importar
                productos
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-50 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Producto</th>
                    <th className="px-6 py-3">Tipo</th>
                    <th className="px-6 py-3">Costo</th>
                    <th className="px-6 py-3">Precio venta</th>
                    <th className="px-6 py-3">Margen</th>
                    <th className="px-6 py-3">Estado</th>
                    <th className="px-6 py-3">Publicado</th>
                    <th className="px-6 py-3">Ordenes</th>
                    <th className="px-6 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {products.map((product) => {
                    const margin =
                      product.costPrice > 0
                        ? Math.round(
                            ((product.salePrice - product.costPrice) /
                              product.costPrice) *
                              100
                          )
                        : 0;
                    const isPublished = product.products.length > 0;

                    return (
                      <tr
                        key={product.id}
                        className="hover:bg-surface-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-100 text-surface-500">
                              {product.type === "GIFT_CARD" ? (
                                <Gift className="h-4 w-4" />
                              ) : (
                                <Coins className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-surface-900">
                                {product.name}
                              </p>
                              <p className="text-xs text-surface-400">
                                {product.vemperProductId}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                              product.type === "GIFT_CARD"
                                ? "bg-sky-50 text-sky-700"
                                : "bg-purple-50 text-purple-700"
                            )}
                          >
                            {product.type === "GIFT_CARD"
                              ? "Gift Card"
                              : "Top-Up"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-surface-600">
                          {formatCurrency(product.costPrice)}
                        </td>
                        <td className="px-6 py-4">
                          {editingId === product.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="0.01"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                className="w-20 rounded border border-surface-300 px-2 py-1 text-sm"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    handleUpdatePrice(product.id);
                                  if (e.key === "Escape") setEditingId(null);
                                }}
                                autoFocus
                              />
                              <button
                                onClick={() => handleUpdatePrice(product.id)}
                                className="rounded bg-primary-600 px-2 py-1 text-xs text-white hover:bg-primary-700"
                              >
                                OK
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingId(product.id);
                                setEditPrice(product.salePrice.toString());
                              }}
                              className="flex items-center gap-1 text-sm text-surface-900 hover:text-primary-600"
                            >
                              {formatCurrency(product.salePrice)}
                              <Edit3 className="h-3 w-3 text-surface-400" />
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              "text-sm font-medium",
                              margin >= 20
                                ? "text-accent-600"
                                : margin >= 10
                                ? "text-amber-600"
                                : "text-red-600"
                            )}
                          >
                            {margin}%
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() =>
                              handleToggleActive(product.id, product.isActive)
                            }
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer transition-colors",
                              product.isActive
                                ? "bg-accent-50 text-accent-700 hover:bg-accent-100"
                                : "bg-surface-100 text-surface-500 hover:bg-surface-200"
                            )}
                          >
                            {product.isActive ? "Activo" : "Inactivo"}
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          {isPublished ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-700">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Si
                            </span>
                          ) : (
                            <span className="text-xs text-surface-400">No</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-surface-600">
                          {product.stats.totalOrders}
                          {product.stats.totalProfit > 0 && (
                            <span className="text-xs text-accent-600 ml-1">
                              (+{formatCurrency(product.stats.totalProfit)})
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            {!isPublished && (
                              <button
                                onClick={() => handlePublish(product.id)}
                                disabled={
                                  publishing === product.id ||
                                  !product.isActive
                                }
                                className="flex items-center gap-1 rounded-lg bg-primary-50 px-2.5 py-1.5 text-xs font-medium text-primary-700 hover:bg-primary-100 transition-colors disabled:opacity-50"
                              >
                                {publishing === product.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Upload className="h-3 w-3" />
                                )}
                                Publicar
                              </button>
                            )}
                            {isPublished && product.products[0] && (
                              <a
                                href={`/products/${product.products[0].slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 rounded-lg bg-surface-50 px-2.5 py-1.5 text-xs font-medium text-surface-600 hover:bg-surface-100 transition-colors"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Ver
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
