import crypto from "crypto";
import bcrypt from "bcryptjs";
import { eq, and, gt, isNull } from "drizzle-orm";
import { db } from "../db";
import { adminUsers, adminSessions, auditLogs } from "../db/schema";

const BCRYPT_SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const SESSION_DURATION_DAYS = 7;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Bootstrap default admin user if none exists
 */
export async function bootstrapAdminUser() {
  const existing = await db.select().from(adminUsers).limit(1);
  if (existing.length > 0) {
    return existing[0];
  }

  const email = process.env.ADMIN_BOOTSTRAP_EMAIL || "admin@rayana.ma";
  const rawPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD || "RayanaAdmin2026!Secure";
  const passwordHash = await hashPassword(rawPassword);

  const [created] = await db
    .insert(adminUsers)
    .values({
      email: email.toLowerCase().trim(),
      passwordHash,
      name: "Directeur RAYANA",
      role: "super_admin",
    })
    .returning();

  await db.insert(auditLogs).values({
    adminUserId: created.id,
    action: "ADMIN_BOOTSTRAP_CREATED",
    entityType: "admin_users",
    entityId: created.id,
    detailsJson: { email: created.email, name: created.name },
  });

  return created;
}

export interface LoginResult {
  success: boolean;
  error?: string;
  sessionToken?: string;
  admin?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

/**
 * Authenticate admin with rate limiting & brute-force lockout protection
 */
export async function authenticateAdmin(
  email: string,
  password: string,
  clientIp?: string,
  userAgent?: string
): Promise<LoginResult> {
  const normalizedEmail = email.toLowerCase().trim();

  // Find user
  const users = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, normalizedEmail))
    .limit(1);

  if (users.length === 0) {
    // Record audit attempt without leaking user existence
    await db.insert(auditLogs).values({
      action: "ADMIN_LOGIN_FAILED_UNKNOWN_EMAIL",
      entityType: "auth",
      detailsJson: { email: normalizedEmail },
      ipAddress: clientIp,
    });
    return { success: false, error: "Identifiants invalides." };
  }

  const user = users[0];

  // Check lockout
  const now = new Date();
  if (user.lockedUntil && user.lockedUntil > now) {
    const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / (60 * 1000));
    return {
      success: false,
      error: `Compte temporairement bloqué suite à trop de tentatives. Réessayez dans ${remainingMinutes} minute(s).`,
    };
  }

  // Verify password
  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    const failedAttempts = user.failedLoginAttempts + 1;
    let lockedUntil: Date | null = null;

    if (failedAttempts >= MAX_LOGIN_ATTEMPTS) {
      lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
    }

    await db
      .update(adminUsers)
      .set({
        failedLoginAttempts: failedAttempts,
        lockedUntil,
        updatedAt: new Date(),
      })
      .where(eq(adminUsers.id, user.id));

    await db.insert(auditLogs).values({
      adminUserId: user.id,
      action: lockedUntil ? "ADMIN_ACCOUNT_LOCKED" : "ADMIN_LOGIN_FAILED",
      entityType: "auth",
      entityId: user.id,
      detailsJson: { failedAttempts, lockedUntil: lockedUntil?.toISOString() },
      ipAddress: clientIp,
    });

    if (lockedUntil) {
      return {
        success: false,
        error: `Trop de tentatives échouées. Compte verrouillé pour ${LOCKOUT_MINUTES} minutes.`,
      };
    }

    return {
      success: false,
      error: `Identifiants invalides. (${MAX_LOGIN_ATTEMPTS - failedAttempts} tentative(s) restante(s))`,
    };
  }

  // Password correct: Reset failures and create session
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await db
    .update(adminUsers)
    .set({
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(adminUsers.id, user.id));

  await db.insert(adminSessions).values({
    adminUserId: user.id,
    token: sessionToken,
    ipAddress: clientIp,
    userAgent,
    expiresAt,
  });

  await db.insert(auditLogs).values({
    adminUserId: user.id,
    action: "ADMIN_LOGIN_SUCCESS",
    entityType: "auth",
    entityId: user.id,
    ipAddress: clientIp,
  });

  return {
    success: true,
    sessionToken,
    admin: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}

/**
 * Validate active session token
 */
export async function validateAdminSession(sessionToken: string) {
  if (!sessionToken || sessionToken.length < 32) return null;

  const now = new Date();
  const sessions = await db
    .select({
      sessionId: adminSessions.id,
      userId: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
      role: adminUsers.role,
      expiresAt: adminSessions.expiresAt,
    })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminSessions.adminUserId, adminUsers.id))
    .where(
      and(
        eq(adminSessions.token, sessionToken),
        gt(adminSessions.expiresAt, now),
        isNull(adminSessions.revokedAt)
      )
    )
    .limit(1);

  if (sessions.length === 0) return null;
  return sessions[0];
}

/**
 * Revoke session (logout)
 */
export async function revokeAdminSession(sessionToken: string) {
  if (!sessionToken) return;
  await db
    .update(adminSessions)
    .set({ revokedAt: new Date() })
    .where(eq(adminSessions.token, sessionToken));
}
