import { inngest } from "./client";
import { prisma } from "@/lib/prisma";
import { batchVerifyDeposits, isBinanceVerifyConfigured } from "@/lib/binance-verify";
import { fulfillOrder } from "@/lib/order-fulfillment";
import { creditWallet } from "@/lib/wallet";

/**
 * Cron: Verify pending Binance deposits every 2 minutes.
 *
 * 1. Finds all PENDING payments with provider="binance_transfer" (checkout orders)
 * 2. Finds all PENDING wallet deposits
 * 3. Makes a single batch Binance API call to get recent deposits
 * 4. Matches deposits by memo code + amount
 * 5. Fulfills orders or credits wallets on verification
 * 6. Cancels expired items
 */
export const verifyPendingBinancePaymentsCron = inngest.createFunction(
  { id: "verify-pending-binance-payments" },
  { cron: "*/2 * * * *" },
  async () => {
    if (!isBinanceVerifyConfigured()) {
      return { skipped: true, reason: "Binance Spot API not configured" };
    }

    // --- 1. Pending checkout payments ---
    const pendingPayments = await prisma.payment.findMany({
      where: {
        status: "PENDING",
        paymentMethod: "BINANCE_PAY",
      },
      include: {
        order: {
          include: {
            items: true,
          },
        },
      },
    });

    const binancePayments = pendingPayments.filter((p) => {
      const details = p.paymentDetails as Record<string, unknown> | null;
      return details?.provider === "binance_transfer";
    });

    // --- 2. Pending wallet deposits ---
    const pendingDeposits = await prisma.walletDeposit.findMany({
      where: { status: "PENDING" },
    });

    let expired = 0;
    let verified = 0;

    // --- 3. Handle expired checkout payments ---
    const activePayments: typeof binancePayments = [];
    for (const payment of binancePayments) {
      const details = payment.paymentDetails as Record<string, unknown>;
      const expiresAt = details.expiresAt as string | undefined;

      if (expiresAt && Date.now() > new Date(expiresAt).getTime()) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "FAILED" },
        });
        await prisma.order.update({
          where: { id: payment.orderId },
          data: { status: "CANCELLED", paymentStatus: "FAILED" },
        });
        expired++;
      } else {
        activePayments.push(payment);
      }
    }

    // --- 4. Handle expired wallet deposits ---
    const activeDeposits: typeof pendingDeposits = [];
    for (const deposit of pendingDeposits) {
      if (deposit.expiresAt < new Date()) {
        await prisma.walletDeposit.update({
          where: { id: deposit.id },
          data: { status: "FAILED" },
        });
        expired++;
      } else {
        activeDeposits.push(deposit);
      }
    }

    if (activePayments.length === 0 && activeDeposits.length === 0) {
      return {
        processed: binancePayments.length + pendingDeposits.length,
        expired,
        verified: 0,
      };
    }

    // --- 5. Build combined batch verification request ---
    const pendingItems: Array<{
      memoCode: string;
      expectedAmount: number;
      coin: string;
    }> = [];

    for (const p of activePayments) {
      const details = p.paymentDetails as Record<string, unknown>;
      pendingItems.push({
        memoCode: details.memoCode as string,
        expectedAmount: details.expectedAmount as number,
        coin: (details.coin as string) ?? "USDT",
      });
    }

    for (const d of activeDeposits) {
      pendingItems.push({
        memoCode: d.memoCode,
        expectedAmount: d.amount,
        coin: d.coin,
      });
    }

    // Single batch API call
    const results = await batchVerifyDeposits(pendingItems);

    // --- 6. Process verified checkout payments ---
    for (const payment of activePayments) {
      const details = payment.paymentDetails as Record<string, unknown>;
      const memoCode = details.memoCode as string;
      const result = results.get(memoCode);

      if (!result?.verified) continue;

      const order = payment.order;
      if (!order || order.status === "COMPLETED" || order.status === "CANCELLED")
        continue;

      await fulfillOrder(order, order.buyerId, result.txId ?? `binance_${memoCode}`);
      verified++;
    }

    // --- 7. Process verified wallet deposits ---
    for (const deposit of activeDeposits) {
      const result = results.get(deposit.memoCode);
      if (!result?.verified) continue;

      const creditAmount = result.actualAmount ?? deposit.amount;

      await creditWallet({
        userId: deposit.userId,
        amount: creditAmount,
        type: "DEPOSIT_CREDIT",
        description: `Deposito Binance (${deposit.coin}) - Memo: ${deposit.memoCode}`,
      });

      await prisma.walletDeposit.update({
        where: { id: deposit.id },
        data: {
          status: "COMPLETED",
          verifiedAt: new Date(),
          txId: result.txId,
          actualAmount: result.actualAmount,
        },
      });

      verified++;
    }

    const totalProcessed =
      binancePayments.length + pendingDeposits.length;

    console.log(
      `[Inngest Cron] Binance: ${totalProcessed} checked, ${verified} verified, ${expired} expired`
    );

    return { processed: totalProcessed, expired, verified };
  }
);
