import { describe, it, expect, beforeAll } from "vitest";
import {
  bootstrapAdminUser,
  authenticateAdmin,
  validateAdminSession,
  revokeAdminSession,
  hashPassword,
  verifyPassword,
} from "../src/lib/security/auth";

describe("Admin Authentication & Security Engine", () => {
  beforeAll(async () => {
    // Ensure admin user exists
    await bootstrapAdminUser();
  });

  it("hashes and verifies passwords reliably", async () => {
    const raw = "SuperSecret123!";
    const hash = await hashPassword(raw);
    expect(hash).not.toBe(raw);
    expect(await verifyPassword(raw, hash)).toBe(true);
    expect(await verifyPassword("WrongPassword", hash)).toBe(false);
  });

  it("fails authentication with invalid password", async () => {
    const result = await authenticateAdmin("admin@rayana.ma", "WrongPassword123!");
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.sessionToken).toBeUndefined();
  });

  it("authenticates successfully with correct password", async () => {
    const result = await authenticateAdmin("admin@rayana.ma", "RayanaAdmin2026!Secure");
    expect(result.success).toBe(true);
    expect(result.sessionToken).toBeDefined();
    expect(result.admin?.email).toBe("admin@rayana.ma");

    // Validate the created session
    const validated = await validateAdminSession(result.sessionToken!);
    expect(validated).not.toBeNull();
    expect(validated?.email).toBe("admin@rayana.ma");

    // Revoke the session
    await revokeAdminSession(result.sessionToken!);
    const afterRevoke = await validateAdminSession(result.sessionToken!);
    expect(afterRevoke).toBeNull();
  });
});

