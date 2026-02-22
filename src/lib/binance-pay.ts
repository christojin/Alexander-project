import crypto from "crypto";

const BINANCE_API_BASE = "https://bpay.binanceapi.com";

interface BinancePayOrderResult {
  success: boolean;
  prepayId?: string;
  checkoutUrl?: string;
  qrcodeLink?: string;
  merchantTradeNo?: string;
  error?: string;
}

/**
 * Create a Binance Pay C2B order.
 * Docs: https://developers.binance.com/docs/binance-pay/api-order-create-v3
 */
export async function createBinancePayOrder(params: {
  amount: number;
  orderIds: string[];
  currency?: string;
  description?: string;
}): Promise<BinancePayOrderResult> {
  const apiKey = process.env.BINANCE_PAY_API_KEY;
  const apiSecret = process.env.BINANCE_PAY_SECRET_KEY;

  if (!apiKey || !apiSecret) {
    return { success: false, error: "Binance Pay no esta configurado" };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(16).toString("hex");
  const tradeNo = `VM-${timestamp}-${params.orderIds[0].substring(0, 8)}`;

  const body = {
    env: {
      terminalType: "WEB",
    },
    merchantTradeNo: tradeNo,
    orderAmount: params.amount.toFixed(2),
    currency: params.currency ?? "USDT",
    description: params.description ?? "VirtuMall Purchase",
    goodsType: "02", // Virtual goods
    returnUrl: `${appUrl}/checkout/success?orderIds=${params.orderIds.join(",")}`,
    cancelUrl: `${appUrl}/checkout?cancelled=true`,
    webhookUrl: `${appUrl}/api/webhooks/binance`,
    orderExpireTime: Date.now() + 30 * 60 * 1000, // 30 min expiry
  };

  const payload = JSON.stringify(body);

  // Generate signature: HMAC-SHA512(timestamp + "\n" + nonce + "\n" + payload + "\n")
  const signPayload = `${timestamp}\n${nonce}\n${payload}\n`;
  const signature = crypto
    .createHmac("sha512", apiSecret)
    .update(signPayload)
    .digest("hex")
    .toUpperCase();

  try {
    const response = await fetch(`${BINANCE_API_BASE}/binancepay/openapi/v3/order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "BinancePay-Timestamp": String(timestamp),
        "BinancePay-Nonce": nonce,
        "BinancePay-Certificate-SN": apiKey,
        "BinancePay-Signature": signature,
      },
      body: payload,
    });

    const data = await response.json();

    if (data.status === "SUCCESS" && data.data) {
      return {
        success: true,
        prepayId: data.data.prepayId,
        checkoutUrl: data.data.universalUrl ?? data.data.checkoutUrl,
        qrcodeLink: data.data.qrcodeLink,
        merchantTradeNo: tradeNo,
      };
    }

    return {
      success: false,
      error: data.errorMessage ?? "Error al crear orden de Binance Pay",
    };
  } catch (error) {
    console.error("[Binance Pay] Create order error:", error);
    return { success: false, error: "Error de conexion con Binance Pay" };
  }
}

/**
 * Verify Binance Pay webhook signature.
 */
export function verifyBinanceWebhook(
  body: string,
  headers: {
    timestamp: string;
    nonce: string;
    signature: string;
  }
): boolean {
  const apiSecret = process.env.BINANCE_PAY_SECRET_KEY;
  if (!apiSecret) return false;

  const signPayload = `${headers.timestamp}\n${headers.nonce}\n${body}\n`;
  const expectedSignature = crypto
    .createHmac("sha512", apiSecret)
    .update(signPayload)
    .digest("hex")
    .toUpperCase();

  return expectedSignature === headers.signature;
}

/**
 * Check if Binance Pay is configured.
 */
export function isBinancePayConfigured(): boolean {
  return !!(
    process.env.BINANCE_PAY_API_KEY &&
    process.env.BINANCE_PAY_SECRET_KEY
  );
}
