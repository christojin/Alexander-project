"use server";

import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function loginWithCredentials(
  email: string,
  password: string,
  callbackUrl?: string
) {
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl || "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Email o contrasena incorrectos" };
        default:
          if (error.message?.includes("ACCOUNT_DISABLED")) {
            return { error: "Tu cuenta ha sido deshabilitada" };
          }
          return { error: "Error al iniciar sesion" };
      }
    }
    throw error;
  }
}

export async function loginWithGoogle(callbackUrl?: string) {
  await signIn("google", {
    redirectTo: callbackUrl || "/",
  });
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  role: "BUYER" | "SELLER";
}) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (existingUser) {
      return { error: "Este email ya esta registrado" };
    }

    // Validate password
    if (data.password.length < 8) {
      return { error: "La contrasena debe tener al menos 8 caracteres" };
    }

    // Create user directly via Prisma
    const passwordHash = await bcrypt.hash(data.password, 12);

    if (data.role === "SELLER") {
      // Use transaction to ensure User + SellerProfile are created atomically
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name: data.name.trim(),
            email: data.email.toLowerCase().trim(),
            passwordHash,
            role: "SELLER",
            isActive: true,
          },
        });

        await tx.sellerProfile.create({
          data: {
            userId: user.id,
            storeName: `Tienda de ${data.name.trim()}`,
            storeDescription: "",
            status: "PENDING",
          },
        });
      });
    } else {
      await prisma.user.create({
        data: {
          name: data.name.trim(),
          email: data.email.toLowerCase().trim(),
          passwordHash,
          role: "BUYER",
          isActive: true,
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("[registerUser] Error:", error);
    return { error: "Error al crear la cuenta. Intenta de nuevo." };
  }
}
