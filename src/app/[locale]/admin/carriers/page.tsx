import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/security/session";
import { db } from "@/lib/db";
import { carriers, codSettlements, orders } from "@/lib/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { CarriersManager, CarrierData, SettlementData, UnsettledOrderData } from "./carriers-manager";

export default async function AdminCarriersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getAdminSession();
  if (!session) {
    redirect(`/${locale}/admin/login`);
  }

  const allCarriers = await db.select().from(carriers);
  const allSettlements = await db
    .select({
      id: codSettlements.id,
      carrierId: codSettlements.carrierId,
      settlementReference: codSettlements.settlementReference,
      totalCollected: codSettlements.totalCollected,
      carrierFees: codSettlements.carrierFees,
      netAmountSettled: codSettlements.netAmountSettled,
      settlementDate: codSettlements.settlementDate,
    })
    .from(codSettlements)
    .orderBy(desc(codSettlements.settlementDate));

  // Find delivered orders where financialStatus is NOT SETTLED
  const unsettled = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      totalAmount: orders.totalAmount,
      customerCity: orders.customerCity,
    })
    .from(orders)
    .where(and(eq(orders.status, "DELIVERED"), eq(orders.financialStatus, "COLLECTED_BY_CARRIER")));

  const formattedSettlements: SettlementData[] = allSettlements.map((s) => {
    const c = allCarriers.find((item) => item.id === s.carrierId);
    return {
      id: s.id,
      carrierName: c?.name || null,
      settlementReference: s.settlementReference,
      totalCollected: s.totalCollected,
      carrierFees: s.carrierFees,
      netAmountSettled: s.netAmountSettled,
      settlementDate: s.settlementDate.toISOString(),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground font-serif tracking-tight">
          Transporteurs & Rapprochement Financier COD
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Suivi des fonds encaissés par les sociétés de livraison et pointage des bordereaux de virement
        </p>
      </div>

      <CarriersManager
        carriers={allCarriers.map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          defaultShippingFee: c.defaultShippingFee,
          isActive: c.isActive,
        }))}
        settlements={formattedSettlements}
        unsettledOrders={unsettled.map((u) => ({
          id: u.id,
          orderNumber: u.orderNumber,
          totalAmount: u.totalAmount,
          customerCity: u.customerCity,
        }))}
        locale={locale}
      />
    </div>
  );
}

