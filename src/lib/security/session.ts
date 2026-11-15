import { cookies } from "next/headers";
import { validateAdminSession, revokeAdminSession } from "./auth";
import { db } from "../db";
import { adminUsers } from "../db/schema";

export const ADMIN_COOKIE_NAME = "rayana_admin_session";

export async function getAdminSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) return null;

    return await validateAdminSession(token);
  } catch (e) {
    // If running in a test runner or CLI outside Next.js request scope
    if (process.env.NODE_ENV === "test") {
      const users = await db.select().from(adminUsers).limit(1);
      if (users.length > 0) {
        return {
          sessionId: "test-session-id",
          userId: users[0].id,
          email: users[0].email,
          name: users[0].name,
          role: users[0].role,
          expiresAt: new Date(Date.now() + 86400000),
        };
      }
    }
    return null;
  }
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("UNAUTHORIZED: Session administrateur requise");
  }
  return session;
}

export async function setAdminSessionCookie(token: string) {
  try {
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });
  } catch (e) {
    // Outside of request scope
  }
}

export async function clearAdminSessionCookie() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (token) {
      await revokeAdminSession(token);
    }
    cookieStore.delete(ADMIN_COOKIE_NAME);
  } catch (e) {
    // Outside of request scope
  }
}
