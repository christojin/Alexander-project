"use client";

import { useState, useMemo } from "react";
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
import { products as initialProducts } from "@/data/mock/products";
import type { Product, ProductType } from "@/types";
import { formatCurrency, cn, generateId } from "@/lib/utils";

const SELLER_ID = "seller-1";
const SELLER_NAME = "DigitalKeys Bolivia";

const categoryOptions = [
  { value: "cat-1", label: "Streaming" },
  { value: "cat-2", label: "Gaming" },
  { value: "cat-3", label: "Juegos Moviles" },
  { value: "cat-4", label: "Tiendas Online" },
];

const categoryNameMap: Record<string, string> = {
  "cat-1": "Streaming",
  "cat-2": "Gaming",
  "cat-3": "Juegos Moviles",
  "cat-4": "Tiendas Online",
};

const regionOptions = [
  { value: "Global", label: "Global" },
  { value: "USA", label: "USA" },
  { value: "Latinoamerica", label: "Latinoamerica" },
  { value: "Europa", label: "Europa" },
];

const platformOptions = [
  { value: "Netflix", label: "Netflix" },
  { value: "Spotify", label: "Spotify" },
  { value: "PlayStation Store", label: "PlayStation Store" },
  { value: "Steam", label: "Steam" },
  { value: "Xbox", label: "Xbox" },
  { value: "Amazon", label: "Amazon" },
  { value: "Roblox", label: "Roblox" },
  { value: "Free Fire", label: "Free Fire" },
  { value: "PUBG Mobile", label: "PUBG Mobile" },
  { value: "Disney+", label: "Disney+" },
  { value: "Otro", label: "Otro" },
];

const deliveryOptions = [
  { value: "instant", label: "Instantanea" },
  { value: "manual", label: "Manual" },
];

interface ProductForm {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  region: string;
  platform: string;
  deliveryType: "instant" | "manual";
  productType: ProductType;
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
  categoryId: "",
  region: "",
  platform: "",
  deliveryType: "instant",
  productType: "gift_card",
  digitalCodes: "",
  streamingEmail: "",
  streamingUsername: "",
  streamingPassword: "",
  streamingExpiration: "",
};

export default function SellerProductsPage() {
  const [productsList, setProductsList] = useState<Product[]>(
    initialProducts.filter((p) => p.sellerId === SELLER_ID)
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFileName, setImportFileName] = useState("");

  const filteredProducts = useMemo(() => {
    return productsList.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        !categoryFilter || p.categoryId === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [productsList, searchQuery, categoryFilter]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      categoryId: product.categoryId,
      region: product.region,
      platform: product.platform,
      deliveryType: product.deliveryType,
      productType: product.productType,
      digitalCodes: "",
      streamingEmail: "",
      streamingUsername: "",
      streamingPassword: "",
      streamingExpiration: "",
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name || !form.price || !form.categoryId) return;

    const codes = form.digitalCodes
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean);

    const stockAdded =
      form.productType === "streaming"
        ? form.streamingEmail && form.streamingPassword
          ? 1
          : 0
        : codes.length;

    if (editingProduct) {
      setProductsList((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                name: form.name,
                slug: form.name.toLowerCase().replace(/\s+/g, "-"),
                description: form.description,
                price: parseFloat(form.price),
                categoryId: form.categoryId,
                categoryName: categoryNameMap[form.categoryId] || "",
                region: form.region,
                platform: form.platform,
                deliveryType: form.deliveryType,
                productType: form.productType,
                stockCount: p.stockCount + stockAdded,
              }
            : p
        )
      );
    } else {
      const newProduct: Product = {
        id: `prod-${generateId()}`,
        name: form.name,
        slug: form.name.toLowerCase().replace(/\s+/g, "-"),
        description: form.description,
        price: parseFloat(form.price),
        categoryId: form.categoryId,
        categoryName: categoryNameMap[form.categoryId] || "",
        sellerId: SELLER_ID,
        sellerName: SELLER_NAME,
        sellerRating: 4.8,
        sellerVerified: true,
        sellerSales: 0,
        sellerJoined: new Date().toISOString(),
        image: "/images/placeholder.svg",
        brand: form.platform,
        region: form.region,
        platform: form.platform,
        stockCount: stockAdded,
        soldCount: 0,
        isActive: true,
        isFeatured: false,
        deliveryType: form.deliveryType,
        productType: form.productType,
        createdAt: new Date().toISOString(),
      };
      setProductsList((prev) => [newProduct, ...prev]);
    }

    setModalOpen(false);
    setEditingProduct(null);
    setForm(emptyForm);
  };

  const handleDelete = (productId: string) => {
    setProductsList((prev) => prev.filter((p) => p.id !== productId));
    setDeleteConfirm(null);
  };

  const toggleActive = (productId: string) => {
    setProductsList((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, isActive: !p.isActive } : p
      )
    );
  };

  const updateForm = (field: keyof ProductForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

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
                      variant={product.productType === "streaming" ? "warning" : "info"}
                      size="sm"
                    >
                      {product.productType === "streaming" ? (
                        <span className="flex items-center gap-1"><Tv className="size-3" /> Streaming</span>
                      ) : (
                        <span className="flex items-center gap-1"><Gift className="size-3" /> Gift Card</span>
                      )}
                    </Badge>
                  </div>
                  <div className="absolute right-3 top-3 flex gap-2">
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
                    {product.categoryName}
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
                    <span>{product.region}</span>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex items-center gap-2 border-t border-surface-100 pt-4">
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
                      onClick={() => toggleActive(product.id)}
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
          }}
          title={editingProduct ? "Editar producto" : "Agregar producto"}
          size="lg"
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
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
              <Select
                label="Categoria"
                options={categoryOptions}
                placeholder="Selecciona una categoria"
                value={form.categoryId}
                onChange={(e) => updateForm("categoryId", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Select
                label="Region"
                options={regionOptions}
                placeholder="Selecciona region"
                value={form.region}
                onChange={(e) => updateForm("region", e.target.value)}
              />
              <Select
                label="Plataforma"
                options={platformOptions}
                placeholder="Selecciona plataforma"
                value={form.platform}
                onChange={(e) => updateForm("platform", e.target.value)}
              />
              <Select
                label="Tipo de entrega"
                options={deliveryOptions}
                value={form.deliveryType}
                onChange={(e) =>
                  updateForm("deliveryType", e.target.value)
                }
              />
            </div>
            {/* Product Type Selector */}
            <div>
              <label className="mb-2 block text-sm font-medium text-surface-700">
                Tipo de producto
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateForm("productType", "gift_card")}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all",
                    form.productType === "gift_card"
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
                  onClick={() => updateForm("productType", "streaming")}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all",
                    form.productType === "streaming"
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
            {form.productType === "gift_card" ? (
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
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editingProduct ? "Guardar cambios" : "Crear producto"}
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
