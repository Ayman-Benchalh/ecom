"use server";

import { headers } from "next/headers";
import { placeCodOrder, PlaceOrderInput, PlaceOrderResult } from "./order-service";
import { codCheckoutSchema } from "@/lib/validation/morocco";

export async function submitCodOrderAction(formData: unknown): Promise<PlaceOrderResult> {
  try {
    const headerList = await headers();
    const forwardedFor = headerList.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    const userAgent = headerList.get("user-agent") || undefined;

    // Validate input schema
    const parseResult = codCheckoutSchema.safeParse(formData);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      return {
        success: false,
        error: issue ? issue.message : "Données de formulaire invalides.",
      };
    }

    const data = parseResult.data;

    // Execute order creation in database transaction
    const result = await placeCodOrder({
      fullName: data.fullName,
      phone: data.phone,
      city: data.city,
      address: data.address,
      notes: data.notes,
      offerId: data.offerId,
      quantity: data.quantity,
      selectedVariants: data.selectedVariants,
      idempotencyKey: data.idempotencyKey,
      ipAddress,
      userAgent,
    });

    return result;
  } catch (error: any) {
    console.error("Order submission action error:", error);
    return {
      success: false,
      error: error?.message || "Erreur serveur lors de la commande. Veuillez réessayer.",
    };
  }
}
