"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/security/session";
import { db } from "@/lib/db";
import { settings, adminUsers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/security/auth";

export async function updateStoreSettingsAction(input: {
  storeName?: string;
  whatsappPhone?: string;
  metaPixelId?: string;
  defaultShippingFee?: number;
}) {
  await requireAdmin();

  await db
    .insert(settings)
    .values({
      key: "store_general",
      valueJson: input,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: settings.key,
      set: {
        valueJson: input,
        updatedAt: new Date(),
      },
    });

  revalidatePath("/[locale]/admin/settings");
  return { success: true };
}

export async function changeAdminPasswordAction(newPassword: string) {
  const admin = await requireAdmin();

  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: "Le mot de passe doit contenir au moins 8 caractères." };
  }

  const passwordHash = await hashPassword(newPassword);

  await db
    .update(adminUsers)
    .set({
      passwordHash,
      updatedAt: new Date(),
    })
    .where(eq(adminUsers.id, admin.userId));

  return { success: true };
}
