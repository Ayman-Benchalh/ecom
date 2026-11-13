"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/security/session";
import { db } from "@/lib/db";
import { codSettlements, codSettlementOrders, orders, carriers } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function createCodSettlementAction(input: {
  carrierId: string;
  settlementReference: string;
  totalCollected: number;
  carrierFees: number;
  orderIds: string[];
  notes?: string;
}) {
  await requireAdmin();

  return await db.transaction(async (tx) => {
    const netAmountSettled = input.totalCollected - input.carrierFees;

    const [settlement] = await tx
      .insert(codSettlements)
      .values({
        carrierId: input.carrierId,
        settlementReference: input.settlementReference.trim().toUpperCase(),
        totalCollected: input.totalCollected.toFixed(2),
        carrierFees: input.carrierFees.toFixed(2),
        netAmountSettled: netAmountSettled.toFixed(2),
        notes: input.notes,
      })
      .returning();

    // Link orders and mark financialStatus: SETTLED
    for (const orderId of input.orderIds) {
      const [ord] = await tx
        .select({ totalAmount: orders.totalAmount, shippingFee: orders.shippingFee })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (ord) {
        await tx.insert(codSettlementOrders).values({
          settlementId: settlement.id,
          orderId,
          collectedAmount: ord.totalAmount,
          carrierFee: ord.shippingFee,
        });

        await tx
          .update(orders)
          .set({
            financialStatus: "SETTLED",
            updatedAt: new Date(),
          })
          .where(eq(orders.id, orderId));
      }
    }

    revalidatePath("/[locale]/admin/carriers");
    revalidatePath("/[locale]/admin");
    return { success: true, settlementId: settlement.id };
  });
}
