import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { generateOrderNumber, toPaymentMethodEnum } from "@/lib/order-utils";
import { debitWallet } from "@/lib/wallet";
import { assessFraudRisk, scheduleDelayedDelivery } from "@/lib/fraud";
import { createBinancePayOrder, isBinancePayConfigured } from "@/lib/binance-pay";
import { createQrBoliviaOrder } from "@/lib/qr-bolivia";

interface CheckoutItem {
  productId: string;
  quantity: number;
}

/**
 * POST /api/checkout
 *
 * Unified checkout endpoint. Creates order(s) grouped by seller,
 * then initiates payment based on the selected method.
 *
 * Body: { items: [{productId, quantity}], paymentMethod: string }
 *
 * Returns:
 *   - stripe:      { type: "redirect", url, orderIds }
 *   - qr_bolivia:  { type: "qr", reference, qrDataUrl, amount, orderIds }
 *   - binance_pay: { type: "redirect", url, orderIds }
 *   - crypto:      { type: "mock_complete", orderIds }
 *   - wallet:      { type: "wallet_complete", orderIds }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Debes iniciar sesion para comprar" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { items, paymentMethod } = body as {
      items: CheckoutItem[];
      paymentMethod: string;
    };

    if (!items?.length) {
      return NextResponse.json(
        { error: "El carrito esta vacio" },
        { status: 400 }
      );
    }

    const validMethods = ["stripe", "qr_bolivia", "binance_pay", "crypto", "wallet"];
    if (!validMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Metodo de pago invalido" },
        { status: 400 }
      );
    }

    // ── 1. Fetch all products and validate ──────────────────────
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true, isDeleted: false },
      include: {
        seller: {
          select: {
            id: true,
            commissionRate: true,
            status: true,
            userId: true,
            storeName: true,
          },
        },
      },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: "Uno o mas productos no estan disponibles" },
        { status: 400 }
      );
    }

    // Build lookup
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate stock for instant-delivery products
    for (const item of items) {
      const product = productMap.get(item.productId)!;
      if (product.deliveryType === "INSTANT") {
        // Count available codes/accounts
        const availableGiftCards = await prisma.giftCardCode.count({
          where: { productId: product.id, status: "AVAILABLE" },
        });
        const availableAccounts = await prisma.streamingAccount.count({
          where: { productId: product.id, status: "AVAILABLE" },
        });
        const totalAvailable = availableGiftCards + availableAccounts;

        if (totalAvailable < item.quantity) {
          return NextResponse.json(
            {
              error: `Stock insuficiente para "${product.name}". Disponible: ${totalAvailable}`,
            },
            { status: 400 }
          );
        }
      }
    }

    // ── 2. Fetch platform settings for fees ─────────────────────
    const settings = await prisma.platformSettings.findUnique({
      where: { id: "default" },
    });
    const serviceFeeFixed = settings?.buyerServiceFeeFixed ?? 0;
    const serviceFeePercent = settings?.buyerServiceFeePercent ?? 0;

    // ── 3. Group items by seller ────────────────────────────────
    const sellerGroups = new Map<
      string,
      { seller: (typeof products)[0]["seller"]; items: Array<{ product: (typeof products)[0]; quantity: number }> }
    >();

    for (const item of items) {
      const product = productMap.get(item.productId)!;
      const sellerId = product.sellerId;
      if (!sellerGroups.has(sellerId)) {
        sellerGroups.set(sellerId, { seller: product.seller, items: [] });
      }
      sellerGroups.get(sellerId)!.items.push({
        product,
        quantity: item.quantity,
      });
    }

    // ── 4. Create orders (one per seller) ───────────────────────
    const paymentMethodEnum = toPaymentMethodEnum(paymentMethod);
    const createdOrders: Array<{
      id: string;
      orderNumber: string;
      totalAmount: number;
    }> = [];

    for (const [, group] of sellerGroups) {
      const subtotal = group.items.reduce(
        (sum, i) => sum + i.product.price * i.quantity,
        0
      );
      const serviceFeeAmount =
        serviceFeeFixed + subtotal * (serviceFeePercent / 100);
      const totalAmount = subtotal + serviceFeeAmount;
      const commissionRate = group.seller.commissionRate;
      const commissionAmount = subtotal * (commissionRate / 100);
      const sellerEarnings = subtotal - commissionAmount;

      const orderNumber = generateOrderNumber();

      const order = await prisma.order.create({
        data: {
          orderNumber,
          buyerId: session.user.id,
          sellerId: group.seller.id,
          subtotal,
          serviceFeeFixed,
          serviceFeePercent,
          serviceFeeAmount,
          totalAmount,
          commissionRate,
          commissionAmount,
          sellerEarnings,
          paymentMethod: paymentMethodEnum,
          paymentStatus: "PENDING",
          status: "PENDING",
          isHighValue: false,
          requiresManualReview: false,
          items: {
            create: group.items.map((i) => ({
              productId: i.product.id,
              productName: i.product.name,
              productType: i.product.productType,
              quantity: i.quantity,
              unitPrice: i.product.price,
              totalPrice: i.product.price * i.quantity,
              deliveryType: i.product.deliveryType,
            })),
          },
          payment: {
            create: {
              paymentMethod: paymentMethodEnum,
              amount: totalAmount,
              currency: "USD",
              status: "PENDING",
            },
          },
        },
      });

      createdOrders.push({
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount,
      });
    }

    const grandTotal = createdOrders.reduce(
      (sum, o) => sum + o.totalAmount,
      0
    );
    const orderIds = createdOrders.map((o) => o.id);

    // ── 4b. Anti-fraud assessment ──────────────────────────────
    const fraudResult = await assessFraudRisk({
      buyerId: session.user.id,
      totalAmount: grandTotal,
      paymentMethod,
      itemCount: items.length,
    });

    // Update orders with fraud flags
    for (const orderId of orderIds) {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          isHighValue: fraudResult.isHighValue,
          requiresManualReview: fraudResult.requiresManualReview,
        },
      });

      // Schedule delayed delivery if needed
      if (fraudResult.shouldDelay) {
        await scheduleDelayedDelivery(orderId, fraudResult.delayMinutes);
      }
    }

    // ── 5. Initiate payment based on method ─────────────────────

    // --- WALLET ---
    if (paymentMethod === "wallet") {
      const debitResult = await debitWallet({
        userId: session.user.id,
        amount: grandTotal,
        description: `Compra - Ordenes: ${createdOrders.map((o) => o.orderNumber).join(", ")}`,
        orderId: orderIds[0],
      });

      if (!debitResult.success) {
        // Clean up created orders
        for (const orderId of orderIds) {
          await prisma.payment.delete({ where: { orderId } });
          await prisma.orderItem.deleteMany({ where: { orderId } });
          await prisma.order.delete({ where: { id: orderId } });
        }
        return NextResponse.json({ error: debitResult.error }, { status: 400 });
      }

      // Mark wallet amount used on orders
      for (const orderId of orderIds) {
        const o = createdOrders.find((c) => c.id === orderId);
        await prisma.order.update({
          where: { id: orderId },
          data: { walletAmountUsed: o?.totalAmount ?? 0 },
        });
      }

      // Complete orders
      await completeOrders(orderIds, session.user.id, `wallet_${debitResult.transactionId}`);
      return NextResponse.json({
        type: "wallet_complete",
        orderIds,
        message: "Pago realizado con saldo de billetera.",
      });
    }

    // --- STRIPE ---
    if (paymentMethod === "stripe") {
      if (!isStripeConfigured() || !stripe) {
        // Mock mode: auto-complete orders
        await completeOrders(orderIds, session.user.id, "mock_stripe_" + Date.now());
        return NextResponse.json({
          type: "mock_complete",
          orderIds,
          message: "Stripe no configurado. Pedido completado en modo demo.",
        });
      }

      const lineItems = items.map((item) => {
        const product = productMap.get(item.productId)!;
        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: product.name,
              description: product.description.substring(0, 500),
            },
            unit_amount: Math.round(product.price * 100), // cents
          },
          quantity: item.quantity,
        };
      });

      // Add service fee as a line item if applicable
      const totalServiceFee = createdOrders.reduce(
        (sum, o) => sum + (o.totalAmount - items.reduce((s, i) => {
          const p = productMap.get(i.productId);
          return s + (p ? p.price * i.quantity : 0);
        }, 0)),
        0
      );
      if (totalServiceFee > 0) {
        lineItems.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: "Cargo por servicio",
              description: "Tarifa de procesamiento",
            },
            unit_amount: Math.round(totalServiceFee * 100),
          },
          quantity: 1,
        });
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

      const stripeSession = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: lineItems,
        metadata: {
          orderIds: orderIds.join(","),
          buyerId: session.user.id,
        },
        success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/checkout?cancelled=true`,
      });

      return NextResponse.json({
        type: "redirect",
        url: stripeSession.url,
        orderIds,
      });
    }

    // --- QR BOLIVIA ---
    if (paymentMethod === "qr_bolivia") {
      const result = await createQrBoliviaOrder({
        amount: grandTotal,
        orderIds,
        description: `VirtuMall - ${createdOrders.map((o) => o.orderNumber).join(", ")}`,
      });

      if (!result.success) {
        return NextResponse.json(
          { error: result.error ?? "Error al generar QR de pago" },
          { status: 500 }
        );
      }

      // Store provider order ID in payment records
      for (const orderId of orderIds) {
        await prisma.payment.update({
          where: { orderId },
          data: {
            externalPaymentId: result.orderId,
            paymentDetails: {
              provider: "qr_bolivia",
              providerOrderId: result.orderId,
              sandbox: result.sandbox ?? false,
            },
          },
        });
      }

      return NextResponse.json({
        type: "qr",
        reference: result.orderId,
        qrDataUrl: result.qrImageUrl ?? "",
        amount: grandTotal,
        orderIds,
        expiresAt: result.expiresAt,
        sandbox: result.sandbox ?? false,
      });
    }

    // --- BINANCE PAY ---
    if (paymentMethod === "binance_pay") {
      if (!isBinancePayConfigured()) {
        // Mock mode: auto-complete
        await completeOrders(orderIds, session.user.id, "mock_binance_" + Date.now());
        return NextResponse.json({
          type: "mock_complete",
          orderIds,
          message: "Binance Pay no configurado. Pedido completado en modo demo.",
        });
      }

      const result = await createBinancePayOrder({
        amount: grandTotal,
        orderIds,
        description: `VirtuMall - ${createdOrders.map((o) => o.orderNumber).join(", ")}`,
      });

      if (!result.success || !result.checkoutUrl) {
        // Fallback to mock mode
        await completeOrders(orderIds, session.user.id, "mock_binance_" + Date.now());
        return NextResponse.json({
          type: "mock_complete",
          orderIds,
          message: result.error ?? "Error con Binance Pay. Pedido completado en modo demo.",
        });
      }

      // Store Binance trade number in payment records
      for (const orderId of orderIds) {
        await prisma.payment.update({
          where: { orderId },
          data: {
            externalPaymentId: result.merchantTradeNo,
            paymentDetails: {
              provider: "binance_pay",
              prepayId: result.prepayId,
              checkoutUrl: result.checkoutUrl,
            },
          },
        });
      }

      return NextResponse.json({
        type: "redirect",
        url: result.checkoutUrl,
        orderIds,
      });
    }

    // --- CRYPTO (mock) ---
    if (paymentMethod === "crypto") {
      // Mock: auto-complete
      await completeOrders(orderIds, session.user.id, "mock_crypto_" + Date.now());
      return NextResponse.json({
        type: "mock_complete",
        orderIds,
        message: "Crypto en modo demo. Pedido completado.",
      });
    }

    return NextResponse.json({ error: "Metodo de pago no soportado" }, { status: 400 });
  } catch (error) {
    console.error("[Checkout POST] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// ── Helper: Complete orders and assign digital codes ────────────
async function completeOrders(
  orderIds: string[],
  buyerId: string,
  externalPaymentId: string
) {
  const { fulfillOrder } = await import("@/lib/order-fulfillment");

  for (const orderId of orderIds) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order || order.status !== "PENDING") continue;

    await fulfillOrder(
      {
        id: order.id,
        sellerId: order.sellerId,
        orderNumber: order.orderNumber,
        sellerEarnings: order.sellerEarnings,
        requiresManualReview: order.requiresManualReview,
        paymentStatus: order.paymentStatus,
        items: order.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          productType: item.productType,
          deliveryType: item.deliveryType,
          quantity: item.quantity,
        })),
      },
      buyerId,
      externalPaymentId
    );
  }
}
