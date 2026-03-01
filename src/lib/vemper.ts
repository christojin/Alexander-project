import crypto from "crypto";

const VEMPER_API_BASE =
  process.env.VEMPER_API_URL || "https://vemper.games/api";

// ── Config check ───────────────────────────────────────────────

export function isVemperConfigured(): boolean {
  return !!(process.env.VEMPER_API_KEY && process.env.VEMPER_API_URL);
}

// ── Auth header helper ─────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.VEMPER_API_KEY}`,
  };
}

// ── Types ──────────────────────────────────────────────────────

export interface VemperApiProduct {
  id: string;
  name: string;
  type: "GIFT_CARD" | "TOP_UP";
  costPrice: number;
  denominations?: number[];
  requiredFields?: string[];
  image?: string;
  category?: string;
  region?: string;
  available: boolean;
}

export interface VemperOrderResult {
  success: boolean;
  vemperOrderId?: string;
  code?: string;
  status?: string;
  error?: string;
}

export interface VemperOrderStatus {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  code?: string;
  error?: string;
}

// ── Fetch all products from Vemper catalog ─────────────────────

export async function fetchVemperProducts(): Promise<{
  success: boolean;
  products?: VemperApiProduct[];
  error?: string;
}> {
  if (!isVemperConfigured()) {
    return { success: false, error: "Vemper API no configurada" };
  }

  try {
    const res = await fetch(`${VEMPER_API_BASE}/products`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.message ?? "Error de Vemper API",
      };
    }

    return { success: true, products: data.products ?? data };
  } catch (error) {
    console.error("[Vemper] fetchProducts error:", error);
    return { success: false, error: "Error de conexion con Vemper" };
  }
}

// ── Create order (purchase a code or perform a top-up) ─────────

export async function createVemperOrder(params: {
  productId: string;
  denomination?: number;
  quantity?: number;
  topUpData?: Record<string, string>;
}): Promise<VemperOrderResult> {
  if (!isVemperConfigured()) {
    return { success: false, error: "Vemper API no configurada" };
  }

  try {
    const res = await fetch(`${VEMPER_API_BASE}/orders`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        product_id: params.productId,
        denomination: params.denomination,
        quantity: params.quantity ?? 1,
        ...(params.topUpData ?? {}),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.message ?? "Error al crear orden Vemper",
      };
    }

    return {
      success: true,
      vemperOrderId: data.id ?? data.order_id,
      code: data.code,
      status: data.status ?? "completed",
    };
  } catch (error) {
    console.error("[Vemper] createOrder error:", error);
    return { success: false, error: "Error de conexion con Vemper" };
  }
}

// ── Get order status ───────────────────────────────────────────

export async function getVemperOrderStatus(
  orderId: string
): Promise<VemperOrderStatus | null> {
  if (!isVemperConfigured()) return null;

  try {
    const res = await fetch(`${VEMPER_API_BASE}/orders/${orderId}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("[Vemper] getOrderStatus error:", error);
    return null;
  }
}

// ── Webhook signature verification (HMAC-SHA256) ───────────────

export function verifyVemperWebhook(
  payload: string,
  signature: string
): boolean {
  const secret = process.env.VEMPER_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}
