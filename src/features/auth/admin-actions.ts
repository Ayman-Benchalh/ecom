"use server";

import { headers } from "next/headers";
import { authenticateAdmin } from "@/lib/security/auth";
import { setAdminSessionCookie, clearAdminSessionCookie } from "@/lib/security/session";

export async function loginAdminAction(formData: { email: string; password: string }) {
  try {
    const headerList = await headers();
    const forwardedFor = headerList.get("x-forwarded-for");
    const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    const userAgent = headerList.get("user-agent") || undefined;

    const result = await authenticateAdmin(
      formData.email,
      formData.password,
      clientIp,
      userAgent
    );

    if (result.success && result.sessionToken) {
      await setAdminSessionCookie(result.sessionToken);
      return { success: true };
    }

    return { success: false, error: result.error || "Identifiants invalides." };
  } catch (err: any) {
    console.error("Login action error:", err);
    return { success: false, error: "Erreur serveur lors de la connexion." };
  }
}

export async function logoutAdminAction() {
  await clearAdminSessionCookie();
  return { success: true };
}

