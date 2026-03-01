import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  generateMemoCode,
  getBinanceDepositInfo,
  isBinanceVerifyConfigured,
  verifyBinanceDeposit,
} from "@/lib/binance-verify";
import { creditWallet } from "@/lib/wallet";

/**
 * POST /api/buyer/wallet/deposit
 * Create a wallet deposit request via Binance transfer.
 * Returns deposit instructions (address, memo code, amount).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const amount = Number(body.amount);

    if (!amount || amount < 1 || amount > 10000) {
      return NextResponse.json(
        { error: "El monto debe ser entre $1 y $10,000" },
        { status: 400 }
      );
    }

    // Check for existing pending deposit
    const existingDeposit = await prisma.walletDeposit.findFirst({
      where: {
        userId: session.user.id,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    if (existingDeposit) {
      return NextResponse.json(
        {
          error:
            "Ya tienes un deposito pendiente. Espera a que expire o completa el deposito actual.",
        },
        { status: 409 }
      );
    }

    const memoCode = generateMemoCode();
    const depositInfo = getBinanceDepositInfo();
    const sandbox = !isBinanceVerifyConfigured();
    const expiryMinutes = parseInt(
      process.env.BINANCE_DEPOSIT_EXPIRY_MINUTES ?? "30",
      10
    );
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    const deposit = await prisma.walletDeposit.create({
      data: {
        userId: session.user.id,
        amount,
        coin: depositInfo.coin,
        network: depositInfo.network,
        depositAddress: depositInfo.address,
        memoCode,
        sandbox,
        expiresAt,
      },
    });

    return NextResponse.json({
      type: "binance_deposit",
      depositId: deposit.id,
      depositAddress: depositInfo.address,
      coin: depositInfo.coin,
      network: depositInfo.network,
      memoCode,
      amount,
      expiresAt: expiresAt.toISOString(),
      sandbox,
    });
  } catch (error) {
    console.error("[Wallet Deposit POST] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/buyer/wallet/deposit
 * Check status of a pending wallet deposit.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const url = new URL(req.url);
    const depositId = url.searchParams.get("depositId");

    if (!depositId) {
      return NextResponse.json(
        { error: "depositId es requerido" },
        { status: 400 }
      );
    }

    const deposit = await prisma.walletDeposit.findFirst({
      where: {
        id: depositId,
        userId: session.user.id,
      },
    });

    if (!deposit) {
      return NextResponse.json(
        { error: "Deposito no encontrado" },
        { status: 404 }
      );
    }

    // Already completed
    if (deposit.status === "COMPLETED") {
      return NextResponse.json({ status: "completed" });
    }

    // Expired
    if (deposit.expiresAt < new Date()) {
      return NextResponse.json({ status: "expired" });
    }

    // Try to verify via Binance API
    if (isBinanceVerifyConfigured()) {
      const result = await verifyBinanceDeposit(
        deposit.memoCode,
        deposit.amount,
        deposit.coin
      );

      if (result.verified) {
        const creditAmount = result.actualAmount ?? deposit.amount;

        const walletResult = await creditWallet({
          userId: session.user.id,
          amount: creditAmount,
          type: "DEPOSIT_CREDIT",
          description: `Deposito Binance (${deposit.coin}) - Memo: ${deposit.memoCode}`,
        });

        if (walletResult.success) {
          await prisma.walletDeposit.update({
            where: { id: deposit.id },
            data: {
              status: "COMPLETED",
              verifiedAt: new Date(),
              txId: result.txId,
              actualAmount: result.actualAmount,
            },
          });

          return NextResponse.json({
            status: "completed",
            amount: creditAmount,
            newBalance: walletResult.newBalance,
          });
        }
      }
    }

    return NextResponse.json({ status: "pending" });
  } catch (error) {
    console.error("[Wallet Deposit GET] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/buyer/wallet/deposit
 * Manual confirmation (sandbox mode only).
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const { depositId } = body;

    if (!depositId) {
      return NextResponse.json(
        { error: "depositId es requerido" },
        { status: 400 }
      );
    }

    const deposit = await prisma.walletDeposit.findFirst({
      where: {
        id: depositId,
        userId: session.user.id,
      },
    });

    if (!deposit) {
      return NextResponse.json(
        { error: "Deposito no encontrado" },
        { status: 404 }
      );
    }

    if (deposit.status === "COMPLETED") {
      return NextResponse.json({ status: "completed" });
    }

    // Only allow manual confirm in sandbox mode
    if (!deposit.sandbox) {
      const result = await verifyBinanceDeposit(
        deposit.memoCode,
        deposit.amount,
        deposit.coin
      );

      if (!result.verified) {
        return NextResponse.json(
          { error: "El deposito aun no ha sido detectado. Por favor espera." },
          { status: 400 }
        );
      }
    }

    const walletResult = await creditWallet({
      userId: session.user.id,
      amount: deposit.amount,
      type: "DEPOSIT_CREDIT",
      description: `Deposito Binance (${deposit.coin}) - Memo: ${deposit.memoCode}`,
    });

    if (!walletResult.success) {
      return NextResponse.json(
        { error: walletResult.error ?? "Error al acreditar la billetera" },
        { status: 500 }
      );
    }

    await prisma.walletDeposit.update({
      where: { id: deposit.id },
      data: {
        status: "COMPLETED",
        verifiedAt: new Date(),
      },
    });

    return NextResponse.json({
      status: "completed",
      amount: deposit.amount,
      newBalance: walletResult.newBalance,
    });
  } catch (error) {
    console.error("[Wallet Deposit PUT] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
