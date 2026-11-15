"use server";

import { safeRevalidatePath } from "@/lib/utils/cache";
import { requireAdmin } from "@/lib/security/session";
import { db } from "@/lib/db";
import { returns, orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function updateReturnStatusAction(input: {
  returnId: string;
  status: "requested" | "approved" | "rejected" | "received" | "inspected" | "completed" | "cancelled";
  refundStatus?: "not_applicable" | "pending" | "refunded";
  refundAmount?: number;
  adminNotes?: string;
}) {
  await requireAdmin();

  const updateFields: any = {
    status: input.status,
    updatedAt: new Date(),
  };

  if (input.refundStatus) {
    updateFields.refundStatus = input.refundStatus;
  }
  if (input.refundAmount !== undefined) {
    updateFields.refundAmount = input.refundAmount.toFixed(2);
  }
  if (input.adminNotes !== undefined) {
    updateFields.adminNotes = input.adminNotes;
  }

  await db.update(returns).set(updateFields).where(eq(returns.id, input.returnId));

  safeRevalidatePath("/[locale]/admin/returns");
  return { success: true };
}

