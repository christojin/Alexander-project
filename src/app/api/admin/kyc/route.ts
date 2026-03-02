import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

// GET /api/admin/kyc — List KYC applications
export async function GET(req: NextRequest) {
  try {
  
    const authResult = await requireAdmin();
    if (authResult.error) return authResult.response;
    const { session } = authResult;
  
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
  } catch (error) {
    console.error("[AdminKyc] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
