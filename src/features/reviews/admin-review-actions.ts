"use server";

import { safeRevalidatePath } from "@/lib/utils/cache";
import { requireAdmin } from "@/lib/security/session";
import { db } from "@/lib/db";
import { reviews } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function moderateReviewAction(input: {
  reviewId: string;
  status: "approved" | "rejected" | "hidden";
}) {
  await requireAdmin();

  const now = new Date();
  await db
    .update(reviews)
    .set({
      status: input.status,
      approvedAt: input.status === "approved" ? now : null,
    })
    .where(eq(reviews.id, input.reviewId));

  safeRevalidatePath("/[locale]/admin/reviews");
  safeRevalidatePath("/[locale]");
  return { success: true };
}

