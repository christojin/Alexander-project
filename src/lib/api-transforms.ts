import type { Product, ProductType, Order, Ticket, TicketMessage } from "@/types";

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
    name: apiProduct.name ?? "",
    slug: apiProduct.slug ?? "",
    description: apiProduct.description ?? "",
    price: Number(apiProduct.price) || 0,
    originalPrice: apiProduct.originalPrice != null ? Number(apiProduct.originalPrice) : undefined,
    categoryId: apiProduct.categoryId ?? "",
    categoryName: apiProduct.category?.name ?? "",
    sellerId: apiProduct.sellerId ?? "",
    sellerName: apiProduct.seller?.storeName ?? apiProduct.seller?.user?.name ?? "",
    sellerRating: Number(apiProduct.seller?.rating) || 0,
    sellerVerified: apiProduct.seller?.isVerified ?? false,
    sellerSales: Number(apiProduct.seller?.totalSales) || 0,
    sellerJoined: apiProduct.seller?.user?.createdAt ?? "",
    image: apiProduct.image ?? apiProduct.brand?.logo ?? "/images/placeholder.svg",
    brand: apiProduct.brand?.name ?? "",
    region: apiProduct.region?.name ?? "",
    regionCode: apiProduct.region?.code ?? undefined,
    regionFlag: apiProduct.region?.flagEmoji ?? undefined,
    platform: apiProduct.brand?.name ?? "",
    stockCount: Number(apiProduct.stockCount) || 0,
    soldCount: Number(apiProduct.soldCount) || 0,
    isActive: apiProduct.isActive ?? true,
    isFeatured: apiProduct.isPromoted ?? false,
    deliveryType: deliveryTypeMap[apiProduct.deliveryType] ?? "instant",
    productType: productTypeMap[apiProduct.productType] ?? "gift_card",
    streamingMode: apiProduct.streamingMode
      ? streamingModeMap[apiProduct.streamingMode]
      : undefined,
    streamingMaxProfiles: apiProduct.profileCount != null ? Number(apiProduct.profileCount) : undefined,
    createdAt: apiProduct.createdAt ?? "",
  };
}

/**
 * Transform an array of API products to frontend Products.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toFrontendProducts(apiProducts: any[]): Product[] {
  return apiProducts.map(toFrontendProduct);
}

// ── Order transforms ──────────────────────────────────────────

const orderStatusMap: Record<string, string> = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
  UNDER_REVIEW: "under_review",
};

const paymentMethodMap: Record<string, string> = {
  STRIPE: "stripe",
  QR_BOLIVIA: "qr_bolivia",
  BINANCE_PAY: "binance_pay",
  CRYPTO: "crypto",
  WALLET: "wallet",
};

const paymentStatusMap: Record<string, string> = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
};

const orderProductTypeMap: Record<string, string> = {
  GIFT_CARD: "gift_card",
  STREAMING: "streaming",
  TOP_UP: "topup",
  MANUAL: "gift_card",
};

/**
 * Flatten a Prisma Order (with items, buyer, seller, codes) into
 * one or more frontend Order objects (one per OrderItem).
 *
 * Expects the Prisma order to include:
 *   buyer, seller.user, items.giftCardCodes, items.streamingProfiles.streamingAccount, payment
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toFrontendOrders(prismaOrder: any): Order[] {
  const items = prismaOrder.items ?? [];
  if (items.length === 0) {
    // Return a single order entry even if no items
    return [buildFlatOrder(prismaOrder, null)];
  }
  return items.map((item: Record<string, unknown>) => buildFlatOrder(prismaOrder, item));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildFlatOrder(order: any, item: any): Order {
  const itemCount = order.items?.length ?? 1;
  // Proportional share of order-level amounts for multi-item orders
  const itemShare = item ? (Number(item.totalPrice) / Number(order.subtotal)) : 1;
  const totalAmount = item ? Number(item.totalPrice) : Number(order.totalAmount);
  const commissionAmount = Number(order.commissionAmount) * itemShare;
  const sellerEarnings = Number(order.sellerEarnings) * itemShare;

  // Extract digital codes
  const digitalCodes: string[] = [];
  if (item?.giftCardCodes) {
    for (const code of item.giftCardCodes) {
      digitalCodes.push(code.codeEncrypted ?? "***");
    }
  }

  // Extract streaming credentials
  let streamingCredentials: Order["streamingCredentials"] | undefined;
  if (item?.streamingProfiles?.length > 0) {
    const profile = item.streamingProfiles[0];
    const account = profile.streamingAccount;
    if (account) {
      streamingCredentials = {
        email: account.emailEncrypted ?? "",
        username: account.usernameEncrypted ?? "",
        password: account.passwordEncrypted ?? "",
        expirationDate: account.expiresAt ?? "",
      };
    }
  }

  return {
    id: itemCount === 1 ? order.id : `${order.id}-${item?.id ?? "0"}`,
    orderNumber: order.orderNumber ?? order.id,
    buyerId: order.buyerId ?? "",
    buyerName: order.buyer?.name ?? "",
    buyerEmail: order.buyer?.email ?? "",
    sellerId: order.sellerId ?? "",
    sellerName: order.seller?.storeName ?? order.seller?.user?.name ?? "",
    productId: item?.productId ?? "",
    productName: item?.productName ?? "",
    productImage: item?.product?.image ?? "/images/placeholder.svg",
    productType: (orderProductTypeMap[item?.productType ?? ""] ?? "gift_card") as Order["productType"],
    quantity: Number(item?.quantity ?? 1),
    unitPrice: Number(item?.unitPrice ?? 0),
    totalAmount,
    commissionRate: Number(order.commissionRate),
    commissionAmount,
    sellerEarnings,
    paymentMethod: (paymentMethodMap[order.paymentMethod] ?? "stripe") as Order["paymentMethod"],
    paymentStatus: (paymentStatusMap[order.paymentStatus] ?? "pending") as Order["paymentStatus"],
    status: (orderStatusMap[order.status] ?? "pending") as Order["status"],
    digitalCodes,
    streamingCredentials,
    createdAt: order.createdAt?.toISOString?.() ?? String(order.createdAt ?? ""),
    completedAt: order.completedAt?.toISOString?.() ?? undefined,
  };
}

/**
 * Flatten multiple Prisma orders into frontend Order[].
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toFrontendOrderList(prismaOrders: any[]): Order[] {
  return prismaOrders.flatMap(toFrontendOrders);
}

// ── Ticket transforms ─────────────────────────────────────────

const ticketStatusMap: Record<string, string> = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  RESOLVED: "resolved",
  CLOSED: "closed",
};

const ticketPriorityMap: Record<string, string> = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
};

const roleMap: Record<string, string> = {
  BUYER: "buyer",
  SELLER: "seller",
  ADMIN: "admin",
};

/**
 * Transform a Prisma Ticket (with messages, buyer, seller) to frontend Ticket.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toFrontendTicket(prismaTicket: any): Ticket {
  const messages: TicketMessage[] = (prismaTicket.messages ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (msg: any) => ({
      id: msg.id,
      senderId: msg.senderId,
      senderName: msg.senderName ?? "",
      senderRole: roleMap[msg.senderRole] ?? "buyer",
      message: msg.content,
      createdAt: msg.createdAt?.toISOString?.() ?? String(msg.createdAt ?? ""),
    })
  );

  return {
    id: prismaTicket.id,
    orderId: prismaTicket.orderId,
    buyerId: prismaTicket.buyerId,
    buyerName: prismaTicket.buyer?.name ?? "",
    sellerId: prismaTicket.sellerId,
    sellerName: prismaTicket.seller?.storeName ?? prismaTicket.seller?.user?.name ?? "",
    subject: prismaTicket.subject,
    status: (ticketStatusMap[prismaTicket.status] ?? "open") as Ticket["status"],
    priority: (ticketPriorityMap[prismaTicket.priority] ?? "medium") as Ticket["priority"],
    messages,
    createdAt: prismaTicket.createdAt?.toISOString?.() ?? String(prismaTicket.createdAt ?? ""),
    updatedAt: prismaTicket.updatedAt?.toISOString?.() ?? String(prismaTicket.updatedAt ?? ""),
  };
}

/**
 * Transform multiple Prisma tickets to frontend Ticket[].
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toFrontendTickets(prismaTickets: any[]): Ticket[] {
  return prismaTickets.map(toFrontendTicket);
}

// ── Chat transforms ─────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toFrontendChatConversation(
  prismaConv: any,
  perspective: "buyer" | "seller",
  userId: string
) {
  const unreadCount = (prismaConv.messages ?? []).filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (m: any) => m.senderId !== userId && !m.isRead
  ).length;

  const lastMsg = prismaConv.messages?.[prismaConv.messages.length - 1];

  return {
    id: prismaConv.id,
    otherPartyName:
      perspective === "buyer"
        ? prismaConv.seller?.storeName ?? prismaConv.seller?.user?.name ?? ""
        : prismaConv.buyer?.name ?? "",
    otherPartyAvatar:
      perspective === "buyer"
        ? prismaConv.seller?.storePhoto ?? undefined
        : prismaConv.buyer?.avatar ?? undefined,
    productName: prismaConv.product?.name ?? undefined,
    lastMessage: lastMsg?.content ?? undefined,
    lastMessageAt: lastMsg?.createdAt?.toISOString?.() ?? undefined,
    unreadCount,
    isActive: prismaConv.isActive,
    createdAt: prismaConv.createdAt?.toISOString?.() ?? "",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toFrontendChatMessage(msg: any, buyerId: string) {
  return {
    id: msg.id,
    conversationId: msg.conversationId,
    senderId: msg.senderId,
    senderName: msg.sender?.name ?? "",
    senderRole: msg.senderId === buyerId ? "buyer" : "seller",
    content: msg.content,
    imageUrl: msg.imageUrl ?? undefined,
    isRead: msg.isRead,
    createdAt: msg.createdAt?.toISOString?.() ?? "",
  };
}
