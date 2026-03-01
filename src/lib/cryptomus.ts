import crypto from "crypto";

const CRYPTOMUS_API_BASE = "https://api.cryptomus.com/v1";

// ── Signature generation ───────────────────────────────────────────

function generateSign(body: object, apiKey: string): string {
  const json = JSON.stringify(body);
  const base64 = Buffer.from(json).toString("base64");
  return crypto.createHash("md5").update(base64 + apiKey).digest("hex");
}

// ── Config check ───────────────────────────────────────────────────

export function isCryptomusConfigured(): boolean {
  return !!(
    process.env.CRYPTOMUS_MERCHANT_UUID &&
    process.env.CRYPTOMUS_API_KEY
  );
}

// ── Create payment invoice ─────────────────────────────────────────

interface CryptomusInvoiceResult {
  success: boolean;
  paymentUrl?: string;
  invoiceId?: string;
  error?: string;
}

export async function createCryptomusInvoice(params: {
  amount: number;
  orderIds: string[];
  currency?: string;
}): Promise<CryptomusInvoiceResult> {
  const merchantUuid = process.env.CRYPTOMUS_MERCHANT_UUID;
  const apiKey = process.env.CRYPTOMUS_API_KEY;

  if (!merchantUuid || !apiKey) {
    return { success: false, error: "Cryptomus no esta configurado" };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const orderId = `VM-${Date.now()}-${params.orderIds[0].substring(0, 8)}`;

  const body = {
    amount: params.amount.toFixed(2),
    currency: params.currency ?? "USD",
    order_id: orderId,
    url_return: `${appUrl}/checkout`,
    url_success: `${appUrl}/checkout/success?orderIds=${params.orderIds.join(",")}`,
    url_callback: `${appUrl}/api/webhooks/cryptomus`,
    lifetime: 3600, // 1 hour
    is_payment_multiple: false,
    additional_data: JSON.stringify({ orderIds: params.orderIds }),
  };

  const sign = generateSign(body, apiKey);

  try {
    const response = await fetch(`${CRYPTOMUS_API_BASE}/payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        merchant: merchantUuid,
        sign,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.result?.url) {
      // Store the merchant trade number for each order's payment
      return {
        success: true,
        paymentUrl: data.result.url,
        invoiceId: data.result.uuid,
      };
    }

    return {
      success: false,
      error:
        data.message ?? "Error al crear factura de Cryptomus",
    };
  } catch (error) {
    console.error("[Cryptomus] Create invoice error:", error);
    return { success: false, error: "Error de conexion con Cryptomus" };
  }
}

// ── Webhook signature verification ─────────────────────────────────

export function verifyCryptomusWebhook(
  body: Record<string, unknown>,
  receivedSign: string
): boolean {
  const apiKey = process.env.CRYPTOMUS_API_KEY;
  if (!apiKey) return false;

  // Remove sign from body before verification
  const bodyWithoutSign = { ...body };
  delete bodyWithoutSign.sign;

  const json = JSON.stringify(bodyWithoutSign);
  const base64 = Buffer.from(json).toString("base64");
  const expectedSign = crypto
    .createHash("md5")
    .update(base64 + apiKey)
    .digest("hex");

  return expectedSign === receivedSign;
}

// ── Payment status check ───────────────────────────────────────────

interface CryptomusPaymentStatus {
  status: string;
  isFinal: boolean;
  isPaid: boolean;
  txId?: string;
  paymentAmount?: string;
}

export async function getCryptomusPaymentStatus(
  uuid: string
): Promise<CryptomusPaymentStatus | null> {
  const merchantUuid = process.env.CRYPTOMUS_MERCHANT_UUID;
  const apiKey = process.env.CRYPTOMUS_API_KEY;

  if (!merchantUuid || !apiKey) return null;

  const body = { uuid };
  const sign = generateSign(body, apiKey);

  try {
    const response = await fetch(`${CRYPTOMUS_API_BASE}/payment/info`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        merchant: merchantUuid,
        sign,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    const result = data.result;

    if (!result) return null;

    const isPaid =
      result.payment_status === "paid" ||
      result.payment_status === "paid_over";

    return {
      status: result.payment_status,
      isFinal: result.is_final === true,
      isPaid,
      txId: result.txid,
      paymentAmount: result.payment_amount,
    };
  } catch (error) {
    console.error("[Cryptomus] Status check error:", error);
    return null;
  }
}
