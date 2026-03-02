import { prisma } from "@/lib/prisma";

/**
 * Generate a sequential, human-readable order number.
 * Format: VM-1001, VM-1002, VM-1003 ...
 */
export async function generateOrderNumber(): Promise<string> {
  const count = await prisma.order.count();
  return `VM-${1001 + count}`;
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
