"use server";

import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, createAdminToken } from "@/lib/auth";

export async function loginAdminAction(password: string): Promise<{ ok: boolean; error?: string }> {
  // Clave definida en servidor (o clave de fábrica por defecto para desarrollo)
  const officialPassword = process.env.ADMIN_PASSWORD || "AuraRosaAdmin2026*";

  if (!password || password.trim() !== officialPassword.trim()) {
    return {
      ok: false,
      error: "Contraseña incorrecta. Por favor verifica e intenta nuevamente.",
    };
  }

  // Generar token seguro firmado
  const token = await createAdminToken();

  // Guardar en cookie segura httpOnly
  try {
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });
  } catch {
    // Si se corre en un script de prueba fuera de Next.js
  }

  return { ok: true };
}

export async function logoutAdminAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}
