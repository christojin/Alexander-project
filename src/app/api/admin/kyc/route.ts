import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/kyc — List KYC applications
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "PENDING";
  const search = searchParams.get("search") || "";

  const where: Record<string, unknown> = {};

  if (status !== "ALL") {
    where.status = status;
  }

  // Only show sellers that have KYC documents
  where.kycDocuments = { some: {} };

  if (search) {
    where.OR = [
      { storeName: { contains: search, mode: "insensitive" } },
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  const sellers = await prisma.sellerProfile.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true, createdAt: true } },
      country: { select: { name: true, flagEmoji: true } },
      kycDocuments: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ sellers });
}
