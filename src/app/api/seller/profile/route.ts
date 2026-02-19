import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

// GET /api/seller/profile — Get current seller's profile
export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const seller = await prisma.sellerProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } },
      country: { select: { id: true, name: true, code: true, flagEmoji: true } },
      businessHours: { orderBy: { dayOfWeek: "asc" } },
    },
  });

  if (!seller) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ seller });
}

// PATCH /api/seller/profile — Update seller profile
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "SELLER") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!seller) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (body.storeName !== undefined) {
      data.storeName = body.storeName.trim();
      // Regenerate slug
      let newSlug = slugify(body.storeName.trim());
      const existing = await prisma.sellerProfile.findUnique({ where: { slug: newSlug } });
      if (existing && existing.id !== seller.id) {
        newSlug = `${newSlug}-${Math.random().toString(36).substring(2, 8)}`;
      }
      data.slug = newSlug;
    }

    if (body.storeDescription !== undefined) data.storeDescription = body.storeDescription.trim();
    if (body.storePhoto !== undefined) data.storePhoto = body.storePhoto;
    if (body.countryId !== undefined) data.countryId = body.countryId || null;
    if (body.marketType !== undefined) data.marketType = body.marketType;

    await prisma.sellerProfile.update({
      where: { id: seller.id },
      data,
    });

    return NextResponse.json({ message: "Perfil actualizado" });
  } catch (error) {
    console.error("[Seller Profile] Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
