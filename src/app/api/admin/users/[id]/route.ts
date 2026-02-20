import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/users/[id] — Get user detail
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      role: true,
      isActive: true,
      createdAt: true,
      sellerProfile: {
        include: {
          country: true,
          kycDocuments: { orderBy: { createdAt: "desc" } },
          businessHours: { orderBy: { dayOfWeek: "asc" } },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

// PATCH /api/admin/users/[id] — Update user
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const user = await prisma.user.findUnique({
    where: { id },
    include: { sellerProfile: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  // Build user update data
  const userData: Record<string, unknown> = {};
  if (body.name !== undefined) userData.name = body.name.trim();
  if (body.email !== undefined) userData.email = body.email.toLowerCase().trim();
  if (body.isActive !== undefined) userData.isActive = body.isActive;
  if (body.role !== undefined && ["BUYER", "SELLER", "ADMIN"].includes(body.role)) {
    userData.role = body.role;
  }

  await prisma.user.update({ where: { id }, data: userData });

  // Update seller profile if applicable
  if (user.sellerProfile && body.seller) {
    const sellerData: Record<string, unknown> = {};
    if (body.seller.storeName !== undefined) sellerData.storeName = body.seller.storeName.trim();
    if (body.seller.commissionRate !== undefined) sellerData.commissionRate = parseFloat(body.seller.commissionRate);
    if (body.seller.isVerified !== undefined) sellerData.isVerified = body.seller.isVerified;
    if (body.seller.promotionQuota !== undefined) {
      const raw = Math.max(0, parseInt(body.seller.promotionQuota));
      sellerData.promotionQuota = Math.round(raw / 5) * 5;
    }
    if (body.seller.offersQuota !== undefined) {
      const raw = Math.max(0, parseInt(body.seller.offersQuota));
      sellerData.offersQuota = Math.round(raw / 5) * 5;
    }

    if (Object.keys(sellerData).length > 0) {
      await prisma.sellerProfile.update({
        where: { id: user.sellerProfile.id },
        data: sellerData,
      });
    }
  }

  return NextResponse.json({ message: "Usuario actualizado" });
}

// DELETE /api/admin/users/[id] — Deactivate user
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json({ error: "No puedes desactivar tu propia cuenta" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ message: "Usuario desactivado" });
}
