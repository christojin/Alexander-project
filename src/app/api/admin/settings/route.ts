import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/settings
 * Fetch platform settings.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const settings = await prisma.platformSettings.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default" },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/settings
 * Update any subset of platform settings.
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();

    // Whitelist allowed fields
    const allowed: Record<string, string> = {
      siteName: "string",
      footerHtml: "string",
      defaultCommissionRate: "number",
      buyerServiceFeeFixed: "number",
      buyerServiceFeePercent: "number",
      enableStripe: "boolean",
      enableQrBolivia: "boolean",
      enableBinancePay: "boolean",
      enableCrypto: "boolean",
      deliveryDelayMinutes: "number",
      highValueThreshold: "number",
      requireManualReviewAbove: "number",
      bannerIntervalSeconds: "number",
      // Per-gateway fees
      stripeGatewayFeePercent: "number",
      stripeGatewayFeeFixed: "number",
      qrBoliviaGatewayFeePercent: "number",
      qrBoliviaGatewayFeeFixed: "number",
      binancePayGatewayFeePercent: "number",
      binancePayGatewayFeeFixed: "number",
      cryptoGatewayFeePercent: "number",
      cryptoGatewayFeeFixed: "number",
      walletGatewayFeePercent: "number",
      walletGatewayFeeFixed: "number",
      // Social media & contact
      facebookUrl: "string",
      instagramUrl: "string",
      twitterUrl: "string",
      tiktokUrl: "string",
      whatsappUrl: "string",
      telegramUrl: "string",
      contactEmail: "string",
      contactPhone: "string",
      contactLocation: "string",
    };

    const updateData: Record<string, unknown> = {};
    for (const [key, expectedType] of Object.entries(allowed)) {
      if (key in body && typeof body[key] === expectedType) {
        updateData[key] = body[key];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No hay campos validos para actualizar" }, { status: 400 });
    }

    const settings = await prisma.platformSettings.upsert({
      where: { id: "default" },
      update: updateData,
      create: { id: "default", ...updateData },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
