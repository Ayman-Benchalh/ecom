import { describe, it, expect } from "vitest";
import { createProductWithVariants, createVariant } from "../src/features/products/product-service";
import { createOfferWithSlots } from "../src/features/offers/offer-service";
import { placeCodOrder, getOrderByNumber } from "../src/features/orders/order-service";
import { db } from "../src/lib/db";
import { productVariants } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

describe("Pack Engine & Authoritative Order Checkout", () => {
  it("processes a Pack Duo order with independent piece variants, stock deduction & idempotency", async () => {
    // 1. Create Product
    const testSku = `TSHIRT-${Date.now()}`;
    const product = await createProductWithVariants({
      name: "T-Shirt Coton Bio RAYANA",
      slug: `t-shirt-coton-bio-${Date.now()}`,
      sku: testSku,
      sellingPrice: 99.0,
      status: "active",
      options: [
        {
          name: "Couleur",
          values: [
            { value: "Noir", colorHex: "#000000" },
            { value: "Beige", colorHex: "#F5F5DC" },
          ],
        },
        {
          name: "Taille",
          values: [{ value: "M" }, { value: "XL" }],
        },
      ],
    });

    // 2. Create specific variants
    const vBlackM = await createVariant({
      productId: product.id,
      sku: `${testSku}-BLK-M`,
      title: "Noir / M",
      stockQuantity: 10,
    });

    const vBeigeXL = await createVariant({
      productId: product.id,
      sku: `${testSku}-BGE-XL`,
      title: "Beige / XL",
      stockQuantity: 10,
    });

    // 3. Create Pack Duo (2 Pieces for 169 MAD)
    const offer = await createOfferWithSlots({
      productId: product.id,
      title: "Pack Duo — 2 T-Shirts Coton Bio",
      slug: `pack-duo-tshirts-${Date.now()}`,
      offerType: "pack_duo",
      fixedPrice: 169.0,
      itemCount: 2,
      freeShipping: true,
      slots: [
        {
          slotNumber: 1,
          slotTitle: "1ère Pièce (Choisissez couleur & taille)",
          productId: product.id,
        },
        {
          slotNumber: 2,
          slotTitle: "2ème Pièce (Choisissez couleur & taille)",
          productId: product.id,
        },
      ],
    });

    // 4. Customer places order: Piece 1 = Black/M, Piece 2 = Beige/XL
    const idempotencyKey = `idem-${Date.now()}`;
    const orderResult = await placeCodOrder({
      fullName: "Karim Bennani",
      phone: "06 12 34 56 78",
      city: "Casablanca",
      address: "24 Boulevard d'Anfa, Étage 3",
      notes: "Sonner à l'interphone Bennani",
      offerId: offer.id,
      quantity: 1,
      selectedVariants: [
        { slotNumber: 1, variantId: vBlackM.id },
        { slotNumber: 2, variantId: vBeigeXL.id },
      ],
      idempotencyKey,
    });

    expect(orderResult.success).toBe(true);
    expect(orderResult.orderNumber).toMatch(/^RY-\d{4}-\d{4}$/);
    expect(orderResult.totalAmount).toBe(169.0);

    // 5. Verify database order details
    const orderDetails = await getOrderByNumber(orderResult.orderNumber!);
    expect(orderDetails).not.toBeNull();
    expect(orderDetails?.customerCity).toBe("Casablanca");
    expect(orderDetails?.items.length).toBe(2);

    const piece1 = orderDetails?.items.find((i) => i.packSlotNumber === 1);
    const piece2 = orderDetails?.items.find((i) => i.packSlotNumber === 2);
    expect(piece1?.variantTitle).toBe("Noir / M");
    expect(piece2?.variantTitle).toBe("Beige / XL");

    // 6. Verify inventory deduction
    const [updatedVBlackM] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, vBlackM.id));
    const [updatedVBeigeXL] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, vBeigeXL.id));

    expect(updatedVBlackM.stockQuantity).toBe(9); // 10 - 1 = 9
    expect(updatedVBeigeXL.stockQuantity).toBe(9); // 10 - 1 = 9

    // 7. Test Idempotency: Repeating same submission does not double deduct stock
    const duplicateSubmission = await placeCodOrder({
      fullName: "Karim Bennani",
      phone: "06 12 34 56 78",
      city: "Casablanca",
      offerId: offer.id,
      quantity: 1,
      selectedVariants: [
        { slotNumber: 1, variantId: vBlackM.id },
        { slotNumber: 2, variantId: vBeigeXL.id },
      ],
      idempotencyKey,
    });

    expect(duplicateSubmission.orderNumber).toBe(orderResult.orderNumber);

    const [vAfterDuplicate] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, vBlackM.id));
    expect(vAfterDuplicate.stockQuantity).toBe(9); // Still 9, no duplicate deduction!
  });
});
