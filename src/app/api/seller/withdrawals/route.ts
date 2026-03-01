import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSeller } from "@/lib/auth-utils";
import { VALID_WITHDRAWAL_METHODS } from "@/lib/constants";

/**
 * POST /api/seller/withdrawals
 * Create a new withdrawal request. Immediately deducts from availableBalance.
 */
export async function POST(req: NextRequest) {
  const auth = await requireSeller();
  if (auth.error) return auth.response;

  const body = await req.json();
  const { amount, method, accountInfo } = body as {
    amount?: number;
    method?: string;
    accountInfo?: Record<string, string>;
  };

  // Validate amount
  if (!amount || amount <= 0) {
    return NextResponse.json(
      { error: "El monto debe ser mayor a 0" },
      { status: 400 }
    );
  }

  if (amount > auth.seller.availableBalance) {
    return NextResponse.json(
      { error: "Saldo insuficiente" },
      { status: 400 }
    );
  }

  // Validate method
  if (
    !method ||
    !VALID_WITHDRAWAL_METHODS.includes(
      method as (typeof VALID_WITHDRAWAL_METHODS)[number]
    )
  ) {
    return NextResponse.json(
      { error: "Metodo de retiro no valido" },
      { status: 400 }
    );
  }

  // Validate accountInfo per method
  if (!accountInfo || typeof accountInfo !== "object") {
    return NextResponse.json(
      { error: "Informacion de cuenta requerida" },
      { status: 400 }
    );
  }

  const missingFields = validateAccountInfo(method, accountInfo);
  if (missingFields) {
    return NextResponse.json(
      { error: `Campos requeridos faltantes: ${missingFields}` },
      { status: 400 }
    );
  }

  // Create withdrawal + deduct balance in a transaction
  const withdrawal = await prisma.$transaction(async (tx) => {
    const w = await tx.withdrawal.create({
      data: {
        sellerId: auth.seller.id,
        amount,
        method,
        accountInfo,
      },
    });

    await tx.sellerProfile.update({
      where: { id: auth.seller.id },
      data: { availableBalance: { decrement: amount } },
    });

    await tx.auditLog.create({
      data: {
        userId: auth.session.user.id,
        action: "withdrawal_requested",
        entityType: "withdrawal",
        entityId: w.id,
        details: { amount, method },
      },
    });

    return w;
  });

  return NextResponse.json({ withdrawal }, { status: 201 });
}

/**
 * GET /api/seller/withdrawals
 * List withdrawal history for the authenticated seller.
 */
export async function GET(req: NextRequest) {
  const auth = await requireSeller();
  if (auth.error) return auth.response;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
  const skip = (page - 1) * limit;

  const [withdrawals, total] = await Promise.all([
    prisma.withdrawal.findMany({
      where: { sellerId: auth.seller.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.withdrawal.count({ where: { sellerId: auth.seller.id } }),
  ]);

  return NextResponse.json({
    withdrawals,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// --- Helpers ---

function validateAccountInfo(
  method: string,
  info: Record<string, string>
): string | null {
  const requiredByMethod: Record<string, string[]> = {
    bank_transfer: ["bankName", "accountNumber", "accountHolder"],
    binance_pay: ["binanceId"],
    qr_bolivia: ["phoneNumber", "bankName"],
  };

  const required = requiredByMethod[method] || [];
  const missing = required.filter((f) => !info[f]?.trim());
  return missing.length > 0 ? missing.join(", ") : null;
}
