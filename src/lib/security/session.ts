import { cookies } from "next/headers";
import { validateAdminSession, revokeAdminSession } from "./auth";

export const ADMIN_COOKIE_NAME = "rayana_admin_session";

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;

  return validateAdminSession(token);
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("UNAUTHORIZED: Session administrateur requise");
  }
  return session;
}

export async function setAdminSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  });
}

export async function clearAdminSessionCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (token) {
    await revokeAdminSession(token);
  }
  cookieStore.delete(ADMIN_COOKIE_NAME);
}
