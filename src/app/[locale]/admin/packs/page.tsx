import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/security/session";
import { db } from "@/lib/db";
import { offers, offerSlots, products } from "@/lib/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { PacksManager, PackItemData } from "./packs-manager";

export default async function AdminPacksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getAdminSession();
  if (!session) {
    redirect(`/${locale}/admin/login`);
  }

  const allOffers = await db.select().from(offers).orderBy(offers.displayOrder);
  const allProducts = await db.select({ id: products.id, name: products.name }).from(products);

  const offerIds = allOffers.map((o) => o.id);
  const allSlots =
    offerIds.length > 0
      ? await db
          .select()
          .from(offerSlots)
          .where(inArray(offerSlots.offerId, offerIds))
      : [];

  const formattedPacks: PackItemData[] = allOffers.map((o) => {
    const prod = allProducts.find((p) => p.id === o.productId);
    const slots = allSlots.filter((s) => s.offerId === o.id);

    return {
      id: o.id,
      title: o.title,
      slug: o.slug,
      fixedPrice: o.fixedPrice,
      referencePrice: o.referencePrice,
      itemCount: o.itemCount,
      badge: o.badge,
      freeShipping: o.freeShipping,
      isFeatured: o.isFeatured,
      productName: prod?.name || "Produit",
      slotsCount: slots.length,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground font-serif tracking-tight">
          Moteur de Packs & Bundles
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Configuration des offres promotionnelles (Offre 1 pièce, Pack Duo, Pack Trio) avec sélection indépendante des variantes
        </p>
      </div>

      <PacksManager packs={formattedPacks} products={allProducts} locale={locale} />
    </div>
  );
}

