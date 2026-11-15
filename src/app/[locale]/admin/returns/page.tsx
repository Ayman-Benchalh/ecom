import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/security/session";
import { db } from "@/lib/db";
import { returns, orders } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { ReturnsManager, ReturnItemData } from "./returns-manager";

export default async function AdminReturnsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getAdminSession();
  if (!session) {
    redirect(`/${locale}/admin/login`);
  }

  const allReturns = await db
    .select({
      id: returns.id,
      returnNumber: returns.returnNumber,
      orderNumber: orders.orderNumber,
      customerPhone: returns.customerPhone,
      reason: returns.reason,
      description: returns.description,
      evidenceMediaUrls: returns.evidenceMediaUrls,
      status: returns.status,
      refundStatus: returns.refundStatus,
      refundAmount: returns.refundAmount,
      adminNotes: returns.adminNotes,
      createdAt: returns.createdAt,
    })
    .from(returns)
    .innerJoin(orders, eq(returns.orderId, orders.id))
    .orderBy(desc(returns.createdAt));

  const formattedReturns: ReturnItemData[] = allReturns.map((r) => ({
    id: r.id,
    returnNumber: r.returnNumber,
    orderNumber: r.orderNumber,
    customerPhone: r.customerPhone,
    reason: r.reason,
    description: r.description,
    evidenceMediaUrls: r.evidenceMediaUrls,
    status: r.status,
    refundStatus: r.refundStatus,
    refundAmount: r.refundAmount,
    adminNotes: r.adminNotes,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground font-serif tracking-tight">
          Retours & Service Après-Vente (SAV)
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Traitement des demandes d'échange de taille et retours produits sous 7 jours
        </p>
      </div>

      <ReturnsManager returnsList={formattedReturns} locale={locale} />
    </div>
  );
}

