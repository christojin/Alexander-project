import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/categories
 * List all categories with product counts.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const categories = await prisma.category.findMany({
    orderBy: { displayOrder: "asc" },
    include: {
      _count: { select: { products: true } },
    },
  });

  const result = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description ?? "",
    icon: c.icon ?? "Tag",
    image: c.image ?? "",
    bannerImage: c.bannerImage ?? "",
    isPopular: c.isPopular,
    productCount: c._count.products,
    isActive: c.isActive,
  }));

  return NextResponse.json(result);
}

/**
 * POST /api/admin/categories
 * Create a new category.
 * Body: { name, slug?, description?, icon?, isActive? }
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const { name, slug, description, icon, image, bannerImage, isPopular, isActive } = body as {
    name: string;
    slug?: string;
    description?: string;
    icon?: string;
    image?: string;
    bannerImage?: string;
    isPopular?: boolean;
    isActive?: boolean;
  };

  if (!name?.trim()) {
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  }

  const finalSlug =
    slug?.trim() ||
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  // Check for duplicate slug
  const existing = await prisma.category.findUnique({ where: { slug: finalSlug } });
  if (existing) {
    return NextResponse.json({ error: "El slug ya existe" }, { status: 409 });
  }

  const category = await prisma.category.create({
    data: {
      name: name.trim(),
      slug: finalSlug,
      description: description?.trim() ?? null,
      icon: icon ?? "Tag",
      image: image?.trim() || null,
      bannerImage: bannerImage?.trim() || null,
      isPopular: isPopular ?? false,
      isActive: isActive ?? true,
    },
    include: { _count: { select: { products: true } } },
  });

  return NextResponse.json(
    {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      icon: category.icon ?? "Tag",
      image: category.image ?? "",
      bannerImage: category.bannerImage ?? "",
      isPopular: category.isPopular,
      productCount: category._count.products,
      isActive: category.isActive,
    },
    { status: 201 }
  );
}
