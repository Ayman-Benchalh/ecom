"use server";

import { safeRevalidatePath } from "@/lib/utils/cache";
import { requireAdmin } from "@/lib/security/session";
import { db } from "@/lib/db";
import { products, productVariants, inventoryMovements } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createProductWithVariants, createVariant } from "./product-service";

export async function adjustVariantStockAction(input: {
  variantId: string;
  delta: number;
  reason: string;
  notes?: string;
}) {
  const admin = await requireAdmin();

  return await db.transaction(async (tx) => {
    const [variant] = await tx
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, input.variantId))
      .limit(1);

    if (!variant) {
      return { success: false, error: "Variante introuvable." };
    }

    const newStock = Math.max(0, variant.stockQuantity + input.delta);

    await tx
      .update(productVariants)
      .set({
        stockQuantity: newStock,
        updatedAt: new Date(),
      })
      .where(eq(productVariants.id, variant.id));

    await tx.insert(inventoryMovements).values({
      variantId: variant.id,
      delta: input.delta,
      reason: input.reason || "manual_adjustment",
      balanceAfter: newStock,
      notes: input.notes || `Ajustement de stock par ${admin.email}`,
    });

    safeRevalidatePath("/[locale]/admin/products");
    return { success: true, newStock };
  });
}

export async function createNewProductAction(input: {
  name: string;
  sku: string;
  sellingPrice: number;
  referencePrice?: number;
  description?: string;
  shortDescription?: string;
  badge?: string;
}) {
  await requireAdmin();

  const slug = input.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  const product = await createProductWithVariants({
    name: input.name,
    slug: `${slug}-${Date.now().toString().slice(-4)}`,
    sku: input.sku.toUpperCase(),
    sellingPrice: input.sellingPrice,
    referencePrice: input.referencePrice,
    description: input.description,
    shortDescription: input.shortDescription,
    badge: input.badge,
    status: "active",
    images: [
      {
        url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
        alt: input.name,
        isPrimary: true,
      },
    ],
  });

  // Create standard S, M, L, XL variants
  const sizes = ["S", "M", "L", "XL"];
  for (const s of sizes) {
    await createVariant({
      productId: product.id,
      sku: `${input.sku}-${s}`,
      title: `Taille ${s}`,
      stockQuantity: 20,
    });
  }

  safeRevalidatePath("/[locale]/admin/products");
  return { success: true, product };
}

