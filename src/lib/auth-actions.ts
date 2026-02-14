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
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    return { error: "Este email ya esta registrado" };
  }

  // Validate password
  if (data.password.length < 6) {
    return { error: "La contrasena debe tener al menos 6 caracteres" };
  }

  // Create user directly via Prisma
  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      isActive: true,
    },
  });

  // Create seller profile if registering as seller
  if (data.role === "SELLER") {
    await prisma.sellerProfile.create({
      data: {
        userId: user.id,
        storeName: `Tienda de ${data.name}`,
        storeDescription: "",
        status: "PENDING",
      },
    });
  }

  // Auto sign in after registration
  try {
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirectTo: data.role === "SELLER" ? "/seller/dashboard" : "/buyer/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Cuenta creada pero error al iniciar sesion. Intenta iniciar sesion manualmente." };
    }
    throw error;
  }

  return { success: true };
}
