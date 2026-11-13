import { eq, desc, inArray, and } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  offers,
  offerSlots,
  products,
  productVariants,
  reviews,
} from "@/lib/db/schema";

export interface CreateOfferInput {
  productId: string;
  title: string;
  slug: string;
  description?: string;
  badge?: string;
  offerType: "single" | "pack_duo" | "pack_trio" | "custom_bundle";
  fixedPrice: number;
  referencePrice?: number;
  itemCount: number;
  freeShipping?: boolean;
  isFeatured?: boolean;
  displayOrder?: number;
  slots: Array<{
    slotNumber: number;
    slotTitle: string;
    productId: string;
    isRequired?: boolean;
  }>;
}

export async function createOfferWithSlots(input: CreateOfferInput) {
  return await db.transaction(async (tx) => {
    const [offer] = await tx
      .insert(offers)
      .values({
        productId: input.productId,
        title: input.title,
        slug: input.slug,
        description: input.description,
        badge: input.badge,
        offerType: input.offerType,
        fixedPrice: input.fixedPrice.toFixed(2),
        referencePrice: input.referencePrice ? input.referencePrice.toFixed(2) : null,
        itemCount: input.itemCount,
        freeShipping: input.freeShipping !== false,
        isFeatured: input.isFeatured || false,
        displayOrder: input.displayOrder || 0,
      })
      .returning();

    for (const slot of input.slots) {
      await tx.insert(offerSlots).values({
        offerId: offer.id,
        slotNumber: slot.slotNumber,
        slotTitle: slot.slotTitle,
        productId: slot.productId,
        isRequired: slot.isRequired !== false,
      });
    }

    return offer;
  });
}

export async function getOffersForProduct(productId: string) {
  const offerList = await db
    .select()
    .from(offers)
    .where(and(eq(offers.productId, productId), eq(offers.isActive, true)))
    .orderBy(offers.displayOrder);

  if (offerList.length === 0) return [];

  const offerIds = offerList.map((o) => o.id);
  const slotsList = await db
    .select()
    .from(offerSlots)
    .where(inArray(offerSlots.offerId, offerIds))
    .orderBy(offerSlots.slotNumber);

  return offerList.map((offer) => ({
    ...offer,
    slots: slotsList.filter((s) => s.offerId === offer.id),
  }));
}

export async function getProductLandingData(productSlug: string) {
  const prodRows = await db
    .select()
    .from(products)
    .where(eq(products.slug, productSlug))
    .limit(1);

  if (prodRows.length === 0) return null;
  const product = prodRows[0];

  // Fetch offers
  const rawOffers = await db
    .select()
    .from(offers)
    .where(and(eq(offers.productId, product.id), eq(offers.isActive, true)))
    .orderBy(offers.displayOrder);

  const offerIds = rawOffers.map((o) => o.id);
  const rawSlots =
    offerIds.length > 0
      ? await db
          .select()
          .from(offerSlots)
          .where(inArray(offerSlots.offerId, offerIds))
          .orderBy(offerSlots.slotNumber)
      : [];

  // For each slot, get variants of the slot's product
  const enrichedOffers = await Promise.all(
    rawOffers.map(async (offer) => {
      const slotsForOffer = rawSlots.filter((s) => s.offerId === offer.id);
      const enrichedSlots = await Promise.all(
        slotsForOffer.map(async (slot) => {
          const variants = await db
            .select({
              id: productVariants.id,
              sku: productVariants.sku,
              title: productVariants.title,
              stockQuantity: productVariants.stockQuantity,
            })
            .from(productVariants)
            .where(
              and(
                eq(productVariants.productId, slot.productId),
                eq(productVariants.status, "active")
              )
            )
            .orderBy(productVariants.title);

          return {
            ...slot,
            product: {
              id: product.id,
              name: product.name,
            },
            variants,
          };
        })
      );

      return {
        ...offer,
        slots: enrichedSlots,
      };
    })
  );

  // Fetch approved customer reviews
  const approvedReviews = await db
    .select({
      id: reviews.id,
      customerName: reviews.customerName,
      customerCity: reviews.customerCity,
      rating: reviews.rating,
      headline: reviews.headline,
      comment: reviews.comment,
      isVerifiedPurchase: reviews.isVerifiedPurchase,
    })
    .from(reviews)
    .where(and(eq(reviews.productId, product.id), eq(reviews.status, "approved")))
    .orderBy(desc(reviews.createdAt))
    .limit(10);

  return {
    product,
    offers: enrichedOffers,
    reviews: approvedReviews,
  };
}
