import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/checkout/fees
 * Public endpoint returning platform service fee + per-gateway fee configuration.
 * Used by the checkout page to display accurate totals.
 */
export async function GET() {
  try {
    const settings = await prisma.platformSettings.findUnique({
      where: { id: "default" },
    });

    return NextResponse.json({
      // Platform service fee (applies to all methods)
      serviceFeeFixed: settings?.buyerServiceFeeFixed ?? 0,
      serviceFeePercent: settings?.buyerServiceFeePercent ?? 0,
      // Per-gateway fees
      gateways: {
        stripe: {
          feePercent: settings?.stripeGatewayFeePercent ?? 0,
          feeFixed: settings?.stripeGatewayFeeFixed ?? 0,
        },
        qr_bolivia: {
          feePercent: settings?.qrBoliviaGatewayFeePercent ?? 0,
          feeFixed: settings?.qrBoliviaGatewayFeeFixed ?? 0,
        },
        binance_pay: {
          feePercent: settings?.binancePayGatewayFeePercent ?? 0,
          feeFixed: settings?.binancePayGatewayFeeFixed ?? 0,
        },
        crypto: {
          feePercent: settings?.cryptoGatewayFeePercent ?? 0,
          feeFixed: settings?.cryptoGatewayFeeFixed ?? 0,
        },
        wallet: {
          feePercent: settings?.walletGatewayFeePercent ?? 0,
          feeFixed: settings?.walletGatewayFeeFixed ?? 0,
        },
      },
    });
  } catch (error) {
    console.error("[Checkout Fees GET] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
