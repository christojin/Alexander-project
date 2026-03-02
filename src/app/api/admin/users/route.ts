import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

// GET /api/admin/users — List all users
export async function GET(req: NextRequest) {
  try {
  
    const authResult = await requireAdmin();
    if (authResult.error) return authResult.response;
    const { session } = authResult;
  
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const search = searchParams.get("search") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "50")));
  
    const where: Record<string, unknown> = {};
  
    if (role && ["BUYER", "SELLER", "ADMIN"].includes(role)) {
      where.role = role;
    }
  
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
  
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
          isActive: true,
          createdAt: true,
          sellerProfile: {
            select: {
              id: true,
              storeName: true,
              slug: true,
              commissionRate: true,
              rating: true,
              totalSales: true,
              totalEarnings: true,
              status: true,
              marketType: true,
              isVerified: true,
              promotionQuota: true,
              offersQuota: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);
  
    return NextResponse.json({
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[AdminUsers] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
