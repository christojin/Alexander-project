import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit-api";

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, { windowMs: 15 * 60 * 1000, maxRequests: 5 }, "register");
  if (limited) return limited;

  try {
    const body = await req.json();
    const { name, email, password, role } = body;

    // Validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nombre, email y contrasena son requeridos" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contrasena debe tener al menos 8 caracteres" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Email invalido" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email ya esta registrado" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Determine role (only BUYER or SELLER allowed from registration)
    const userRole = role === "SELLER" ? "SELLER" : "BUYER";

    // Create user (with transaction for seller to ensure atomicity)
    if (userRole === "SELLER") {
      const result = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            name: name.trim(),
            email: email.toLowerCase().trim(),
            passwordHash,
            role: "SELLER",
          },
        });

        await tx.sellerProfile.create({
          data: {
            userId: newUser.id,
            storeName: `Tienda de ${name.trim()}`,
            storeDescription: "",
            status: "PENDING",
          },
        });

        return newUser;
      });

      return NextResponse.json(
        {
          message: "Cuenta creada exitosamente",
          user: {
            id: result.id,
            name: result.name,
            email: result.email,
            role: result.role,
          },
        },
        { status: 201 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        role: "BUYER",
      },
    });

    return NextResponse.json(
      {
        message: "Cuenta creada exitosamente",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Register] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
