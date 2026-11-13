import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/security/session";
import { db } from "@/lib/db";
import { orders, orderItems, carriers, shipments } from "@/lib/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { OrdersTable, AdminOrder } from "./orders-table";

export default async function AdminOrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getAdminSession();
  if (!session) {
    redirect(`/${locale}/admin/login`);
  }

  // Fetch all orders
  const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));

  const orderIds = allOrders.map((o) => o.id);
  const allItems =
    orderIds.length > 0
      ? await db
          .select()
          .from(orderItems)
          .where(inArray(orderItems.orderId, orderIds))
      : [];

  const allShipments =
    orderIds.length > 0
      ? await db
          .select({
            orderId: shipments.orderId,
            trackingNumber: shipments.trackingNumber,
            carrierId: shipments.carrierId,
          })
          .from(shipments)
          .where(inArray(shipments.orderId, orderIds))
      : [];

  const allCarriers = await db.select().from(carriers);

  const formattedOrders: AdminOrder[] = allOrders.map((ord) => {
    const items = allItems.filter((i) => i.orderId === ord.id);
    const shipment = allShipments.find((s) => s.orderId === ord.id);
    const carrier = shipment ? allCarriers.find((c) => c.id === shipment.carrierId) : null;

    return {
      id: ord.id,
      orderNumber: ord.orderNumber,
      customerName: ord.customerName,
      customerPhone: ord.customerPhone,
      customerCity: ord.customerCity,
      customerAddress: ord.customerAddress,
      customerNotes: ord.customerNotes,
      offerTitle: ord.offerTitle,
      quantity: ord.quantity,
      subtotalAmount: ord.subtotalAmount,
      shippingFee: ord.shippingFee,
      totalAmount: ord.totalAmount,
      status: ord.status,
      financialStatus: ord.financialStatus,
      internalNotes: ord.internalNotes,
      createdAt: ord.createdAt.toISOString(),
      items: items.map((i) => ({
        id: i.id,
        packSlotNumber: i.packSlotNumber,
        productTitle: i.productTitle,
        variantTitle: i.variantTitle,
        sku: i.sku,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
        totalPrice: i.totalPrice,
      })),
      trackingNumber: shipment?.trackingNumber || null,
      carrierName: carrier?.name || null,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground font-serif tracking-tight">
            Gestion des Commandes
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Traitement des commandes COD, confirmations téléphoniques et expéditions
          </p>
        </div>
      </div>

      <OrdersTable
        orders={formattedOrders}
        carriers={allCarriers.map((c) => ({ id: c.id, name: c.name }))}
        locale={locale}
      />
    </div>
  );
}
