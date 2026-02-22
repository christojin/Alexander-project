/**
 * Generate a human-readable order number.
 * Format: VV-YYYYMMDD-XXXXX (e.g., VV-20260220-A3F9K)
 */
export function generateOrderNumber(): string {
  const now = new Date();
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `VV-${date}-${random}`;
}

/**
 * Map frontend PaymentMethod strings to Prisma PaymentMethod enum values.
 */
export function toPaymentMethodEnum(
  method: string
): "STRIPE" | "QR_BOLIVIA" | "BINANCE_PAY" | "CRYPTO" | "WALLET" {
  const map: Record<string, "STRIPE" | "QR_BOLIVIA" | "BINANCE_PAY" | "CRYPTO" | "WALLET"> = {
    stripe: "STRIPE",
    qr_bolivia: "QR_BOLIVIA",
    binance_pay: "BINANCE_PAY",
    crypto: "CRYPTO",
    wallet: "WALLET",
  };
  return map[method] || "STRIPE";
}
