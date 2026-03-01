export type UserRole = "buyer" | "seller" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  isActive: boolean;
}

export interface Seller extends User {
  role: "seller";
  storeName: string;
  commissionRate: number;
  totalSales: number;
  totalEarnings: number;
  rating: number;
  totalReviews: number;
  isVerified: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  image?: string;
  productCount: number;
  isActive: boolean;
}

export interface DigitalCode {
  id: string;
  code: string;
  isRedeemed: boolean;
  redeemedAt?: string;
  orderId?: string;
}

export type ProductType = "streaming" | "gift_card" | "topup";
export type StreamingMode = "complete_account" | "profile_sharing";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  categoryId: string;
  categoryName: string;
  sellerId: string;
  sellerName: string;
  sellerRating: number;
  sellerVerified: boolean;
  sellerSales: number;
  sellerJoined: string;
  image: string;
  brand: string;
  region: string;
  regionCode?: string;
  regionFlag?: string;
  platform: string;
  stockCount: number;
  soldCount: number;
  isActive: boolean;
  isFeatured: boolean;
  deliveryType: "instant" | "manual";
  productType: ProductType;
  streamingMode?: StreamingMode;
  streamingDuration?: string;
  streamingMaxProfiles?: number;
  manualDeliveryTime?: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = "pending" | "processing" | "completed" | "cancelled" | "refunded" | "under_review";
export type PaymentMethod = "qr_bolivia" | "stripe" | "binance_pay" | "crypto" | "wallet";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export type WalletTransactionType = "refund_credit" | "purchase_debit" | "admin_adjustment";
export type RefundStatus = "pending" | "approved" | "rejected" | "processed";
export type RefundType = "full" | "partial_prorated";

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  orderId?: string;
  createdAt: string;
}

export interface RefundRequest {
  id: string;
  orderId: string;
  refundType: RefundType;
  originalAmount: number;
  refundAmount: number;
  reason?: string;
  status: RefundStatus;
  totalDays?: number;
  usedDays?: number;
  remainingDays?: number;
  processedAt?: string;
  createdAt: string;
}

export interface StreamingCredentials {
  email: string;
  username: string;
  password: string;
  expirationDate: string;
}

export interface Order {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  sellerId: string;
  sellerName: string;
  productId: string;
  productName: string;
  productImage: string;
  productType: ProductType;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  commissionRate: number;
  commissionAmount: number;
  sellerEarnings: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  digitalCodes: string[];
  streamingCredentials?: StreamingCredentials;
  createdAt: string;
  completedAt?: string;
}

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high";

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  message: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  orderId: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalSales: number;
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  totalCommissions: number;
  pendingTickets: number;
  recentOrders: Order[];
}

export interface AdminSettings {
  siteName: string;
  footerHtml: string;
  defaultCommissionRate: number;
  enableQrBolivia: boolean;
  enableStripe: boolean;
  enableBinancePay: boolean;
  enableCrypto: boolean;
  deliveryDelayMinutes: number;
  highValueThreshold: number;
  requireManualReviewAbove: number;
}

// ── Chat types ──────────────────────────────────────────────

export interface ChatConversationSummary {
  id: string;
  otherPartyName: string;
  otherPartyAvatar?: string;
  productName?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface ChatMsg {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: "buyer" | "seller";
  content: string;
  imageUrl?: string;
  isRead: boolean;
  createdAt: string;
}
