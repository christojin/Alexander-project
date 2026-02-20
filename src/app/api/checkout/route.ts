import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { generateOrderNumber, toPaymentMethodEnum } from "@/lib/order-utils";

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
 *   - qr_bolivia:  { type: "qr", reference, amount, orderIds }
 *   - binance_pay: { type: "redirect", url, orderIds }  (mock)
 *   - crypto:      { type: "wallet", address, amount, orderIds } (mock)
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

    const validMethods = ["stripe", "qr_bolivia", "binance_pay", "crypto"];
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
    const highValueThreshold = settings?.highValueThreshold ?? 100;
    const requireManualReviewAbove =
      settings?.requireManualReviewAbove ?? 500;

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

      const isHighValue = totalAmount >= highValueThreshold;
      const requiresManualReview = totalAmount >= requireManualReviewAbove;

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
          isHighValue,
          requiresManualReview,
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

    // ── 5. Initiate payment based on method ─────────────────────

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

    // --- QR BOLIVIA (mock/sandbox) ---
    if (paymentMethod === "qr_bolivia") {
      const reference = `QR-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Store reference in payment records
      for (const orderId of orderIds) {
        await prisma.payment.update({
          where: { orderId },
          data: {
            externalPaymentId: reference,
            paymentDetails: { provider: "qr_bolivia", reference },
          },
        });
      }

      return NextResponse.json({
        type: "qr",
        reference,
        amount: grandTotal,
        orderIds,
      });
    }

    // --- BINANCE PAY (mock) ---
    if (paymentMethod === "binance_pay") {
      // Mock: auto-complete
      await completeOrders(orderIds, session.user.id, "mock_binance_" + Date.now());
      return NextResponse.json({
        type: "mock_complete",
        orderIds,
        message: "Binance Pay en modo demo. Pedido completado.",
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
  for (const orderId of orderIds) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order || order.status !== "PENDING") continue;

    // Assign digital codes for instant-delivery items
    for (const item of order.items) {
      if (item.deliveryType === "INSTANT") {
        if (item.productType === "GIFT_CARD" || item.productType === "TOP_UP") {
          // Assign gift card codes
          const codes = await prisma.giftCardCode.findMany({
            where: { productId: item.productId, status: "AVAILABLE" },
            take: item.quantity,
          });
          for (const code of codes) {
            await prisma.giftCardCode.update({
              where: { id: code.id },
              data: {
                status: "SOLD",
                soldAt: new Date(),
                buyerId,
                orderId: item.id,
              },
            });
          }
        } else if (item.productType === "STREAMING") {
          // Assign streaming accounts (1 per quantity for COMPLETE_ACCOUNT)
          const accounts = await prisma.streamingAccount.findMany({
            where: { productId: item.productId, status: "AVAILABLE" },
            take: item.quantity,
          });
          for (const account of accounts) {
            await prisma.streamingAccount.update({
              where: { id: account.id },
              data: { status: "SOLD", soldAt: new Date() },
            });
          }
        }

        // Mark item as delivered
        await prisma.orderItem.update({
          where: { id: item.id },
          data: { isDelivered: true, deliveredAt: new Date() },
        });
      }
    }

    // Update product stock counts
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { soldCount: { increment: item.quantity } },
      });
    }

    // Update seller earnings
    await prisma.sellerProfile.update({
      where: { id: order.sellerId },
      data: {
        totalSales: { increment: 1 },
        totalEarnings: { increment: order.sellerEarnings },
        availableBalance: { increment: order.sellerEarnings },
      },
    });

    // Mark order as completed
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: order.requiresManualReview ? "UNDER_REVIEW" : "COMPLETED",
        paymentStatus: "COMPLETED",
        completedAt: order.requiresManualReview ? undefined : new Date(),
      },
    });

    // Mark payment as completed
    await prisma.payment.update({
      where: { orderId },
      data: {
        status: "COMPLETED",
        externalPaymentId,
        completedAt: new Date(),
      },
    });
  }
}
