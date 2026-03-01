import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchVemperProducts, isVemperConfigured } from "@/lib/vemper";

/**
 * POST /api/admin/vemper/sync
 * Fetch the Vemper catalog and upsert VemperProduct records.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!isVemperConfigured()) {
    return NextResponse.json(
      {
        error:
          "Vemper API no configurada. Configure VEMPER_API_KEY y VEMPER_API_URL en las variables de entorno.",
      },
      { status: 400 }
    );
  }

  const result = await fetchVemperProducts();

  if (!result.success || !result.products) {
    return NextResponse.json(
      { error: result.error ?? "Error al sincronizar con Vemper" },
      { status: 502 }
    );
  }

  let created = 0;
  let updated = 0;

  for (const apiProduct of result.products) {
    const existing = await prisma.vemperProduct.findUnique({
      where: { vemperProductId: apiProduct.id },
    });

    if (existing) {
      await prisma.vemperProduct.update({
        where: { vemperProductId: apiProduct.id },
        data: {
          name: apiProduct.name,
          type: apiProduct.type,
          costPrice: apiProduct.costPrice,
          denominations: apiProduct.denominations ?? undefined,
          requiredFields: apiProduct.requiredFields ?? undefined,
          image: apiProduct.image ?? undefined,
        },
      });
      updated++;
    } else {
      await prisma.vemperProduct.create({
        data: {
          vemperProductId: apiProduct.id,
          name: apiProduct.name,
          type: apiProduct.type,
          costPrice: apiProduct.costPrice,
          salePrice: Math.round(apiProduct.costPrice * 1.3 * 100) / 100,
          denominations: apiProduct.denominations ?? undefined,
          requiredFields: apiProduct.requiredFields ?? undefined,
          image: apiProduct.image ?? undefined,
        },
      });
      created++;
    }
  }

  return NextResponse.json({
    success: true,
    created,
    updated,
    total: result.products.length,
  });
}
