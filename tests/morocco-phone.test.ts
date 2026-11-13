import { describe, it, expect } from "vitest";
import { normalizeMoroccanPhone, formatMoroccanPhoneDisplay, moroccanPhoneSchema } from "../src/lib/validation/morocco";

describe("Moroccan Phone Validation & Normalization", () => {
  it("normalizes standard Moroccan mobile numbers starting with 06", () => {
    expect(normalizeMoroccanPhone("0612345678")).toBe("+212612345678");
    expect(normalizeMoroccanPhone("06 12 34 56 78")).toBe("+212612345678");
    expect(normalizeMoroccanPhone("06-12-34-56-78")).toBe("+212612345678");
  });

  it("normalizes numbers starting with 07", () => {
    expect(normalizeMoroccanPhone("0799887766")).toBe("+212799887766");
    expect(normalizeMoroccanPhone("07 99 88 77 66")).toBe("+212799887766");
  });

  it("normalizes numbers starting with international prefixes +212 and 00212", () => {
    expect(normalizeMoroccanPhone("+212661234567")).toBe("+212661234567");
    expect(normalizeMoroccanPhone("00212661234567")).toBe("+212661234567");
    expect(normalizeMoroccanPhone("212661234567")).toBe("+212661234567");
  });

  it("normalizes Moroccan landline numbers starting with 05", () => {
    expect(normalizeMoroccanPhone("0522123456")).toBe("+212522123456");
  });

  it("rejects invalid numbers", () => {
    expect(normalizeMoroccanPhone("123456")).toBeNull();
    expect(normalizeMoroccanPhone("0812345678")).toBeNull(); // 08 is not standard mobile/landline
    expect(normalizeMoroccanPhone("061234567")).toBeNull(); // Too short
    expect(normalizeMoroccanPhone("061234567890")).toBeNull(); // Too long
    expect(normalizeMoroccanPhone("abcd")).toBeNull();
    expect(normalizeMoroccanPhone("+33612345678")).toBeNull(); // French number, not Moroccan
  });

  it("formats normalized phone for display", () => {
    expect(formatMoroccanPhoneDisplay("+212612345678")).toBe("06 12 34 56 78");
  });

  it("validates via Zod schema", () => {
    expect(moroccanPhoneSchema.safeParse("0612345678").success).toBe(true);
    expect(moroccanPhoneSchema.safeParse("+212712345678").success).toBe(true);
    expect(moroccanPhoneSchema.safeParse("0123456789").success).toBe(false);
  });
});
