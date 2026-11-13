import React from "react";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/security/session";
import { db } from "@/lib/db";
import { products, productVariants } from "@/lib/db/schema";
import { desc, inArray } from "drizzle-orm";
import { ProductsManager, ProductData } from "./products-manager";

export default async function AdminProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getAdminSession();
  if (!session) {
    redirect(`/${locale}/admin/login`);
  }

  const allProducts = await db
    .select()
    .from(products)
    .orderBy(desc(products.createdAt));

  const productIds = allProducts.map((p) => p.id);
  const allVariants =
    productIds.length > 0
      ? await db
          .select()
          .from(productVariants)
          .where(inArray(productVariants.productId, productIds))
          .orderBy(productVariants.title)
      : [];

  const formattedProducts: ProductData[] = allProducts.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    sellingPrice: p.sellingPrice,
    referencePrice: p.referencePrice,
    status: p.status,
    badge: p.badge,
    variants: allVariants
      .filter((v) => v.productId === p.id)
      .map((v) => ({
        id: v.id,
        sku: v.sku,
        title: v.title,
        stockQuantity: v.stockQuantity,
        status: v.status,
      })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground font-serif tracking-tight">
          Catalogue & Gestion des Stocks
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Gestion des articles, variantes par taille/couleur et ajustements d'inventaire
        </p>
      </div>

      <ProductsManager products={formattedProducts} locale={locale} />
    </div>
  );
}
