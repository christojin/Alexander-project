import type { Product, ProductType } from "@/types";

/**
 * Transform a Prisma product (from API) to the frontend Product type.
 * This bridges the DB schema with the existing UI components.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toFrontendProduct(apiProduct: any): Product {
  const productTypeMap: Record<string, ProductType> = {
    GIFT_CARD: "gift_card",
    STREAMING: "streaming",
    TOP_UP: "topup",
    MANUAL: "gift_card",
  };

  const deliveryTypeMap: Record<string, "instant" | "manual"> = {
    INSTANT: "instant",
    MANUAL: "manual",
  };

  const streamingModeMap: Record<string, "complete_account" | "profile_sharing"> = {
    COMPLETE_ACCOUNT: "complete_account",
    PROFILE: "profile_sharing",
  };

  return {
    id: apiProduct.id,
    name: apiProduct.name,
    slug: apiProduct.slug,
    description: apiProduct.description,
    price: apiProduct.price,
    originalPrice: apiProduct.originalPrice ?? undefined,
    categoryId: apiProduct.categoryId,
    categoryName: apiProduct.category?.name ?? "",
    sellerId: apiProduct.sellerId,
    sellerName: apiProduct.seller?.storeName ?? apiProduct.seller?.user?.name ?? "",
    sellerRating: apiProduct.seller?.rating ?? 0,
    sellerVerified: apiProduct.seller?.isVerified ?? false,
    sellerSales: apiProduct.seller?.totalSales ?? 0,
    sellerJoined: apiProduct.seller?.user?.createdAt ?? "",
    image: apiProduct.image ?? apiProduct.brand?.logo ?? "/images/placeholder.svg",
    brand: apiProduct.brand?.name ?? "",
    region: apiProduct.region?.name ?? "",
    regionFlag: apiProduct.region?.flagEmoji ?? undefined,
    platform: apiProduct.brand?.name ?? "",
    stockCount: apiProduct.stockCount,
    soldCount: apiProduct.soldCount,
    isActive: apiProduct.isActive,
    isFeatured: apiProduct.isPromoted ?? false,
    deliveryType: deliveryTypeMap[apiProduct.deliveryType] ?? "instant",
    productType: productTypeMap[apiProduct.productType] ?? "gift_card",
    streamingMode: apiProduct.streamingMode
      ? streamingModeMap[apiProduct.streamingMode]
      : undefined,
    streamingMaxProfiles: apiProduct.profileCount ?? undefined,
    createdAt: apiProduct.createdAt,
  };
}

/**
 * Transform an array of API products to frontend Products.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toFrontendProducts(apiProducts: any[]): Product[] {
  return apiProducts.map(toFrontendProduct);
}
