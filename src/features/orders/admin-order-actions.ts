"use server";

import { safeRevalidatePath } from "@/lib/utils/cache";
import { requireAdmin } from "@/lib/security/session";
import { db } from "@/lib/db";
import { orders, orderEvents, shipments, inventoryMovements, productVariants, orderItems } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function updateOrderStatusAction(input: {
  orderId: string;
  newStatus: string;
  notes?: string;
  trackingNumber?: string;
  carrierId?: string;
}) {
  const admin = await requireAdmin();

  return await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, input.orderId))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Commande introuvable." };
    }

    const oldStatus = existing.status;
    const now = new Date();

    const updateFields: any = {
      status: input.newStatus,
      updatedAt: now,
    };

    if (input.newStatus === "CONFIRMED") {
      updateFields.confirmedAt = now;
    } else if (input.newStatus === "SHIPPED") {
      updateFields.shippedAt = now;
    } else if (input.newStatus === "DELIVERED") {
      updateFields.deliveredAt = now;
      // Carrier collected cash
      updateFields.financialStatus = "COLLECTED_BY_CARRIER";
    } else if (input.newStatus === "CANCELLED") {
      updateFields.cancelledAt = now;

      // Restock inventory if cancelled from confirmed/new
      if (oldStatus !== "CANCELLED" && oldStatus !== "RETURNED") {
        const items = await tx
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, existing.id));

        for (const item of items) {
          const [v] = await tx
            .select()
            .from(productVariants)
            .where(eq(productVariants.id, item.variantId));

          if (v) {
            const newStock = v.stockQuantity + item.quantity;
            await tx
              .update(productVariants)
              .set({ stockQuantity: newStock, updatedAt: now })
              .where(eq(productVariants.id, v.id));

            await tx.insert(inventoryMovements).values({
              variantId: v.id,
              delta: item.quantity,
              reason: "order_cancelled",
              referenceId: existing.id,
              balanceAfter: newStock,
              notes: `Annulation commande ${existing.orderNumber}`,
            });
          }
        }
      }
    }

    if (input.notes) {
      updateFields.internalNotes = input.notes;
    }

    await tx.update(orders).set(updateFields).where(eq(orders.id, existing.id));

    // Handle tracking number / carrier shipment
    if (input.trackingNumber) {
      const existingShipment = await tx
        .select()
        .from(shipments)
        .where(eq(shipments.orderId, existing.id))
        .limit(1);

      if (existingShipment.length > 0) {
        await tx
          .update(shipments)
          .set({
            trackingNumber: input.trackingNumber,
            carrierId: input.carrierId || existingShipment[0].carrierId,
            status: input.newStatus === "DELIVERED" ? "delivered" : "in_transit",
            updatedAt: now,
          })
          .where(eq(shipments.id, existingShipment[0].id));
      } else {
        await tx.insert(shipments).values({
          orderId: existing.id,
          carrierId: input.carrierId || null,
          trackingNumber: input.trackingNumber,
          shippingFee: existing.shippingFee,
          codAmountToCollect: existing.totalAmount,
          status: "in_transit",
          shippedAt: now,
        });
      }
    }

    // Log order event
    await tx.insert(orderEvents).values({
      orderId: existing.id,
      actorType: "admin",
      actorId: admin.userId,
      eventType: "ORDER_STATUS_CHANGED",
      oldStatus,
      newStatus: input.newStatus,
      notes: input.notes || `Statut mis à jour vers ${input.newStatus}`,
    });

    safeRevalidatePath("/[locale]/admin/orders");
    return { success: true };
  });
}

