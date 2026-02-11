"use server";

import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";

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
    throw error; // Re-throw redirect errors (NEXT_REDIRECT)
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
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) {
    return { error: result.error || "Error al registrarse" };
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
    throw error; // Re-throw redirect errors
  }

  return { success: true };
}
