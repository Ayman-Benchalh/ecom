import { eq, sql, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  orders,
  orderItems,
  orderEvents,
  customers,
  offers,
  offerSlots,
  products,
  productVariants,
  inventoryMovements,
} from "@/lib/db/schema";
import { normalizeMoroccanPhone } from "@/lib/validation/morocco";

export interface PlaceOrderInput {
  fullName: string;
  phone: string;
  city: string;
  address?: string;
  notes?: string;
  offerId: string;
  quantity: number;
  selectedVariants: Array<{
    slotNumber: number;
    variantId: string;
  }>;
  ipAddress?: string;
  userAgent?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  idempotencyKey?: string;
}

export interface PlaceOrderResult {
  success: boolean;
  orderNumber?: string;
  orderId?: string;
  totalAmount?: number;
  error?: string;
}

function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `RY-${year}${month}-${random}`;
}

export async function placeCodOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  // 1. Phone validation
  const normalizedPhone = normalizeMoroccanPhone(input.phone);
  if (!normalizedPhone) {
    return {
      success: false,
      error: "Numéro de téléphone marocain invalide (ex: 06 12 34 56 78)",
    };
  }

  // 2. Quantity check
  const orderQty = Math.max(1, Math.min(10, input.quantity || 1));

  // 3. Check idempotency if provided
  if (input.idempotencyKey) {
    const existing = await db
      .select({ orderNumber: orders.orderNumber, id: orders.id, totalAmount: orders.totalAmount })
      .from(orders)
      .where(eq(orders.idempotencyKey, input.idempotencyKey))
      .limit(1);

    if (existing.length > 0) {
      return {
        success: true,
        orderNumber: existing[0].orderNumber,
        orderId: existing[0].id,
        totalAmount: Number(existing[0].totalAmount),
      };
    }
  }

  // Execute in database transaction to prevent stock overselling & race conditions
  return await db.transaction(async (tx) => {
    // 4. Fetch and validate Offer
    const offerRows = await tx
      .select()
      .from(offers)
      .where(eq(offers.id, input.offerId))
      .limit(1);

    if (offerRows.length === 0 || !offerRows[0].isActive) {
      return { success: false, error: "Cette offre n'est plus disponible." };
    }

    const offer = offerRows[0];

    // 5. Fetch Offer Slots
    const slots = await tx
      .select()
      .from(offerSlots)
      .where(eq(offerSlots.offerId, offer.id))
      .orderBy(offerSlots.slotNumber);

    if (input.selectedVariants.length !== slots.length) {
      return {
        success: false,
        error: `Veuillez sélectionner les variantes pour chacune des ${slots.length} pièces du pack.`,
      };
    }

    // 6. Aggregate variant quantities needed (e.g. if customer picked same color/size for multiple pieces)
    const variantQuantitiesMap = new Map<string, number>();
    for (const sel of input.selectedVariants) {
      const current = variantQuantitiesMap.get(sel.variantId) || 0;
      variantQuantitiesMap.set(sel.variantId, current + orderQty);
    }

    const variantIds = Array.from(variantQuantitiesMap.keys());
    const variantRows = await tx
      .select()
      .from(productVariants)
      .where(inArray(productVariants.id, variantIds));

    if (variantRows.length !== variantIds.length) {
      return { success: false, error: "Une des variantes sélectionnées n'existe pas." };
    }

    // Check stock availability
    for (const v of variantRows) {
      const needed = variantQuantitiesMap.get(v.id) || 0;
      if (v.stockQuantity < needed) {
        return {
          success: false,
          error: `Stock insuffisant pour la variante "${v.title}". Il ne reste que ${v.stockQuantity} unité(s).`,
        };
      }
    }

    // 7. Authoritative financial calculation
    const unitPackPrice = Number(offer.fixedPrice);
    const subtotal = unitPackPrice * orderQty;
    const shippingFee = offer.freeShipping ? 0 : 35.0;
    const totalAmount = subtotal + shippingFee;

    // 8. Find or create customer
    let customerId: string | null = null;
    const existingCustomers = await tx
      .select()
      .from(customers)
      .where(eq(customers.phoneNormalized, normalizedPhone))
      .limit(1);

    if (existingCustomers.length > 0) {
      customerId = existingCustomers[0].id;
      await tx
        .update(customers)
        .set({
          fullName: input.fullName.trim(),
          city: input.city.trim(),
          address: input.address?.trim() || existingCustomers[0].address,
          orderCount: existingCustomers[0].orderCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, customerId));
    } else {
      const [newCustomer] = await tx
        .insert(customers)
        .values({
          fullName: input.fullName.trim(),
          phone: input.phone.trim(),
          phoneNormalized: normalizedPhone,
          city: input.city.trim(),
          address: input.address?.trim() || null,
          notes: input.notes?.trim() || null,
        })
        .returning();
      customerId = newCustomer.id;
    }

    // 9. Create Order
    const orderNumber = generateOrderNumber();
    const [order] = await tx
      .insert(orders)
      .values({
        orderNumber,
        customerId,
        customerName: input.fullName.trim(),
        customerPhone: input.phone.trim(),
        customerCity: input.city.trim(),
        customerAddress: input.address?.trim() || null,
        customerNotes: input.notes?.trim() || null,
        offerId: offer.id,
        offerTitle: offer.title,
        quantity: orderQty,
        subtotalAmount: subtotal.toFixed(2),
        shippingFee: shippingFee.toFixed(2),
        discountAmount: "0.00",
        totalAmount: totalAmount.toFixed(2),
        currency: "MAD",
        status: "NEW",
        financialStatus: "UNPAID",
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
        idempotencyKey: input.idempotencyKey,
      })
      .returning();

    // 10. Deduct Stock and create order items
    // First, deduct stock & record movements
    for (const [varId, qtyToDeduct] of variantQuantitiesMap.entries()) {
      const variant = variantRows.find((v) => v.id === varId)!;
      const newBalance = variant.stockQuantity - qtyToDeduct;

      await tx
        .update(productVariants)
        .set({
          stockQuantity: newBalance,
          updatedAt: new Date(),
        })
        .where(eq(productVariants.id, varId));

      await tx.insert(inventoryMovements).values({
        variantId: varId,
        delta: -qtyToDeduct,
        reason: "order_placed",
        referenceId: order.id,
        balanceAfter: newBalance,
        notes: `Commande ${orderNumber}`,
      });
    }

    // Insert order items for each piece in each pack quantity
    for (const sel of input.selectedVariants) {
      const variant = variantRows.find((v) => v.id === sel.variantId)!;
      const slot = slots.find((s) => s.slotNumber === sel.slotNumber)!;

      const [product] = await tx
        .select()
        .from(products)
        .where(eq(products.id, slot.productId))
        .limit(1);

      const piecePrice = unitPackPrice / slots.length;

      await tx.insert(orderItems).values({
        orderId: order.id,
        productId: product.id,
        variantId: variant.id,
        packSlotNumber: sel.slotNumber,
        productTitle: product.name,
        variantTitle: variant.title,
        sku: variant.sku,
        unitPrice: piecePrice.toFixed(2),
        quantity: orderQty,
        totalPrice: (piecePrice * orderQty).toFixed(2),
        snapshotJson: {
          productName: product.name,
          variantTitle: variant.title,
          sku: variant.sku,
          packSlotTitle: slot.slotTitle,
        },
      });
    }

    // 11. Record Order Event
    await tx.insert(orderEvents).values({
      orderId: order.id,
      actorType: "customer",
      eventType: "ORDER_CREATED",
      newStatus: "NEW",
      notes: `Commande COD créée avec ${slots.length} pièce(s) par pack.`,
      metadataJson: {
        offerTitle: offer.title,
        quantity: orderQty,
        totalAmount,
      },
    });

    return {
      success: true,
      orderNumber: order.orderNumber,
      orderId: order.id,
      totalAmount,
    };
  });
}

export async function getOrderByNumber(orderNumber: string) {
  const orderList = await db
    .select()
    .from(orders)
    .where(eq(orders.orderNumber, orderNumber))
    .limit(1);

  if (orderList.length === 0) return null;
  const order = orderList[0];

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id))
    .orderBy(orderItems.packSlotNumber);

  return {
    ...order,
    items,
  };
}

