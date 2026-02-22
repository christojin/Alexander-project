import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getWalletInfo } from "@/lib/wallet";

/**
 * GET /api/buyer/wallet
 * Returns wallet balance and transaction history.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 20));

    const walletInfo = await getWalletInfo(session.user.id, page, limit);

    return NextResponse.json(walletInfo);
  } catch (error) {
    console.error("[Buyer Wallet GET] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
