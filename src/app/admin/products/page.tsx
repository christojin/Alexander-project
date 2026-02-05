"use client";

import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout";
import { products as mockProducts } from "@/data/mock/products";
import { categories } from "@/data/mock/categories";
import { sellers } from "@/data/mock/users";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { Product } from "@/types";
import {
  Search,
  Filter,
  Pencil,
  Trash2,
  X,
  Package,
  Eye,
  EyeOff,
  ImageIcon,
} from "lucide-react";

export default function AdminProductsPage() {
  const [productList, setProductList] = useState<Product[]>(mockProducts);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSeller, setFilterSeller] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const filteredProducts = useMemo(() => {
    let list = productList;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sellerName.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      );
    }
    if (filterCategory) {
      list = list.filter((p) => p.categoryId === filterCategory);
    }
    if (filterSeller) {
      list = list.filter((p) => p.sellerId === filterSeller);
    }
    if (filterStatus === "active") {
      list = list.filter((p) => p.isActive);
    } else if (filterStatus === "inactive") {
      list = list.filter((p) => !p.isActive);
    }
    return list;
  }, [productList, search, filterCategory, filterSeller, filterStatus]);

  const handleToggleActive = (productId: string) => {
    setProductList((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, isActive: !p.isActive } : p
      )
    );
  };

  const handleEditProduct = () => {
    if (!editingProduct) return;
    setProductList((prev) =>
      prev.map((p) => (p.id === editingProduct.id ? editingProduct : p))
    );
    setEditingProduct(null);
  };

  const handleDeleteProduct = (productId: string) => {
    setProductList((prev) => prev.filter((p) => p.id !== productId));
    setDeleteConfirm(null);
  };

  const activeCount = productList.filter((p) => p.isActive).length;
  const inactiveCount = productList.filter((p) => !p.isActive).length;
  const totalStock = productList.reduce((s, p) => s + p.stockCount, 0);

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Gestion de productos
          </h1>
          <p className="mt-1 text-slate-500">
            Administra todos los productos de la plataforma
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Total productos</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {productList.length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Activos</p>
            <p className="mt-1 text-2xl font-bold text-green-600">
              {activeCount}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Inactivos</p>
            <p className="mt-1 text-2xl font-bold text-red-600">
              {inactiveCount}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Stock total</p>
            <p className="mt-1 text-2xl font-bold text-indigo-600">
              {totalStock}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, vendedor o marca..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                showFilters
                  ? "border-indigo-200 bg-indigo-50 text-indigo-600"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              )}
            >
              <Filter className="h-4 w-4" />
              Filtros
            </button>
          </div>
          {showFilters && (
            <div className="flex flex-wrap gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Todas las categorias</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={filterSeller}
                onChange={(e) => setFilterSeller(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Todos los vendedores</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.storeName}
                  </option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Todos los estados</option>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
              {(filterCategory || filterSeller || filterStatus) && (
                <button
                  onClick={() => {
                    setFilterCategory("");
                    setFilterSeller("");
                    setFilterStatus("");
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>

        {/* Table */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Vendedor
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Vendidos
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="transition-colors hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                          <ImageIcon className="h-5 w-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {product.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {product.brand} -- {product.region}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <p className="text-sm font-medium text-slate-700">
                        {product.sellerName}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        {product.categoryName}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {formatCurrency(product.price)}
                        </p>
                        {product.originalPrice && (
                          <p className="text-xs text-slate-400 line-through">
                            {formatCurrency(product.originalPrice)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          product.stockCount < 10
                            ? "text-red-600"
                            : product.stockCount < 30
                            ? "text-amber-600"
                            : "text-slate-900"
                        )}
                      >
                        {product.stockCount}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                      {product.soldCount}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(product.id)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                          product.isActive
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-red-100 text-red-700 hover:bg-red-200"
                        )}
                      >
                        {product.isActive ? (
                          <Eye className="h-3 w-3" />
                        ) : (
                          <EyeOff className="h-3 w-3" />
                        )}
                        {product.isActive ? "Activo" : "Inactivo"}
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingProduct({ ...product })}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(product.id)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-sm text-slate-500"
                    >
                      No se encontraron productos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Editar producto
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Nombre
                </label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct((prev) =>
                      prev ? { ...prev, name: e.target.value } : null
                    )
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Descripcion
                </label>
                <textarea
                  value={editingProduct.description}
                  onChange={(e) =>
                    setEditingProduct((prev) =>
                      prev ? { ...prev, description: e.target.value } : null
                    )
                  }
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Precio
                  </label>
                  <input
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) =>
                      setEditingProduct((prev) =>
                        prev
                          ? { ...prev, price: Number(e.target.value) }
                          : null
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    min={0}
                    step={0.01}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={editingProduct.stockCount}
                    onChange={(e) =>
                      setEditingProduct((prev) =>
                        prev
                          ? { ...prev, stockCount: Number(e.target.value) }
                          : null
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    min={0}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Categoria
                </label>
                <select
                  value={editingProduct.categoryId}
                  onChange={(e) => {
                    const cat = categories.find(
                      (c) => c.id === e.target.value
                    );
                    setEditingProduct((prev) =>
                      prev
                        ? {
                            ...prev,
                            categoryId: e.target.value,
                            categoryName: cat?.name || prev.categoryName,
                          }
                        : null
                    );
                  }}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Marca
                  </label>
                  <input
                    type="text"
                    value={editingProduct.brand}
                    onChange={(e) =>
                      setEditingProduct((prev) =>
                        prev ? { ...prev, brand: e.target.value } : null
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Region
                  </label>
                  <input
                    type="text"
                    value={editingProduct.region}
                    onChange={(e) =>
                      setEditingProduct((prev) =>
                        prev ? { ...prev, region: e.target.value } : null
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="edit-prod-active"
                  checked={editingProduct.isActive}
                  onChange={(e) =>
                    setEditingProduct((prev) =>
                      prev ? { ...prev, isActive: e.target.checked } : null
                    )
                  }
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label
                  htmlFor="edit-prod-active"
                  className="text-sm text-slate-700"
                >
                  Producto activo
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="edit-prod-featured"
                  checked={editingProduct.isFeatured}
                  onChange={(e) =>
                    setEditingProduct((prev) =>
                      prev ? { ...prev, isFeatured: e.target.checked } : null
                    )
                  }
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label
                  htmlFor="edit-prod-featured"
                  className="text-sm text-slate-700"
                >
                  Producto destacado
                </label>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">
                  Vendedor: <span className="font-medium text-slate-700">{editingProduct.sellerName}</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Creado: <span className="font-medium text-slate-700">{formatDate(editingProduct.createdAt)}</span>
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setEditingProduct(null)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleEditProduct}
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
              >
                Guardar cambios
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
              Eliminar producto
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Esta seguro de que desea eliminar este producto? Esta accion no se
              puede deshacer.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteProduct(deleteConfirm)}
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
