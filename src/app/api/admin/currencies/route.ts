import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/currencies
 * List all currencies.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const currencies = await prisma.currency.findMany({
      orderBy: { code: "asc" },
    });

    return NextResponse.json({ currencies });
  } catch (error) {
    console.error("Error fetching currencies:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

/**
 * POST /api/admin/currencies
 * Create a new currency.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const { name, code, symbol, exchangeRate } = body as {
      name: string;
      code: string;
      symbol: string;
      exchangeRate: number;
    };

    if (!name || !code || !symbol || typeof exchangeRate !== "number" || exchangeRate <= 0) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
    }

    const existing = await prisma.currency.findUnique({ where: { code: code.toUpperCase() } });
    if (existing) {
      return NextResponse.json({ error: `La moneda ${code} ya existe` }, { status: 409 });
    }

    const currency = await prisma.currency.create({
      data: {
        name,
        code: code.toUpperCase(),
        symbol,
        exchangeRate,
      },
    });

    return NextResponse.json({ currency }, { status: 201 });
  } catch (error) {
    console.error("Error creating currency:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
