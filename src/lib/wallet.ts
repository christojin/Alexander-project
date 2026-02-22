import { prisma } from "@/lib/prisma";
import { WalletTransactionType } from "@prisma/client";

interface WalletOperationResult {
  success: boolean;
  newBalance: number;
  transactionId: string;
  error?: string;
}

/**
 * Credit (add funds to) a buyer's wallet.
 * Uses Prisma interactive transaction for atomicity.
 */
export async function creditWallet(params: {
  userId: string;
  amount: number;
  type: WalletTransactionType;
  description: string;
  orderId?: string;
  refundId?: string;
}): Promise<WalletOperationResult> {
  const { userId, amount, type, description, orderId, refundId } = params;

  if (amount <= 0) {
    return { success: false, newBalance: 0, transactionId: "", error: "El monto debe ser mayor a 0" };
  }

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    });

    if (!user) {
      return { success: false, newBalance: 0, transactionId: "", error: "Usuario no encontrado" };
    }

    const balanceBefore = user.walletBalance;
    const balanceAfter = balanceBefore + amount;

    await tx.user.update({
      where: { id: userId },
      data: { walletBalance: balanceAfter },
    });

    const transaction = await tx.walletTransaction.create({
      data: {
        userId,
        type,
        amount,
        balanceBefore,
        balanceAfter,
        description,
        orderId: orderId ?? null,
        refundId: refundId ?? null,
      },
    });

    return {
      success: true,
      newBalance: balanceAfter,
      transactionId: transaction.id,
    };
  });
}

/**
 * Debit (subtract funds from) a buyer's wallet.
 * Returns error if insufficient balance.
 * Uses Prisma interactive transaction for atomicity.
 */
export async function debitWallet(params: {
  userId: string;
  amount: number;
  description: string;
  orderId?: string;
}): Promise<WalletOperationResult> {
  const { userId, amount, description, orderId } = params;

  if (amount <= 0) {
    return { success: false, newBalance: 0, transactionId: "", error: "El monto debe ser mayor a 0" };
  }

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    });

    if (!user) {
      return { success: false, newBalance: 0, transactionId: "", error: "Usuario no encontrado" };
    }

    if (user.walletBalance < amount) {
      return {
        success: false,
        newBalance: user.walletBalance,
        transactionId: "",
        error: `Saldo insuficiente. Disponible: $${user.walletBalance.toFixed(2)}`,
      };
    }

    const balanceBefore = user.walletBalance;
    const balanceAfter = balanceBefore - amount;

    await tx.user.update({
      where: { id: userId },
      data: { walletBalance: balanceAfter },
    });

    const transaction = await tx.walletTransaction.create({
      data: {
        userId,
        type: "PURCHASE_DEBIT",
        amount: -amount,
        balanceBefore,
        balanceAfter,
        description,
        orderId: orderId ?? null,
      },
    });

    return {
      success: true,
      newBalance: balanceAfter,
      transactionId: transaction.id,
    };
  });
}

/**
 * Get wallet balance and recent transactions.
 */
export async function getWalletInfo(
  userId: string,
  page: number = 1,
  limit: number = 20
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { walletBalance: true },
  });

  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.walletTransaction.count({ where: { userId } }),
  ]);

  return {
    balance: user?.walletBalance ?? 0,
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
