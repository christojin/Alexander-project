import crypto from "crypto";
import QRCode from "qrcode";

const QR_EXPIRY_MINUTES = 15;

interface QrBoliviaOrderResult {
  success: boolean;
  orderId?: string;
  qrImageUrl?: string;
  qrContent?: string;
  expiresAt?: string;
  sandbox?: boolean;
  error?: string;
}

/**
 * Check if QR Bolivia provider is configured.
 */
export function isQrBoliviaConfigured(): boolean {
  return !!(
    process.env.QR_BOLIVIA_API_KEY &&
    process.env.QR_BOLIVIA_API_URL &&
    process.env.QR_BOLIVIA_WEBHOOK_SECRET
  );
}

/**
 * Create a QR Bolivia payment order.
 *
 * When configured, calls the provider API to generate a QR code.
 * When not configured, falls back to local QR generation (sandbox mode).
 */
export async function createQrBoliviaOrder(params: {
  amount: number;
  orderIds: string[];
  description?: string;
  currency?: string;
}): Promise<QrBoliviaOrderResult> {
  const apiKey = process.env.QR_BOLIVIA_API_KEY;
  const apiUrl = process.env.QR_BOLIVIA_API_URL;

  // ── Sandbox mode (not configured) ──────────────────────────
  if (!apiKey || !apiUrl) {
    const reference = `QR-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + QR_EXPIRY_MINUTES * 60 * 1000).toISOString();

    const qrPayload = [
      `Ref: ${reference}`,
      `Monto: $${params.amount.toFixed(2)} USD`,
      `Ordenes: ${params.orderIds.join(", ")}`,
      `VendorVault - Pago QR Bolivia`,
    ].join("\n");

    let qrImageUrl = "";
    try {
      qrImageUrl = await QRCode.toDataURL(qrPayload, {
        width: 300,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });
    } catch {
      // Fallback: return reference without QR image
    }

    return {
      success: true,
      orderId: reference,
      qrImageUrl,
      qrContent: qrPayload,
      expiresAt,
      sandbox: true,
    };
  }

  // ── Production mode (configured) ───────────────────────────
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const merchantOrderId = `VM-${Date.now()}-${params.orderIds[0].substring(0, 8)}`;

  const body = {
    amount: params.amount,
    currency: params.currency ?? "BOB",
    description: params.description ?? "VendorVault Purchase",
    merchantOrderId,
    webhookUrl: `${appUrl}/api/webhooks/qr-bolivia`,
    expiresInMinutes: QR_EXPIRY_MINUTES,
  };

  try {
    const response = await fetch(`${apiUrl}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (response.ok && data.orderId) {
      return {
        success: true,
        orderId: data.orderId,
        qrImageUrl: data.qrImageUrl ?? data.qrCodeUrl,
        qrContent: data.qrContent,
        expiresAt: data.expiresAt ?? new Date(Date.now() + QR_EXPIRY_MINUTES * 60 * 1000).toISOString(),
      };
    }

    return {
      success: false,
      error: data.message ?? data.error ?? "Error al crear orden QR Bolivia",
    };
  } catch (error) {
    console.error("[QR Bolivia] Create order error:", error);
    return { success: false, error: "Error de conexion con el proveedor QR Bolivia" };
  }
}

/**
 * Verify payment status with the QR Bolivia provider.
 */
export async function verifyQrBoliviaPayment(
  providerOrderId: string
): Promise<{ paid: boolean; transactionId?: string }> {
  const apiKey = process.env.QR_BOLIVIA_API_KEY;
  const apiUrl = process.env.QR_BOLIVIA_API_URL;

  if (!apiKey || !apiUrl) {
    return { paid: false };
  }

  try {
    const response = await fetch(`${apiUrl}/orders/${providerOrderId}/status`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    const data = await response.json();

    if (response.ok && (data.status === "COMPLETED" || data.status === "PAID")) {
      return {
        paid: true,
        transactionId: data.transactionId ?? providerOrderId,
      };
    }

    return { paid: false };
  } catch (error) {
    console.error("[QR Bolivia] Verify payment error:", error);
    return { paid: false };
  }
}

/**
 * Verify QR Bolivia webhook signature (HMAC-SHA256).
 */
export function verifyQrBoliviaWebhook(body: string, signature: string): boolean {
  const webhookSecret = process.env.QR_BOLIVIA_WEBHOOK_SECRET;
  if (!webhookSecret) return false;

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(body)
    .digest("hex");

  return expectedSignature === signature;
}
