import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isStripeConfigured } from "@/lib/stripe";
import { isQrBoliviaConfigured } from "@/lib/qr-bolivia";
import { isCryptomusConfigured } from "@/lib/cryptomus";
import { isBinanceVerifyConfigured } from "@/lib/binance-verify";
import { isVemperConfigured } from "@/lib/vemper";

interface IntegrationStatus {
  id: string;
  name: string;
  description: string;
  category: "payment" | "external";
  configured: boolean;
  envVars: { key: string; set: boolean }[];
  webhookUrl?: string;
}

/**
 * GET /api/admin/integrations
 * Returns the configuration status of all external integrations.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const integrations: IntegrationStatus[] = [
    {
      id: "stripe",
      name: "Stripe",
      description: "Pagos con tarjeta de credito/debito (Visa, Mastercard, AMEX). Checkout seguro con redireccion.",
      category: "payment",
      configured: isStripeConfigured(),
      envVars: [
        { key: "STRIPE_PUBLIC_KEY", set: !!process.env.STRIPE_PUBLIC_KEY },
        { key: "STRIPE_SECRET_KEY", set: !!process.env.STRIPE_SECRET_KEY },
        { key: "STRIPE_WEBHOOK_SECRET", set: !!process.env.STRIPE_WEBHOOK_SECRET },
      ],
      webhookUrl: `${appUrl}/api/webhooks/stripe`,
    },
    {
      id: "qr_bolivia",
      name: "QR Bolivia",
      description: "Pagos con codigo QR via apps bancarias bolivianas. Generacion de QR y verificacion via webhook.",
      category: "payment",
      configured: isQrBoliviaConfigured(),
      envVars: [
        { key: "QR_BOLIVIA_API_KEY", set: !!process.env.QR_BOLIVIA_API_KEY },
        { key: "QR_BOLIVIA_API_URL", set: !!process.env.QR_BOLIVIA_API_URL },
        { key: "QR_BOLIVIA_WEBHOOK_SECRET", set: !!process.env.QR_BOLIVIA_WEBHOOK_SECRET },
      ],
      webhookUrl: `${appUrl}/api/webhooks/qr-bolivia`,
    },
    {
      id: "cryptomus",
      name: "Cryptomus",
      description: "Pasarela de criptomonedas multi-coin (BTC, USDT, USDC, ETH y mas). Redireccion a pagina de pago.",
      category: "payment",
      configured: isCryptomusConfigured(),
      envVars: [
        { key: "CRYPTOMUS_MERCHANT_UUID", set: !!process.env.CRYPTOMUS_MERCHANT_UUID },
        { key: "CRYPTOMUS_API_KEY", set: !!process.env.CRYPTOMUS_API_KEY },
      ],
      webhookUrl: `${appUrl}/api/webhooks/cryptomus`,
    },
    {
      id: "binance",
      name: "Binance (Transferencia USDT)",
      description: "Verificacion automatica de depositos USDT via Binance Spot API. El comprador envia USDT con memo code.",
      category: "payment",
      configured: isBinanceVerifyConfigured(),
      envVars: [
        { key: "BINANCE_SPOT_API_KEY", set: !!process.env.BINANCE_SPOT_API_KEY },
        { key: "BINANCE_SPOT_SECRET_KEY", set: !!process.env.BINANCE_SPOT_SECRET_KEY },
        { key: "BINANCE_DEPOSIT_ADDRESS", set: !!process.env.BINANCE_DEPOSIT_ADDRESS },
      ],
    },
    {
      id: "vemper",
      name: "Vemper Games",
      description: "API de proveedor de codigos de juegos y gift cards. Inventario y entrega automatica de codigos digitales.",
      category: "external",
      configured: isVemperConfigured(),
      envVars: [
        { key: "VEMPER_API_KEY", set: !!process.env.VEMPER_API_KEY },
        { key: "VEMPER_API_URL", set: !!process.env.VEMPER_API_URL },
        { key: "VEMPER_WEBHOOK_SECRET", set: !!process.env.VEMPER_WEBHOOK_SECRET },
      ],
      webhookUrl: `${appUrl}/api/webhooks/vemper`,
    },
  ];

  const configuredCount = integrations.filter((i) => i.configured).length;

  return NextResponse.json({
    integrations,
    summary: {
      total: integrations.length,
      configured: configuredCount,
      unconfigured: integrations.length - configuredCount,
    },
  });
}
