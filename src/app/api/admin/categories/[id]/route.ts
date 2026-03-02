import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * PUT /api/admin/categories/[id]
 * Update a category.
 * Body: { name?, slug?, description?, icon?, isActive? }
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, slug, description, icon, image, bannerImage, isPopular, isActive } = body as {
    name?: string;
    slug?: string;
    description?: string;
    icon?: string;
    image?: string | null;
    bannerImage?: string | null;
    isPopular?: boolean;
    isActive?: boolean;
  };

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Categoria no encontrada" }, { status: 404 });
  }

  // Check slug uniqueness if changed
  if (slug && slug !== existing.slug) {
    const slugExists = await prisma.category.findUnique({ where: { slug } });
    if (slugExists) {
      return NextResponse.json({ error: "El slug ya existe" }, { status: 409 });
    }
  }

  const updated = await prisma.category.update({
    where: { id },
    data: {
      ...(name != null && { name: name.trim() }),
      ...(slug != null && { slug: slug.trim() }),
      ...(description != null && { description: description.trim() }),
      ...(icon != null && { icon }),
      ...(image !== undefined && { image: image?.trim() || null }),
      ...(bannerImage !== undefined && { bannerImage: bannerImage?.trim() || null }),
      ...(isPopular != null && { isPopular }),
      ...(isActive != null && { isActive }),
    },
    include: { _count: { select: { products: true } } },
  });

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    slug: updated.slug,
    description: updated.description ?? "",
    icon: updated.icon ?? "Tag",
    image: updated.image ?? "",
    bannerImage: updated.bannerImage ?? "",
    isPopular: updated.isPopular,
    productCount: updated._count.products,
    isActive: updated.isActive,
  });
}

/**
 * DELETE /api/admin/categories/[id]
 * Delete a category.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Categoria no encontrada" }, { status: 404 });
  }

  await prisma.category.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

/**
 * PATCH /api/admin/categories/[id]
 * Toggle active status.
 * Body: { isActive: boolean }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { isActive, isPopular } = body as { isActive?: boolean; isPopular?: boolean };

  const updated = await prisma.category.update({
    where: { id },
    data: {
      ...(isActive != null && { isActive }),
      ...(isPopular != null && { isPopular }),
    },
    include: { _count: { select: { products: true } } },
  });

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    slug: updated.slug,
    description: updated.description ?? "",
    icon: updated.icon ?? "Tag",
    image: updated.image ?? "",
    bannerImage: updated.bannerImage ?? "",
    isPopular: updated.isPopular,
    productCount: updated._count.products,
    isActive: updated.isActive,
  });
}
