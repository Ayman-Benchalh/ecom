import { describe, it, expect } from "vitest";
import {
  bootstrapAdminUser,
  authenticateAdmin,
  validateAdminSession,
} from "../src/lib/security/auth";
import {
  createProductWithVariants,
  createVariant,
  getProductBySlug,
} from "../src/features/products/product-service";
import { createOfferWithSlots } from "../src/features/offers/offer-service";
import {
  saveLandingPageVersionAction,
} from "../src/features/pages/admin-landing-actions";
import {
  placeCodOrder,
  getOrderByNumber,
} from "../src/features/orders/order-service";
import { updateOrderStatusAction } from "../src/features/orders/admin-order-actions";
import { createCodSettlementAction } from "../src/features/delivery/admin-carrier-actions";
import { updateReturnStatusAction } from "../src/features/returns/admin-return-actions";
import { moderateReviewAction } from "../src/features/reviews/admin-review-actions";
import { db } from "../src/lib/db";
import {
  products,
  productVariants,
  landingPages,
  carriers,
  orders,
  reviewInvitations,
  reviews,
  returns,
  codSettlements,
} from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

describe("RAYANA Section 23 — Complete Master End-to-End Scenario", () => {
  it("executes the complete 30-step lifecycle from product creation to COD settlement, reviews, and returns", async () => {
    // -------------------------------------------------------------
    // Step 1: Administrator logs into RAYANA
    // -------------------------------------------------------------
    await bootstrapAdminUser();
    const loginResult = await authenticateAdmin(
      "admin@rayana.ma",
      "RayanaAdmin2026!Secure"
    );
    expect(loginResult.success).toBe(true);
    expect(loginResult.sessionToken).toBeDefined();

    const session = await validateAdminSession(loginResult.sessionToken!);
    expect(session).not.toBeNull();
    expect(session?.email).toBe("admin@rayana.ma");

    // -------------------------------------------------------------
    // Step 2 & 3: Administrator creates a T-shirt product & variants
    // -------------------------------------------------------------
    const timestamp = Date.now();
    const productSku = `RY-TS-${timestamp}`;
    const product = await createProductWithVariants({
      name: `T-Shirt Coton Bio Test ${timestamp}`,
      slug: `t-shirt-test-${timestamp}`,
      sku: productSku,
      sellingPrice: 99.0,
      referencePrice: 149.0,
      status: "active",
      shortDescription: "T-shirt 100% coton peigné pour test E2E",
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

    // -------------------------------------------------------------
    // Step 4: Administrator configures stock for variants
    // -------------------------------------------------------------
    const vBlackM = await createVariant({
      productId: product.id,
      sku: `${productSku}-BLK-M`,
      title: "Noir / M",
      stockQuantity: 15,
    });

    const vBeigeXL = await createVariant({
      productId: product.id,
      sku: `${productSku}-BGE-XL`,
      title: "Beige / XL",
      stockQuantity: 15,
    });

    expect(vBlackM.stockQuantity).toBe(15);
    expect(vBeigeXL.stockQuantity).toBe(15);

    // -------------------------------------------------------------
    // Step 5 & 6: Administrator creates a two-piece pack & sets price (169 MAD)
    // -------------------------------------------------------------
    const packOffer = await createOfferWithSlots({
      productId: product.id,
      title: "Pack Duo Test — 2 T-Shirts",
      slug: `pack-duo-test-${timestamp}`,
      offerType: "pack_duo",
      fixedPrice: 169.0,
      referencePrice: 198.0,
      itemCount: 2,
      freeShipping: true,
      isFeatured: true,
      slots: [
        {
          slotNumber: 1,
          slotTitle: "1ère Pièce (Choix couleur & taille)",
          productId: product.id,
        },
        {
          slotNumber: 2,
          slotTitle: "2ème Pièce (Choix couleur & taille)",
          productId: product.id,
        },
      ],
    });
    expect(Number(packOffer.fixedPrice)).toBe(169.0);
    expect(packOffer.itemCount).toBe(2);

    // -------------------------------------------------------------
    // Step 7, 8, 9: Landing page creation, appearance & publishing
    // -------------------------------------------------------------
    const [landingPage] = await db
      .insert(landingPages)
      .values({
        title: "T-Shirt Coton Bio Signature — Offre E2E",
        slug: `landing-e2e-${timestamp}`,
        productId: product.id,
        status: "draft",
      })
      .returning();

    // Save and publish version
    const saveVersionResult = await saveLandingPageVersionAction({
      landingPageId: landingPage.id,
      sections: [
        { type: "hero", title: "Coton Bio Premium" },
        { type: "pack_selector" },
        { type: "checkout_form" },
      ],
      appearance: {
        primaryColor: "#0F4C3A",
        accentColor: "#B25E29",
      },
      publishNow: true,
    });
    expect(saveVersionResult.success).toBe(true);

    const [publishedPage] = await db
      .select()
      .from(landingPages)
      .where(eq(landingPages.id, landingPage.id));
    expect(publishedPage.status).toBe("published");
    expect(publishedPage.activeVersionNumber).toBe(saveVersionResult.versionNumber);

    // -------------------------------------------------------------
    // Step 10 to 17: Customer selects Pack Duo, Piece 1 (Black/M), Piece 2 (Beige/XL), COD checkout
    // -------------------------------------------------------------
    const customerOrderPayload = {
      fullName: "Anas El Amrani",
      phone: "06 61 23 45 67",
      city: "Tanger",
      address: "Quartier Malabata, Résidence Tanger Bay",
      notes: "Appeler 30 minutes avant svp",
      offerId: packOffer.id,
      quantity: 1,
      selectedVariants: [
        { slotNumber: 1, variantId: vBlackM.id },
        { slotNumber: 2, variantId: vBeigeXL.id },
      ],
      idempotencyKey: `e2e-order-${timestamp}`,
    };

    // -------------------------------------------------------------
    // Step 18 & 19: Server validates selections, authoritative pricing, exactly 1 order created
    // -------------------------------------------------------------
    const orderResult = await placeCodOrder(customerOrderPayload);
    expect(orderResult.success).toBe(true);
    expect(orderResult.orderNumber).toBeDefined();
    expect(orderResult.totalAmount).toBe(169.0);

    const orderNumber = orderResult.orderNumber!;
    const orderDetails = await getOrderByNumber(orderNumber);
    expect(orderDetails).not.toBeNull();
    expect(orderDetails?.customerCity).toBe("Tanger");
    expect(orderDetails?.items.length).toBe(2);

    const piece1 = orderDetails?.items.find((i) => i.packSlotNumber === 1);
    const piece2 = orderDetails?.items.find((i) => i.packSlotNumber === 2);
    expect(piece1?.variantTitle).toBe("Noir / M");
    expect(piece2?.variantTitle).toBe("Beige / XL");

    // -------------------------------------------------------------
    // Step 20 & 21: Administrator sees new order & confirms it
    // -------------------------------------------------------------
    expect(orderDetails?.status).toBe("NEW");
    expect(orderDetails?.financialStatus).toBe("UNPAID");

    const confirmRes = await updateOrderStatusAction({
      orderId: orderDetails!.id,
      newStatus: "CONFIRMED",
      notes: "Client confirmé au téléphone pour livraison Tanger",
    });
    expect(confirmRes.success).toBe(true);

    // -------------------------------------------------------------
    // Step 22: Inventory is updated safely (15 - 1 = 14)
    // -------------------------------------------------------------
    const [blackVariantAfter] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, vBlackM.id));
    const [beigeVariantAfter] = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.id, vBeigeXL.id));

    expect(blackVariantAfter.stockQuantity).toBe(14);
    expect(beigeVariantAfter.stockQuantity).toBe(14);

    // -------------------------------------------------------------
    // Step 23 & 24: Administrator prepares shipment & records tracking number
    // -------------------------------------------------------------
    const [carrier] = await db.select().from(carriers).limit(1);
    const trackingCode = `AMANA-${timestamp}`;

    const shipRes = await updateOrderStatusAction({
      orderId: orderDetails!.id,
      newStatus: "SHIPPED",
      carrierId: carrier.id,
      trackingNumber: trackingCode,
      notes: "Colis confié à Amana Express Tanger",
    });
    expect(shipRes.success).toBe(true);

    // -------------------------------------------------------------
    // Step 25: Order marked DELIVERED when confirmed by carrier
    // -------------------------------------------------------------
    const deliverRes = await updateOrderStatusAction({
      orderId: orderDetails!.id,
      newStatus: "DELIVERED",
      trackingNumber: trackingCode,
      notes: "Colis livré et espèces encaissées par Amana",
    });
    expect(deliverRes.success).toBe(true);

    const [deliveredOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderDetails!.id));
    expect(deliveredOrder.status).toBe("DELIVERED");

    // -------------------------------------------------------------
    // Step 26: Financial status is COLLECTED_BY_CARRIER, pending settlement
    // -------------------------------------------------------------
    expect(deliveredOrder.financialStatus).toBe("COLLECTED_BY_CARRIER");

    // Perform COD Reconciliation
    const settleRef = `SETTLE-E2E-${timestamp}`;
    const settleRes = await createCodSettlementAction({
      carrierId: carrier.id,
      settlementReference: settleRef,
      totalCollected: 169.0,
      carrierFees: 35.0,
      orderIds: [deliveredOrder.id],
      notes: "Virement hebdomadaire Amana Express",
    });
    expect(settleRes.success).toBe(true);

    const [settledOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderDetails!.id));
    expect(settledOrder.financialStatus).toBe("SETTLED");

    // -------------------------------------------------------------
    // Step 27 & 28: Customer review invitation & moderation
    // -------------------------------------------------------------
    const inviteToken = crypto.randomBytes(24).toString("hex");
    await db.insert(reviewInvitations).values({
      orderId: deliveredOrder.id,
      token: inviteToken,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });

    // Customer submits review using invitation
    const [customerReview] = await db
      .insert(reviews)
      .values({
        orderId: deliveredOrder.id,
        productId: product.id,
        customerName: deliveredOrder.customerName,
        customerCity: deliveredOrder.customerCity,
        rating: 5,
        headline: "Très satisfait du Pack Duo !",
        comment: "Excellente coupe, le noir et le beige sont magnifiques. Reçu en 24h à Tanger.",
        isVerifiedPurchase: true,
        status: "pending",
        invitationToken: inviteToken,
      })
      .returning();
    expect(customerReview.status).toBe("pending");

    // Admin approves review
    const modRes = await moderateReviewAction({
      reviewId: customerReview.id,
      status: "approved",
    });
    expect(modRes.success).toBe(true);

    const [approvedReview] = await db
      .select()
      .from(reviews)
      .where(eq(reviews.id, customerReview.id));
    expect(approvedReview.status).toBe("approved");

    // -------------------------------------------------------------
    // Step 29 & 30: Customer return request & administrator decision
    // -------------------------------------------------------------
    const [returnReq] = await db
      .insert(returns)
      .values({
        returnNumber: `RET-E2E-${timestamp}`,
        orderId: deliveredOrder.id,
        customerPhone: deliveredOrder.customerPhone,
        reason: "wrong_size",
        description: "Je souhaite échanger la taille M du noir contre une taille L svp",
        status: "requested",
      })
      .returning();
    expect(returnReq.status).toBe("requested");

    // Admin reviews and approves the exchange
    const returnDecisionRes = await updateReturnStatusAction({
      returnId: returnReq.id,
      status: "approved",
      adminNotes: "Échange approuvé, envoi du nouveau t-shirt en cours",
    });
    expect(returnDecisionRes.success).toBe(true);

    const [approvedReturn] = await db
      .select()
      .from(returns)
      .where(eq(returns.id, returnReq.id));
    expect(approvedReturn.status).toBe("approved");
  });
});

