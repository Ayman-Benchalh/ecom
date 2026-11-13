import { eq, desc, sql, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  products,
  productCategories,
  productOptions,
  productOptionValues,
  productVariants,
  productVariantValues,
  inventoryMovements,
} from "@/lib/db/schema";

export interface CreateProductInput {
  name: string;
  slug: string;
  sku: string;
  description?: string;
  shortDescription?: string;
  categoryId?: string;
  purchasePrice?: number;
  sellingPrice: number;
  referencePrice?: number;
  status?: "draft" | "active" | "archived";
  images?: Array<{ url: string; alt?: string; isPrimary?: boolean }>;
  videoUrl?: string;
  badge?: string;
  seoTitle?: string;
  seoDescription?: string;
  options?: Array<{
    name: string;
    values: Array<{ value: string; colorHex?: string }>;
  }>;
}

export async function getProducts(options?: { status?: string; limit?: number }) {
  const query = db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      sku: products.sku,
      sellingPrice: products.sellingPrice,
      referencePrice: products.referencePrice,
      status: products.status,
      badge: products.badge,
      images: products.images,
      createdAt: products.createdAt,
    })
    .from(products)
    .orderBy(desc(products.createdAt));

  if (options?.limit) {
    query.limit(options.limit);
  }

  return query;
}

export async function getProductBySlug(slug: string) {
  const result = await db
    .select()
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);

  if (result.length === 0) return null;
  const product = result[0];

  // Fetch options and option values
  const optionsList = await db
    .select()
    .from(productOptions)
    .where(eq(productOptions.productId, product.id))
    .orderBy(productOptions.position);

  const optionIds = optionsList.map((o) => o.id);
  const valuesList =
    optionIds.length > 0
      ? await db
          .select()
          .from(productOptionValues)
          .where(inArray(productOptionValues.optionId, optionIds))
          .orderBy(productOptionValues.position)
      : [];

  const structuredOptions = optionsList.map((opt) => ({
    ...opt,
    values: valuesList.filter((v) => v.optionId === opt.id),
  }));

  // Fetch variants
  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, product.id))
    .orderBy(productVariants.title);

  return {
    ...product,
    options: structuredOptions,
    variants,
  };
}

export async function getProductById(id: string) {
  const result = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (result.length === 0) return null;
  const product = result[0];

  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, product.id));

  return {
    ...product,
    variants,
  };
}

export async function createProductWithVariants(input: CreateProductInput) {
  return await db.transaction(async (tx) => {
    const [newProduct] = await tx
      .insert(products)
      .values({
        name: input.name,
        slug: input.slug,
        sku: input.sku,
        description: input.description,
        shortDescription: input.shortDescription,
        categoryId: input.categoryId || null,
        purchasePrice: input.purchasePrice ? input.purchasePrice.toFixed(2) : "0.00",
        sellingPrice: input.sellingPrice.toFixed(2),
        referencePrice: input.referencePrice ? input.referencePrice.toFixed(2) : null,
        status: input.status || "active",
        images: input.images || [],
        videoUrl: input.videoUrl,
        badge: input.badge,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
      })
      .returning();

    // If options provided, create options and option values
    if (input.options && input.options.length > 0) {
      for (let i = 0; i < input.options.length; i++) {
        const opt = input.options[i];
        const [insertedOpt] = await tx
          .insert(productOptions)
          .values({
            productId: newProduct.id,
            name: opt.name,
            position: i,
          })
          .returning();

        for (let j = 0; j < opt.values.length; j++) {
          const val = opt.values[j];
          await tx.insert(productOptionValues).values({
            optionId: insertedOpt.id,
            value: val.value,
            colorHex: val.colorHex,
            position: j,
          });
        }
      }
    }

    return newProduct;
  });
}

export async function createVariant(data: {
  productId: string;
  sku: string;
  title: string;
  priceOverride?: number;
  stockQuantity: number;
  imageUrl?: string;
}) {
  return await db.transaction(async (tx) => {
    const [variant] = await tx
      .insert(productVariants)
      .values({
        productId: data.productId,
        sku: data.sku,
        title: data.title,
        priceOverride: data.priceOverride ? data.priceOverride.toFixed(2) : null,
        stockQuantity: data.stockQuantity,
        imageUrl: data.imageUrl,
        status: "active",
      })
      .returning();

    // Record initial stock movement
    if (data.stockQuantity > 0) {
      await tx.insert(inventoryMovements).values({
        variantId: variant.id,
        delta: data.stockQuantity,
        reason: "initial_stock",
        balanceAfter: data.stockQuantity,
        notes: "Initial inventory setup",
      });
    }

    return variant;
  });
}
