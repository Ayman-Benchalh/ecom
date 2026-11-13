import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "@/lib/security/session";
import { db } from "@/lib/db";
import { orders, orderItems } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { formatMAD } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Truck,
  TrendingUp,
  DollarSign,
  AlertCircle,
  ArrowUpRight,
  UserCheck,
} from "lucide-react";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getAdminSession();
  if (!session) {
    redirect(`/${locale}/admin/login`);
  }

  // 1. Fetch Key Metrics
  const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));

  const totalOrders = allOrders.length;
  const newOrders = allOrders.filter((o) => o.status === "NEW").length;
  const confirmedOrders = allOrders.filter((o) => o.status === "CONFIRMED" || o.status === "READY").length;
  const deliveredOrders = allOrders.filter((o) => o.status === "DELIVERED").length;

  const totalRevenue = allOrders.reduce((acc, o) => acc + Number(o.totalAmount), 0);
  const deliveredRevenue = allOrders
    .filter((o) => o.status === "DELIVERED")
    .reduce((acc, o) => acc + Number(o.totalAmount), 0);

  const pendingCodSettlement = allOrders
    .filter((o) => o.status === "DELIVERED" && o.financialStatus !== "SETTLED")
    .reduce((acc, o) => acc + Number(o.totalAmount), 0);

  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Recent 8 orders
  const recentOrders = allOrders.slice(0, 8);

  return (
    <div className="space-y-8">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground font-serif tracking-tight">
            Tableau de Bord
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Performance commerciale & suivi des livraisons au Maroc
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button asChild size="sm" variant="outline">
            <Link href={`/${locale}/admin/orders`}>
              Toutes les Commandes ({totalOrders})
            </Link>
          </Button>
          <Button asChild size="sm" variant="default">
            <Link href={`/${locale}/admin/products`}>
              Gérer les Stocks
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Orders */}
        <Card className="border border-border shadow-2xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Commandes Totales
              </span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-foreground mt-2 font-mono">
              {totalOrders}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {newOrders} nouvelle(s) à confirmer
            </p>
          </CardContent>
        </Card>

        {/* Metric 2: New Orders requiring confirmation */}
        <Card className="border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 shadow-2xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                À Confirmer (Appels)
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-900 dark:text-amber-200 mt-2 font-mono">
              {newOrders}
            </div>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
              Priorité opérationnelle
            </p>
          </CardContent>
        </Card>

        {/* Metric 3: Delivered Revenue */}
        <Card className="border border-border shadow-2xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Chiffre d'Affaires Livré
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
              {formatMAD(deliveredRevenue, locale)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Sur {formatMAD(totalRevenue, locale)} commandés
            </p>
          </CardContent>
        </Card>

        {/* Metric 4: Pending COD Settlement */}
        <Card className="border border-border shadow-2xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                COD Chez Transporteurs
              </span>
              <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-secondary mt-2 font-mono">
              {formatMAD(pendingCodSettlement, locale)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              À rapprocher & verser
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Section */}
      <Card className="border border-border shadow-xs">
        <CardHeader className="py-4 px-6 border-b border-border/60 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-primary" />
            Dernières Commandes Enregistrées
          </CardTitle>
          <Button asChild size="sm" variant="ghost">
            <Link href={`/${locale}/admin/orders`}>
              Voir tout <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-container text-muted-foreground uppercase font-bold text-[10px] tracking-wider border-b border-border/60">
                <tr>
                  <th className="py-3 px-4">Commande</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Ville</th>
                  <th className="py-3 px-4">Offre & Quantité</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Statut Opérationnel</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      Aucune commande pour le moment.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-surface-container/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-foreground">
                        {ord.orderNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground">
                          {ord.customerName}
                        </div>
                        <div className="text-muted-foreground text-[11px]">
                          {ord.customerPhone}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground">
                        {ord.customerCity}
                      </td>
                      <td className="py-3 px-4">
                        <div className="truncate max-w-[200px] text-foreground font-medium">
                          {ord.offerTitle}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          Qté : {ord.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-primary">
                        {formatMAD(ord.totalAmount, locale)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            ord.status === "DELIVERED"
                              ? "success"
                              : ord.status === "NEW"
                              ? "warning"
                              : "outline"
                          }
                          className="text-[10px] uppercase font-bold"
                        >
                          {ord.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button asChild size="sm" variant="outline" className="h-7 text-xs">
                          <Link href={`/${locale}/admin/orders?search=${ord.orderNumber}`}>
                            Détails
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
