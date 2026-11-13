"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/security/session";
import { db } from "@/lib/db";
import { landingPages, landingPageVersions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function saveLandingPageVersionAction(input: {
  landingPageId: string;
  sections: any[];
  appearance: any;
  publishNow?: boolean;
}) {
  await requireAdmin();

  return await db.transaction(async (tx) => {
    const [page] = await tx
      .select()
      .from(landingPages)
      .where(eq(landingPages.id, input.landingPageId))
      .limit(1);

    if (!page) {
      return { success: false, error: "Page introuvable." };
    }

    const latestVersion = await tx
      .select({ versionNumber: landingPageVersions.versionNumber })
      .from(landingPageVersions)
      .where(eq(landingPageVersions.landingPageId, page.id))
      .orderBy(desc(landingPageVersions.versionNumber))
      .limit(1);

    const nextVersion = (latestVersion[0]?.versionNumber || 0) + 1;
    const now = new Date();

    const [createdVersion] = await tx
      .insert(landingPageVersions)
      .values({
        landingPageId: page.id,
        versionNumber: nextVersion,
        sectionsJson: input.sections,
        appearanceJson: input.appearance,
        publishedAt: input.publishNow ? now : null,
      })
      .returning();

    if (input.publishNow) {
      await tx
        .update(landingPages)
        .set({
          status: "published",
          activeVersionNumber: nextVersion,
          publishedAt: now,
          updatedAt: now,
        })
        .where(eq(landingPages.id, page.id));
    }

    revalidatePath("/[locale]/admin/pages");
    revalidatePath("/[locale]");
    return { success: true, versionNumber: nextVersion };
  });
}

export async function duplicateLandingPageAction(landingPageId: string) {
  await requireAdmin();

  return await db.transaction(async (tx) => {
    const [page] = await tx
      .select()
      .from(landingPages)
      .where(eq(landingPages.id, landingPageId))
      .limit(1);

    if (!page) {
      return { success: false, error: "Page introuvable." };
    }

    const newSlug = `${page.slug}-copie-${Date.now().toString().slice(-4)}`;
    const [duplicated] = await tx
      .insert(landingPages)
      .values({
        title: `${page.title} (Copie)`,
        slug: newSlug,
        productId: page.productId,
        status: "draft",
        activeVersionNumber: 1,
      })
      .returning();

    // Copy latest version
    const latestVersion = await tx
      .select()
      .from(landingPageVersions)
      .where(eq(landingPageVersions.landingPageId, page.id))
      .orderBy(desc(landingPageVersions.versionNumber))
      .limit(1);

    if (latestVersion.length > 0) {
      await tx.insert(landingPageVersions).values({
        landingPageId: duplicated.id,
        versionNumber: 1,
        sectionsJson: latestVersion[0].sectionsJson,
        appearanceJson: latestVersion[0].appearanceJson,
      });
    }

    revalidatePath("/[locale]/admin/pages");
    return { success: true, duplicatedId: duplicated.id };
  });
}
